'use client';

import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  Sparkles,
  FileDown,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  RotateCcw,
  FileText,
  Lightbulb,
  Award,
  ChevronDown,
  ChevronUp,
  Cpu,
  Code,
  Share2,
  Upload,
  File,
  Image as ImageIcon,
  X,
  FileUp,
  Crown,
} from 'lucide-react';
import { SolvedQuestionItem, UniversityExamRequest, UniversitySolvedExam, UserUsageSummary } from '@/types';
import { SUBSCRIPTION_ENABLED } from '@/config/subscription';
import { exportUniversityExamPdf } from '@/lib/examPdfExport';
import { MermaidRenderer } from '@/components/MermaidRenderer';
import { SafeMarkdown } from '@/components/tutor/SafeMarkdown';
import { getAuthHeaders } from '@/lib/auth';
import { saveSolvedExam } from '@/lib/storage';
import { GlyphBackground } from '@/components/animate-ui/backgrounds/glyph';

const SAMPLE_EXAMS = [
  {
    title: 'Database Systems: Distributed DBMS (DDBMS)',
    subject: 'Distributed Database Systems (CS304)',
    level: 'Undergraduate / B.Tech / BSC',
    text: `Q1. Define Distributed Database Management System (DDBMS). Name one advantage of using a DDBMS related to data duplication. [5 Marks]

Q2. What is the Two-Phase Commit (2PC) protocol in distributed databases? Explain the Prepare and Commit phases with a visual flowchart. [8 Marks]

Q3. Compare Data Replication vs. Data Fragmentation (Horizontal and Vertical) in DDBMS. Discuss transparency, query performance, and fault tolerance with an architectural diagram. [10 Marks]`,
  },
  {
    title: 'Computer Science: DSA & Algorithms',
    subject: 'Data Structures & Algorithms (CS201)',
    level: 'Undergraduate / B.Tech / BSC',
    text: `Q1. Define Big-O notation and state the time complexity of binary search. [2 Marks]

Q2. Explain the working principle of a Hash Table with collision resolution using Chaining. [5 Marks]

Q3. Compare Depth First Search (DFS) and Breadth First Search (BFS) in detail. Discuss their time/space complexity, data structures used, and practical applications in shortest-path finding and cycle detection. [10 Marks]

Q4. Design and analyze the Dijkstra's Shortest Path Algorithm for weighted graphs with non-negative edge weights. Provide the step-by-step algorithmic execution, prove its optimality, discuss edge cases, and analyze the complexity with an adjacency list and Min-Heap. [15 Marks]`,
  },
  {
    title: 'Operating Systems: Concurrency & Memory',
    subject: 'Operating Systems (CS302)',
    level: 'Undergraduate / B.Tech / BSC',
    text: `Q1. What is the difference between a Process and a Thread? [2 Marks]

Q2. What are the four Coffman conditions necessary for a Deadlock to occur? Explain briefly. [5 Marks]

Q3. Explain Virtual Memory management using Paging. Describe the translation of logical address to physical address with Translation Lookaside Buffer (TLB), page faults, and LRU page replacement. [10 Marks]`,
  },
  {
    title: 'Machine Learning: Deep Neural Networks',
    subject: 'Machine Learning & Deep Learning (CS450)',
    level: 'Undergraduate / Masters',
    text: `Q1. What is the Vanishing Gradient problem in Deep Neural Networks? [2 Marks]

Q2. Explain the purpose and mathematical formulation of the Softmax Activation Function in multi-class classification. [5 Marks]

Q3. Describe the architecture and forward/backward propagation mechanisms of Convolutional Neural Networks (CNNs). Explain Convolution, Pooling, and Fully-Connected layers with industrial applications in computer vision. [10 Marks]`,
  },
];

interface UniversityQuestionSolverProps {
  onBackToYouTube?: () => void;
  apiKey?: string;
  hasServerKey?: boolean;
  onOpenApiKeyModal?: () => void;
  userId?: string;
  userEmail?: string;
  activeSolvedExam?: UniversitySolvedExam | null;
  onExamSolved?: (exam: UniversitySolvedExam) => void;
  usageSummary?: UserUsageSummary | null;
  isPro?: boolean;
  onOpenUpgradeModal?: () => void;
  onQuotaUsed?: () => void;
}

