'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  ArrowRight,
  Lightbulb,
  FileQuestion,
  HelpCircle,
  Brain,
  GraduationCap,
  Play,
  Share2,
  Bookmark,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  TutorContext,
  TutorExplanationMode,
  TutorLearningMode,
  TutorMessage,
  TutorConversation,
  TutorChatRequest,
  TutorSuggestedAction,
} from '@/types';
import { saveTutorConversation, getStoredApiKey } from '@/lib/storage';

interface AITutorViewProps {
  initialContext?: TutorContext | null;
  onClearContext?: () => void;
  onPracticeTopic?: (topic: string) => void;
  onCreateFlashcards?: (topic: string) => void;
  onBackToStudy?: () => void;
  userId?: string;
  hasServerKey?: boolean;
  onOpenApiKeyModal?: () => void;
  activeConversation?: TutorConversation | null;
  onConversationUpdated?: (conv: TutorConversation) => void;
}

const EXPLANATION_MODES: {
  id: TutorExplanationMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  { id: 'simple', label: 'Simple', description: 'Intuitive ELI5 explanation with analogies', icon: '💡' },
  { id: 'detailed', label: 'Detailed', description: 'Comprehensive theoretical depth', icon: '📚' },
  { id: 'step_by_step', label: 'Step-by-Step', description: 'Logical numbered derivation', icon: '📝' },
  { id: 'example', label: 'Example', description: 'Practical code & real-world scenarios', icon: '🔍' },
  { id: 'exam', label: 'Exam Mode', description: 'Mark-maximizing points & examiner tips', icon: '🎯' },
];

