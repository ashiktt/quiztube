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

export interface LectureStudySet {
  id: string;
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