export function UniversityQuestionSolver({
  onBackToYouTube,
  apiKey,
  hasServerKey,
  onOpenApiKeyModal,
  userId,
  userEmail,
  activeSolvedExam,
  onExamSolved,
  usageSummary,
  isPro = false,
  onOpenUpgradeModal,
  onQuotaUsed,
}: UniversityQuestionSolverProps) {
  const [subject, setSubject] = useState('Computer Science & Engineering');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate / B.Tech / BSC');
  const [questionsText, setQuestionsText] = useState('');
  const [preferredModel, setPreferredModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [solvedExam, setSolvedExam] = useState<UniversitySolvedExam | null>(activeSolvedExam || null);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  // Daily quota
  const solverRemaining = usageSummary?.questionSolverRemaining ?? (isPro ? 100 : 2);
  const isQuotaExhausted = !isPro && solverRemaining <= 0;

  // Sync external activeSolvedExam selection from library
  React.useEffect(() => {
    if (activeSolvedExam) {
      setSolvedExam(activeSolvedExam);
      const initialExpanded: Record<string, boolean> = {};
      (activeSolvedExam.solutions || []).forEach((_, idx) => {
        initialExpanded[idx] = true;
      });
      setExpandedSolutions(initialExpanded);
    }
  }, [activeSolvedExam]);

  // File Upload State (PDF or Image)
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
    base64: string;
    mimeType: string;
    previewUrl?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    // Validate file type
    const validMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];

    if (!validMimes.includes(file.type)) {
      setErrorMessage('Please upload a valid PDF document or Image file (.png, .jpg, .jpeg, .webp).');
      return;
    }

    // 15MB limit
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please upload a smaller PDF or image.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      setUploadedFile({
        file,
        base64,
        mimeType: file.type,
        previewUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (preset: (typeof SAMPLE_EXAMS)[0]) => {
    setSubject(preset.subject);
    setAcademicLevel(preset.level);
    setQuestionsText(preset.text);
    handleRemoveFile();
    setErrorMessage(null);
  };

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isQuotaExhausted) {
      setErrorMessage(
        'You have reached your daily limit of 2 free Question Solver generations. Quota resets at 12:00 AM IST (Asia/Kolkata). Upgrade to QuizTube Pro for high limits.'
      );
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      return;
    }

    const hasText = questionsText.trim().length >= 5;
    const hasFile = Boolean(uploadedFile);

    if (!hasText && !hasFile) {
      setErrorMessage('Please enter exam questions or upload a question paper PDF/Image.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/solve-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          questionsText: questionsText.trim() || undefined,
          subject: subject.trim() || 'University Examination',
          academicLevel,
          apiKey,
          preferredModel: preferredModel || undefined,
          fileBase64: uploadedFile?.base64,
          fileMimeType: uploadedFile?.mimeType,
          fileName: uploadedFile?.file.name,
          userId,
          userEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data?.isQuotaExceeded && onOpenUpgradeModal) {
          onOpenUpgradeModal();
        }
        if (data?.error?.includes('API key is required') && onOpenApiKeyModal) {
          onOpenApiKeyModal();
        }
        throw new Error(data?.error || 'Failed to solve university exam questions.');
      }

      const newSolvedExam: UniversitySolvedExam = {
        ...data.solvedExam,
        userId: userId || undefined,
      };

      setSolvedExam(newSolvedExam);
      saveSolvedExam(newSolvedExam);
      if (onExamSolved) onExamSolved(newSolvedExam);
      if (onQuotaUsed) onQuotaUsed();

      // Expand all solutions by default
      const initialExpanded: Record<string, boolean> = {};
      (newSolvedExam.solutions || []).forEach((_: any, idx: number) => {
        initialExpanded[idx] = true;
      });
      setExpandedSolutions(initialExpanded);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error generating exam model answers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySingleAnswer = (sol: SolvedQuestionItem, idx: number) => {
    let md = `### ${sol.questionNumber} [${sol.marksAllocated} Marks]: ${sol.questionText}\n\n`;
    md += `**Key Thesis / Summary:** ${sol.answerSummary}\n\n`;
    md += `**Model Answer:**\n${sol.detailedAnswer}\n\n`;
    if (sol.keyPoints && sol.keyPoints.length > 0) {
      md += `**Key Criteria for Full Marks:**\n`;
      sol.keyPoints.forEach(kp => (md += `- ${kp}\n`));
      md += '\n';
    }
    if (sol.formulasOrCode) {
      md += `\`\`\`\n${sol.formulasOrCode}\n\`\`\`\n\n`;
    }
    if (sol.examTips) {
      md += `*Examiner Tip: ${sol.examTips}*\n\n`;
    }

    navigator.clipboard.writeText(md);
    setCopiedQuestionId(`${idx}`);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  const handleCopyAll = () => {
    if (!solvedExam) return;
    let md = `# Model Solutions: ${solvedExam.subject}\n`;
    md += `**Level:** ${solvedExam.academicLevel} | **Total Marks:** ${solvedExam.totalMarks}M\n\n`;
    md += `## Overview\n${solvedExam.overallExamSummary}\n\n---\n\n`;

    solvedExam.solutions.forEach(sol => {
      md += `## ${sol.questionNumber} [${sol.marksAllocated} Marks]\n`;
      md += `> **${sol.questionText}**\n\n`;
      md += `### Core Thesis\n${sol.answerSummary}\n\n`;
      md += `### Comprehensive Answer\n${sol.detailedAnswer}\n\n`;
      if (sol.keyPoints && sol.keyPoints.length > 0) {
        md += `### High-Yield Criteria:\n`;
        sol.keyPoints.forEach(kp => (md += `- ${kp}\n`));
        md += '\n';
      }
      if (sol.formulasOrCode) {
        md += `\`\`\`\n${sol.formulasOrCode}\n\`\`\`\n\n`;
      }
      if (sol.diagramMermaid) {
        md += `\`\`\`mermaid\n${sol.diagramMermaid}\n\`\`\`\n\n`;
      }
      if (sol.examTips) {
        md += `*💡 Examiner Tip: ${sol.examTips}*\n\n`;
      }
      md += `---\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const toggleExpand = (idx: number) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!solvedExam) return;
    try {
      setIsExportingPdf(true);
      await exportUniversityExamPdf(solvedExam);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setErrorMessage(err?.message || 'Could not generate PDF booklet. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getMarkBadgeStyle = (marks: number) => {
    if (marks <= 2) {
      return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (marks <= 5) {
      return 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (marks <= 10) {
      return 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
    return 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {!solvedExam ? (
        /* Input Form View */
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-emerald-500/20 bg-[#080D0B]/70 backdrop-blur-xl shadow-xl">
            <GlyphBackground
              className="absolute inset-0 z-0 pointer-events-none opacity-45"
              fontSize={10}
              interactive={true}
              glowColor="#10B981"
              shapeColor="#34D399"
            />
            <div className="relative z-10 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-full shadow-sm">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Multimodal AI Academic Examiner (Text, PDF & Images)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                University{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Question Solver
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Upload your question paper as a <strong>PDF or Image</strong>, or paste question text with marks (2, 5, 10, 15 M) to generate accurate, mark-scaled model answers and download as PDF booklets.
              </p>

              {/* Daily Quota Indicator (Only when subscriptions are enabled) */}
              {SUBSCRIPTION_ENABLED && (
                <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                  {isPro ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full font-medium">
                      <Crown className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span>QuizTube Pro &middot; Advanced Question Solver (High AI limits)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-emerald-500/30 text-slate-300 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Free Daily Quota: <strong className="text-emerald-400">{solverRemaining}/2</strong> generations remaining today (Asia/Kolkata)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quota Exhausted Banner (Only when subscriptions are enabled) */}
          {SUBSCRIPTION_ENABLED && isQuotaExhausted && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 fill-current" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-bold text-white">Daily Free Question Solver Limit Reached</h4>
                  <p className="text-[11px] sm:text-xs text-slate-300">
                    You have used 2/2 free generations for today (IST timezone). Upgrade to Pro for Advanced Question Solver with High AI limits.
                  </p>
                </div>
              </div>
              {onOpenUpgradeModal && (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition transform hover:scale-[1.02] shrink-0"
                >
                  Upgrade &middot; &#8377;149/mo
                </button>
              )}
            </div>
          )}

          {/* Quick Presets */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sample Exam Papers</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to auto-fill</span>
            </div>

            <div className="flex sm:grid sm:grid-cols-3 gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {SAMPLE_EXAMS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl text-left transition group min-w-[220px] sm:min-w-0 shrink-0 sm:shrink"
                >
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {preset.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{preset.subject}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Main Solver Form */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/25 bg-[#0c102b]/85 backdrop-blur-2xl shadow-xl">
            <GlyphBackground
              className="absolute inset-0 z-0 pointer-events-none opacity-30"
              fontSize={10}
              interactive={true}
              glowColor="#10B981"
              shapeColor="#34D399"
            />
            <form
              onSubmit={handleSolve}
              className="relative z-10 p-3.5 sm:p-8 space-y-4 sm:space-y-6"
            >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Subject / Course Name
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems (CS302) or Engineering Physics"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-h-[44px]"
                />
              </div>

              {/* Academic Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Academic Target Level
                </label>
                <select
                  value={academicLevel}
                  onChange={e => setAcademicLevel(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-h-[44px]"
                >
                  <option value="Undergraduate / B.Tech / BSC / BA">Undergraduate (B.Tech / BSC / BA / B.Com)</option>
                  <option value="Masters / MS / M.Tech / MBA">Postgraduate / Masters (MS / M.Tech / MBA)</option>
                  <option value="High School / AP / IB / A-Levels">High School / AP / IB / A-Levels</option>
                  <option value="Professional / Competitive Certification">Professional / Competitive Exam</option>
                </select>
              </div>
            </div>

            {/* Multimodal PDF / Image Upload Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-1">
                <span className="flex items-center gap-1.5">
                  <FileUp className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Upload Question Paper (PDF or Image)</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal">PDF, PNG, JPG, WEBP (Max 15MB)</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`p-4 sm:p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 min-h-[120px] ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="p-2.5 sm:p-3 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Tap to select file, or drag & drop (optional)
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Exam paper photo, scanned pages, or official university PDF
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 sm:p-4 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {uploadedFile.previewUrl ? (
                      <img
                        src={uploadedFile.previewUrl}
                        alt="Preview"
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0"
                      />
                    ) : (
                      <div className="p-2.5 sm:p-3 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                        <File className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200 truncate break-all">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                        {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB • {uploadedFile.mimeType.includes('pdf') ? 'PDF Document' : 'Image Photo'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0"
                    title="Remove attached file"
                    aria-label="Remove attached file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Questions Textarea */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    {uploadedFile ? 'Additional Notes / Questions (Optional)' : 'Or Paste Exam Questions & Marks'}
                  </span>
                </label>
                {!uploadedFile && (
                  <span className="text-[10px] sm:text-[11px] text-slate-400">
                    e.g. <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">[2 Marks]</code>, <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">(5M)</code>
                  </span>
                )}
              </div>

              <textarea
                rows={uploadedFile ? 3 : 6}
                value={questionsText}
                onChange={e => setQuestionsText(e.target.value)}
                placeholder={
                  uploadedFile
                    ? 'Optional: Mention specific questions to prioritize or add extra instructions...'
                    : `Paste your questions here. Example:

Q1. Define Paging and Segmentation. [2 Marks]

Q2. Explain the working of Semaphore synchronization with wait() and signal(). [5 Marks]

Q3. Compare Monolithic vs Microkernel architectures with diagrams, advantages, and real OS examples. [10 Marks]`
                }
                className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 sm:p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300 animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="font-bold">Unable to process question paper</p>
                  <p className="break-words">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3.5 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] rounded-2xl shadow-lg shadow-indigo-500/20 transition disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span className="truncate">
                    {uploadedFile
                      ? 'AI Examiner is Solving Question Paper...'
                      : 'Senior AI Examiner is Generating Model Answers...'}
                  </span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse shrink-0" />
                  <span className="truncate">
                    {uploadedFile
                      ? 'Solve Uploaded Question Paper & Generate PDF'
                      : 'Generate Mark-Scaled Model Solutions & PDF'}
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </>
              )}
            </button>
          </form>
          </div>
        </div>
      ) : (
        /* Solved Exam Model Solutions View */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Control Banner */}
          <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSolvedExam(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mr-2 min-h-[36px] py-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Solve Another Exam Paper</span>
                </button>

                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800 shrink-0">
                  {solvedExam.academicLevel}
                </span>

                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {solvedExam.totalMarks} Total Marks
                </span>

                <span className="text-xs text-slate-400 font-mono">
                  {solvedExam.solutions.length} Questions Solved
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                {solvedExam.subject} — Model Solutions
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row sm:flex-wrap items-stretch xs:items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition shadow-sm w-full xs:w-auto"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAll ? 'Copied All!' : 'Copy Markdown'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition shadow-md shadow-indigo-500/20 disabled:opacity-60 w-full xs:w-auto"
              >
                <FileDown className={`w-4 h-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
                <span>{isExportingPdf ? 'Rendering PDF...' : 'Download as PDF'}</span>
              </button>
            </div>
          </div>

          {/* Overview Callout */}
          {solvedExam.overallExamSummary && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/40 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-pink-950/10 border border-indigo-200/70 dark:border-indigo-800/60 rounded-3xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Paper Topical Synthesis & Scope</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                {solvedExam.overallExamSummary}
              </p>
            </div>
          )}

          {/* Solutions Accordion List */}
          <div className="space-y-4 sm:space-y-6">
            {solvedExam.solutions.map((sol, idx) => {
              const isExpanded = expandedSolutions[idx] !== false;
              const badgeStyle = getMarkBadgeStyle(sol.marksAllocated);

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition"
                >
                  {/* Question Card Header */}
                  <div
                    onClick={() => toggleExpand(idx)}
                    className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 sm:gap-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-lg border uppercase tracking-wider shrink-0 ${badgeStyle}`}>
                          {sol.questionNumber || `Q${idx + 1}`} • {sol.marksAllocated} MARKS
                        </span>

                        {sol.estimatedWordCount && (
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>~{sol.estimatedWordCount} words</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug break-words">
                        {sol.questionText}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleCopySingleAnswer(sol, idx);
                        }}
                        className="p-2 sm:p-2.5 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition"
                        title="Copy this solution"
                      >
                        {copiedQuestionId === `${idx}` ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <div className="p-1 sm:p-1.5 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Solution Content */}
                  {isExpanded && (
                    <div className="p-4 sm:p-8 space-y-5 sm:space-y-6 bg-slate-50/30 dark:bg-slate-900/40">
                      {/* TL;DR Answer Thesis */}
                      {sol.answerSummary && (
                        <div className="p-3.5 sm:p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Core Thesis / Quick Summary</span>
                          </span>
                          <p className="text-xs sm:text-sm font-medium text-emerald-950 dark:text-emerald-200 italic break-words">
                            {sol.answerSummary}
                          </p>
                        </div>
                      )}

                      {/* Detailed Mark-Scaled Model Answer */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Structured Model Solution ({sol.marksAllocated} Marks Depth)
                        </span>

                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <SafeMarkdown content={sol.detailedAnswer} />
                        </div>
                      </div>

                      {/* Mermaid Architecture Flowchart (if applicable) */}
                      {sol.diagramMermaid && (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 shrink-0" />
                            <span>Visual System Flowchart & Architecture</span>
                          </span>
                          <MermaidRenderer
                            code={sol.diagramMermaid}
                            title={`${sol.questionNumber} Architecture Diagram`}
                          />
                        </div>
                      )}

                      {/* Formulas / Code Snippet */}
                      {sol.formulasOrCode && sol.formulasOrCode.trim().length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Code className="w-4 h-4 text-purple-500" />
                            <span>Core Formula / Implementation Syntax</span>
                          </span>
                          <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs overflow-x-auto font-mono border border-slate-800">
                            <code>{sol.formulasOrCode}</code>
                          </pre>
                        </div>
                      )}

                      {/* Examiner Marking Criteria */}
                      {sol.keyPoints && sol.keyPoints.length > 0 && (
                        <div className="p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>Full-Marks Criteria (Examiner Checklist):</span>
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                            {sol.keyPoints.map((kp, kIdx) => (
                              <li key={kIdx} className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{kp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Examiner Insider Tip */}
                      {sol.examTips && (
                        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold mr-1">Examiner Scoring Tip:</span>
                            <span>{sol.examTips}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Download Bar */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-extrabold text-base sm:text-lg">Download Complete Model Answer Paper</h3>
              <p className="text-xs text-white/80">
                Formatted as a professional university-style assessment booklet with student headers.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-6 py-3.5 min-h-[48px] bg-white text-indigo-700 hover:bg-slate-100 font-bold text-sm rounded-xl shadow-md transition shrink-0 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 w-full sm:w-auto"
            >
              <FileDown className={`w-4 h-4 shrink-0 ${isExportingPdf ? 'animate-bounce' : ''}`} />
              <span>{isExportingPdf ? 'Generating PDF Booklet...' : 'Download PDF Booklet'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
