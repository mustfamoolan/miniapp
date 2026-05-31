import React, { useEffect, useState } from 'react';
import useAppStore from './store/useAppStore';
import CustomerProfile from './components/CustomerProfile';

/* ─── Hero Balance Component ───────────────────────────────── */
function BalanceHero({ data, onAddCustomer }) {
  return (
    <div className="flex flex-col items-center pt-8 pb-6 px-4">
      <div className="w-14 h-14 rounded-full bg-var-tg-secondary-bg mb-3 flex items-center justify-center text-2xl shadow-sm">
        💰
      </div>
      <p className="text-var-tg-hint font-medium text-sm mb-1">إجمالي المستحقات (ديون + أقساط)</p>
      <div className="flex items-baseline gap-1 mb-6 text-var-tg-text">
        <span className="text-4xl font-black tracking-tight">{data?.total_receivables?.toLocaleString('ar-IQ') || '0'}</span>
        <span className="text-lg font-bold text-var-tg-hint"> د.ع</span>
      </div>

      <div className="flex w-full justify-center gap-4">
        <button
          onClick={onAddCustomer}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <span className="text-xs font-bold text-var-tg-text">زبون جديد</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Alert Strip ──────────────────────────────────────────── */
function AlertStrip({ overdueCount, upcomingCount }) {
  if (!overdueCount && !upcomingCount) return null;
  return (
    <div className="px-4 mb-4 flex gap-2">
      {overdueCount > 0 && (
        <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">⚠️</div>
          <div>
            <p className="text-red-500 font-bold text-sm leading-tight">متأخرة</p>
            <p className="text-red-500/70 text-xs">{overdueCount} دفعات</p>
          </div>
        </div>
      )}
      {upcomingCount > 0 && (
        <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">⏳</div>
          <div>
            <p className="text-amber-600 dark:text-amber-400 font-bold text-sm leading-tight">قادمة قريباً</p>
            <p className="text-amber-600/70 dark:text-amber-400/70 text-xs">{upcomingCount} خلال أسبوع</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main App ─────────────────────────────────────────────── */
export default function App() {
  const { user, isReady, initTelegram, dashboardData, addCustomer, triggerHaptic } = useAppStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  useEffect(() => {
    initTelegram();
    const tg = window.Telegram?.WebApp;
    if (tg) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
      document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#5288c1');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f4f4f5');
      document.body.style.backgroundColor = 'var(--tg-theme-bg-color)';
      document.body.style.color = 'var(--tg-theme-text-color)';
    }
  }, []);

  const handleCreateCustomer = async () => {
    if (!newCustomerName) return;
    const success = await addCustomer({ name: newCustomerName, phone: newCustomerPhone });
    if (success) {
      setShowAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    }
  };

  if (!isReady || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-var-tg-bg">
        <div className="w-8 h-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Router behavior
  if (selectedCustomerId) {
    return <CustomerProfile customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} />;
  }

  return (
    <div className="min-h-screen w-full bg-var-tg-bg text-var-tg-text font-sans antialiased" dir="rtl">
      <BalanceHero data={dashboardData} onAddCustomer={() => { triggerHaptic('light'); setShowAddCustomer(true); }} />
      <AlertStrip overdueCount={dashboardData.overdue_count} upcomingCount={dashboardData.upcoming_count} />
      
      <div className="px-4 pb-8">
        <h2 className="text-lg font-bold mb-3 mt-2 text-var-tg-text">دليل الزبائن</h2>
        <div className="flex flex-col gap-3">
          {dashboardData.customers?.length > 0 ? (
            dashboardData.customers.map((c) => (
              <div 
                key={c.id} 
                onClick={() => { triggerHaptic('light'); setSelectedCustomerId(c.id); }}
                className="bg-var-tg-secondary-bg rounded-xl p-4 flex items-center justify-between shadow-sm border border-var-tg-hint-color/5 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-lg">
                    {c.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-var-tg-text">{c.name}</h3>
                    <p className="text-xs text-var-tg-hint">{c.phone || 'بدون رقم'}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-orange-500">{Number(c.total_due).toLocaleString('ar-IQ')}</p>
                  <p className="text-xs text-var-tg-hint">د.ع</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-var-tg-hint bg-var-tg-secondary-bg rounded-xl">
              <p>لا يوجد زبائن حتى الآن.</p>
              <p className="text-sm mt-1">اضغط على زر "زبون جديد" للبدء.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full bg-var-tg-bg rounded-t-3xl p-5 pb-10 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">إضافة زبون جديد</h2>
              <button onClick={() => setShowAddCustomer(false)} className="text-var-tg-hint text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-var-tg-hint mb-1 block">اسم الزبون (مطلوب)</label>
                <input type="text" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-var-tg-hint mb-1 block">رقم الهاتف (اختياري)</label>
                <input type="tel" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
              </div>
              <button onClick={handleCreateCustomer} className="w-full py-4 mt-2 rounded-xl bg-var-tg-button text-var-tg-button-text font-bold active:scale-95 shadow-lg shadow-var-tg-button/30">
                حفظ الزبون
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
