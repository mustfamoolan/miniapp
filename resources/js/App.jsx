import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import useAppStore from './store/useAppStore';
import CustomerProfile from './components/CustomerProfile';

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
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#faf8ff');
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Router behavior
  if (selectedCustomerId) {
    return <CustomerProfile customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} />;
  }

  return (
    <div className="bg-background text-on-background select-none min-h-screen" dir="rtl">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-background flex flex-row-reverse justify-between items-center px-container-padding py-stack-gap h-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant overflow-hidden text-primary">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-on-surface">مرحباً</span>
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant">نشط</span>
              <span className="w-2 h-2 rounded-full bg-green-500 pulsing-dot"></span>
            </div>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
      </header>

      <main className="pt-20 pb-24 px-container-padding space-y-6">
        
        {/* Hero Balance Card */}
        <section className="relative overflow-hidden rounded-2xl bg-primary-container p-container-padding text-on-primary-container shadow-sm border border-primary/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="font-label-sm text-label-sm opacity-90">إجمالي المستحقات المتبقية</span>
              <h1 className="font-display-currency text-display-currency">
                {dashboardData?.total_receivables?.toLocaleString('ar-IQ') || '0'} <span className="text-headline-lg-mobile opacity-80 font-normal">د.ع</span>
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {dashboardData?.overdue_count > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container text-on-error-container border border-error/10">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span className="font-label-sm text-label-sm">أقساط متأخرة</span>
                </div>
              )}
              {dashboardData?.upcoming_count > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/10">
                  <span className="material-symbols-outlined text-[16px]">event_upcoming</span>
                  <span className="font-label-sm text-label-sm">مستحقات قادمة</span>
                </div>
              )}
              {(!dashboardData?.overdue_count && !dashboardData?.upcoming_count) && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed border border-primary/10">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span className="font-label-sm text-label-sm">لا توجد مستحقات قريبة</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-3 gap-stack-gap">
          <button onClick={() => { triggerHaptic('light'); setShowAddCustomer(true); }} className="flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface text-center">إضافة زبون</span>
          </button>
          <button className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
            <div className="w-16 h-16 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface text-center">تسجيل سداد</span>
          </button>
          <button className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
            <div className="w-16 h-16 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface text-center">كشف حساب</span>
          </button>
        </section>

        {/* Asset Directory */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">الزبائن النشطون</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">filter_list</span>
          </div>
          <div className="space-y-stack-gap">
            {dashboardData.customers?.length > 0 ? (
              dashboardData.customers.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { triggerHaptic('light'); setSelectedCustomerId(c.id); }}
                  className="bg-surface-container-lowest p-container-padding rounded-xl border border-outline-variant/30 flex items-center justify-between hover:border-primary/30 transition-colors active:scale-[0.98] duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-body-md text-body-md font-semibold text-on-surface">{c.name}</span>
                      <span className="font-label-sm text-label-sm text-outline">{c.phone || 'بدون رقم'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="font-body-md text-body-md font-bold text-primary">{Number(c.total_due).toLocaleString('ar-IQ')} د.ع</span>
                    </div>
                    <span className="material-symbols-outlined text-outline">chevron_left</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <p className="text-on-surface-variant font-body-md">لا يوجد زبائن حتى الآن.</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md bg-surface rounded-t-[24px] p-6 pb-safe animate-fade-in-up border-t border-outline-variant/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">إضافة زبون جديد</h2>
              <button onClick={() => setShowAddCustomer(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">اسم الزبون (مطلوب)</label>
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md" 
                  placeholder="مثال: أحمد جاسم محمد"
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">رقم الهاتف (اختياري)</label>
                <input 
                  type="tel" 
                  value={newCustomerPhone}
                  onChange={e => setNewCustomerPhone(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md" 
                  placeholder="0770 000 0000"
                />
              </div>
              
              <button 
                onClick={handleCreateCustomer} 
                disabled={!newCustomerName}
                className="w-full bg-primary text-on-primary font-headline-lg-mobile text-headline-lg-mobile py-4 rounded-xl mt-4 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">person_add</span>
                حفظ الزبون
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
