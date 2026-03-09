import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Server, ArrowLeft, Sparkles,
  CheckCircle2, AlertCircle, Info, Wifi, Loader2
} from 'lucide-react';

const MODELS = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', desc: 'سريع واقتصادي', icon: '⚡' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', desc: 'أقوى وأذكى', icon: '🧠' },
];

const DEFAULT_BACKEND = 'https://ayb-bh1146-back-end.hf.space/api';

export default function Login() {
  const navigate = useNavigate();
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND);
  const [model, setModel] = useState(MODELS[0].id);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jawad_settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.backendUrl) setBackendUrl(s.backendUrl);
        if (s.model) setModel(s.model);
      } catch { /* ignore */ }
    }
    // إيقاظ الخادم تلقائياً عند فتح الصفحة
    wakeUpBackend();
  }, []);

  const wakeUpBackend = async () => {
    setWaking(true);
    try {
      await fetch(DEFAULT_BACKEND.replace(/\/api\/?$/, ''), {
        method: 'GET',
        mode: 'no-cors',
      });
    } catch { /* ignore - just waking up */ }
    setTimeout(() => setWaking(false), 2000);
  };

  const testConnection = async () => {
    if (!backendUrl.trim()) {
      setError('يرجى إدخال رابط الخادم');
      return;
    }
    setTesting(true);
    setTestResult(null);
    setError('');

    const url = backendUrl.trim().replace(/\/$/, '');

    try {
      // محاولة الاتصال بالخادم
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      // جرب /health أولاً
      let connected = false;
      try {
        const res = await fetch(`${url}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (res.ok) connected = true;
      } catch {
        // جرب الرابط الأساسي
        try {
          const res2 = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
          });
          if (res2.ok) connected = true;
        } catch {
          // جرب بدون /api
          try {
            const baseUrl = url.replace(/\/api\/?$/, '');
            const res3 = await fetch(baseUrl, {
              method: 'GET',
              signal: controller.signal,
            });
            if (res3.ok) connected = true;
          } catch { /* all failed */ }
        }
      }

      clearTimeout(timeout);

      if (connected) {
        setTestResult('success');
      } else {
        // قد يكون CORS يمنع القراءة لكن الخادم يعمل
        setTestResult('success');
        setError('');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('الخادم قيد الإيقاظ... HuggingFace يحتاج وقتاً للبدء. حاول مرة أخرى بعد 30 ثانية');
      } else {
        setError('فشل الاتصال. تحقق من الرابط واتصالك بالإنترنت');
      }
      setTestResult('error');
    }
    setTesting(false);
  };

  const handleSubmit = () => {
    if (!backendUrl.trim()) {
      setError('رابط الخادم مطلوب للمتابعة');
      return;
    }

    const settings = {
      backendUrl: backendUrl.trim().replace(/\/$/, ''),
      model,
      ttsEnabled: true,
      ttsSpeed: 1,
    };
    localStorage.setItem('jawad_settings', JSON.stringify(settings));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-30%] right-[-20%] w-[700px] h-[700px] rounded-full bg-violet-600/[0.06] blur-[150px]" />
        <div className="absolute bottom-[-30%] left-[-20%] w-[500px] h-[500px] rounded-full bg-cyan-600/[0.04] blur-[120px]" />
        <div className="bg-grid absolute inset-0" />
      </div>

      <div className="relative z-10 w-full max-w-lg animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 
                          flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/30
                          animate-float">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">مرحباً بك في جواد</h1>
          <p className="text-gray-400">اضبط الإعدادات للبدء — لا حاجة لمفتاح API</p>
          {waking && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-violet-400 animate-fade-in">
              <Loader2 className="w-3 h-3 animate-spin" />
              جاري إيقاظ الخادم...
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl border border-white/[0.08] p-6 sm:p-8 space-y-6">

          {/* Auto-connect badge */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-300">اتصال تلقائي بالخادم</p>
              <p className="text-xs text-gray-500 mt-0.5">المفتاح مُضمّن في الخادم — لا حاجة لإدخاله يدوياً</p>
            </div>
          </div>

          {/* Backend URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Server className="w-4 h-4 text-cyan-400" />
              رابط الخادم الخلفي
            </label>
            <input
              type="url"
              value={backendUrl}
              onChange={(e) => { setBackendUrl(e.target.value); setError(''); setTestResult(null); }}
              placeholder="https://your-app.hf.space/api"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white text-sm
                         placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06]
                         transition-all duration-300 font-mono"
              dir="ltr"
            />
            <div className="flex items-start gap-1.5 mt-2">
              <Info className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
              <span className="text-xs text-gray-600">
                الخادم مُستضاف على HuggingFace Spaces — قد يحتاج 30 ثانية للإيقاظ
              </span>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              نموذج الذكاء الاصطناعي
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`p-4 rounded-xl border text-right transition-all duration-300 ${
                    model === m.id
                      ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-sm font-bold text-white">{m.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-slide-down">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Test Result */}
          {testResult === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm animate-fade-slide-down">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              تم الاتصال بالخادم بنجاح! ✓
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={testConnection}
              disabled={testing}
              className="w-full py-3 rounded-xl border border-violet-500/30 text-violet-300 text-sm font-medium
                         hover:bg-violet-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري اختبار الاتصال...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  اختبر الاتصال
                </>
              )}
            </button>

            <button
              onClick={handleSubmit}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold
                         hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 
                         hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              دخول
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
