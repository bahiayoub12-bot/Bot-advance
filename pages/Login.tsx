import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Key, Server, Eye, EyeOff, ArrowLeft, Sparkles,
  CheckCircle2, AlertCircle, ExternalLink, Info
} from 'lucide-react';

const MODELS = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', desc: 'سريع واقتصادي', icon: '⚡' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', desc: 'أقوى وأذكى', icon: '🧠' },
];

export default function Login() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('jawad_settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.apiKey) setApiKey(s.apiKey);
        if (s.backendUrl) setBackendUrl(s.backendUrl);
        if (s.model) setModel(s.model);
      } catch { /* ignore */ }
    }
  }, []);

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setError('يرجى إدخال مفتاح API أولاً');
      return;
    }
    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'قل مرحبا' }],
          max_tokens: 20,
          temperature: 0.5,
        }),
      });

      if (res.ok) {
        setTestResult('success');
      } else if (res.status === 401 || res.status === 403) {
        setError('مفتاح API غير صالح. تحقق من المفتاح وحاول مجدداً');
        setTestResult('error');
      } else if (res.status === 429) {
        setError('تم تجاوز الحد المجاني. حاول لاحقاً');
        setTestResult('error');
      } else {
        setError(`خطأ في الاتصال (${res.status})`);
        setTestResult('error');
      }
    } catch {
      setError('فشل الاتصال. تحقق من اتصالك بالإنترنت');
      setTestResult('error');
    }
    setTesting(false);
  };

  const handleSubmit = () => {
    if (!apiKey.trim()) {
      setError('مفتاح API مطلوب للمتابعة');
      return;
    }

    const settings = {
      apiKey: apiKey.trim(),
      backendUrl: backendUrl.trim(),
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 
                          flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/20">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">مرحباً بك في جواد</h1>
          <p className="text-gray-400">أدخل إعداداتك للبدء</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl border border-white/[0.08] p-6 sm:p-8 space-y-6">
          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Key className="w-4 h-4 text-violet-400" />
              مفتاح NVIDIA API
              <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setError(''); setTestResult(null); }}
                placeholder="nvapi-..."
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 pl-12 text-white text-sm
                           placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06]
                           transition-all duration-300"
                dir="ltr"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <a
              href="https://build.nvidia.com/explore/discover"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              احصل على مفتاح مجاني من NVIDIA
            </a>
          </div>

          {/* Backend URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Server className="w-4 h-4 text-cyan-400" />
              رابط الخادم الخلفي
              <span className="text-gray-600 text-xs">(اختياري)</span>
            </label>
            <input
              type="url"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="https://your-app.hf.space/api"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm
                         placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06]
                         transition-all duration-300"
              dir="ltr"
            />
            <div className="flex items-start gap-1.5 mt-2">
              <Info className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
              <span className="text-xs text-gray-600">
                للميزات المتقدمة مثل تحليل الملفات و Piper TTS. يُستضاف على HuggingFace Spaces
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
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-slide-down">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Test Result */}
          {testResult === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm animate-fade-slide-down">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              تم الاتصال بنجاح! المفتاح صالح ✓
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
                  <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  جاري اختبار الاتصال...
                </>
              ) : (
                <>اختبر الاتصال</>
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
