# 🎓 QuizTube AI — YouTube Lectures to Interactive Quizzes & Study Sets

QuizTube AI is an academic active-recall platform that transforms any YouTube lecture or study notes into interactive quizzes, spaced-repetition flashcards, synced video review guides, and printable study sheets powered by **Google Gemini 3.7 & 2.5 Flash**.

Built with ❤️ by [Ashikur](https://personal-portfolio-blue-eight-9p8guawbf5.vercel.app/).

---

## ✨ Key Features

### 1. 🎯 Interactive Quiz Engine
- **Customizable Question Tiers**: Choose between *Easy (Definitions & Recall)*, *Medium (Application & Reasoning)*, *Hard (Nuanced Analysis)*, or *Mixed*.
- **Flexible Question Counts**: Generate 5, 10, 15, or 20 questions.
- **Multiple Formats**: Standard 4-Choice Multiple Choice (MCQ), True/False, and Mixed formats.
- **Two Study Modes**:
  - **Practice Mode**: Instant feedback, streak counter, collapsible hints, and in-depth pedagogical explanations for why the correct choice is right and why distractors are wrong.
  - **Exam Mode**: Simulates real test conditions, grading only upon submission with topic-by-topic mastery analytics.

### 2. ⏱️ Timestamp-Synced Video Review
- Every question and flashcard is linked to the exact timestamp (e.g. `[11:45]`) in the video where the concept was taught.
- Clicking the **"Lecture at MM:SS"** badge instantly seeks the embedded YouTube player to that exact segment for rapid revision.

### 3. 🖼️ Visual Study Cheatsheet with Valid Images & Flowcharts
- **Lecture Hero Banner & Snapshots**: Displays verified high-resolution video thumbnails and timestamp preview frames (`maxresdefault.jpg` / `hqdefault.jpg`).
- **Core Formulas & Equations Box**: Math formulations, code blocks, and 1-click "Copy All Formulas" button.
- **Interactive Visual Flowcharts (Mermaid.js)**: Automatically renders architectural diagrams, execution pipelines, and mindmaps directly from lecture concepts.
- **Comparison Matrix**: Structured comparison tables contrasting algorithms, models, formulas, or biological/physical mechanisms.
- **Exam Pitfalls**: Highlights common student misconceptions vs verified correct facts.
- **1-Click Print & PDF**: Print a 1-page visual summary or export as PDF/Markdown.

### 4. 🗂️ 3D Spaced-Repetition Flashcards
- Smooth 3D card flips (click or press `Space`).
- Front prompt (Concept / Term) and Back definition with **"🧠 Memory Anchor"** takeaways.
- Self-evaluation tracking (*Mastered* vs *Needs Review*) and deck shuffling.

### 5. 📖 Lecture Summary & Key Takeaways
- Comprehensive multi-paragraph lecture synthesis.
- Bulleted high-yield takeaways with a 1-click **"Copy Takeaways"** button.
- Chapter timeline with interactive timestamp seek links.

### 6. 📥 Multi-Format Export
- **Printable Assessment (PDF)**: Student test paper with separate answer keys, detailed explanations, and cheatsheet formulas.
- **Anki Flashcard Deck (.txt / TSV)**: Import directly into Anki, Quizlet, RemNote, or Notion.
- **Markdown Study Cheatsheet (.md)**: Clean markdown notes with embedded Mermaid diagrams and collapsible solution accordions.
- **Raw JSON**: Complete structured data for downstream tools.

### 6. 💾 Offline Study Library
- Automatically caches previous study sets in browser `localStorage`.
- Re-take quizzes, track score improvements, and manage saved lectures anytime.

---

## 🚀 Getting Started

### 1. Clone or Open the Project
```bash
cd C:\Users\akm00\.gemini\antigravity\scratch\youtube-lecture-quiz
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Your Gemini API Key
You have two easy ways to configure your Gemini API key:
- **Option A (Environment Variable)**: Create a `.env.local` file in the root directory:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
- **Option B (In-App Settings)**: Click the **"Set Gemini Key"** button in the top navigation bar of the web app to save your key directly in your browser.

Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Technology Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, TypeScript)
- **AI Model**: Google Gemini 3.7 Flash via official [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Transcripts**: `youtube-transcript` with automatic language fallback & timed segmentation
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)
- **Animations & Effects**: `canvas-confetti`, CSS 3D transforms
