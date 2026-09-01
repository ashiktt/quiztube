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
} from 'lucide-react';
import { SolvedQuestionItem, UniversitySolvedExam } from '@/types';
import { exportUniversityExamPdf } from '@/lib/examPdfExport';
import { MermaidRenderer } from '@/components/MermaidRenderer';

const SAMPLE_EXAMS = [
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
}

export function UniversityQuestionSolver({
  onBackToYouTube,
  apiKey,
  hasServerKey,
  onOpenApiKeyModal,
}: UniversityQuestionSolverProps) {
  const [subject, setSubject] = useState('Computer Science & Engineering');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate / B.Tech / BSC');
  const [questionsText, setQuestionsText] = useState('');
  const [preferredModel, setPreferredModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [solvedExam, setSolvedExam] = useState<UniversitySolvedExam | null>(null);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

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
    const hasText = questionsText.trim().length >= 5;
    const hasFile = Boolean(uploadedFile);

    if (!hasText && !hasFile) {
      setErrorMessage('Please enter exam questions or upload a question paper PDF/Image.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/solve-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionsText: questionsText.trim() || undefined,
          subject: subject.trim() || 'University Examination',
          academicLevel,
          apiKey,
          preferredModel: preferredModel || undefined,
          fileBase64: uploadedFile?.base64,
          fileMimeType: uploadedFile?.mimeType,
          fileName: uploadedFile?.file.name,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data?.error?.includes('API key is required') && onOpenApiKeyModal) {
          onOpenApiKeyModal();
        }
        throw new Error(data?.error || 'Failed to solve university exam questions.');
      }

      setSolvedExam(data.solvedExam);

      // Expand all solutions by default
      const initialExpanded: Record<string, boolean> = {};
      (data.solvedExam.solutions || []).forEach((_: any, idx: number) => {
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

  // Helper for mark badge colors
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
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 rounded-full shadow-sm">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span>Multimodal AI Academic Examiner (Text, PDF & Images)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              University{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Question Solver
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Upload your question paper as a <strong>PDF or Image</strong>, or paste question text with marks (2, 5, 10, 15 M) to generate accurate, mark-scaled model answers and download as PDF booklets.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Sample Exam Papers</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to auto-fill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_EXAMS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl text-left transition group"
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
          <form
            onSubmit={handleSolve}
            className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileUp className="w-4 h-4 text-indigo-500" />
                  <span>Upload Question Paper (PDF or Photo/Image)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">PDF, PNG, JPG, WEBP (Max 15MB)</span>
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
                  className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Click to upload or drag & drop Question Paper
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Upload exam paper photo, scanned pages, or official university PDF
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    {uploadedFile.previewUrl ? (
                      <img
                        src={uploadedFile.previewUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0"
                      />
                    ) : (
                      <div className="p-3 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                        <File className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB • {uploadedFile.mimeType.includes('pdf') ? 'PDF Document' : 'Image Photo'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0"
                    title="Remove attached file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Questions Textarea (Optional if file uploaded, or for additional prompts) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>
                    {uploadedFile ? 'Additional Notes / Specific Questions (Optional)' : 'Or Paste Exam Questions & Marks'}
                  </span>
                </label>
                {!uploadedFile && (
                  <span className="text-[11px] text-slate-400">
                    e.g. <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">[2 Marks]</code>, <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">(5M)</code>, <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">[10]</code>
                  </span>
                )}
              </div>

              <textarea
                rows={uploadedFile ? 4 : 8}
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
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300 animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Unable to process question paper</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] rounded-2xl shadow-lg shadow-indigo-500/20 transition disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {uploadedFile
                      ? 'AI Examiner is Reading File & Solving Question Paper...'
                      : 'Senior AI Examiner is Generating Model Answers...'}
                  </span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>
                    {uploadedFile
                      ? 'Solve Uploaded Question Paper & Generate PDF'
                      : 'Generate Mark-Scaled Model Solutions & PDF'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Solved Exam Model Solutions View */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Control Banner */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSolvedExam(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mr-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Solve Another Exam Paper</span>
                </button>

                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800">
                  {solvedExam.academicLevel}
                </span>

                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {solvedExam.totalMarks} Total Marks
                </span>

                <span className="text-xs text-slate-400 font-mono">
                  {solvedExam.solutions.length} Questions Solved
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {solvedExam.subject} — Model Solutions
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition shadow-sm"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAll ? 'Copied All!' : 'Copy Markdown'}</span>
              </button>

              <button
                type="button"
                onClick={() => exportUniversityExamPdf(solvedExam)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition shadow-md shadow-indigo-500/20"
              >
                <FileDown className="w-4 h-4" />
                <span>Download as PDF</span>
              </button>
            </div>
          </div>

          {/* Overview Callout */}
          {solvedExam.overallExamSummary && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/40 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-pink-950/10 border border-indigo-200/70 dark:border-indigo-800/60 rounded-3xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Paper Topical Synthesis & Scope</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {solvedExam.overallExamSummary}
              </p>
            </div>
          )}

          {/* Solutions Accordion List */}
          <div className="space-y-6">
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
                    className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-lg border uppercase tracking-wider ${badgeStyle}`}>
                          {sol.questionNumber || `Q${idx + 1}`} • {sol.marksAllocated} MARKS
                        </span>

                        {sol.estimatedWordCount && (
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>~{sol.estimatedWordCount} words</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {sol.questionText}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleCopySingleAnswer(sol, idx);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition"
                        title="Copy this solution"
                      >
                        {copiedQuestionId === `${idx}` ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <div className="p-1.5 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Solution Content */}
                  {isExpanded && (
                    <div className="p-5 sm:p-8 space-y-6 bg-slate-50/30 dark:bg-slate-900/40">
                      {/* TL;DR Answer Thesis */}
                      {sol.answerSummary && (
                        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Core Thesis / Quick Summary</span>
                          </span>
                          <p className="text-xs sm:text-sm font-medium text-emerald-950 dark:text-emerald-200 italic">
                            {sol.answerSummary}
                          </p>
                        </div>
                      )}

                      {/* Detailed Mark-Scaled Model Answer */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Structured Model Solution ({sol.marksAllocated} Marks Depth)
                        </span>

                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 space-y-3 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                          {sol.detailedAnswer}
                        </div>
                      </div>

                      {/* Mermaid Architecture Flowchart (if applicable) */}
                      {sol.diagramMermaid && (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Cpu className="w-4 h-4" />
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
          <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-extrabold text-lg">Download Complete Model Answer Paper</h3>
              <p className="text-xs text-white/80">
                Formatted as a professional university-style assessment booklet with student headers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => exportUniversityExamPdf(solvedExam)}
              className="px-6 py-3 bg-white text-indigo-700 hover:bg-slate-100 font-bold text-sm rounded-xl shadow-md transition shrink-0 active:scale-95 flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF Booklet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
