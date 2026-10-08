# Saberio AI — MongoDB & Mongoose Architecture

Saberio AI is now completely migrated to **MongoDB + Mongoose** for the database and authentication layers.

---

## 1. Quick Setup: Environment Variables

In your `.env.local` file (or Vercel / production environment settings):

```env
# MongoDB Connection String (Atlas or Local)
# Atlas Example:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/saberio_ai?retryWrites=true&w=majority

# Local MongoDB Example:
# MONGODB_URI=mongodb://localhost:27017/saberio_ai

# JWT Secret for Session Authentication
JWT_SECRET=saberio_ai_jwt_production_secret_key_2026

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 2. Mongoose Models (`src/models/`)

| Model | File | Description |
|---|---|---|
| **User** | `src/models/User.ts` | Student accounts, bcrypt hashed passwords, admin flags, profile |
| **StudySet** | `src/models/StudySet.ts` | Video lectures, generated quizzes, flashcards, cheatsheets, chapters |
| **SolvedExam** | `src/models/SolvedExam.ts` | Solved university exam papers, step-by-step solutions, key formulas |
| **TutorConversation** | `src/models/TutorConversation.ts` | 24/7 AI tutor chat history, visual states, explanation modes |
| **Subscription** | `src/models/Subscription.ts` | Pro subscriptions, validity periods, Razorpay order/payment records |
| **DailyUsage** | `src/models/DailyUsage.ts` | Daily AI quota usage tracking (Asia/Kolkata timezone) |

---

## 3. REST API Endpoints

### Authentication APIs (`src/app/api/auth/`)
- `POST /api/auth/register` — Register with email, password & name (hashes password with bcrypt, returns JWT)
- `POST /api/auth/login` — Sign in with email & password (validates bcrypt hash, returns JWT)
- `GET /api/auth/me` — Retrieve currently authenticated user profile
- `PATCH /api/auth/me` — Update password or profile
- `DELETE /api/auth/me` — Sign out & clear cookie
- `POST /api/auth/forgot-password` — Password reset request
- `POST /api/auth/reset-password` — Reset password with new password
- `POST /api/auth/google` — Sign in / Register with Google profile

### Data APIs
- `GET, POST, DELETE /api/study-sets` — Manage study sets in MongoDB
- `GET /api/study-sets/[id]` — Fetch single study set by ID
- `GET, POST, DELETE /api/solved-exams` — Manage solved exam papers in MongoDB
- `GET, POST, DELETE /api/tutor/conversations` — Manage AI tutor conversations in MongoDB
- `GET, POST /api/user/subscription` — Check active subscription & quotas in MongoDB
- `GET /api/user/usage` — Daily quota usage summary in MongoDB
- `POST /api/payment/verify` & `POST /api/payment/webhook` — Razorpay payment fulfillment to MongoDB

---

## 4. Frontend & React Integration

- **`src/lib/auth.ts`**: Clean client-side library communicating with the Next.js MongoDB REST APIs. Handles token storage in `localStorage` and real-time state synchronization via custom events.
- **`src/components/AuthModal.tsx`**: Sign in, sign up, and password reset modal working with the new MongoDB backend.
