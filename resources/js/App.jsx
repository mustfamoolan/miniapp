import React, { useEffect, useState } from 'react';
import useAppStore from './store/useAppStore';

/* ─── Avatar Component ─────────────────────────────────────── */
function Avatar({ user }) {
  const initials = user
    ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '')
    : '?';

  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
  ];
  const colorClass = colors[(user?.id || 0) % colors.length];

  return (
    <div
      className={`w-11 h-11 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-base shadow-lg ring-2 ring-white/20`}
    >
      {initials.toUpperCase()}
    </div>
  );
}

/* ─── Stat Card ────────────────────────────────────────────── */
function StatCard({ icon, label, value, accentClass }) {
  return (
    <div className="relative flex flex-col gap-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 overflow-hidden group hover:bg-white/10 transition-all duration-300">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-white/50 text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className={`text-xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}

/* ─── Main Action Button ───────────────────────────────────── */
function ActionButton({ onClick, label, loading }) {
  return (
    <button
      id="main-action-btn"
      onClick={onClick}
      disabled={loading}
      className="relative w-full py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-lg active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
      style={{ boxShadow: '0 8px 30px rgba(124,58,237,0.35)' }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>جاري التحميل...</span>
        </span>
      ) : (
        <span className="relative z-10">{label}</span>
      )}
    </button>
  );
}

/* ─── Info Row ─────────────────────────────────────────────── */
function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/8 last:border-0">
      <span className="text-white/50 text-sm">{label}</span>
      <span className="text-white/90 text-sm font-medium">{value || '—'}</span>
    </div>
  );
}

/* ─── Main App ─────────────────────────────────────────────── */
export default function App() {
  const { user, isReady, initTelegram, triggerHaptic } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    initTelegram();
  }, []);

  const handleMainAction = () => {
    if (loading) return;
    triggerHaptic('medium');
    setLoading(true);
    setShowBadge(false);

    setTimeout(() => {
      setPoints((p) => p + 100);
      setLoading(false);
      setShowBadge(true);
      triggerHaptic('light');
      setTimeout(() => setShowBadge(false), 3000);
    }, 1200);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-white/50 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        background: 'linear-gradient(145deg, #0d0d14 0%, #12101e 50%, #0d0d14 100%)',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
      dir="rtl"
    >
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full" style={{ background: 'rgba(124,58,237,0.15)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full" style={{ background: 'rgba(99,102,241,0.10)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full" style={{ background: 'rgba(139,92,246,0.08)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-md mx-auto flex flex-col min-h-screen px-4 pb-10">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div className="flex flex-col">
              <p className="text-white/50 text-xs font-medium tracking-wide">مرحباً بك 👋</p>
              <h1 className="text-white font-bold text-lg leading-tight">
                {user?.first_name || 'مستخدم'}
                {user?.last_name ? ` ${user.last_name}` : ''}
              </h1>
              {user?.username && (
                <p className="text-violet-400 text-xs font-medium">@{user.username}</p>
              )}
            </div>
          </div>

          <button
            id="notification-btn"
            onClick={() => triggerHaptic('light')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="الإشعارات"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </header>

        {/* ── POINTS HERO ────────────────────────────────────── */}
        <div
          className="relative mt-2 mb-5 rounded-3xl p-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(99,102,241,0.15) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10 text-center py-2">
            <p className="text-white/50 text-sm font-medium mb-1">مجموع النقاط</p>
            <div
              className="text-5xl font-black mb-1 tabular-nums"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #818cf8, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {points.toLocaleString('ar-IQ')}
            </div>
            <p className="text-white/30 text-xs">نقطة مكتسبة</p>

            {showBadge && (
              <div
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
              >
                <span>✓</span>
                <span>+١٠٠ نقطة أضيفت!</span>
              </div>
            )}
          </div>
        </div>

        {/* ── STATS GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard icon="🏆" label="المستوى" value="مبتدئ" accentClass="text-amber-400" />
          <StatCard icon="🔥" label="الأيام المتتالية" value="٣ أيام" accentClass="text-orange-400" />
          <StatCard icon="⚡" label="المهام المكتملة" value="٧" accentClass="text-blue-400" />
          <StatCard icon="💎" label="التحديات" value="٢ / ٥" accentClass="text-violet-400" />
        </div>

        {/* ── USER INFO CARD ─────────────────────────────────── */}
        <div
          className="rounded-3xl p-5 mb-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <span className="text-lg">👤</span>
            معلومات الحساب
          </h2>
          <div className="flex flex-col">
            <InfoRow label="الاسم الأول" value={user?.first_name} />
            <InfoRow label="اسم العائلة" value={user?.last_name} />
            <InfoRow label="اسم المستخدم" value={user?.username ? `@${user.username}` : null} />
            <InfoRow label="معرّف المستخدم" value={user?.id?.toString()} />
            <InfoRow label="اللغة" value={user?.language_code?.toUpperCase()} />
          </div>
        </div>

        {/* ── ACTION CARD ────────────────────────────────────── */}
        <div
          className="rounded-3xl p-5 mb-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h2 className="text-white font-bold text-base mb-1 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            Mini App Dion
          </h2>
          <p className="text-white/40 text-sm mb-4">
            اضغط الزر أدناه لكسب النقاط مع التفاعل الحسي
          </p>
          <ActionButton
            onClick={handleMainAction}
            label="🚀 اكسب ١٠٠ نقطة"
            loading={loading}
          />
        </div>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <div className="mt-auto pt-4 text-center">
          <p className="text-white/20 text-xs">
            Mini App Dion · مبني بـ Laravel + React
          </p>
        </div>

      </div>
    </div>
  );
}