export function AITutorView({
  initialContext,
  onClearContext,
  onPracticeTopic,
  onCreateFlashcards,
  onBackToStudy,
  userId,
  hasServerKey,
  onOpenApiKeyModal,
  activeConversation,
  onConversationUpdated,
}: AITutorViewProps) {
  const [context, setContext] = useState<TutorContext | null>(initialContext || null);
  const [explanationMode, setExplanationMode] = useState<TutorExplanationMode>('step_by_step');
  const [learningMode, setLearningMode] = useState<TutorLearningMode>('socratic');
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isSpeakingMsgId, setIsSpeakingMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Attached image state for multimodal queries
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Initialize or load conversation
  useEffect(() => {
    if (activeConversation) {
      setConversationId(activeConversation.id);
      setMessages(activeConversation.messages);
      setExplanationMode(activeConversation.explanationMode || 'step_by_step');
      setLearningMode(activeConversation.learningMode || 'socratic');
      if (activeConversation.context) {
        setContext(activeConversation.context);
      }
    } else {
      const newId = 'tutor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      setConversationId(newId);
      if (initialContext) {
        setContext(initialContext);
      }
    }
  }, [activeConversation, initialContext]);

  // Sync initialContext changes
  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
  }, [initialContext]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  // Speech Recognition (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        speechRecognitionRef.current = recognition;
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!speechRecognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isRecording) {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        const base64Data = result.split(',')[1];
        setAttachedImage({
          base64: base64Data,
          mimeType: file.type,
          previewUrl: result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query && !attachedImage) return;

    const storedKey = getStoredApiKey();

    const userMessage: TutorMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: query || '(Uploaded image for analysis)',
      createdAt: new Date().toISOString(),
      imagePreviewUrl: attachedImage ? attachedImage.previewUrl : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    const currentImage = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const payload: TutorChatRequest = {
        messages: newMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        explanationMode,
        learningMode,
        context: context || undefined,
        imageFileBase64: currentImage ? currentImage.base64 : undefined,
        imageMimeType: currentImage ? currentImage.mimeType : undefined,
        apiKey: storedKey || undefined,
        userId,
      };

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data?.error?.includes('Gemini API key is required') && onOpenApiKeyModal) {
          onOpenApiKeyModal();
        }
        throw new Error(data?.error || 'Failed to get explanation from AI Tutor.');
      }

      const assistantMessage: TutorMessage = data.message || {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply || 'No response from AI Tutor.',
        createdAt: new Date().toISOString(),
        suggestedActions: data.suggestedActions || [],
        explanationMode,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Persist conversation
      const currentConvId = conversationId || 'tutor_' + Date.now();
      const firstUserMsg = finalMessages.find(m => m.role === 'user')?.content || 'Study Help';
      const convTitle =
        context?.lectureTitle
          ? `Tutor: ${context.lectureTitle.substring(0, 35)}...`
          : firstUserMsg.length > 40
          ? `${firstUserMsg.substring(0, 40)}...`
          : firstUserMsg;

      const conversationToSave: TutorConversation = {
        id: currentConvId,
        userId,
        createdAt: activeConversation?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: convTitle,
        explanationMode,
        learningMode,
        context: context || undefined,
        messages: finalMessages,
      };

      saveTutorConversation(conversationToSave);
      if (onConversationUpdated) {
        onConversationUpdated(conversationToSave);
      }
    } catch (err: any) {
      console.error('AI Tutor error:', err);
      const errorMessage: TutorMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Error:** ${err.message || 'Unable to connect to AI Tutor. Please verify your Gemini API key and network connection.'}`,
        createdAt: new Date().toISOString(),
        explanationMode,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (content: string, msgId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSpeakText = (content: string, msgId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = content
      .replace(/```[\s\S]*?```/g, 'Code snippet omitted.')
      .replace(/[*#_`~>]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeakingMsgId(null);
    utterance.onerror = () => setIsSpeakingMsgId(null);

    setIsSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleActionClick = (action: TutorSuggestedAction) => {
    if (action.action === 'practice') {
      const topic = action.topic || context?.topicTag || 'Core Concept';
      if (onPracticeTopic) {
        onPracticeTopic(topic);
      } else {
        handleSendMessage(`Give me 3 practice multiple-choice questions on "${topic}" to test my understanding.`);
      }
    } else if (action.action === 'flashcards') {
      const topic = action.topic || context?.topicTag || 'Key Terms';
      if (onCreateFlashcards) {
        onCreateFlashcards(topic);
      } else {
        handleSendMessage(`Generate a set of 5 active-recall flashcard definitions for "${topic}".`);
      }
    } else if (action.action === 'simplify') {
      setExplanationMode('simple');
      handleSendMessage('Can you explain that previous concept in simpler terms using an intuitive real-world analogy?');
    } else if (action.action === 'example') {
      setExplanationMode('example');
      handleSendMessage('Can you provide another clear practical example or real-world application of this concept?');
    } else {
      handleSendMessage(action.label);
    }
  };

  const handleNewChat = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    const newId = 'tutor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    setConversationId(newId);
    setMessages([]);
    setInputText('');
    setAttachedImage(null);
  };

  // Dynamic context-aware suggestion prompts
  const getContextSuggestions = () => {
    if (context?.type === 'mistake' || context?.type === 'quiz_question') {
      return [
        { label: 'Explain why my answer was wrong', prompt: 'Why is my selected answer incorrect, and why is the correct option right?' },
        { label: 'Give a simple analogy', prompt: 'Can you explain this concept using a simple real-world analogy?' },
        { label: 'Give me a similar practice question', prompt: 'Generate a new practice question to test if I understand this concept now.' },
        { label: 'Common exam pitfalls', prompt: 'What are the common traps students fall into on this type of question?' },
      ];
    }

    if (context?.type === 'lecture' || context?.type === 'notes') {
      return [
        { label: 'Summarize key takeaways', prompt: 'What are the 3 most critical points taught in this lecture segment?' },
        { label: 'Explain the core formula / logic', prompt: 'Explain the key formula or algorithm introduced in this lecture.' },
        { label: 'Give a real-world coding example', prompt: 'Provide a real-world practical code implementation of this concept.' },
        { label: 'Quiz me on this topic', prompt: 'Ask me a challenging conceptual question on this lecture topic.' },
      ];
    }

    if (context?.type === 'exam_question') {
      return [
        { label: 'How to write for full marks', prompt: 'What specific keywords and structural points must I write in the exam for full marks?' },
        { label: 'Explain the architecture diagram', prompt: 'Walk me through the system architecture / flowchart step-by-step.' },
        { label: 'Compare with alternative approaches', prompt: 'Compare this solution with alternative techniques and state trade-offs.' },
      ];
    }

    return [
      { label: 'Explain recursion simply', prompt: 'Explain recursion in simple terms with a visual analogy.' },
      { label: 'How does Dijkstra algorithm work?', prompt: 'Walk me through Dijkstra algorithm step-by-step with a weighted graph example.' },
      { label: 'Vanishing gradient problem', prompt: 'Why does the vanishing gradient problem happen in deep neural networks and how is it solved?' },
      { label: 'Process vs Thread', prompt: 'Compare a process and a thread in operating systems with memory layouts.' },
    ];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] sm:h-[calc(100vh-145px)] max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition">
      {/* 1. Header Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 rounded-2xl text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                QuizTube AI Tutor
              </h2>
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                24/7 Academic Mentor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Grounded in your lectures, mistakes, and university model solutions
            </p>
          </div>
        </div>

        {/* Top Controls: Learning Mode Switch & New Chat */}
        <div className="flex items-center gap-2">
          {/* Socratic vs Direct Toggle */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLearningMode('socratic')}
              className={`px-2.5 py-1 rounded-lg transition ${
                learningMode === 'socratic'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Guides you step-by-step with hints & questions"
            >
              🧭 Guide Me
            </button>
            <button
              type="button"
              onClick={() => setLearningMode('direct')}
              className={`px-2.5 py-1 rounded-lg transition ${
                learningMode === 'direct'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Gives full immediate answers & derivations"
            >
              ⚡ Direct Solution
            </button>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700"
            title="Start a fresh tutoring session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {onBackToStudy && (
            <button
              type="button"
              onClick={onBackToStudy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Back</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Active Context Banner (if present) */}
      {context && (
        <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md shrink-0">
              {context.type === 'mistake' || context.type === 'quiz_question' ? (
                <HelpCircle className="w-3.5 h-3.5 text-red-500" />
              ) : context.type === 'lecture' || context.type === 'notes' ? (
                <Play className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <FileQuestion className="w-3.5 h-3.5 text-purple-600" />
              )}
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
              Active Context:
            </span>
            <span className="font-medium text-slate-900 dark:text-white truncate">
              {context.lectureTitle || context.questionText || 'Study Material'}
              {context.timestampFormatted && (
                <span className="ml-1 text-indigo-600 dark:text-indigo-400 font-mono">
                  [{context.timestampFormatted}]
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setContext(null);
              if (onClearContext) onClearContext();
            }}
            className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 shrink-0 flex items-center gap-1"
            title="Detach context to ask general study questions"
          >
            <X className="w-3 h-3" />
            <span>Detach</span>
          </button>
        </div>
      )}

      {/* 3. Explanation Mode Pills Selector */}
      <div className="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
          Mode:
        </span>
        {EXPLANATION_MODES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setExplanationMode(m.id)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition flex items-center gap-1 shrink-0 ${
              explanationMode === m.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={m.description}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* 4. Chat Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State: Welcome & Starter Suggestions */
          <div className="py-6 sm:py-10 max-w-xl mx-auto text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                How can I help you master this topic?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {context
                  ? `I'm ready to explain difficult concepts, diagnose mistakes, or guide you through derivations for: "${context.lectureTitle || context.topicTag || 'your lecture'}".`
                  : 'Ask any university STEM question, paste code to debug, upload an exam diagram photo, or ask for simple analogies!'}
              </p>
            </div>

            {/* Quick Starter Chips */}
            <div className="space-y-2 text-left pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                Suggested Prompts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getContextSuggestions().map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(s.prompt)}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl transition group"
                  >
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {s.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {s.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation Messages List */
          messages.map(msg => {
            const isUser = msg.role === 'user';
            const isSpeaking = isSpeakingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start animate-in fade-in ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 text-slate-900 dark:text-slate-100 rounded-tl-none'
                  }`}
                >
                  {/* User Uploaded Image Preview */}
                  {msg.imagePreviewUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/20 max-w-xs">
                      <img
                        src={msg.imagePreviewUrl}
                        alt="Uploaded for analysis"
                        className="w-full object-cover max-h-48"
                      />
                    </div>
                  )}

                  {/* Message Text Content */}
                  <div
                    className={`prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                      isUser ? 'text-white prose-p:text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Assistant Message Actions (TTS, Copy, Suggested Action Chips) */}
                  {!isUser && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      {/* Secondary Utility Controls */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="text-[10px] font-mono opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSpeakText(msg.content, msg.id)}
                            className={`p-1.5 rounded-lg transition ${
                              isSpeaking
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold'
                                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'
                            }`}
                            title={isSpeaking ? 'Stop speech' : 'Listen to explanation'}
                          >
                            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.content, msg.id)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition"
                            title="Copy explanation"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Post-Explanation Suggested Action Buttons */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {msg.suggestedActions.map((action, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => handleActionClick(action)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl transition shadow-xs flex items-center gap-1 active:scale-95"
                            >
                              <span>{action.label}</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading / Thinking Indicator */}
        {isLoading && (
          <div className="flex gap-3 items-start animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-2xl rounded-tl-none text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="font-medium">
                AI Tutor is analyzing your question & crafting personalized guidance...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Bottom Input Form Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shrink-0">
        {/* Attached image preview banner */}
        {attachedImage && (
          <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl max-w-fit animate-in fade-in">
            <img
              src={attachedImage.previewUrl}
              alt="Preview"
              className="w-8 h-8 object-cover rounded-lg"
            />
            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              Image attached for visual reasoning
            </span>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 text-slate-400 hover:text-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File Upload Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 sm:p-3 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition shrink-0 border border-slate-200 dark:border-slate-700"
            title="Upload photo / diagram / code screenshot"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Voice Mic Trigger */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2.5 sm:p-3 rounded-2xl transition shrink-0 border ${
              isRecording
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Click to speak question'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Textarea Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                context?.type
                  ? `Ask about this ${context.type.replace('_', ' ')}...`
                  : 'Type your study question, paste code, or ask for guidance (Shift+Enter for newline)...'
              }
              className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-40"
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputText.trim() && !attachedImage)}
            className="p-2.5 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl shadow-md transition shrink-0 active:scale-95"
            title="Send to AI Tutor"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400">
          QuizTube AI Tutor guides student learning and fosters critical thinking.
        </p>
      </div>
    </div>
  );
}
