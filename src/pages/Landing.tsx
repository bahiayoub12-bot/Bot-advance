import { useNavigate } from 'react-router-dom';
import {
  Mic, Brain, FileText, Volume2, Globe, BarChart3,
  ChevronLeft, Sparkles, Zap, Shield, ArrowLeft,
  MessageSquare, Upload, Bot, Star
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Mic className="w-7 h-7" />,
      title: 'محادثة صوتية',
      desc: 'تحدث بصوتك باللغة العربية وسيفهمك جواد فوراً عبر تقنية التعرف على الكلام',
      color: 'from-red-500 to-pink-500',
      bg: 'bg-red-500/10',
    },
    {
      icon: <Brain className="w-7 h-7" />,
      title: 'ذكاء اصطناعي متقدم',
      desc: 'مدعوم بنماذج Llama 3.1 من Meta عبر NVIDIA API مع إمكانية التبديل بين النماذج',
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-500/10',
    },
    {
      icon: <FileText className="w-7 h-7" />,
      title: 'تحليل PDF و الملفات',
      desc: 'ارفع ملفات PDF وسيستخرج جواد النصوص بمكتبة PyPDF ويحللها ويجيب عن أسئلتك حولها',
      color: 'from-cyan-500 to-blue-500',
      bg: 'bg-cyan-500/10',
    },
    {
      icon: <Volume2 className="w-7 h-7" />,
      title: 'صور طبية DICOM',
      desc: 'يقرأ جواد ملفات DICOM الطبية بمكتبة PyDICOM ويستخرج البيانات والمعلومات التشخيصية',
      color: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: 'استخراج بيانات الويب',
      desc: 'أعطِ جواد أي رابط وسيستخرج المحتوى بمكتبة Scrapling مع دعم HTTPX للطلبات المتقدمة',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'تحليل بيانات متقدم',
      desc: 'ارفع ملفات CSV أو Excel وسيحللها بمكتبات Pandas و NumPy — إحصائيات، رسوم، ملخصات',
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-500/10',
    },
  ];

  const steps = [
    { num: '01', icon: <Mic className="w-8 h-8" />, title: 'تحدّث أو اكتب', desc: 'اضغط على زر الميكروفون وتحدث بالعربية أو اكتب سؤالك في مربع النص' },
    { num: '02', icon: <Brain className="w-8 h-8" />, title: 'جواد يفكر', desc: 'يعالج جواد طلبك عبر نماذج الذكاء الاصطناعي المتقدمة ويحلل السياق' },
    { num: '03', icon: <MessageSquare className="w-8 h-8" />, title: 'تحصل على الجواب', desc: 'يرد عليك جواد نصاً وصوتاً بإجابة دقيقة ومختصرة باللغة العربية' },
  ];

  const stats = [
    { value: 'Llama 3.1', label: 'نموذج الذكاء' },
    { value: 'عربي', label: 'دعم كامل' },
    { value: 'مجاني', label: 'مفتوح المصدر' },
    { value: '< 3 ث', label: 'زمن الاستجابة' },
  ];

  return (
    <div className="min-h-screen bg-[#050510] overflow-y-auto overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/[0.05] blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-pink-600/[0.04] blur-[100px]" />
        <div className="bg-grid absolute inset-0" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 glass border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">جـواد</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">المميزات</a>
            <a href="#how" className="hover:text-white transition-colors">كيف يعمل</a>
            <a href="#tech" className="hover:text-white transition-colors">التقنيات</a>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 
                       text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 
                       transition-all duration-300 hover:scale-105 active:scale-95"
          >
            ابدأ الآن
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text */}
          <div className="flex-1 text-center lg:text-right">
            <div className="animate-fade-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>مدعوم بـ Llama 3.1 من Meta</span>
              </div>
            </div>

            <h1 className="animate-fade-slide-up delay-100 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-shadow-glow">
              <span className="text-white">مساعدك الذكي</span>
              <br />
              <span className="gradient-text">بالعربية</span>
            </h1>

            <p className="animate-fade-slide-up delay-200 text-lg sm:text-xl text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 lg:mr-0">
              تحدّث مع جواد بصوتك، ارفع ملفاتك، واحصل على إجابات ذكية فورية.
              بوت محادثة عربي متكامل يجمع بين الذكاء الاصطناعي والبساطة.
            </p>

            <div className="animate-fade-slide-up delay-300 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={() => navigate('/login')}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 
                           text-white font-bold text-lg hover:shadow-xl hover:shadow-purple-500/30 
                           transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Mic className="w-5 h-5 group-hover:animate-bounce" />
                ابدأ المحادثة
              </button>

              <a
                href="#features"
                className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-gray-300 
                           hover:bg-white/5 hover:border-white/20 transition-all duration-300"
              >
                اكتشف المزيد
                <ChevronLeft className="w-4 h-4" />
              </a>
            </div>

            {/* Stats */}
            <div className="animate-fade-slide-up delay-400 mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <div key={i} className="text-center lg:text-right">
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bot Illustration */}
          <div className="flex-1 flex justify-center animate-fade-slide-up delay-300">
            <div className="relative w-72 h-72 sm:w-96 sm:h-96">
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-[spin-slow_20s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border border-purple-500/15 animate-[spin-slow_15s_linear_infinite_reverse]" />
              <div className="absolute inset-8 rounded-full border border-cyan-500/10 animate-[spin-slow_25s_linear_infinite]" />

              {/* Center bot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-800/20 
                                border border-violet-500/20 flex items-center justify-center animate-float
                                shadow-2xl shadow-purple-500/10">
                  <div className="text-center">
                    <div className="text-6xl sm:text-7xl mb-2">🤖</div>
                    <div className="text-lg font-bold text-violet-300">جـواد</div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400">متصل</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orbiting icons */}
              <div className="absolute inset-0 animate-[spin-slow_12s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center animate-[spin-slow_12s_linear_infinite_reverse]">
                  <Mic className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <div className="absolute inset-0 animate-[spin-slow_16s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center animate-[spin-slow_16s_linear_infinite]">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="absolute inset-0 animate-[spin-slow_20s_linear_infinite]">
                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-2 w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center animate-[spin-slow_20s_linear_infinite_reverse]">
                  <Upload className="w-5 h-5 text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm mb-4">
            <Zap className="w-4 h-4" />
            قدرات متقدمة
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">كل ما تحتاجه في مكان واحد</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">جواد مُجهّز بأحدث تقنيات الذكاء الاصطناعي ليكون مساعدك الشخصي الأمثل</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] 
                          hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-500 hover-lift
                          animate-fade-slide-up`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-4
                              group-hover:scale-110 transition-transform duration-300`}>
                <div className={`bg-gradient-to-br ${f.color} bg-clip-text text-transparent`}>
                  {f.icon}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">كيف يعمل جواد؟</h2>
          <p className="text-gray-400 text-lg">ثلاث خطوات بسيطة للبدء</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center animate-fade-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="text-6xl font-black text-violet-500/10 mb-4">{s.num}</div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 
                              border border-violet-500/20 flex items-center justify-center mx-auto mb-4 text-violet-400">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute left-0 top-1/3 -translate-x-1/2">
                  <ArrowLeft className="w-6 h-6 text-violet-500/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-4">مبني بأحدث التقنيات</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Python', 'FastAPI',
            'Llama 3.1', 'NVIDIA API', 'Web Speech API', 'PyPDF', 'PyDICOM', 'Scrapling',
            'HTTPX', 'Pandas', 'NumPy', 'Donut OCR', 'Pydantic'
          ].map((tech, i) => (
            <span key={i} className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-300 text-sm
                                     hover:bg-violet-500/10 hover:border-violet-500/20 hover:text-violet-300 transition-all cursor-default">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-800/20" />
          <div className="absolute inset-0 border border-violet-500/20 rounded-3xl" />
          <div className="relative p-10 sm:p-16 text-center">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">جاهز للبدء؟</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
              ابدأ محادثتك الأولى مع جواد الآن — مجاناً ودون تعقيد
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 
                         text-white font-bold text-lg hover:shadow-xl hover:shadow-purple-500/30 
                         transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Star className="w-5 h-5" />
              ابدأ مجاناً
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-400" />
            <span className="font-bold text-gray-400">جواد</span>
            <span className="text-gray-600 text-sm">— المساعد الذكي بالعربية</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 text-sm">
            <Shield className="w-4 h-4" />
            <span>مشروع مفتوح المصدر © 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
