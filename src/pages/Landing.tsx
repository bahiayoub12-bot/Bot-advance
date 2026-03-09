import { useNavigate } from 'react-router-dom';
import { Sparkles, Mic, Upload, Brain, ArrowLeft, Zap, Shield, Globe } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/[0.04] blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-purple-600/[0.03] blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg">
            🤖
          </div>
          <span className="text-lg font-bold">جواد</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium hover:bg-violet-500/20 transition-all"
        >
          ابدأ الآن
          <ArrowLeft className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-300 text-xs mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          مدعوم بـ Llama 3.1 من Meta
        </div>

        <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
          مساعدك الذكي
          <br />
          <span className="bg-gradient-to-l from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            بالعربية
          </span>
        </h1>

        <p className="text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          تحدّث مع جواد بصوتك، ارفع ملفاتك، واحصل على إجابات ذكية فورية.
          بوت محادثة عربي متكامل يجمع بين الذكاء الاصطناعي والبساطة.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-l from-violet-600 to-purple-600 text-white font-bold text-base hover:shadow-2xl hover:shadow-violet-500/25 hover:scale-105 transition-all"
          >
            <Mic className="w-5 h-5" />
            ابدأ المحادثة
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/[0.1] text-gray-300 font-medium text-base hover:bg-white/[0.05] transition-all"
          >
            اكتشف المزيد ›
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 w-full max-w-2xl">
          {[
            { label: 'Llama 3.1', sub: 'نموذج الذكاء' },
            { label: 'عربي', sub: 'دعم كامل' },
            { label: '‹ 3 ث', sub: 'زمن الاستجابة' },
            { label: 'مجاني', sub: 'مفتوح المصدر' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-black text-white">{s.label}</div>
              <div className="text-xs text-gray-600 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 sm:px-12 py-20">
        <h2 className="text-3xl font-black text-center mb-14">
          كل ما تحتاجه في مكان واحد
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: <Mic className="w-6 h-6 text-red-400" />, title: 'صوت ذكي', desc: 'تحدث بالعربية وجواد يفهمك تماماً ويرد بصوت طبيعي' },
            { icon: <Upload className="w-6 h-6 text-cyan-400" />, title: 'رفع الملفات', desc: 'ارفع PDF أو صور أو مستندات وجواد يحللها لك فوراً' },
            { icon: <Brain className="w-6 h-6 text-violet-400" />, title: 'ذكاء متقدم', desc: 'نموذج Llama 3.1 الأقوى للفهم والتحليل والإجابة' },
            { icon: <Zap className="w-6 h-6 text-amber-400" />, title: 'سريع جداً', desc: 'استجابات فورية بأقل من 3 ثوانٍ لأي سؤال' },
            { icon: <Shield className="w-6 h-6 text-green-400" />, title: 'خصوصية تامة', desc: 'مفتاحك الخاص، بياناتك لا تُخزّن في أي مكان' },
            { icon: <Globe className="w-6 h-6 text-blue-400" />, title: 'بحث ذكي', desc: 'يبحث في الإنترنت ويحلل المصادر لك تلقائياً' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 text-center">
        <div className="max-w-xl mx-auto p-10 rounded-3xl border border-violet-500/20 bg-violet-500/[0.03]">
          <div className="text-4xl mb-4">🤖</div>
          <h2 className="text-2xl font-black mb-3">جاهز للبدء؟</h2>
          <p className="text-gray-500 text-sm mb-6">أضف مفتاح NVIDIA مجاني وابدأ في ثوانٍ</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-purple-600 text-white font-bold hover:shadow-xl hover:shadow-violet-500/25 hover:scale-105 transition-all"
          >
            ابدأ مجاناً الآن
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-xs text-gray-700 border-t border-white/[0.04]">
        جواد © 2025 — مساعدك الذكي بالعربية
      </footer>
    </div>
  );
}
