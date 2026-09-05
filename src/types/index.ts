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
  isAdmin?: boolean;
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
  userId?: string;
  userEmail?: string;
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
  questionsText?: string;
  subject?: string;
  academicLevel?: string;
  apiKey?: string;
  preferredModel?: string;
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
  userId?: string;
  userEmail?: string;
}

// ==========================================
// QUIZTUBE AI TUTOR TYPES
// ==========================================

export type TutorExplanationMode =
  | 'simple'       // Beginner friendly, simple analogies
  | 'detailed'     // In-depth technical & conceptual breakdown
  | 'step_by_step' // Methodical step 1, 2, 3 solution
  | 'example'      // Real-world practical examples & use cases
  | 'exam';        // High-yield exam criteria, memory hooks, pitfalls

export type TutorLearningMode =
  | 'direct'       // Gives comprehensive explanations & answers directly
  | 'socratic';    // Guides the student with scaffolding questions first

export type TutorResponseType =
  | 'concept'
  | 'process'
  | 'comparison'
  | 'algorithm'
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'computer_science'
  | 'programming'
  | 'history'
  | 'geography'
  | 'exam_question'
  | 'definition'
  | 'general';

export type TutorVisualType =
  | 'flowchart'
  | 'process_diagram'
  | 'concept_map'
  | 'timeline'
  | 'comparison_table'
  | 'hierarchy'
  | 'network_graph'
  | 'architecture_diagram'
  | 'formula_breakdown'
  | 'step_sequence'
  | 'code_flow'
  | 'none';

export interface HierarchyLayer {
  layerNumber?: number | string;
  name: string;
  shortDesc: string;
  details?: string;
  protocolsOrExamples?: string[];
  badge?: string;
}

export interface ComparisonTableData {
  headers: string[];
  rows: Array<{ feature: string; values: string[]; highlight?: boolean }>;
  summaryTakeaway?: string;
}

export interface TimelineEventData {
  dateOrPeriod: string;
  title: string;
  description: string;
  significance?: string;
  icon?: string;
}

export interface FormulaBreakdownData {
  formula: string;
  name: string;
  purpose: string;
  variables: Array<{ symbol: string; meaning: string; unit?: string }>;
  notes?: string;
}

export interface StepSequenceItem {
  stepNumber: number;
  title: string;
  action: string;
  stateOrData?: string;
  explanation: string;
  highlightNodes?: string[];
  isFinal?: boolean;
}

export interface DiagramNode {
  id: string;
  label: string;
  details?: string;
  type?: 'start' | 'process' | 'decision' | 'end' | 'active';
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  costOrWeight?: string;
}

export interface CodeFlowData {
  language: string;
  code: string;
  executionSteps?: Array<{ lineOrStep: number | string; description: string; variableState?: string }>;
  explanation?: string;
}

export interface TutorVisualData {
  type: TutorVisualType;
  title?: string;
  subtitle?: string;
  hierarchyLayers?: HierarchyLayer[];
  comparisonTable?: ComparisonTableData;
  timelineEvents?: TimelineEventData[];
  formulaBreakdown?: FormulaBreakdownData;
  stepSequence?: StepSequenceItem[];
  diagramNodes?: DiagramNode[];
  diagramEdges?: DiagramEdge[];
  mermaidCode?: string;
  codeFlow?: CodeFlowData;
  startNode?: string;
  finalCost?: string | number;
  distances?: Record<string, string | number>;
}

export interface TutorSection {
  type: 'explanation' | 'steps' | 'key_takeaway' | 'socratic_question';
  title?: string;
  content?: string;
  items?: Array<{ stepNumber: number; title: string; detail: string; status?: string }>;
}

