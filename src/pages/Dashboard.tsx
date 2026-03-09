import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, MessageSquare, Mic, Settings, LogOut, Trash2,
  Brain, Plus, Clock, ChevronLeft, Volume2,
  Server, Sparkles, FileText, BarChart3, ArrowLeft,
  Phone, Wifi
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  timestamp: string;
}

interface AppSettings {
  backendUrl: string;
  model: string;
  ttsEnabled: boolean;
  ttsSpeed: number;
}

const MODELS = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', desc: 'سريع واقتصادي', icon: '⚡', color: 'from-cyan-500 to-blue-500' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', desc: 'أقوى وأذكى', icon: '🧠', color: 'from-violet-500 to-purple-500' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>({
    backendUrl: '', model: MODELS[0].id, ttsEnabled: true, ttsSpeed: 1,
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'settings'>('overview');

  useEffect(() => {
    const saved = localStorage.getItem('jawad_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          backendUrl: parsed.backendUrl || '',
          model: parsed.model || MODELS[0].id,
          ttsEnabled: parsed.ttsEnabled !== false,
          ttsSpeed: parsed.ttsSpeed || 1,
        });
      } catch { /* ignore */ }
    } else {
      navigate('/login');
    }

    const convs = localStorage.getItem('jawad_conversations');
    if (convs) {
      try { setConversations(JSON.parse(convs)); } catch { /* ignore */ }
    }
  }, [navigate]);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('jawad_settings', JSON.stringify(newSettings));
  };

  const clearAllConversations = () => {
    setConversations([]);
    localStorage.removeItem('jawad_conversations');
    localStorage.removeItem('jawad_chat_messages');
  };

  const startNewChat = () => {
    localStorage.removeItem('jawad_chat_messages');
    navigate('/chat');
  };

  const currentModel = MODELS.find(m => m.id === settings.model) || MODELS[0];
  const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);

  // تحقق من حالة الاتصال
  const isConnected = !!settings.backendUrl;

  const statCards = [
    { icon: <MessageSquare className="w-6 h-6" />, label: 'المحادثات', value: conversations.length, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/10' },
    { icon: <BarChart3 className="w-6 h-6" />, label: 'الرسائل', value: totalMessages, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10' },
    { icon: <Brain className="w-6 h-6" />, label: 'النموذج', value: currentModel.name, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
    { icon: <Server className="w-6 h-6" />, label: 'الخادم', value: isConnected ? 'متصل ✓' : 'غير متصل', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen bg-[#050510] relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-600/[0.04] blur-[100px]" />
        <div className="bg-grid absolute inset-0" />
      </div>

      {/* Top Bar */}
      <header className="relative z-50 glass border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">لوحة التحكم</h1>
              <p className="text-xs text-gray-500">مرحباً بك في جواد</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 
                         text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 
                         transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              محادثة جديدة
            </button>
            <button
              onClick={() => { localStorage.removeItem('jawad_settings'); navigate('/login'); }}
              className="p-2.5 rounded-xl border border-white/[0.06] text-gray-500 hover:text-red-400 
                         hover:border-red-500/20 hover:bg-red-500/5 transition-all"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar">
          {[
            { id: 'overview' as const, label: 'نظرة عامة', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'history' as const, label: 'المحادثات', icon: <Clock className="w-4 h-4" /> },
            { id: 'settings' as const, label: 'الإعدادات', icon: <Settings className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent hover:bg-white/[0.03]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Welcome */}
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-l from-violet-600/10 to-purple-800/10" />
              <div className="absolute inset-0 border border-violet-500/10 rounded-2xl" />
              <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="text-6xl animate-float">🤖</div>
                <div className="text-center sm:text-right flex-1">
                  <h2 className="text-2xl font-black text-white mb-2">أهلاً بك في جواد!</h2>
                  <p className="text-gray-400 mb-4">مساعدك الذكي جاهز للمحادثة. ابدأ محادثة جديدة أو تابع من حيث توقفت</p>
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    <button
                      onClick={startNewChat}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 
                                 text-white font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105"
                    >
                      <Mic className="w-5 h-5" />
                      محادثة نصية وصوتية
                    </button>
                    <button
                      onClick={startNewChat}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30
                                 text-emerald-300 font-bold hover:bg-emerald-500/10 transition-all"
                    >
                      <Phone className="w-5 h-5" />
                      دردشة صوتية مباشرة
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] 
                             transition-all hover-lift animate-fade-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <div className={`bg-gradient-to-br ${s.color} bg-clip-text text-transparent`}>
                      {s.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">إجراءات سريعة</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button onClick={startNewChat}
                  className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] 
                             hover:bg-violet-500/5 hover:border-violet-500/20 transition-all text-center">
                  <MessageSquare className="w-6 h-6 text-violet-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white mb-0.5">محادثة</div>
                  <div className="text-[10px] text-gray-500">نصية وصوتية</div>
                </button>
                <button onClick={startNewChat}
                  className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] 
                             hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all text-center">
                  <Phone className="w-6 h-6 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white mb-0.5">مباشرة</div>
                  <div className="text-[10px] text-gray-500">مكالمة صوتية</div>
                </button>
                <button onClick={startNewChat}
                  className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] 
                             hover:bg-red-500/5 hover:border-red-500/20 transition-all text-center">
                  <FileText className="w-6 h-6 text-red-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white mb-0.5">PDF</div>
                  <div className="text-[10px] text-gray-500">PyPDF تحليل</div>
                </button>
                <button onClick={startNewChat}
                  className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] 
                             hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all text-center">
                  <BarChart3 className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white mb-0.5">بيانات</div>
                  <div className="text-[10px] text-gray-500">Pandas تحليل</div>
                </button>
                <button onClick={startNewChat}
                  className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] 
                             hover:bg-amber-500/5 hover:border-amber-500/20 transition-all text-center">
                  <Wifi className="w-6 h-6 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white mb-0.5">ويب</div>
                  <div className="text-[10px] text-gray-500">Scrapling استخراج</div>
                </button>
                <button onClick={startNewChat}
                  className="group p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] 
                             hover:bg-pink-500/5 hover:border-pink-500/20 transition-all text-center">
                  <Plus className="w-6 h-6 text-pink-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white mb-0.5">DICOM</div>
                  <div className="text-[10px] text-gray-500">صور طبية</div>
                </button>
              </div>
            </div>

            {/* Recent Conversations */}
            {conversations.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">آخر المحادثات</h3>
                  <button onClick={() => setActiveTab('history')} className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                    عرض الكل <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {conversations.slice(0, 3).map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => navigate('/chat')}
                      className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] 
                                 cursor-pointer transition-all flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{conv.title}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{conv.lastMessage}</div>
                      </div>
                      <div className="text-xs text-gray-600 shrink-0">{conv.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">سجل المحادثات</h3>
              {conversations.length > 0 && (
                <button
                  onClick={clearAllConversations}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-400 
                             border border-red-500/20 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف الكل
                </button>
              )}
            </div>

            {conversations.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">💬</div>
                <h4 className="text-lg font-bold text-gray-400 mb-2">لا توجد محادثات بعد</h4>
                <p className="text-gray-600 mb-6">ابدأ أول محادثة مع جواد!</p>
                <button
                  onClick={startNewChat}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-medium 
                             hover:bg-violet-500 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  محادثة جديدة
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] 
                               cursor-pointer transition-all flex items-center gap-4"
                    onClick={() => navigate('/chat')}
                  >
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{conv.title}</div>
                      <div className="text-sm text-gray-500 mt-1 truncate">{conv.lastMessage}</div>
                      <div className="text-xs text-gray-600 mt-2">{conv.messageCount} رسالة • {conv.timestamp}</div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl animate-fade-in space-y-6">
            <h3 className="text-xl font-bold text-white mb-6">الإعدادات</h3>

            {/* Model */}
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h4 className="flex items-center gap-2 font-bold text-white mb-4">
                <Brain className="w-5 h-5 text-violet-400" />
                نموذج الذكاء الاصطناعي
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => saveSettings({ ...settings, model: m.id })}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      settings.model === m.id
                        ? 'border-violet-500/50 bg-violet-500/10'
                        : 'border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="text-sm font-bold text-white">{m.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* TTS */}
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h4 className="flex items-center gap-2 font-bold text-white mb-4">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                إعدادات الصوت
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">تشغيل الردود صوتياً</span>
                  <button
                    onClick={() => saveSettings({ ...settings, ttsEnabled: !settings.ttsEnabled })}
                    className={`w-12 h-7 rounded-full transition-all ${
                      settings.ttsEnabled ? 'bg-violet-600' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.ttsEnabled ? '-translate-x-[22px]' : '-translate-x-[4px]'
                    }`} />
                  </button>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm">سرعة النطق</span>
                    <span className="text-violet-300 text-sm font-mono">{settings.ttsSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5" max="2" step="0.1"
                    value={settings.ttsSpeed}
                    onChange={(e) => saveSettings({ ...settings, ttsSpeed: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Connection */}
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h4 className="flex items-center gap-2 font-bold text-white mb-4">
                <Wifi className="w-5 h-5 text-emerald-400" />
                الاتصال بالخادم
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">رابط الخادم الخلفي</label>
                  <div className="text-sm text-gray-400 bg-white/[0.03] rounded-lg px-3 py-2.5 font-mono flex items-center gap-2" dir="ltr">
                    {isConnected && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                    {settings.backendUrl || 'غير محدد'}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Server className="w-3 h-3" />
                  <span>المفتاح مُضمّن في الخادم — لا حاجة لإدخاله يدوياً</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                تعديل إعدادات الاتصال
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-2xl border border-red-500/10 bg-red-500/[0.02]">
              <h4 className="flex items-center gap-2 font-bold text-red-300 mb-4">
                <Trash2 className="w-5 h-5" />
                منطقة الخطر
              </h4>
              <button
                onClick={clearAllConversations}
                className="px-4 py-2 rounded-xl text-sm text-red-400 border border-red-500/20 
                           hover:bg-red-500/10 transition-all"
              >
                حذف جميع المحادثات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
