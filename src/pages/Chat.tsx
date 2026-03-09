import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import {
  Bot, Send, Mic, MicOff, Volume2, VolumeX, Trash2, Settings, ArrowRight,
  Upload, X, FileText, Image, File, Loader2, AlertCircle, Copy, Check,
  ChevronDown, Sparkles, RotateCcw, Paperclip, StopCircle, Phone, PhoneOff,
  Globe, BarChart3, Heart, Search, Wrench, Code,
  CheckCircle2, Database, Zap
} from 'lucide-react';

// ═══════════════════════════════════════
// ─── Types ───
// ═══════════════════════════════════════
interface ToolResult {
  type: 'pdf' | 'dicom' | 'data' | 'search' | 'image';
  fileName?: string;
  url?: string;
  summary?: string;
  extractedText?: string;
  tableHtml?: string;
  error?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  files?: UploadedFile[];
  toolResult?: ToolResult;
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  rawFile?: File;
  status?: 'pending' | 'uploading' | 'done' | 'error';
  extractedContent?: string;
}

interface AppSettings {
  backendUrl: string;
  model: string;
  ttsEnabled: boolean;
  ttsSpeed: number;
}

type LiveState = 'idle' | 'listening' | 'processing' | 'speaking';
type ToolId = 'pdf' | 'dicom' | 'data' | 'search' | 'image' | null;

// ═══════════════════════════════════════
// ─── Constants ───
// ═══════════════════════════════════════
const MODELS = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', icon: '⚡' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', icon: '🧠' },
];

const SYSTEM_PROMPT = `أنت مساعد ذكي اسمك جواد، تتحدث العربية بطلاقة. ردودك مختصرة وواضحة ولا تتجاوز 3 جمل.
يمكنك تحليل الملفات (PDF, CSV, Excel, DICOM, صور) والبحث في الإنترنت.
إذا تلقيت محتوى ملف أو نتائج بحث، حلّلها وأعطِ ملخصاً مفيداً.
كن ودوداً ومهنياً.`;

const TOOLS = [
  { id: 'pdf' as ToolId, name: 'تحليل PDF', icon: FileText, accept: '.pdf', color: 'red', desc: 'استخراج نص من ملفات PDF — PyPDF' },
  { id: 'dicom' as ToolId, name: 'صور طبية', icon: Heart, accept: '.dcm,.dicom', color: 'pink', desc: 'قراءة ملفات DICOM — PyDICOM' },
  { id: 'data' as ToolId, name: 'تحليل بيانات', icon: BarChart3, accept: '.csv,.xlsx,.xls,.json', color: 'cyan', desc: 'تحليل بيانات — Pandas + NumPy' },
  { id: 'search' as ToolId, name: 'بحث الإنترنت', icon: Globe, accept: null, color: 'amber', desc: 'بحث في الإنترنت — Scrapling + HTTPX' },
  { id: 'image' as ToolId, name: 'تحليل صور', icon: Image, accept: '.png,.jpg,.jpeg,.gif,.bmp,.webp', color: 'emerald', desc: 'تحليل صور — Donut OCR' },
];

const QUICK_MESSAGES = [
  { text: '👋 مرحباً جواد', icon: '👋' },
  { text: '🤔 ما هي قدراتك؟', icon: '🤔' },
  { text: '🔍 ابحث عن آخر أخبار الذكاء الاصطناعي', icon: '🔍' },
  { text: '📊 كيف أحلل ملف CSV؟', icon: '📊' },
];

