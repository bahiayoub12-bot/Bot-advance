import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Send, Mic, MicOff, Volume2, VolumeX, Trash2, Settings, ArrowRight,
  Upload, X, FileText, Image, File, Loader2, AlertCircle, Copy, Check,
  ChevronDown, Sparkles, RotateCcw, Paperclip, StopCircle
} from 'lucide-react';

// ─── Types ───
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  files?: UploadedFile[];
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

interface AppSettings {
  apiKey: string;
  backendUrl: string;
  model: string;
  ttsEnabled: boolean;
  ttsSpeed: number;
}

// ─── Constants ───
const MODELS = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', icon: '⚡' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', icon: '🧠' },
];

const SYSTEM_PROMPT = `أنت مساعد ذكي اسمك جواد، تتحدث العربية بطلاقة. ردودك مختصرة وواضحة ولا تتجاوز 3 جمل. إذا سُئلت عن ملف، حلّله وأعطِ ملخصاً مفيداً. كن ودوداً ومهنياً.`;

const QUICK_MESSAGES = [
  '👋 مرحباً جواد',
  '🤔 ما هي قدراتك؟',
  '📝 اكتب لي مقالاً قصيراً',
  '💡 أعطني فكرة مشروع',
];

// ─── Helpers ───
const generateId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ═══════════════════════════════════════
// ─── Main Chat Component ───
// ═══════════════════════════════════════
export default function Chat() {
  const navigate = useNavigate();

  // ─── State ───
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: '', backendUrl: '', model: MODELS[0].id, ttsEnabled: true, ttsSpeed: 1,
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

  // ─── Refs ───
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load settings ───
  useEffect(() => {
    const saved = localStorage.getItem('jawad_settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch { navigate('/login'); }
    } else {
      navigate('/login');
    }

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

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ─── Scroll detection ───
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  // ─── Setup Speech Recognition ───
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        setInterimText(interim);
        if (final) {
          setInput(prev => prev + final);
          setInterimText('');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech error:', event.error);
        if (event.error === 'not-allowed') {
          setError('يرجى السماح بالوصول للميكروفون في إعدادات المتصفح');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
      window.speechSynthesis?.cancel();
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
      setError('');
      setInterimText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // ─── TTS ───
  const speak = useCallback((text: string) => {
    if (!settings.ttsEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    // تقسيم النص لجمل
    const sentences = text.match(/[^.!؟،\n]+[.!؟،\n]?/g) || [text];

    sentences.forEach((sentence, i) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = 'ar-SA';
      utterance.rate = settings.ttsSpeed;
      utterance.pitch = 1;

      // اختيار صوت عربي
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) utterance.voice = arabicVoice;

      if (i === 0) {
        utterance.onstart = () => setIsSpeaking(true);
      }
      if (i === sentences.length - 1) {
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
      }

      window.speechSynthesis.speak(utterance);
    });
  }, [settings.ttsEnabled, settings.ttsSpeed]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // ─── Copy message ───
  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── File Upload ───
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`الملف ${file.name} كبير جداً (الحد: 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: e.target?.result as string,
        });
        if (newFiles.length === files.length) {
          setPendingFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Drag & Drop ───
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // ─── Send Message ───
  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content && pendingFiles.length === 0) return;
    if (isLoading) return;

    if (!settings.apiKey) {
      setError('يرجى إضافة مفتاح NVIDIA API في الإعدادات');
      return;
    }

    // أوامر خاصة
    if (content === 'خروج' || content === 'exit') {
      navigate('/dashboard');
      return;
    }
    if (content === 'مسح الذاكرة' || content === 'مسح') {
      clearChat();
      return;
    }

    // إيقاف الاستماع والنطق
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    stopSpeaking();

    // إضافة رسالة المستخدم
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content || (pendingFiles.length > 0 ? `📎 تم رفع ${pendingFiles.length} ملف` : ''),
      timestamp: new Date(),
      files: pendingFiles.length > 0 ? [...pendingFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPendingFiles([]);
    setError('');
    setIsLoading(true);

    // تجهيز السياق
    const contextMessages = messages.slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // إضافة معلومات الملفات للرسالة
    let finalContent = content;
    if (userMessage.files && userMessage.files.length > 0) {
      const fileNames = userMessage.files.map(f => f.name).join(', ');
      finalContent = `${content}\n\n[ملفات مرفقة: ${fileNames}]`;
    }

    try {
      abortRef.current = new AbortController();
      const timeout = setTimeout(() => abortRef.current?.abort(), 45000);

      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...contextMessages,
            { role: 'user', content: finalContent },
          ],
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
        }),
        signal: abortRef.current.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('مفتاح API غير صالح. تحقق من المفتاح في الإعدادات');
        } else if (res.status === 429) {
          throw new Error('تم تجاوز الحد اليومي المجاني. حاول لاحقاً أو استخدم مفتاحاً آخر');
        } else {
          throw new Error(`خطأ من الخادم (${res.status}). حاول مرة أخرى`);
        }
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من الإجابة';

      const botMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);

      // نطق الرد
      setTimeout(() => speak(reply), 200);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('انتهت مهلة الانتظار. تحقق من اتصالك وحاول مرة أخرى');
      } else if (!navigator.onLine) {
        setError('لا يوجد اتصال بالإنترنت. تحقق من اتصالك وحاول مجدداً');
      } else {
        setError(err.message || 'حدث خطأ غير متوقع');
      }
    }

    setIsLoading(false);
  };

  // ─── Clear Chat ───
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('jawad_chat_messages');
    setError('');
  };

  // ─── Cancel request ───
  const cancelRequest = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  // ─── Keyboard ───
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Get file icon ───
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-green-400" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
    return <File className="w-4 h-4 text-blue-400" />;
  };

  const currentModel = MODELS.find(m => m.id === settings.model) || MODELS[0];

  // ═══════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════
  return (
    <div
      className="h-screen flex flex-col bg-[#050510] relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
            <p className="text-gray-400 mt-2">PDF, صور, نصوص</p>
          </div>
        </div>
      )}

      {/* ─── Top Bar ─── */}
      <header className="relative z-50 glass border-b border-white/[0.06] shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl hover:bg-white/[0.05] text-gray-500 hover:text-white transition-all"
              title="العودة"
            >
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

          {/* Left side */}
          <div className="flex items-center gap-1">
            {/* TTS Toggle */}
            <button
              onClick={() => {
                const newSettings = { ...settings, ttsEnabled: !settings.ttsEnabled };
                setSettings(newSettings);
                localStorage.setItem('jawad_settings', JSON.stringify(newSettings));
                if (!newSettings.ttsEnabled) stopSpeaking();
              }}
              className={`p-2 rounded-xl transition-all ${
                settings.ttsEnabled
                  ? 'text-violet-400 hover:bg-violet-500/10'
                  : 'text-gray-600 hover:bg-white/[0.05]'
              }`}
              title={settings.ttsEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            >
              {settings.ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Model Switch */}
            <button
              onClick={() => {
                const nextModel = settings.model === MODELS[0].id ? MODELS[1] : MODELS[0];
                const newSettings = { ...settings, model: nextModel.id };
                setSettings(newSettings);
                localStorage.setItem('jawad_settings', JSON.stringify(newSettings));
              }}
              className="p-2 rounded-xl text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
              title="تبديل النموذج"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-all ${
                showSettings ? 'text-violet-400 bg-violet-500/10' : 'text-gray-500 hover:bg-white/[0.05]'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Clear */}
            <button
              onClick={clearChat}
              className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="مسح المحادثة"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute left-0 right-0 top-full z-50 glass border-b border-white/[0.06] p-4 animate-fade-slide-down">
            <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">النموذج</label>
                <div className="flex gap-2">
                  {MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        const ns = { ...settings, model: m.id };
                        setSettings(ns);
                        localStorage.setItem('jawad_settings', JSON.stringify(ns));
                      }}
                      className={`flex-1 p-2 rounded-lg border text-xs text-center transition-all ${
                        settings.model === m.id
                          ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                          : 'border-white/[0.06] text-gray-500 hover:bg-white/[0.04]'
                      }`}
                    >
                      {m.icon} {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">سرعة النطق</label>
                  <span className="text-xs text-violet-300 font-mono">{settings.ttsSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5" max="2" step="0.1"
                  value={settings.ttsSpeed}
                  onChange={(e) => {
                    const ns = { ...settings, ttsSpeed: parseFloat(e.target.value) };
                    setSettings(ns);
                    localStorage.setItem('jawad_settings', JSON.stringify(ns));
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Messages Area ─── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto relative z-10"
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Welcome Screen */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 
                              border border-violet-500/20 flex items-center justify-center mb-6 animate-float">
                <span className="text-4xl">🤖</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">مرحباً! أنا جواد</h2>
              <p className="text-gray-400 mb-8 max-w-md">
                مساعدك الذكي بالعربية. تحدث معي بصوتك أو اكتب سؤالك، ويمكنك رفع ملفات للتحليل
              </p>

              {/* Quick Messages */}
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_MESSAGES.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(msg)}
                    className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] 
                               text-sm text-gray-300 hover:bg-violet-500/10 hover:border-violet-500/20 
                               hover:text-violet-300 transition-all duration-300"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              {/* Capabilities */}
              <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-sm">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <Mic className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <span className="text-[11px] text-gray-500">صوتي</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <Upload className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                  <span className="text-[11px] text-gray-500">ملفات</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <span className="text-[11px] text-gray-500">ذكي</span>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} ${
                msg.role === 'user' ? 'msg-user' : 'msg-bot'
              }`}
            >
              <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'order-1' : 'order-1'}`}>
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
                <div
                  className={`relative group rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600/15 border border-blue-500/20 rounded-tr-sm'
                      : 'bg-violet-600/10 border border-violet-500/15 rounded-tl-sm'
                  }`}
                >
                  {/* Files */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                          {getFileIcon(f.type)}
                          <span className="text-xs text-gray-300 max-w-[120px] truncate">{f.name}</span>
                          <span className="text-[10px] text-gray-600">{formatFileSize(f.size)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Actions */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        className="p-1 rounded-md hover:bg-white/[0.05] text-gray-600 hover:text-gray-300 transition-all"
                        title="نسخ"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => speak(msg.content)}
                        className="p-1 rounded-md hover:bg-white/[0.05] text-gray-600 hover:text-gray-300 transition-all"
                        title="استمع"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => sendMessage('أعد صياغة إجابتك السابقة بشكل مختلف')}
                        className="p-1 rounded-md hover:bg-white/[0.05] text-gray-600 hover:text-gray-300 transition-all"
                        title="إعادة"
                      >
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
                  <span className="text-[11px] text-gray-600">جواد يفكر...</span>
                </div>
                <div className="rounded-2xl rounded-tl-sm px-5 py-4 bg-violet-600/10 border border-violet-500/15">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                    <span className="text-sm text-violet-300/70">⏳ جاري التفكير...</span>
                    <button
                      onClick={cancelRequest}
                      className="mr-2 p-1 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                      title="إلغاء"
                    >
                      <StopCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="flex justify-center mb-4 animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
                <div className="flex gap-0.5 items-end h-4">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="waveform-bar bg-violet-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-violet-300">جواد يتحدث...</span>
                <button onClick={stopSpeaking} className="text-gray-500 hover:text-red-400 transition-colors">
                  <VolumeX className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 p-2 rounded-full 
                     glass border border-white/[0.1] text-gray-400 hover:text-white 
                     shadow-xl transition-all animate-fade-slide-up"
        >
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

      {/* ─── Input Area ─── */}
      <div className="relative z-20 shrink-0 border-t border-white/[0.06] glass">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          {/* Pending Files */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 animate-fade-slide-up">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                  {getFileIcon(f.type)}
                  <span className="text-xs text-gray-300 max-w-[100px] truncate">{f.name}</span>
                  <button onClick={() => removePendingFile(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Listening indicator */}
          {isListening && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-slide-up">
              <div className="flex gap-0.5 items-end h-4">
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className="waveform-bar"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-red-300 flex-1">
                {interimText || '🎤 جاري الاستماع...'}
              </span>
              <span className="text-[10px] text-gray-500">اضغط الميكروفون للإيقاف</span>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-2">
            {/* File Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-3 rounded-xl border border-white/[0.06] text-gray-500 
                         hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 
                         transition-all"
              title="رفع ملف"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.txt,.csv,.xlsx,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك هنا..."
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
                }}
              />
            </div>

            {/* Mic Button */}
            <button
              onClick={toggleListening}
              className={`shrink-0 p-3 rounded-xl transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 text-white animate-mic-pulse shadow-lg shadow-red-500/30'
                  : 'border border-white/[0.06] text-gray-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
              }`}
              title={isListening ? 'إيقاف الاستماع' : 'تحدث بصوتك'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Send Button */}
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
              className="shrink-0 p-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white
                         hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300
                         hover:scale-105 active:scale-95
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 rotate-180" />
              )}
            </button>
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-gray-700">
              Enter للإرسال • Shift+Enter لسطر جديد
            </p>
            <p className="text-[10px] text-gray-700">
              {currentModel.icon} {currentModel.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
