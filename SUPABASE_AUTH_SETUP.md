# Saberio AI — Production Supabase Authentication & Google OAuth Setup Guide

This guide provides the exact step-by-step instructions to configure **Google OAuth**, **Email Verification**, and **6-Digit Email OTP Password Recovery** in your Supabase project.

---

## 1. Google OAuth Platform Setup (Google Cloud Console)

To enable "Continue with Google" for real student accounts:

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project or create a new one (e.g., `Saberio-AI`).
3. Go to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**
   - App Name: `Saberio AI`
   - User support email: Select your admin email (e.g., `akm007ab@gmail.com`)
   - Developer contact email: Your email
   - Scopes: Add `.../auth/userinfo.email`, `.../auth/userinfo.profile`, and `openid`
   - Publish App: Set status to **In Production** (or add your test accounts under Test Users).
4. Go to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Saberio AI Web & Supabase`.
   - **Authorized JavaScript origins**:
     - `https://hagqafhhjlvqfugsoqdo.supabase.co` *(Replace with your Supabase Project URL)*
     - `https://quiztube.vercel.app`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `https://hagqafhhjlvqfugsoqdo.supabase.co/auth/v1/callback` *(Replace with your Supabase Auth callback URL)*
5. Click **Create**. Copy your **Client ID** and **Client Secret**.

---

## 2. Supabase Provider Configuration

1. Go to your [Supabase Project Dashboard](https://supabase.com/dashboard/project/_/auth/providers).
2. Navigate to **Authentication** > **Providers** > **Google**:
   - Toggle **Enable Google provider** to ON.
   - Paste your **Client ID** (for OAuth Client ID).
   - Paste your **Client Secret** (for OAuth Client Secret).
   - Click **Save**.

---

## 3. Supabase URL Configuration & Redirects

1. Navigate to **Authentication** > **URL Configuration**:
   - **Site URL**: `https://quiztube.vercel.app`
   - **Redirect URLs** (Add each):
     - `https://quiztube.vercel.app/auth/callback`
     - `https://quiztube.vercel.app/**`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`
2. Click **Save**.

---

## 4. 6-Digit Email OTP Password Recovery Template

To ensure the password recovery email sends the secure **6-digit verification code** required by Saberio AI:

1. Navigate to **Authentication** > **Email Templates** > **Reset Password**.
2. Set **Subject**: `Reset your Saberio AI password`
3. Set **Body** to the template below containing `{{ .Token }}`:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 20px; border: 1px solid #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">Saberio AI</h1>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 6px;">Smart AI Learning & Quiz Platform</p>
  </div>
  <div style="background: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155; text-align: center;">
    <h2 style="font-size: 16px; font-weight: 700; color: #ffffff; margin-top: 0;">Password Recovery Code</h2>
    <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
      Enter the 6-digit verification code below in Saberio AI to reset your password:
    </p>
    <div style="margin: 24px 0; padding: 14px 20px; background: #0f172a; border-radius: 12px; border: 1px solid #4f46e5; display: inline-block;">
      <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; font-family: monospace; color: #a5b4fc;">{{ .Token }}</span>
    </div>
    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
      This code is confidential and expires in 10 minutes. If you did not request this, please ignore this email.
    </p>
  </div>
  <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #64748b;">
    <p>© Saberio AI &middot; All rights reserved.</p>
  </div>
</div>
```

4. Click **Save**.

---

## 5. Email Verification Template (6-Digit OTP)

1. Ensure **Confirm email** is toggled to **ON** in [Supabase Email Provider Settings](https://supabase.com/dashboard/project/hagqafhhjlvqfugsoqdo/auth/providers).
2. Navigate to **Authentication** > **Email Templates** > **Confirm signup**.
3. Set **Subject**: `Verify your Saberio AI account`
4. Set **Body**:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 20px; border: 1px solid #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">Saberio AI</h1>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 6px;">Smart AI Learning & Quiz Platform</p>
  </div>
  <div style="background: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155; text-align: center;">
    <h2 style="font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0;">Your Verification Code</h2>
    <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
      Enter the 6-digit verification code below in Saberio AI to activate your account:
    </p>
    <div style="margin: 24px 0; padding: 14px 20px; background: #0f172a; border-radius: 12px; border: 1px solid #4f46e5; display: inline-block;">
      <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; font-family: monospace; color: #a5b4fc;">{{ .Token }}</span>
    </div>
    <div style="margin: 16px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 10px 22px; background: #334155; color: #cbd5e1; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 8px; border: 1px solid #475569;">Or click here to verify instantly</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
      This code expires in 10 minutes. If you did not create a Saberio AI account, please ignore this email.
    </p>
  </div>
  <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #64748b;">
    <p>© Saberio AI &middot; All rights reserved.</p>
  </div>
</div>
```

5. Click **Save**.

---

## 6. Production SMTP Configuration

Supabase includes a default email provider limited to 3-4 emails per hour for development. For production:
1. Navigate to **Authentication** > **SMTP Settings**.
2. Toggle **Enable Custom SMTP** to ON.
3. Configure your provider credentials (e.g. [Resend](https://resend.com/), [SendGrid](https://sendgrid.com/), [Postmark](https://postmarkapp.com/), or [Amazon SES]):
   - **Sender email**: `auth@yourdomain.com` or `noreply@yourdomain.com`
   - **Sender name**: `Saberio AI`
   - **Host**: Your SMTP host (e.g. `smtp.resend.com`)
   - **Port**: `587` or `465`
   - **Username**: `resend` (or SMTP username)
   - **Password**: Your SMTP API Key / Password
4. Click **Save**.

---

## 7. Database Migration (Profiles & Trigger)

Execute the updated SQL script in [supabase_schema.sql](./supabase_schema.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) to ensure Google avatar and name sync are enabled.