// ═══════════════════════════════════════
// ─── Helpers ───
// ═══════════════════════════════════════
const generateId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const formatTime = (date: Date) => new Intl.DateTimeFormat('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ─── Markdown بسيط ───
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.JSX.Element[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeIndex = 0;

  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${codeIndex}`} className="my-2 p-3 rounded-xl bg-black/30 border border-white/[0.06] overflow-x-auto">
            <code className="text-xs text-emerald-300 font-mono whitespace-pre">{codeContent.trim()}</code>
          </pre>
        );
        codeContent = '';
        inCodeBlock = false;
        codeIndex++;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      return;
    }

    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    processed = processed.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/[0.06] text-violet-300 text-xs font-mono">$1</code>');

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-sm font-bold text-white mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processed.slice(4) }} />);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-base font-bold text-white mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processed.slice(3) }} />);
    }
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 mr-2 my-0.5">
          <span className="text-violet-400 mt-0.5 shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: processed.replace(/^[\s]*[-*]\s/, '') }} />
        </div>
      );
    }
    else if (/^\d+\.\s/.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 mr-2 my-0.5">
          <span className="text-violet-400 shrink-0 text-xs font-bold mt-0.5">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, '') }} />
        </div>
      );
    }
    else if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (line.includes('---')) return;
      const cells = line.split('|').filter(c => c.trim());
      const isHeader = i < lines.length - 1 && lines[i + 1]?.includes('---');
      elements.push(
        <div key={i} className={`flex gap-0 border-b border-white/[0.06] ${isHeader ? 'font-bold text-white' : ''}`}>
          {cells.map((cell, ci) => (
            <div key={ci} className="flex-1 px-2 py-1 text-xs">{cell.trim()}</div>
          ))}
        </div>
      );
    }
    else if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
    }
    else {
      elements.push(<p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: processed }} />);
    }
  });

  return elements;
};


// ═══════════════════════════════════════════════
// ─── Main Chat Component ───
// ═══════════════════════════════════════════════
export default function Chat() {
  const navigate = useNavigate();

  // ─── State ───
  const [settings, setSettings] = useState<AppSettings>({
    backendUrl: 'https://ayb-bh1146-back-end.hf.space/api',
    model: MODELS[0].id, ttsEnabled: true, ttsSpeed: 1,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // ─── Tools State ───
  const [showTools, setShowTools] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingTool, setIsProcessingTool] = useState(false);

  // ─── Live Voice Chat State ───
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveState, setLiveState] = useState<LiveState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveResponse, setLiveResponse] = useState('');

  // ─── Refs ───
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolFileInputRef = useRef<HTMLInputElement>(null);
  const preRecordInputRef = useRef('');
  const isLiveModeRef = useRef(false);
  const liveStateRef = useRef<LiveState>('idle');
  const piperAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { isLiveModeRef.current = isLiveMode; }, [isLiveMode]);
  useEffect(() => { liveStateRef.current = liveState; }, [liveState]);

  // ─── Load settings ───
  useEffect(() => {
    const saved = localStorage.getItem('jawad_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          backendUrl: parsed.backendUrl || 'https://ayb-bh1146-back-end.hf.space/api',
          model: parsed.model || MODELS[0].id,
          ttsEnabled: parsed.ttsEnabled !== false,
          ttsSpeed: parsed.ttsSpeed || 1,
        });
      } catch { navigate('/login'); }
    } else { navigate('/login'); }

    const savedMsgs = localStorage.getItem('jawad_chat_messages');
    if (savedMsgs) {
      try {
        const parsed = JSON.parse(savedMsgs);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch { /* ignore */ }
    }
  }, [navigate]);

  // ─── Save messages ───
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('jawad_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // ─── Auto scroll ───
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  const handleScroll = () => {
    const c = messagesContainerRef.current;
    if (c) setShowScrollBtn(c.scrollHeight - c.scrollTop - c.clientHeight > 100);
  };

  // ═══════════════════════════════════════
  // ─── Speech Recognition (الميكروفون) ───
  // ═══════════════════════════════════════
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // ─── جمع كل النتائج النهائية بدون تكرار ───
      let allFinalResults: string[] = [];

      recognition.onstart = () => {
        allFinalResults = [];
      };

      recognition.onresult = (event: any) => {
        let interimT = '';
        allFinalResults = [];

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            allFinalResults.push(transcript);
          } else {
            interimT += transcript;
          }
        }

        const finalText = allFinalResults.join(' ').trim();

        if (isLiveModeRef.current) {
          setLiveTranscript(finalText || interimT);
          setInterimText(interimT);
          if (finalText) { setInterimText(''); handleLiveMessage(finalText); }
          return;
        }

        setInterimText(interimT);
        if (finalText) {
          // استبدال النص بالكامل بدل الإضافة — يمنع التكرار
          setInput(preRecordInputRef.current ? preRecordInputRef.current + ' ' + finalText : finalText);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setError('يرجى السماح بالوصول للميكروفون في إعدادات المتصفح');
        } else if (event.error === 'no-speech' && isLiveModeRef.current && liveStateRef.current === 'listening') {
          setTimeout(() => { try { recognitionRef.current?.start(); } catch {} }, 300);
          return;
        }
        if (!isLiveModeRef.current) setIsListening(false);
      };

      recognition.onend = () => {
        if (isLiveModeRef.current) {
          // لا تعيد الاستماع إلا إذا كانت الحالة listening فعلاً وليس speaking أو processing
          if (liveStateRef.current === 'listening') {
            setTimeout(() => { try { recognitionRef.current?.start(); } catch {} }, 500);
          }
          return;
        }
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    }
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      window.speechSynthesis?.cancel();
      if (piperAudioRef.current) {
        piperAudioRef.current.pause();
        piperAudioRef.current = null;
      }
    };
  }, []);

  // ─── Toggle Mic ───
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('متصفحك لا يدعم التعرف على الكلام. استخدم Chrome أو Edge');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (isLiveMode) return;
      setError(''); setInterimText('');
      preRecordInputRef.current = input;
      try { recognitionRef.current.start(); setIsListening(true); }
      catch { setError('فشل بدء التعرف على الكلام'); }
    }
  };

  // ═══════════════════════════════════════
  // ─── TTS — Piper أولاً ثم المتصفح ───
  // ═══════════════════════════════════════

  // ─── صوت المتصفح (احتياطي) ───
  const speakBrowser = useCallback((text: string, onDone?: () => void) => {
    if (!window.speechSynthesis) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const sentences = text.match(/[^.!؟،\n]+[.!؟،\n]?/g) || [text];
    const valid = sentences.map(s => s.trim()).filter(s => s.length > 0);
    if (!valid.length) { onDone?.(); return; }

    valid.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence);
      u.lang = 'ar-SA'; u.rate = settings.ttsSpeed; u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const ar = voices.find(v => v.lang.startsWith('ar'));
      if (ar) u.voice = ar;
      if (i === 0) u.onstart = () => setIsSpeaking(true);
      if (i === valid.length - 1) {
        u.onend = () => { setIsSpeaking(false); onDone?.(); };
        u.onerror = () => { setIsSpeaking(false); onDone?.(); };
      }
      window.speechSynthesis.speak(u);
    });
  }, [settings.ttsSpeed]);

  // ─── Piper TTS من الباك إند ───
  const speak = useCallback(async (text: string, onDone?: () => void) => {
    if (!settings.ttsEnabled) { onDone?.(); return; }

    const backendUrl = settings.backendUrl.replace(/\/$/, '');
    const cleanText = text.replace(/[*#`_~|>]/g, '').replace(/\n+/g, '. ').trim();
    if (!cleanText) { onDone?.(); return; }

    // ─── محاولة Piper أولاً ───
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${backendUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';

        // ─── إذا أرجع الخادم صوت (audio blob) ───
        if (contentType.includes('audio') || contentType.includes('octet-stream')) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.playbackRate = settings.ttsSpeed;
          piperAudioRef.current = audio;

          setIsSpeaking(true);
          audio.onended = () => {
            setIsSpeaking(false);
            piperAudioRef.current = null;
            URL.revokeObjectURL(audioUrl);
            onDone?.();
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            piperAudioRef.current = null;
            URL.revokeObjectURL(audioUrl);
            // احتياطي: صوت المتصفح
            speakBrowser(text, onDone);
          };

          await audio.play();
          console.log('🔊 Piper TTS: يشتغل من الباك إند');
          return;
        }

        // ─── إذا أرجع JSON مع base64 audio ───
        if (contentType.includes('json')) {
          const data = await response.json();
          const audioBase64 = data.audio || data.audio_base64 || data.data;
          if (audioBase64) {
            const audioSrc = audioBase64.startsWith('data:')
              ? audioBase64
              : `data:audio/mp3;base64,${audioBase64}`;
            const audio = new Audio(audioSrc);
            audio.playbackRate = settings.ttsSpeed;
            piperAudioRef.current = audio;

            setIsSpeaking(true);
            audio.onended = () => { setIsSpeaking(false); piperAudioRef.current = null; onDone?.(); };
            audio.onerror = () => { setIsSpeaking(false); piperAudioRef.current = null; speakBrowser(text, onDone); };
            await audio.play();
            console.log('🔊 Piper TTS (base64): يشتغل من الباك إند');
            return;
          }
        }
      }
    } catch (err) {
      console.log('⚠️ Piper TTS غير متوفر، التبديل لصوت المتصفح', err);
    }

    // ─── احتياطي: صوت المتصفح ───
    speakBrowser(text, onDone);
  }, [settings.ttsEnabled, settings.ttsSpeed, settings.backendUrl, speakBrowser]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    if (piperAudioRef.current) {
      piperAudioRef.current.pause();
      piperAudioRef.current.currentTime = 0;
      piperAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // ─── Copy ───
  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ═══════════════════════════════════════
  // ─── File Handling ───
  // ═══════════════════════════════════════
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        setError(`الملف ${file.name} كبير جداً (الحد: 50MB)`);
        return;
      }
      newFiles.push({
        name: file.name,
        type: file.type || getTypeFromExt(file.name),
        size: file.size,
        rawFile: file,
        status: 'pending',
      });
    });
    setPendingFiles(prev => [...prev, ...newFiles]);
    setActiveTool(null);
    setShowTools(false);
  };

  const getTypeFromExt = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      'pdf': 'application/pdf', 'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel', 'dcm': 'application/dicom',
      'dicom': 'application/dicom', 'json': 'application/json',
    };
    return map[ext || ''] || 'application/octet-stream';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Drag & Drop ───
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // ═══════════════════════════════════════════════
  // ─── Backend API Calls ───
  // ═══════════════════════════════════════════════

  // ─── رفع ملف للباك إند (PyPDF, PyDICOM, Pandas, Donut) ───
  const uploadFileToBackend = async (file: UploadedFile): Promise<{ content: string; summary?: string; tableHtml?: string }> => {
    const backendUrl = settings.backendUrl.replace(/\/$/, '');
    if (!file.rawFile) throw new Error('لا يوجد ملف');

    const formData = new FormData();
    formData.append('file', file.rawFile);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    console.log(`📤 رفع ملف: ${file.name} (${formatFileSize(file.size)}) → ${backendUrl}/upload`);

    try {
      const res = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      console.log(`📥 استجابة الخادم: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`❌ خطأ رفع الملف:`, errorText);
        if (res.status === 413) throw new Error('الملف كبير جداً على الخادم');
        if (res.status === 415) throw new Error('نوع الملف غير مدعوم من الخادم');
        if (res.status === 422) throw new Error('الخادم لم يتعرف على الملف — تحقق من الصيغة');
        if (res.status === 503) throw new Error('الخادم قيد الإيقاظ... حاول بعد 30 ثانية');
        if (res.status === 500) throw new Error('خطأ داخلي في الخادم أثناء معالجة الملف');
        throw new Error(`خطأ من الخادم (${res.status}): ${errorText.slice(0, 200)}`);
      }

      const data = await res.json();
      console.log('✅ نتيجة التحليل:', Object.keys(data));

      return {
        content: data.content || data.text || data.extracted_text || data.result || data.output || JSON.stringify(data),
        summary: data.summary || data.description || data.analysis || '',
        tableHtml: data.table_html || data.tableHtml || data.table || '',
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('انتهت المهلة — الملف قد يكون كبيراً جداً');
      if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت');
      throw err;
    }
  };

  // ─── بحث في الإنترنت عبر Scrapling ───
  const searchWeb = async (query: string): Promise<{ content: string; title?: string; sources?: string[] }> => {
    const backendUrl = settings.backendUrl.replace(/\/$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    console.log(`🔍 بحث: "${query}" → ${backendUrl}/search`);

    try {
      // محاولة /search أولاً
      let res = await fetch(`${backendUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, q: query }),
        signal: controller.signal,
      }).catch(() => null);

      // إذا فشل /search، جرب /scrape مع query
      if (!res || !res.ok) {
        console.log('⚠️ /search فشل، محاولة /scrape...');
        res = await fetch(`${backendUrl}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, q: query, url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }),
          signal: controller.signal,
        });
      }

      clearTimeout(timeout);

      if (!res || !res.ok) {
        const status = res?.status || 0;
        if (status === 503) throw new Error('الخادم قيد الإيقاظ...');
        if (status === 404) throw new Error('خدمة البحث غير متوفرة على الخادم — تأكد من وجود endpoint /search أو /scrape');
        throw new Error(`خطأ في البحث (${status})`);
      }

      const data = await res.json();
      console.log('✅ نتائج البحث:', Object.keys(data));

      return {
        content: data.content || data.text || data.result || data.results || data.extracted_text || data.output || JSON.stringify(data),
        title: data.title || data.query || query,
        sources: data.sources || data.urls || data.links || [],
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('انتهت مهلة البحث');
      if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت');
      throw err;
    }
  };

  // ─── إرسال رسالة للـ LLM ───
  const callAPI = async (userContent: string, contextMessages: { role: string; content: string }[]): Promise<string> => {
    const backendUrl = settings.backendUrl.replace(/\/$/, '');
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...contextMessages,
            { role: 'user', content: userContent },
          ],
          model: settings.model,
          max_tokens: userContent.length > 200 ? 3000 : userContent.length > 50 ? 1500 : 800,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('خطأ في المصادقة');
        if (res.status === 429) throw new Error('تم تجاوز الحد اليومي');
        if (res.status === 503) throw new Error('الخادم قيد الإيقاظ...');
        throw new Error(`خطأ (${res.status})`);
      }

      const data = await res.json();
      return data.response || data.reply || data.text || data.answer
        || data.choices?.[0]?.message?.content || data.content
        || 'عذراً، لم أتمكن من الإجابة';
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('انتهت مهلة الانتظار — حاول مرة أخرى');
      if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت');
      throw err;
    }
  };

  // ═══════════════════════════════════════════════
  // ─── البحث في الإنترنت (Scrapling) ───
  // ═══════════════════════════════════════════════
  const handleSearch = async (queryOverride?: string) => {
    const query = (queryOverride || searchQuery).trim();
    if (!query) return;

    setIsProcessingTool(true);
    setShowTools(false);
    setError('');

    // رسالة المستخدم
    const userMsg: Message = {
      id: generateId(), role: 'user',
      content: `🔍 ابحث عن: ${query}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSearchQuery('');
    setActiveTool(null);
    setIsLoading(true);

    try {
      const result = await searchWeb(query);

      // رسالة نتيجة البحث
      const toolMsg: Message = {
        id: generateId(), role: 'assistant',
        content: result.content
          ? `✅ **نتائج البحث عن "${query}":**\n\n${result.content.slice(0, 3000)}${result.content.length > 3000 ? '\n\n... (تم اقتطاع النتائج)' : ''}`
          : '❌ لم أجد نتائج لهذا البحث',
        timestamp: new Date(),
        toolResult: {
          type: 'search',
          url: query,
          summary: `نتائج البحث: ${query}`,
          extractedText: result.content,
        },
      };
      setMessages(prev => [...prev, toolMsg]);

      // اسأل LLM لتلخيص النتائج
      if (result.content) {
        const contextMsgs = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
        const summary = await callAPI(
          `المستخدم بحث عن: "${query}"\n\nنتائج البحث من الإنترنت:\n${result.content.slice(0, 4000)}\n\nلخّص هذه النتائج بشكل مفيد ومختصر باللغة العربية`,
          contextMsgs
        );
        const summaryMsg: Message = {
          id: generateId(), role: 'assistant',
          content: summary,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, summaryMsg]);
        setTimeout(() => speak(summary), 200);
      }
    } catch (err: any) {
      setError(err.message || 'فشل البحث');
    }

    setIsLoading(false);
    setIsProcessingTool(false);
  };

  // ═══════════════════════════════════════════════
  // ─── Send Message (مع كشف تلقائي للبحث) ───
  // ═══════════════════════════════════════════════
  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content && pendingFiles.length === 0) return;
    if (isLoading) return;

    if (!settings.backendUrl) {
      setError('يرجى تحديد رابط الخادم في الإعدادات');
      return;
    }

    // أوامر خاصة
    if (content === 'خروج' || content === 'exit') { navigate('/dashboard'); return; }
    if (content === 'مسح الذاكرة' || content === 'مسح') { clearChat(); return; }

    // ─── كشف تلقائي: هل يريد المستخدم البحث؟ ───
    const searchPrefixes = ['ابحث عن', 'ابحث في', 'بحث عن', 'بحث في', 'ابحث لي عن', 'ابحثلي عن', 'search for', 'search'];
    const lowerContent = content.toLowerCase();
    for (const prefix of searchPrefixes) {
      if (lowerContent.startsWith(prefix)) {
        const query = content.slice(prefix.length).trim();
        if (query) {
          setInput('');
          await handleSearch(query);
          return;
        }
      }
    }

    // إيقاف
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    stopSpeaking();

    // رسالة المستخدم
    const currentPendingFiles = [...pendingFiles];
    const userMessage: Message = {
      id: generateId(), role: 'user',
      content: content || (currentPendingFiles.length > 0 ? `📎 تم رفع ${currentPendingFiles.length} ملف` : ''),
      timestamp: new Date(),
      files: currentPendingFiles.length > 0 ? currentPendingFiles : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPendingFiles([]);
    setError('');
    setIsLoading(true);

    let finalContent = content;
    const fileContents: string[] = [];

    // ─── رفع الملفات للباك إند ───
    if (currentPendingFiles.length > 0) {
      for (const file of currentPendingFiles) {
        if (!file.rawFile) continue;

        const processingId = generateId();
        setMessages(prev => [...prev, {
          id: processingId, role: 'assistant',
          content: `⏳ جاري تحليل الملف: **${file.name}** (${formatFileSize(file.size)})...\n📡 إرسال إلى الخادم...`,
          timestamp: new Date(),
        }]);

        try {
          const result = await uploadFileToBackend(file);

          const toolResult: ToolResult = {
            type: getToolType(file.name),
            fileName: file.name,
            summary: result.summary,
            extractedText: result.content,
            tableHtml: result.tableHtml,
          };

          setMessages(prev => prev.map(m =>
            m.id === processingId
              ? {
                  ...m,
                  content: result.summary
                    ? `✅ تم تحليل **${file.name}**:\n\n${result.summary}`
                    : `✅ تم استخراج المحتوى من **${file.name}** (${result.content.length} حرف)`,
                  toolResult,
                }
              : m
          ));

          if (result.content) {
            fileContents.push(`[محتوى ملف ${file.name}]:\n${result.content.slice(0, 4000)}`);
          }
        } catch (err: any) {
          setMessages(prev => prev.map(m =>
            m.id === processingId
              ? {
                  ...m,
                  content: `❌ فشل تحليل **${file.name}**: ${err.message}`,
                  toolResult: { type: getToolType(file.name), fileName: file.name, error: err.message },
                }
              : m
          ));
        }
      }
    }

    // ─── إرسال للـ LLM ───
    if (content || fileContents.length > 0) {
      const contextMessages = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

      if (fileContents.length > 0) {
        finalContent = content
          ? `${content}\n\n${fileContents.join('\n\n')}`
          : `حلل الملفات التالية وأعطني ملخصاً:\n\n${fileContents.join('\n\n')}`;
      }

      try {
        const reply = await callAPI(finalContent, contextMessages);
        const botMessage: Message = {
          id: generateId(), role: 'assistant',
          content: reply, timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setTimeout(() => speak(reply), 200);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع');
      }
    }

    setIsLoading(false);
  };

  const getToolType = (fileName: string): ToolResult['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'dcm' || ext === 'dicom') return 'dicom';
    if (['csv', 'xlsx', 'xls', 'json'].includes(ext || '')) return 'data';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext || '')) return 'image';
    return 'pdf';
  };

  // ═══════════════════════════════════════
  // ─── Tool Click Handler ───
  // ═══════════════════════════════════════
  const handleToolClick = (toolId: ToolId) => {
    if (toolId === 'search') {
      setActiveTool('search');
      return;
    }

    const tool = TOOLS.find(t => t.id === toolId);
    if (tool?.accept && toolFileInputRef.current) {
      toolFileInputRef.current.accept = tool.accept;
      toolFileInputRef.current.click();
    }
    setShowTools(false);
  };

  // ═══════════════════════════════════════════════
  // ─── Live Voice Chat ───
  // ═══════════════════════════════════════════════
  const handleLiveMessage = async (text: string) => {
    if (!text.trim()) { setLiveState('listening'); return; }
    if (['خروج', 'توقف', 'أغلق', 'exit', 'stop'].includes(text.trim())) { endLiveMode(); return; }

    try { recognitionRef.current?.stop(); } catch {}
    setLiveState('processing');
    setLiveTranscript(text);

    const userMsg: Message = { id: generateId(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    const ctx = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    try {
      const reply = await callAPI(text, ctx);
      const botMsg: Message = { id: generateId(), role: 'assistant', content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);

      setLiveState('speaking');
      setLiveResponse(reply);
      // أوقف الميكروفون تماماً أثناء الكلام لمنع الاضطراب
      try { recognitionRef.current?.stop(); } catch {}
      speak(reply, () => {
        if (isLiveModeRef.current) {
          setLiveState('listening'); setLiveTranscript(''); setLiveResponse('');
          try { recognitionRef.current?.start(); } catch {}
        }
      });
    } catch (err: any) {
      setError(err.message || 'خطأ');
      if (isLiveModeRef.current) {
        setLiveState('listening');
        setTimeout(() => { try { recognitionRef.current?.start(); } catch {} }, 1000);
      }
    }
  };

  const startLiveMode = () => {
    if (!recognitionRef.current) { setError('متصفحك لا يدعم التعرف على الكلام'); return; }
    if (!settings.backendUrl) { setError('يرجى تحديد رابط الخادم'); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    stopSpeaking();
    setIsLiveMode(true); setLiveState('listening');
    setLiveTranscript(''); setLiveResponse(''); setError('');
    setTimeout(() => { try { recognitionRef.current?.start(); } catch {} }, 500);
  };

  const endLiveMode = () => {
    setIsLiveMode(false); setLiveState('idle');
    setLiveTranscript(''); setLiveResponse('');
    try { recognitionRef.current?.stop(); } catch {}
    stopSpeaking(); abortRef.current?.abort();
  };

  const interruptLiveSpeaking = () => {
    if (liveState === 'speaking') {
      stopSpeaking(); setLiveState('listening'); setLiveResponse('');
      setTimeout(() => { try { recognitionRef.current?.start(); } catch {} }, 300);
    }
  };

  // ─── Clear ───
  const clearChat = () => {
    setMessages([]); localStorage.removeItem('jawad_chat_messages'); setError('');
  };

  const cancelRequest = () => { abortRef.current?.abort(); setIsLoading(false); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ─── File icon ───
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400" />;
    if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') return <BarChart3 className="w-4 h-4 text-cyan-400" />;
    if (ext === 'dcm' || ext === 'dicom') return <Heart className="w-4 h-4 text-pink-400" />;
    if (ext === 'json') return <Code className="w-4 h-4 text-amber-400" />;
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext || '')) return <Image className="w-4 h-4 text-green-400" />;
    return <File className="w-4 h-4 text-blue-400" />;
  };

  const getToolResultIcon = (type: ToolResult['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'dicom': return <Heart className="w-5 h-5 text-pink-400" />;
      case 'data': return <BarChart3 className="w-5 h-5 text-cyan-400" />;
      case 'search': return <Globe className="w-5 h-5 text-amber-400" />;
      case 'image': return <Image className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getToolResultColor = (type: ToolResult['type']) => {
    switch (type) {
      case 'pdf': return 'border-red-500/20 bg-red-500/5';
      case 'dicom': return 'border-pink-500/20 bg-pink-500/5';
      case 'data': return 'border-cyan-500/20 bg-cyan-500/5';
      case 'search': return 'border-amber-500/20 bg-amber-500/5';
      case 'image': return 'border-emerald-500/20 bg-emerald-500/5';
    }
  };

  const currentModel = MODELS.find(m => m.id === settings.model) || MODELS[0];

  // ═══════════════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════════════
  return (
    <div className="h-screen flex flex-col bg-[#050510] relative"
         onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-600/[0.03] blur-[100px]" />
        <div className="bg-grid absolute inset-0 opacity-50" />
      </div>

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-[100] bg-violet-600/10 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="p-10 rounded-3xl border-2 border-dashed border-violet-400/50 bg-violet-600/10 text-center">
            <Upload className="w-16 h-16 text-violet-400 mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-bold text-violet-300">اسحب الملفات هنا</p>
            <p className="text-gray-400 mt-2">PDF, CSV, Excel, DICOM, صور</p>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple
             accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.txt,.csv,.xlsx,.xls,.doc,.docx,.dcm,.dicom,.json,.webp"
             onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
      <input ref={toolFileInputRef} type="file" multiple
             onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />

      {/* ═══════════════════ */}
      {/* Live Voice Overlay  */}
      {/* ═══════════════════ */}
      {isLiveMode && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
             onClick={liveState === 'speaking' ? interruptLiveSpeaking : undefined}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a20] via-[#050518] to-[#0a0a20]" />
          <div className="absolute inset-0 bg-grid opacity-30" />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`absolute w-80 h-80 rounded-full border transition-all duration-1000 ${
              liveState === 'listening' ? 'border-red-500/20 animate-[ping_3s_ease-in-out_infinite]' :
              liveState === 'processing' ? 'border-violet-500/20 animate-[spin-slow_4s_linear_infinite]' :
              liveState === 'speaking' ? 'border-emerald-500/15 animate-[ping_2s_ease-in-out_infinite]' :
              'border-white/5'
            }`} />
            <div className={`absolute w-60 h-60 rounded-full border transition-all duration-1000 ${
              liveState === 'listening' ? 'border-red-500/15 animate-[ping_3s_ease-in-out_0.5s_infinite]' :
              liveState === 'processing' ? 'border-violet-500/15 animate-[spin-slow_3s_linear_infinite_reverse]' :
              liveState === 'speaking' ? 'border-emerald-500/10 animate-[ping_2s_ease-in-out_0.3s_infinite]' :
              'border-white/5'
            }`} />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center 
                            transition-all duration-700 shadow-2xl ${
              liveState === 'listening'
                ? 'bg-gradient-to-br from-red-500/30 to-red-700/30 border-2 border-red-500/40 shadow-red-500/20 animate-mic-pulse'
                : liveState === 'processing'
                ? 'bg-gradient-to-br from-violet-500/30 to-purple-700/30 border-2 border-violet-500/40 shadow-violet-500/20'
                : liveState === 'speaking'
                ? 'bg-gradient-to-br from-emerald-500/30 to-green-700/30 border-2 border-emerald-500/40 shadow-emerald-500/20'
                : 'bg-white/5 border-2 border-white/10'
            }`}>
              {liveState === 'listening' && (
                <div className="flex flex-col items-center">
                  <Mic className="w-12 h-12 text-red-400 mb-2" />
                  <div className="flex gap-1 items-end h-6">
                    {[0,1,2,3,4,5,6].map(i => (
                      <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              )}
              {liveState === 'processing' && (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-2" />
                  <div className="flex gap-1.5"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
                </div>
              )}
              {liveState === 'speaking' && (
                <div className="flex flex-col items-center">
                  <Volume2 className="w-12 h-12 text-emerald-400 mb-2" />
                  <div className="flex gap-1 items-end h-6">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="waveform-bar bg-emerald-400" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <p className={`text-xl font-bold mb-2 transition-colors duration-500 ${
                liveState === 'listening' ? 'text-red-300' :
                liveState === 'processing' ? 'text-violet-300' :
                liveState === 'speaking' ? 'text-emerald-300' : 'text-gray-400'
              }`}>
                {liveState === 'listening' && '🎤 أنا أسمعك...'}
                {liveState === 'processing' && '⏳ جواد يفكر...'}
                {liveState === 'speaking' && '🔊 جواد يتحدث...'}
              </p>
              {(liveState === 'listening' || liveState === 'processing') && liveTranscript && (
                <div className="max-w-sm mx-auto px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] animate-fade-in">
                  <p className="text-white text-sm leading-relaxed">{liveTranscript}</p>
                </div>
              )}
              {liveState === 'speaking' && liveResponse && (
                <div className="max-w-sm mx-auto mt-3 px-6 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 animate-fade-in">
                  <p className="text-emerald-200 text-sm leading-relaxed">{liveResponse}</p>
                  <p className="text-xs text-gray-600 mt-2">اضغط في أي مكان للمقاطعة</p>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-12 flex flex-col items-center gap-4">
            <button onClick={(e) => { e.stopPropagation(); endLiveMode(); }}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30
                               flex items-center justify-center transition-all hover:scale-110 active:scale-95">
              <PhoneOff className="w-7 h-7" />
            </button>
            <p className="text-gray-600 text-xs">اضغط لإنهاء المحادثة الصوتية</p>
          </div>
        </div>
      )}

      {/* ─── Top Bar ─── */}
      <header className="relative z-50 glass border-b border-white/[0.06] shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-xl hover:bg-white/[0.05] text-gray-500 hover:text-white transition-all">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                جواد
                <span className="flex items-center gap-1 text-[10px] font-normal text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  متصل
                </span>
              </h1>
              <p className="text-[11px] text-gray-500">{currentModel.icon} {currentModel.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => {
                const ns = { ...settings, ttsEnabled: !settings.ttsEnabled };
                setSettings(ns); localStorage.setItem('jawad_settings', JSON.stringify(ns));
                if (!ns.ttsEnabled) stopSpeaking();
              }}
              className={`p-2 rounded-xl transition-all ${settings.ttsEnabled ? 'text-violet-400 hover:bg-violet-500/10' : 'text-gray-600 hover:bg-white/[0.05]'}`}
              title={settings.ttsEnabled ? 'صوت Piper مفعّل' : 'الصوت مغلق'}>
              {settings.ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={() => {
                const next = settings.model === MODELS[0].id ? MODELS[1] : MODELS[0];
                const ns = { ...settings, model: next.id };
                setSettings(ns); localStorage.setItem('jawad_settings', JSON.stringify(ns));
              }}
              className="p-2 rounded-xl text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
              title="تبديل النموذج">
              <Sparkles className="w-4 h-4" />
            </button>
            <button onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-xl transition-all ${showSettings ? 'text-violet-400 bg-violet-500/10' : 'text-gray-500 hover:bg-white/[0.05]'}`}>
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={clearChat}
                    className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="absolute left-0 right-0 top-full z-50 glass border-b border-white/[0.06] p-4 animate-fade-slide-down">
            <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">النموذج</label>
                <div className="flex gap-2">
                  {MODELS.map(m => (
                    <button key={m.id} onClick={() => {
                        const ns = { ...settings, model: m.id };
                        setSettings(ns); localStorage.setItem('jawad_settings', JSON.stringify(ns));
                      }}
                      className={`flex-1 p-2 rounded-lg border text-xs text-center transition-all ${
                        settings.model === m.id
                          ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                          : 'border-white/[0.06] text-gray-500 hover:bg-white/[0.04]'
                      }`}>
                      {m.icon} {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">سرعة النطق (Piper)</label>
                  <span className="text-xs text-violet-300 font-mono">{settings.ttsSpeed}x</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.1" value={settings.ttsSpeed}
                       onChange={(e) => {
                         const ns = { ...settings, ttsSpeed: parseFloat(e.target.value) };
                         setSettings(ns); localStorage.setItem('jawad_settings', JSON.stringify(ns));
                       }} className="w-full" />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Messages Area ─── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative z-10" onScroll={handleScroll}>
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* ═══ Welcome Screen ═══ */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 
                              border border-violet-500/20 flex items-center justify-center mb-6 animate-float
                              shadow-2xl shadow-purple-500/10">
                <span className="text-5xl">🤖</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">مرحباً! أنا جواد</h2>
              <p className="text-gray-400 mb-8 max-w-md">
                مساعدك الذكي بالعربية — أبحث في الإنترنت، أحلل الملفات، وأجيب على أسئلتك بصوت Piper
              </p>

              {/* ─── Backend Tools Grid ─── */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-8 w-full max-w-lg">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const colors: Record<string, string> = {
                    red: 'hover:bg-red-500/10 hover:border-red-500/20 text-red-400',
                    pink: 'hover:bg-pink-500/10 hover:border-pink-500/20 text-pink-400',
                    cyan: 'hover:bg-cyan-500/10 hover:border-cyan-500/20 text-cyan-400',
                    amber: 'hover:bg-amber-500/10 hover:border-amber-500/20 text-amber-400',
                    emerald: 'hover:bg-emerald-500/10 hover:border-emerald-500/20 text-emerald-400',
                  };
                  return (
                    <button key={tool.id} onClick={() => handleToolClick(tool.id)}
                            className={`group p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] 
                                       transition-all duration-300 ${colors[tool.color]}`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-300 block">{tool.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Messages */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {QUICK_MESSAGES.map((msg, i) => (
                  <button key={i} onClick={() => sendMessage(msg.text)}
                          className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] 
                                     text-sm text-gray-300 hover:bg-violet-500/10 hover:border-violet-500/20 
                                     hover:text-violet-300 transition-all duration-300">
                    {msg.text}
                  </button>
                ))}
              </div>

              {/* Bottom capabilities */}
              <div className="flex items-center gap-4 text-[11px] text-gray-600">
                <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> صوتي</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> مباشر</span>
                <span className="flex items-center gap-1"><Upload className="w-3 h-3" /> ملفات</span>
                <span className="flex items-center gap-1"><Search className="w-3 h-3" /> بحث</span>
                <span className="flex items-center gap-1"><Database className="w-3 h-3" /> بيانات</span>
              </div>
            </div>
          )}

          {/* ═══ Messages ═══ */}
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-4 flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} ${
              msg.role === 'user' ? 'msg-user' : 'msg-bot'
            }`}>
              <div className="max-w-[85%] sm:max-w-[75%]">
                {/* Avatar + Name */}
                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}>
                  {msg.role === 'user' ? (
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs">👤</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <span className="text-xs">🤖</span>
                    </div>
                  )}
                  <span className="text-[11px] text-gray-600">
                    {msg.role === 'user' ? 'أنت' : 'جواد'} • {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Bubble */}
                <div className={`relative group rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600/15 border border-blue-500/20 rounded-tr-sm'
                    : msg.toolResult
                    ? `${getToolResultColor(msg.toolResult.type)} border rounded-tl-sm`
                    : 'bg-violet-600/10 border border-violet-500/15 rounded-tl-sm'
                }`}>

                  {/* Tool Result Header */}
                  {msg.toolResult && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.06]">
                      {getToolResultIcon(msg.toolResult.type)}
                      <span className="text-xs font-bold text-gray-300">
                        {msg.toolResult.type === 'pdf' && '📄 تحليل PDF — PyPDF'}
                        {msg.toolResult.type === 'dicom' && '🏥 صورة طبية — PyDICOM'}
                        {msg.toolResult.type === 'data' && '📊 تحليل بيانات — Pandas'}
                        {msg.toolResult.type === 'search' && '🔍 بحث الإنترنت — Scrapling'}
                        {msg.toolResult.type === 'image' && '🖼️ تحليل صورة — Donut'}
                      </span>
                      {msg.toolResult.fileName && (
                        <span className="text-[10px] text-gray-500 mr-auto">{msg.toolResult.fileName}</span>
                      )}
                      {msg.toolResult.url && msg.toolResult.type === 'search' && (
                        <span className="text-[10px] text-amber-400 mr-auto">
                          🔍 {msg.toolResult.url}
                        </span>
                      )}
                      {msg.toolResult.error ? (
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      )}
                    </div>
                  )}

                  {/* Files */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                          {getFileIcon(f.name)}
                          <span className="text-xs text-gray-300 max-w-[120px] truncate">{f.name}</span>
                          <span className="text-[10px] text-gray-600">{formatFileSize(f.size)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content with markdown */}
                  <div className="text-sm text-gray-200 leading-relaxed">
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* Table HTML from backend */}
                  {msg.toolResult?.tableHtml && (
                    <div className="mt-3 overflow-x-auto rounded-lg border border-white/[0.06]"
                         dangerouslySetInnerHTML={{ __html: msg.toolResult.tableHtml }} />
                  )}

                  {/* Actions */}
                  {msg.role === 'assistant' && !msg.toolResult && (
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyMessage(msg.id, msg.content)}
                              className="p-1 rounded-md hover:bg-white/[0.05] text-gray-600 hover:text-gray-300 transition-all">
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button onClick={() => speak(msg.content)}
                              className="p-1 rounded-md hover:bg-white/[0.05] text-gray-600 hover:text-gray-300 transition-all"
                              title="تشغيل بصوت Piper">
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => sendMessage('أعد صياغة إجابتك السابقة بشكل مختلف')}
                              className="p-1 rounded-md hover:bg-white/[0.05] text-gray-600 hover:text-gray-300 transition-all">
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="mb-4 flex justify-end msg-bot">
              <div className="max-w-[75%]">
                <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                  <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <span className="text-xs">🤖</span>
                  </div>
                  <span className="text-[11px] text-gray-600">{isProcessingTool ? 'جاري المعالجة...' : 'جواد يفكر...'}</span>
                </div>
                <div className="rounded-2xl rounded-tl-sm px-5 py-4 bg-violet-600/10 border border-violet-500/15">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                    </div>
                    <span className="text-sm text-violet-300/70">
                      {isProcessingTool ? '🔧 جاري استخدام الأدوات...' : '⏳ جاري التفكير...'}
                    </span>
                    <button onClick={cancelRequest}
                            className="mr-2 p-1 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
                      <StopCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Speaking indicator */}
          {isSpeaking && !isLiveMode && (
            <div className="flex justify-center mb-4 animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
                <div className="flex gap-0.5 items-end h-4">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="waveform-bar bg-violet-400" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-xs text-violet-300">🔊 Piper يتحدث...</span>
                <button onClick={stopSpeaking} className="text-gray-500 hover:text-red-400 transition-colors">
                  <VolumeX className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll btn */}
      {showScrollBtn && (
        <button onClick={scrollToBottom}
                className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 p-2 rounded-full 
                           glass border border-white/[0.1] text-gray-400 hover:text-white shadow-xl transition-all animate-fade-slide-up">
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="relative z-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 
                            text-red-300 text-sm animate-fade-slide-up mb-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* ─── Input Area ─── */}
      {/* ═══════════════════════════════════ */}
      <div className="relative z-20 shrink-0 border-t border-white/[0.06] glass">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">

          {/* ─── Tools Panel ─── */}
          {showTools && (
            <div className="mb-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] animate-fade-slide-up">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-400 flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-violet-400" />
                  أدوات جواد — مكتبات الباك إند
                </h4>
                <button onClick={() => { setShowTools(false); setActiveTool(null); }}
                        className="text-gray-600 hover:text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  const colorClasses: Record<string, string> = {
                    red: isActive ? 'border-red-500/40 bg-red-500/15 text-red-300' : 'hover:border-red-500/20 hover:bg-red-500/5 text-gray-400',
                    pink: isActive ? 'border-pink-500/40 bg-pink-500/15 text-pink-300' : 'hover:border-pink-500/20 hover:bg-pink-500/5 text-gray-400',
                    cyan: isActive ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300' : 'hover:border-cyan-500/20 hover:bg-cyan-500/5 text-gray-400',
                    amber: isActive ? 'border-amber-500/40 bg-amber-500/15 text-amber-300' : 'hover:border-amber-500/20 hover:bg-amber-500/5 text-gray-400',
                    emerald: isActive ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'hover:border-emerald-500/20 hover:bg-emerald-500/5 text-gray-400',
                  };
                  return (
                    <button key={tool.id} onClick={() => handleToolClick(tool.id)}
                            className={`p-2.5 rounded-xl border transition-all duration-200 text-center ${colorClasses[tool.color]} border-white/[0.06]`}
                            title={tool.desc}>
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-[10px] block leading-tight">{tool.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Library badges */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-white/[0.04]">
                {[
                  { name: 'PyPDF', icon: '📄' },
                  { name: 'PyDICOM', icon: '🏥' },
                  { name: 'Pandas', icon: '🐼' },
                  { name: 'NumPy', icon: '🔢' },
                  { name: 'Scrapling', icon: '🌐' },
                  { name: 'HTTPX', icon: '🔗' },
                  { name: 'Donut', icon: '🍩' },
                  { name: 'Piper TTS', icon: '🔊' },
                ].map(lib => (
                  <span key={lib.name} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-gray-500">
                    {lib.icon} {lib.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ─── Search Query Input (بدل URL) ─── */}
          {activeTool === 'search' && (
            <div className="mb-3 flex gap-2 animate-fade-slide-up">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input type="text" value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                       placeholder="اكتب أي شيء تريد البحث عنه... مثلاً: آخر أخبار الذكاء الاصطناعي"
                       className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl pr-10 pl-4 py-2.5
                                  text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/40
                                  transition-all" />
              </div>
              <button onClick={() => handleSearch()} disabled={!searchQuery.trim() || isLoading}
                      className="shrink-0 px-4 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-300
                                 hover:bg-amber-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed
                                 flex items-center gap-2 text-sm">
                <Search className="w-4 h-4" />
                بحث
              </button>
              <button onClick={() => { setActiveTool(null); setSearchQuery(''); }}
                      className="shrink-0 p-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending Files */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 animate-fade-slide-up">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                  {getFileIcon(f.name)}
                  <span className="text-xs text-gray-300 max-w-[120px] truncate">{f.name}</span>
                  <span className="text-[10px] text-gray-600">{formatFileSize(f.size)}</span>
                  {f.status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
                  {f.status === 'done' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  <button onClick={() => removePendingFile(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="text-[10px] text-gray-600 self-center mr-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-violet-400" />
                سيتم إرسالها للخادم للتحليل
              </div>
            </div>
          )}

          {/* Listening indicator */}
          {isListening && !isLiveMode && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-slide-up">
              <div className="flex gap-0.5 items-end h-4">
                {[0,1,2,3,4,5,6].map(i => (
                  <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-sm text-red-300 flex-1">{interimText || '🎤 جاري الاستماع...'}</span>
              <span className="text-[10px] text-gray-500">اضغط الميكروفون للإيقاف</span>
            </div>
          )}

          {/* ─── Input Row ─── */}
          <div className="flex items-end gap-2">
            {/* Tools Button */}
            <button onClick={() => { setShowTools(!showTools); if (showTools) setActiveTool(null); }}
                    className={`shrink-0 p-3 rounded-xl transition-all duration-300 ${
                      showTools
                        ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
                        : 'border border-white/[0.06] text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/20'
                    }`}
                    title="أدوات الباك إند">
              <Wrench className="w-5 h-5" />
            </button>

            {/* File Upload */}
            <button onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 p-3 rounded-xl border border-white/[0.06] text-gray-500 
                               hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all"
                    title="رفع ملف">
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea ref={inputRef} value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="اكتب رسالتك... أو اكتب 'ابحث عن' للبحث في الإنترنت"
                        rows={1}
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 
                                   text-white text-sm placeholder:text-gray-600 resize-none
                                   focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06]
                                   transition-all duration-300 max-h-32"
                        style={{ minHeight: '44px' }}
                        onInput={(e) => {
                          const t = e.target as HTMLTextAreaElement;
                          t.style.height = 'auto';
                          t.style.height = Math.min(t.scrollHeight, 128) + 'px';
                        }} />
            </div>

            {/* Mic */}
            <button onClick={toggleListening}
                    className={`shrink-0 p-3 rounded-xl transition-all duration-300 ${
                      isListening
                        ? 'bg-red-500 text-white animate-mic-pulse shadow-lg shadow-red-500/30'
                        : 'border border-white/[0.06] text-gray-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                    }`}
                    title={isListening ? 'إيقاف الاستماع' : 'كتابة بالصوت'}>
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Live Voice */}
            <button onClick={startLiveMode}
                    className="shrink-0 p-3 rounded-xl border border-emerald-500/20 text-emerald-400 
                               hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10
                               transition-all duration-300 hover:scale-105 active:scale-95"
                    title="محادثة صوتية مباشرة">
              <Phone className="w-5 h-5" />
            </button>

            {/* Send */}
            <button onClick={() => sendMessage()}
                    disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
                    className="shrink-0 p-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white
                               hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300
                               hover:scale-105 active:scale-95
                               disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180" />}
            </button>
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-gray-700 flex items-center gap-2">
              Enter للإرسال • Shift+Enter لسطر جديد • "ابحث عن..." للبحث
            </p>
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-gray-700 flex items-center gap-1">
                <Volume2 className="w-2.5 h-2.5 text-emerald-500" />
                Piper TTS
              </p>
              <p className="text-[10px] text-gray-700">
                {currentModel.icon} {currentModel.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