export interface TutorStructuredResponse {
  title: string;
  responseType: TutorResponseType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  visual?: TutorVisualData;
  sections?: TutorSection[];
  example?: {
    title: string;
    scenario: string;
    walkthrough: string;
    codeOrFormula?: string;
  };
  mistakeAnalysis?: {
    studentAnswer: string;
    correctAnswer: string;
    whatWentWrong: string;
    why: string;
    howToRemember: string;
  };
  practiceQuestion?: {
    question: string;
    options?: string[];
    correctOptionIndex?: number;
    explanation: string;
    hint?: string;
  };
  actions?: Array<
    | 'explain_simpler'
    | 'show_example'
    | 'show_diagram'
    | 'test_me'
    | 'guide_me'
    | 'generate_quiz'
    | 'create_flashcards'
    | 'try_similar'
    | 'show_solution'
    | string
  >;
  followUpQuestions?: string[];
}

export interface TutorContext {
  type?: 'lecture' | 'notes' | 'quiz_question' | 'mistake' | 'exam_question' | 'general';
  lectureTitle?: string;
  videoUrl?: string;
  videoId?: string;
  timestampFormatted?: string;
  timestampSeconds?: number;
  relevantTranscriptSnippet?: string;
  notesOrCheatsheetSnippet?: string;
  questionText?: string;
  options?: string[];
  studentSelectedAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  subject?: string;
  academicLevel?: string;
  topicTag?: string;
}

export interface TutorSuggestedAction {
  label: string;
  action: 'practice' | 'flashcards' | 'save' | 'simplify' | 'example' | 'diagram' | 'socratic' | 'solution' | 'similar';
  topic?: string;
  payload?: any;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  structured?: TutorStructuredResponse;
  createdAt: string;
  suggestedActions?: TutorSuggestedAction[];
  followUpQuestions?: string[];
  isSocratic?: boolean;
  explanationMode?: TutorExplanationMode;
  sourceContextUsed?: boolean;
  imagePreviewUrl?: string;
}

export interface TutorConversation {
  id: string;
  userId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: TutorMessage[];
  context?: TutorContext;
  explanationMode: TutorExplanationMode;
  learningMode: TutorLearningMode;
}

export interface TutorChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: TutorContext;
  explanationMode?: TutorExplanationMode;
  learningMode?: TutorLearningMode;
  imageFileBase64?: string;
  imageMimeType?: string;
  imageFileName?: string;
  apiKey?: string;
  preferredModel?: string;
  userId?: string;
  userEmail?: string;
}

// ==========================================
// QUIZTUBE PRO & MONETIZATION TYPES
// ==========================================

export type UserPlan = 'free' | 'pro';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export type AiFeatureType = 'quiz_ai' | 'question_solver' | 'tutor';

export interface UserSubscription {
  id: string;
  userId: string;
  plan: UserPlan;
  status: SubscriptionStatus;
  paymentProvider?: 'razorpay' | 'manual';
  orderId?: string;
  paymentId?: string;
  subscriptionId?: string;
  amount: number; // in INR paise or rupees (e.g., 14900 or 149)
  currency: string; // 'INR'
  startDate: string;
  expiryDate: string; // 30 days from start or next billing date
  autoRenew?: boolean;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyAiUsage {
  id?: string;
  userId: string;
  featureType: AiFeatureType;
  usageDate: string; // YYYY-MM-DD in Asia/Kolkata timezone
  promptCount: number;
  updatedAt: string;
}

export interface UserUsageSummary {
  userId?: string;
  userEmail?: string;
  plan: UserPlan;
  isPro: boolean;
  isAdmin?: boolean;
  subscription?: UserSubscription | null;
  quizAiUsed: number;
  quizAiLimit: number; // 2 for Free, 100 for Pro (fair-use)
  quizAiRemaining: number;
  questionSolverUsed: number;
  questionSolverLimit: number; // 2 for Free, 100 for Pro (fair-use)
  questionSolverRemaining: number;
  tutorAllowed: boolean;
  timezone: string; // 'Asia/Kolkata'
  date: string; // 'YYYY-MM-DD'
}

export interface PaymentOrderRequest {
  userId: string;
  userEmail?: string;
  userName?: string;
  plan: 'pro';
  period: 'monthly_30d';
}

export interface PaymentVerificationRequest {
  userId: string;
  userEmail?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}




