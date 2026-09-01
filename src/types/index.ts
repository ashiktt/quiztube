export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed';
export type QuestionType = 'mcq' | 'true_false' | 'mixed';
export type BloomsTaxonomy = 'Recall' | 'Understanding' | 'Application' | 'Analysis';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  optionExplanations?: string[];
  hint: string;
  timestampSeconds: number;
  timestampFormatted: string;
  topicTag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomsLevel?: BloomsTaxonomy;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  keyTakeaway: string;
  timestampFormatted?: string;
  timestampSeconds?: number;
  topicTag?: string;
}

export interface LectureChapter {
  title: string;
  timestampFormatted: string;
  timestampSeconds: number;
  summary: string;
}

export interface CheatsheetSection {
  title: string;
  keyPoints: string[];
  formulaOrCode?: string;
  diagramTitle?: string;
  mermaidCode?: string;
  timestampFormatted?: string;
  timestampSeconds?: number;
}

export interface ComparisonTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface PitfallItem {
  misconception: string;
  correctFact: string;
  whyItMatters: string;
}

export interface LectureCheatsheet {
  title: string;
  subtitle: string;
  heroImageUrl?: string;
  coreFormulas: Array<{ label: string; formula: string; explanation: string }>;
  sections: CheatsheetSection[];
  comparisonTable?: ComparisonTable;
  flowchart?: {
    title: string;
    mermaidCode: string;
    description: string;
  };
  pitfalls?: PitfallItem[];
}

export interface UserQuizAttempt {
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
  timeSpentSeconds: number;
  selectedAnswers: Record<string, number>;
  topicMastery?: Record<string, { correct: number; total: number }>;
}

export interface StudentUser {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface LectureStudySet {
  id: string;
  userId?: string;
  createdAt: string;
  videoUrl: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationFormatted: string;
  overallSummary: string;
  keyTakeaways: string[];
  chapters: LectureChapter[];
  questions: QuizQuestion[];
  flashcards: Flashcard[];
  difficulty: DifficultyLevel;
  cheatsheet?: LectureCheatsheet;
  attempts?: UserQuizAttempt[];
}

export interface QuizGenerationRequest {
  url?: string;
  customTranscript?: string;
  title?: string;
  numQuestions: number;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  topicFocus?: string;
  apiKey?: string;
  preferredModel?: string;
}

export interface TranscriptSegment {
  text: string;
  offset: number; // in seconds
  duration: number;
}

export interface SolvedQuestionItem {
  questionNumber: string; // e.g. "Q1(a)" or "Question 1"
  questionText: string;
  marksAllocated: number; // e.g. 2, 5, 10, 15
  answerSummary: string; // 1-2 sentence core answer
  detailedAnswer: string; // Mark-scaled structured answer (Markdown with subheadings)
  keyPoints: string[]; // High-yield bullet points for examiners
  formulasOrCode?: string; // Mathematical formula or code snippet if applicable
  diagramMermaid?: string; // Mermaid architecture/flowchart if applicable
  examTips?: string; // "How to get full marks" tip from examiner perspective
  estimatedWordCount?: number;
}

export interface UniversitySolvedExam {
  id: string;
  userId?: string;
  createdAt: string;
  subject: string;
  academicLevel: string; // e.g. "Undergraduate / B.Tech", "Masters / MS", "High School"
  totalMarks: number;
  rawQuestionsText: string;
  overallExamSummary: string;
  solutions: SolvedQuestionItem[];
}

export interface UniversityExamRequest {
  questionsText: string;
  subject?: string;
  academicLevel?: string;
  apiKey?: string;
  preferredModel?: string;
}
