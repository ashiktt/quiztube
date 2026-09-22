# Security Audit

## Executive Summary

This defensive security review evaluated the Saberio AI Next.js application, focusing on authentication, authorization, API endpoints, database policies, and frontend handling. The review uncovered multiple critical security flaws primarily related to broken access control. The database (Supabase) is configured with entirely permissive Row Level Security (RLS) policies, allowing anyone with the public anon key to read, modify, or delete any data. Furthermore, the Next.js API endpoints fail to enforce ownership before deleting resources and incorrectly trust client-provided user IDs and emails, allowing unauthenticated attackers to spoof admin privileges and bypass AI quotas. Immediate remediation of the database policies and API authorization checks is required before production deployment.

## Critical Findings

### 1. Broken Access Control on Database (RLS Bypass)
- **Finding ID:** CRIT-01
- **Severity:** Critical
- **Category:** Authorization / Database Security
- **File:** `supabase_schema.sql`
- **Relevant line or code section:** Lines 42-108 (e.g., `CREATE POLICY "Public Read Access" ON public.study_sets FOR SELECT USING (true);`)
- **Technical explanation:** The Supabase Row Level Security (RLS) policies for all tables (`study_sets`, `solved_exams`, `tutor_conversations`, `subscriptions`, `daily_ai_usage`) are set to `USING (true)` and `WITH CHECK (true)` for all operations (`FOR ALL`). Additionally, the `profiles` table allows inserts and updates if `auth.uid() IS NULL`.
- **Security impact:** Any user (authenticated or unauthenticated) possessing the public Supabase `anon` key can connect directly to the database and read, modify, or delete all records. Attackers could grant themselves a Pro subscription, delete all user data, or modify quotas.
- **Why the code is vulnerable:** The `USING (true)` clause evaluates to true for all rows and all users, completely neutralizing the RLS protection.
- **Recommended fix:** Restrict RLS policies to the authenticated user. For example: `CREATE POLICY "User Access" ON public.study_sets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
- **How to verify the fix:** Make a direct API request to the Supabase REST endpoint using the anon key without an Authorization header, attempting to `GET` or `POST` to the `subscriptions` table. It should return a 401/403 or empty array.
- **Status:** CONFIRMED ISSUE

### 2. Insecure API Authorization (ID Spoofing & Quota Bypass)
- **Finding ID:** CRIT-02
- **Severity:** Critical
- **Category:** API Security / Authorization
- **File:** `src/app/api/generate-quiz/route.ts`, `src/app/api/solve-exam/route.ts`, `src/app/api/tutor/route.ts`
- **Relevant line or code section:** `const effectiveUserId = authUser?.id || userId; const effectiveUserEmail = authUser?.email || userEmail;`
- **Technical explanation:** The AI generation routes attempt to authenticate the user via a token. However, if the user is unauthenticated (`authUser` is null), the endpoints silently fall back to trusting the `userId` and `userEmail` values provided in the JSON request body.
- **Security impact:** An attacker can trivially bypass daily AI quotas by sending a new, random `userId` in each request. Worse, they can spoof the application admin by sending `{"userEmail": "akm007ab@gmail.com"}`, which the server will trust and grant unlimited "Pro" admin quota for the request.
- **Why the code is vulnerable:** The server incorrectly trusts user-controlled input (`userId` and `userEmail` from the request body) for sensitive authorization and accounting decisions.
- **Recommended fix:** Remove the fallback to `userId` and `userEmail` from the request body. If the user is unauthenticated, they should be treated strictly as an anonymous user and subject to anonymous rate limits (or blocked entirely if auth is required).
- **How to verify the fix:** Send a POST request to `/api/generate-quiz` without an Authorization header but with `{"userEmail": "akm007ab@gmail.com"}` in the body. The request should be rejected as unauthenticated or restricted to a strict IP-based anonymous quota.
- **Status:** CONFIRMED ISSUE

### 3. Insecure Direct Object Reference (IDOR) on DELETE Endpoints
- **Finding ID:** CRIT-03
- **Severity:** Critical
- **Category:** Authorization / API Security
- **File:** `src/app/api/study-sets/route.ts`, `src/app/api/solved-exams/route.ts`, `src/app/api/tutor/conversations/route.ts`
- **Relevant line or code section:** `const { error } = await supabase.from('study_sets').delete().eq('id', id);`
- **Technical explanation:** The `DELETE` endpoints take an `id` parameter from the URL query string and delete the corresponding record from the database. The code does not check whether the authenticated user actually owns the record.
- **Security impact:** Any attacker can delete arbitrary study sets, solved exams, and tutor conversations belonging to other users by enumerating or knowing their IDs.
- **Why the code is vulnerable:** The database query lacks a filter to ensure the `user_id` matches the currently authenticated user (e.g., `.eq('user_id', authUser.id)`).
- **Recommended fix:** Always append `.eq('user_id', authUser.id)` to update and delete operations in the API to enforce ownership.
- **How to verify the fix:** Authenticate as User A and attempt to send a DELETE request targeting a resource ID belonging to User B. The resource should remain in the database.
- **Status:** CONFIRMED ISSUE

## High Severity Findings

### 4. Missing Webhook Signature Validation Enforcement
- **Finding ID:** HIGH-01
- **Severity:** High
- **Category:** API Security / Payment Logic
- **File:** `src/app/api/payment/webhook/route.ts`
- **Relevant line or code section:** `if (webhookSecret && signature) { ... }`
- **Technical explanation:** The Razorpay webhook endpoint verifies the cryptographic signature only if the `RAZORPAY_WEBHOOK_SECRET` environment variable is defined and a signature is present. If the variable is misconfigured or missing in production, the code bypasses validation entirely and processes the payload.
- **Security impact:** Attackers can forge a `payment.captured` webhook payload and grant themselves a free Pro subscription if the server environment is missing the webhook secret.
- **Why the code is vulnerable:** The validation check allows a "fail-open" scenario instead of "fail-closed".
- **Recommended fix:** Throw an error or return a 500 status if `RAZORPAY_WEBHOOK_SECRET` is missing. Enforce that `signature` must be present and valid.
- **How to verify the fix:** Remove the webhook secret from the environment and attempt to send a webhook POST request. The server should refuse to process it.
- **Status:** CONFIRMED ISSUE

### 5. Cross-Site Scripting (XSS) via Mermaid Diagram Rendering
- **Finding ID:** HIGH-02
- **Severity:** High
- **Category:** Frontend Security / XSS
- **File:** `src/components/MermaidRenderer.tsx`
- **Relevant line or code section:** `securityLevel: 'loose'` and `<div dangerouslySetInnerHTML={{ __html: svgContent }} />`
- **Technical explanation:** The Mermaid library is initialized with `securityLevel: 'loose'`, which intentionally permits HTML tags and potentially JavaScript events within the diagram nodes. The generated SVG is then rendered into the DOM using `dangerouslySetInnerHTML`.
- **Security impact:** If an attacker crafts a malicious YouTube transcript (or provides one via custom text), the AI could generate Mermaid diagram code containing XSS payloads (e.g., `click A "javascript:alert(1)"`). When rendered, this would execute arbitrary JavaScript in the victim's browser.
- **Why the code is vulnerable:** The `loose` security setting bypasses Mermaid's built-in XSS sanitization, trusting the AI-generated diagram code implicitly.
- **Recommended fix:** Change the Mermaid configuration to `securityLevel: 'strict'`. Additionally, consider utilizing DOMPurify to sanitize the generated `svgContent` before passing it to `dangerouslySetInnerHTML`.
- **How to verify the fix:** Provide a Mermaid diagram containing an XSS payload and verify that the scripts/handlers are stripped before rendering.
- **Status:** CONFIRMED ISSUE

## Medium Severity Findings

### 6. Information Disclosure (Subscription and Usage Enum)
- **Finding ID:** MED-01
- **Severity:** Medium
- **Category:** API Security
- **File:** `src/app/api/user/subscription/route.ts`, `src/app/api/user/usage/route.ts`
- **Relevant line or code section:** `const userId = authUser?.id || searchParams.get('userId') || undefined;`
- **Technical explanation:** The user usage and subscription endpoints allow overriding the target user by passing `userId` or `email` as a query parameter or body payload, even if authenticated.
- **Security impact:** An attacker can query the usage limits, subscription status, and IDs of other users by passing their email addresses.
- **Why the code is vulnerable:** The endpoint does not restrict data retrieval strictly to the authenticated `authUser`.
- **Recommended fix:** Only allow `userId` or `userEmail` to equal `authUser.id` or `authUser.email`. Remove the ability to query arbitrary users unless the requester is an admin.
- **How to verify the fix:** Attempt to query `/api/user/usage?email=anotheruser@domain.com` while authenticated as a different user. It should return your own data or an error.
- **Status:** CONFIRMED ISSUE

## Low Severity Findings

### 7. Storage of API Keys in LocalStorage
- **Finding ID:** LOW-01
- **Severity:** Low
- **Category:** Frontend Security
- **File:** `src/lib/storage.ts`
- **Relevant line or code section:** `localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());`
- **Technical explanation:** User-provided custom Gemini API keys are stored in plaintext in the browser's `localStorage`.
- **Security impact:** While standard practice for client-side tools, storing API keys in `localStorage` makes them highly susceptible to theft if an XSS vulnerability (such as HIGH-02) is exploited.
- **Why the code is vulnerable:** `localStorage` is accessible by any JavaScript executing on the origin.
- **Recommended fix:** While complete protection is difficult in a client-side architecture, warn the user about the risks of storing keys. Alternatively, encrypt the key in local storage using a session-based password, though this degrades UX.
- **Status:** SECURITY HARDENING

### 8. Vulnerable Dependency (`uuid`)
- **Finding ID:** LOW-02
- **Severity:** Low
- **Category:** Dependency Security
- **File:** `package.json`
- **Technical explanation:** The `npm audit` reports a moderate vulnerability in `uuid` < 11.1.1 (Missing buffer bounds check).
- **Security impact:** Could lead to buffer issues, though its usage within `xcode`/Capacitor CLI during runtime is likely minimal and not directly exposed to user input.
- **Recommended fix:** Run `npm audit fix` to update dependencies.
- **Status:** CONFIRMED ISSUE

## Informational Findings

### 9. Reliance on Client-Side Database Inserts for Unauthenticated Data
- **Finding ID:** INFO-01
- **Severity:** Informational
- **Category:** Architecture
- **File:** `src/app/api/study-sets/route.ts`
- **Technical explanation:** The API allows inserting records without a `user_id` (leaving it null) if the user is unauthenticated. This data relies on local storage syncing, which can lead to orphaned records in the database.
- **Recommended fix:** Implement an automated cleanup job in Supabase to periodically delete old records where `user_id` is NULL.
- **Status:** SECURITY HARDENING

---

| ID | Severity | Category | File | Issue | Recommended Fix |
|----|----------|----------|------|-------|----------------|
| CRIT-01 | Critical | Database | `supabase_schema.sql` | RLS bypass allows full DB access | Restrict RLS policies using `auth.uid() = user_id` |
| CRIT-02 | Critical | API | `src/app/api/generate-quiz/route.ts` | ID Spoofing and Quota Bypass | Do not trust `userId`/`userEmail` from client payload |
| CRIT-03 | Critical | API | `src/app/api/study-sets/route.ts` | IDOR on DELETE endpoints | Append `.eq('user_id', authUser.id)` to DELETE queries |
| HIGH-01 | High | API | `src/app/api/payment/webhook/route.ts` | Missing webhook signature enforcement | Fail closed if `RAZORPAY_WEBHOOK_SECRET` is missing |
| HIGH-02 | High | Frontend | `src/components/MermaidRenderer.tsx` | XSS via Mermaid loose security | Set Mermaid to `strict` security mode |
| MED-01 | Medium | API | `src/app/api/user/subscription/route.ts`| Information Disclosure of usage data | Prevent querying arbitrary emails/IDs |
| LOW-01 | Low | Frontend | `src/lib/storage.ts` | API Keys stored in LocalStorage | Warn user or use session-encryption |
| LOW-02 | Low | Dependencies | `package.json` | Vulnerable `uuid` dependency | Run `npm update` to resolve advisory |

### Prioritized Remediation Checklist
- [ ] 1. **Database:** Update `supabase_schema.sql` to strictly enforce `auth.uid() = user_id` for all `UPDATE`, `INSERT`, and `DELETE` operations across all tables.
- [ ] 2. **API:** Refactor the API endpoints (`generate-quiz`, `solve-exam`, `tutor`) to strictly use `authUser.id` and `authUser.email`. Reject requests that attempt to pass `userId` or `userEmail` manually if unauthenticated.
- [ ] 3. **API:** Add `.eq('user_id', authUser.id)` filters to all Supabase `DELETE` and `UPDATE` calls in the Next.js API.
- [ ] 4. **API:** Update `src/app/api/payment/webhook/route.ts` to explicitly reject requests if `RAZORPAY_WEBHOOK_SECRET` is unset.
- [ ] 5. **Frontend:** Modify `src/components/MermaidRenderer.tsx` to set `securityLevel: 'strict'` to prevent XSS payloads from rendering in the SVG.
- [ ] 6. **API:** Lock down the user usage API endpoints so users can only fetch their own data.
- [ ] 7. **Dependencies:** Run `npm audit fix` to secure development packages.