import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

function InstallmentPreview({ total, downPayment, duration, frequency }) {
  const remaining = Math.max(0, parseFloat(total || 0) - parseFloat(downPayment || 0));
  const portion = duration > 0 ? (remaining / duration).toFixed(2) : 0;
  
  if (remaining <= 0 || duration <= 0) return null;

  return (
    <div className="mt-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
      <h4 className="font-label-sm text-label-sm font-bold text-on-surface mb-3">شكل الأقساط المتوقع:</h4>
      <div className="flex flex-col gap-2 relative">
        <div className="absolute top-2 bottom-2 right-[9px] w-[2px] bg-outline-variant/30 rounded-full" />
        
        {Array.from({ length: Math.min(duration, 5) }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 relative z-10">
            <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-surface">
              {i + 1}
            </div>
            <div className="flex-1 bg-surface-container-lowest px-3 py-2 rounded-lg text-sm flex justify-between shadow-sm border border-outline-variant/20">
              <span className="text-on-surface-variant font-label-sm">{frequency === 'daily' ? 'بعد ' + (i+1) + ' يوم' : frequency === 'weekly' ? 'بعد ' + (i+1) + ' أسبوع' : 'بعد ' + (i+1) + ' شهر'}</span>
              <span className="font-bold text-primary font-label-sm">{Number(portion).toLocaleString('ar-IQ')} د.ع</span>
            </div>
          </div>
        ))}
        {duration > 5 && (
          <div className="pl-8 text-xs text-on-surface-variant font-label-sm pt-1">
            + {duration - 5} أقساط أخرى...
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerProfile({ customerId, onBack }) {
  const { activeCustomer, fetchCustomerProfile, addDebt, payDebt, addInstallment, payInstallmentRow, loading, triggerHaptic } = useAppStore();
  
  // Modals
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddInstallment, setShowAddInstallment] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(null);

  // Form States
  const [debtForm, setDebtForm] = useState({ amount: '', purpose: '', due_date: '' });
  const [instForm, setInstForm] = useState({ purpose: '', original_price: '', total_price_after_interest: '', down_payment: '', duration: '', frequency: 'monthly' });

  useEffect(() => {
    fetchCustomerProfile(customerId);
  }, [customerId]);

  if (loading && !activeCustomer) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!activeCustomer) return null;

  const totalDebts = activeCustomer.debts?.filter(d => d.status === 'pending').reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
  const totalInstallments = activeCustomer.installments?.filter(i => i.status === 'active')
    .reduce((sum, i) => sum + i.schedules.filter(s => s.status === 'unpaid').reduce((sSum, s) => sSum + parseFloat(s.amount_due), 0), 0) || 0;
  const totalRemaining = totalDebts + totalInstallments;

  // Build unified timeline
  const timelineItems = [];
  activeCustomer.debts?.forEach(d => {
    timelineItems.push({
      id: `debt_${d.id}`,
      type: 'debt',
      title: d.purpose || 'دين عام',
      amount: parseFloat(d.amount),
      date: d.due_date,
      status: d.status, // 'pending' or 'paid'
      rawDate: d.due_date ? new Date(d.due_date) : new Date(2100, 0, 1),
      ref: d
    });
  });
  activeCustomer.installments?.forEach(inst => {
    inst.schedules?.forEach(s => {
      timelineItems.push({
        id: `schedule_${s.id}`,
        type: 'schedule',
        title: `${inst.purpose} (قسط ${s.installment_number})`,
        amount: parseFloat(s.amount_due),
        date: s.due_date,
        status: s.status, // 'unpaid' or 'paid'
        rawDate: s.due_date ? new Date(s.due_date) : new Date(2100, 0, 1),
        ref: s
      });
    });
  });

  // Sort: Overdue first, then upcoming, then paid (if any were returned)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  timelineItems.sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'paid' || a.status === 'completed') return 1;
      if (b.status === 'paid' || b.status === 'completed') return -1;
    }
    return a.rawDate - b.rawDate;
  });

  const handleAddDebt = async () => {
    if (!debtForm.amount) return;
    const success = await addDebt({ customer_id: activeCustomer.id, ...debtForm });
    if (success) {
      setShowAddDebt(false);
      setDebtForm({ amount: '', purpose: '', due_date: '' });
    }
  };

  const handleAddInstallment = async () => {
    if (!instForm.total_price_after_interest || !instForm.duration) return;
    const success = await addInstallment({ customer_id: activeCustomer.id, ...instForm });
    if (success) {
      setShowAddInstallment(false);
      setInstForm({ purpose: '', original_price: '', total_price_after_interest: '', down_payment: '', duration: '', frequency: 'monthly' });
    }
  };

  const executePayment = async () => {
    if (!confirmPayment) return;
    
    if (confirmPayment.type === 'debt') {
      await payDebt(confirmPayment.ref.id, confirmPayment.amount);
    } else {
      await payInstallmentRow(confirmPayment.ref.id);
    }
    setConfirmPayment(null);
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-32" dir="rtl">
      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 bg-background flex flex-row-reverse justify-between items-center px-container-padding py-stack-gap h-16">
        <div className="flex items-center gap-3">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-on-surface">بروفايل الزبون</span>
          <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors active:scale-95">
            <span className="material-symbols-outlined" style={{ transform: 'rotate(180deg)' }}>arrow_back</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm bg-primary-container text-on-primary-container px-3 py-1 rounded-full">نشط</span>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container bg-primary/10 flex items-center justify-center text-primary font-bold">
            {activeCustomer.name[0]}
          </div>
        </div>
      </nav>

      <main className="pt-20 px-container-padding space-y-6">
        {/* Profile Header Section */}
        <section className="flex flex-col items-center gap-2 py-4">
          <h1 className="font-headline-lg text-headline-lg text-on-surface text-center">{activeCustomer.name}</h1>
          <div className="flex items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span className="font-body-md text-body-md" dir="ltr">{activeCustomer.phone || 'لا يوجد رقم هاتف'}</span>
          </div>
        </section>

        {/* Debt Summary Geometric Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-sm space-y-6">
          <div className="space-y-1">
            <p className="font-label-sm text-label-sm text-outline">إجمالي المديونية (المتبقي)</p>
            <h2 className="font-display-currency text-display-currency text-primary">
              {totalRemaining.toLocaleString('ar-IQ')} <span className="text-headline-lg-mobile">د.ع</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl space-y-1 border-r-4 border-error">
              <p className="font-label-sm text-label-sm text-outline">الديون العامة</p>
              <p className="font-headline-lg-mobile text-headline-lg-mobile text-error font-bold">{totalDebts.toLocaleString('ar-IQ')} د.ع</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl space-y-1 border-r-4 border-tertiary">
              <p className="font-label-sm text-label-sm text-outline">الأقساط</p>
              <p className="font-headline-lg-mobile text-headline-lg-mobile text-tertiary font-bold">{totalInstallments.toLocaleString('ar-IQ')} د.ع</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => { triggerHaptic('light'); setShowAddDebt(true); }}
            className="bg-primary-container text-on-primary-container font-headline-lg-mobile text-headline-lg-mobile py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined">add_card</span>
            <span>إضافة دين جديد</span>
          </button>
          <button 
            onClick={() => { triggerHaptic('light'); setShowAddInstallment(true); }}
            className="bg-surface-container-highest text-on-surface-variant font-headline-lg-mobile text-headline-lg-mobile py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-secondary-container transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">playlist_add</span>
            <span>إنشاء خطة أقساط</span>
          </button>
        </div>

        {/* Payment History Timeline */}
        <section className="space-y-4 pb-8">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">الجدول الزمني للدفعات</h3>
          </div>
          
          {timelineItems.length > 0 ? (
            <div className="relative timeline-line space-y-8 pr-2">
              {timelineItems.map((item) => {
                const isPaid = item.status === 'paid' || item.status === 'completed';
                const isOverdue = !isPaid && item.rawDate < today;
                
                let icon = 'event_upcoming';
                let circleClass = 'bg-surface-container-highest text-on-surface-variant';
                let amountClass = 'text-on-surface';
                
                if (isPaid) {
                  icon = 'check_circle';
                  circleClass = 'bg-primary text-white';
                  amountClass = 'text-primary';
                } else if (isOverdue) {
                  icon = 'priority_high';
                  circleClass = 'bg-error text-white';
                  amountClass = 'text-error';
                }

                return (
                  <div key={item.id} className="relative flex items-start gap-4">
                    <div className={`z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ring-4 ring-background ${circleClass}`}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div 
                      onClick={() => { 
                        if (!isPaid) {
                          triggerHaptic('light');
                          setConfirmPayment(item);
                        }
                      }}
                      className={`flex-grow p-4 rounded-2xl border transition-all ${!isPaid ? 'bg-surface-container-lowest border-outline-variant hover:border-primary/50 cursor-pointer active:scale-[0.98]' : 'bg-surface-container/50 border-outline-variant/30 opacity-70'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-headline-lg-mobile text-headline-lg-mobile ${amountClass}`}>{item.amount.toLocaleString('ar-IQ')} د.ع</span>
                        <span className="font-label-sm text-label-sm text-outline">{item.date || 'بدون تاريخ'}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-body-md text-body-md text-on-surface-variant">{item.title}</p>
                        {!isPaid && (
                          <span className="font-label-sm text-label-sm text-primary bg-primary/10 px-3 py-1 rounded-full">سداد الآن</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <p className="text-on-surface-variant font-body-md">لا توجد دفعات أو ديون حالياً.</p>
            </div>
          )}
        </section>
      </main>

      {/* Payment Confirmation Modal */}
      {confirmPayment && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl animate-fade-in-up border border-outline-variant/30">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
            <h3 className="text-center font-headline-lg text-headline-lg text-on-surface mb-2">تأكيد السداد</h3>
            <p className="text-center font-body-md text-body-md text-on-surface-variant mb-6">
              هل أنت متأكد من تسجيل سداد بقيمة <strong className="text-primary">{confirmPayment.amount.toLocaleString('ar-IQ')} د.ع</strong> لـ "{confirmPayment.title}"؟
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmPayment(null)}
                className="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface-variant font-bold hover:bg-surface-container-highest transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={executePayment}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                تأكيد السداد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showAddDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md bg-surface rounded-t-[24px] p-6 pb-safe animate-fade-in-up border-t border-outline-variant/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">إضافة دين جديد</h2>
              <button onClick={() => setShowAddDebt(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">المبلغ (دينار عراقي)</label>
                <input type="number" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md" value={debtForm.amount} onChange={e => setDebtForm({...debtForm, amount: e.target.value})} placeholder="مثال: 50000" />
              </div>
              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">الوصف / السبب (اختياري)</label>
                <input type="text" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md" value={debtForm.purpose} onChange={e => setDebtForm({...debtForm, purpose: e.target.value})} placeholder="سلفة، بضاعة..." />
              </div>
              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">تاريخ الاستحقاق (اختياري)</label>
                <input type="date" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md" value={debtForm.due_date} onChange={e => setDebtForm({...debtForm, due_date: e.target.value})} />
              </div>
              <button 
                onClick={handleAddDebt} 
                disabled={!debtForm.amount}
                className="w-full bg-primary text-on-primary font-headline-lg-mobile text-headline-lg-mobile py-4 rounded-xl mt-4 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                حفظ الدين
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Installment Modal */}
      {showAddInstallment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center overflow-hidden">
          <div className="w-full max-w-md bg-surface rounded-t-[24px] p-6 pb-safe animate-fade-in-up border-t border-outline-variant/30 max-h-[90vh] overflow-y-auto scroll-hide">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">خطة أقساط جديدة</h2>
              <button onClick={() => setShowAddInstallment(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">اسم المنتج / الوصف</label>
                <input type="text" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md" value={instForm.purpose} onChange={e => setInstForm({...instForm, purpose: e.target.value})} placeholder="مثال: آيفون 15 برو" />
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">السعر الأصلي</label>
                  <input type="number" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 font-body-md" value={instForm.original_price} onChange={e => setInstForm({...instForm, original_price: e.target.value})} />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">السعر بعد الفائدة</label>
                  <input type="number" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 font-body-md" value={instForm.total_price_after_interest} onChange={e => setInstForm({...instForm, total_price_after_interest: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">المقدمة (الواصل)</label>
                  <input type="number" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 font-body-md" value={instForm.down_payment} onChange={e => setInstForm({...instForm, down_payment: e.target.value})} />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">عدد الدفعات</label>
                  <input type="number" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 font-body-md" value={instForm.duration} onChange={e => setInstForm({...instForm, duration: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">فترة الدفع</label>
                <div className="flex gap-2 bg-surface-container-low p-1 rounded-xl">
                  {['daily', 'weekly', 'monthly'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setInstForm({...instForm, frequency: f})} 
                      className={`flex-1 py-2 font-label-sm text-label-sm rounded-lg transition-colors ${instForm.frequency === f ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      {f === 'daily' ? 'يومي' : f === 'weekly' ? 'أسبوعي' : 'شهري'}
                    </button>
                  ))}
                </div>
              </div>

              <InstallmentPreview 
                total={instForm.total_price_after_interest} 
                downPayment={instForm.down_payment} 
                duration={parseInt(instForm.duration || 0)} 
                frequency={instForm.frequency} 
              />

              <button 
                onClick={handleAddInstallment}
                disabled={!instForm.total_price_after_interest || !instForm.duration}
                className="w-full bg-primary text-on-primary font-headline-lg-mobile text-headline-lg-mobile py-4 rounded-xl mt-4 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                جدولة الأقساط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
