import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

function InstallmentPreview({ total, downPayment, duration, frequency }) {
  const remaining = Math.max(0, parseFloat(total || 0) - parseFloat(downPayment || 0));
  const portion = duration > 0 ? (remaining / duration).toFixed(2) : 0;
  
  if (remaining <= 0 || duration <= 0) return null;

  return (
    <div className="mt-4 p-4 bg-var-tg-secondary-bg rounded-xl border border-var-tg-hint-color/10">
      <h4 className="text-sm font-bold text-var-tg-text mb-3">شكل الأقساط المتوقع:</h4>
      <div className="flex flex-col gap-2 relative">
        <div className="absolute top-2 bottom-2 right-[9px] w-[2px] bg-var-tg-hint/20 rounded-full" />
        
        {Array.from({ length: Math.min(duration, 5) }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 relative z-10">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-var-tg-secondary-bg">
              {i + 1}
            </div>
            <div className="flex-1 bg-var-tg-bg px-3 py-2 rounded-lg text-sm flex justify-between shadow-sm">
              <span className="text-var-tg-hint">{frequency === 'daily' ? 'بعد ' + (i+1) + ' يوم' : frequency === 'weekly' ? 'بعد ' + (i+1) + ' أسبوع' : 'بعد ' + (i+1) + ' شهر'}</span>
              <span className="font-bold text-var-tg-text">{Number(portion).toLocaleString('ar-IQ')} د.ع</span>
            </div>
          </div>
        ))}
        {duration > 5 && (
          <div className="pl-8 text-xs text-var-tg-hint pt-1">
            + {duration - 5} أقساط أخرى...
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerProfile({ customerId, onBack }) {
  const { activeCustomer, fetchCustomerProfile, addDebt, payDebt, addInstallment, payInstallmentRow, loading } = useAppStore();
  const [activeTab, setActiveTab] = useState('debts'); // 'debts' | 'installments'
  
  // Modals
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddInstallment, setShowAddInstallment] = useState(false);

  // Form States
  const [debtForm, setDebtForm] = useState({ amount: '', purpose: '', due_date: '' });
  const [instForm, setInstForm] = useState({ purpose: '', original_price: '', total_price_after_interest: '', down_payment: '', duration: '', frequency: 'monthly' });

  useEffect(() => {
    fetchCustomerProfile(customerId);
  }, [customerId]);

  if (loading && !activeCustomer) {
    return <div className="flex justify-center p-10"><div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>;
  }

  if (!activeCustomer) return null;

  const totalDebts = activeCustomer.debts?.filter(d => d.status === 'pending').reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
  const totalInstallments = activeCustomer.installments?.filter(i => i.status === 'active')
    .reduce((sum, i) => sum + i.schedules.filter(s => s.status === 'unpaid').reduce((sSum, s) => sSum + parseFloat(s.amount_due), 0), 0) || 0;

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

  return (
    <div className="min-h-screen bg-var-tg-bg text-var-tg-text" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 bg-var-tg-bg z-20 border-b border-var-tg-hint-color/10 pb-4">
        <div className="flex items-center gap-3 px-4 pt-4 mb-4">
          <button onClick={onBack} className="p-2 -mr-2 text-var-tg-link active:scale-95">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
            {activeCustomer.name[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">{activeCustomer.name}</h2>
            <p className="text-sm text-var-tg-hint">{activeCustomer.phone || 'بدون رقم'}</p>
          </div>
        </div>

        <div className="px-4 flex gap-2">
          <div className="flex-1 bg-var-tg-secondary-bg rounded-xl p-3 text-center">
            <p className="text-xs text-var-tg-hint mb-1">الديون المتبقية</p>
            <p className="font-bold text-red-500">{totalDebts.toLocaleString('ar-IQ')}</p>
          </div>
          <div className="flex-1 bg-var-tg-secondary-bg rounded-xl p-3 text-center">
            <p className="text-xs text-var-tg-hint mb-1">الأقساط المتبقية</p>
            <p className="font-bold text-orange-500">{totalInstallments.toLocaleString('ar-IQ')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mt-4 border-b border-var-tg-hint-color/10">
        <button 
          onClick={() => setActiveTab('debts')}
          className={`flex-1 pb-3 text-sm font-bold transition-colors ${activeTab === 'debts' ? 'text-var-tg-link border-b-2 border-var-tg-link' : 'text-var-tg-hint'}`}
        >
          الديون العامة
        </button>
        <button 
          onClick={() => setActiveTab('installments')}
          className={`flex-1 pb-3 text-sm font-bold transition-colors ${activeTab === 'installments' ? 'text-var-tg-link border-b-2 border-var-tg-link' : 'text-var-tg-hint'}`}
        >
          خطط الأقساط
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 pb-24">
        {activeTab === 'debts' && (
          <div className="flex flex-col gap-3">
            <button onClick={() => setShowAddDebt(true)} className="w-full py-3 rounded-xl bg-var-tg-link text-white font-bold mb-2 active:scale-[0.98]">
              + إضافة دين جديد
            </button>
            {activeCustomer.debts?.filter(d => d.status === 'pending').map(debt => (
              <div key={debt.id} className="bg-var-tg-secondary-bg rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-var-tg-text text-lg">{Number(debt.amount).toLocaleString('ar-IQ')} د.ع</p>
                  <p className="text-sm text-var-tg-hint">{debt.purpose || 'بدون وصف'}</p>
                  {debt.due_date && <p className="text-xs text-red-400 mt-1">تاريخ الاستحقاق: {debt.due_date}</p>}
                </div>
                <button 
                  onClick={() => payDebt(debt.id, debt.amount)}
                  className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors active:scale-90"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
              </div>
            ))}
            {activeCustomer.debts?.filter(d => d.status === 'pending').length === 0 && (
              <p className="text-center text-var-tg-hint py-8">لا توجد ديون مستحقة</p>
            )}
          </div>
        )}

        {activeTab === 'installments' && (
          <div className="flex flex-col gap-4">
            <button onClick={() => setShowAddInstallment(true)} className="w-full py-3 rounded-xl bg-var-tg-link text-white font-bold active:scale-[0.98]">
              + خطة أقساط جديدة
            </button>
            
            {activeCustomer.installments?.filter(i => i.status === 'active').map(inst => (
              <div key={inst.id} className="bg-var-tg-secondary-bg rounded-xl overflow-hidden shadow-sm border border-var-tg-hint-color/10">
                <div className="p-4 bg-var-tg-hint/5">
                  <h3 className="font-bold text-var-tg-text mb-1">{inst.purpose}</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-var-tg-hint">المتبقي:</span>
                    <span className="font-bold text-orange-500">
                      {inst.schedules.filter(s => s.status === 'unpaid').reduce((sum, s) => sum + parseFloat(s.amount_due), 0).toLocaleString('ar-IQ')} د.ع
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-var-tg-hint-color/5">
                  {inst.schedules.filter(s => s.status === 'unpaid').map(schedule => (
                    <div key={schedule.id} className="p-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-var-tg-hint/20 flex items-center justify-center text-xs font-bold text-var-tg-text">
                          {schedule.installment_number}
                        </span>
                        <div>
                          <p className="font-bold text-sm">{Number(schedule.amount_due).toLocaleString('ar-IQ')} د.ع</p>
                          <p className="text-xs text-var-tg-hint">{schedule.due_date}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => payInstallmentRow(schedule.id)}
                        className="w-8 h-8 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 active:bg-emerald-500 active:text-white transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {activeCustomer.installments?.filter(i => i.status === 'active').length === 0 && (
              <p className="text-center text-var-tg-hint py-8">لا توجد أقساط نشطة</p>
            )}
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      {showAddDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full bg-var-tg-bg rounded-t-3xl p-5 pb-10 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">إضافة دين</h2>
              <button onClick={() => setShowAddDebt(false)} className="text-var-tg-hint">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <input type="number" placeholder="المبلغ (دينار عراقي)" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={debtForm.amount} onChange={e => setDebtForm({...debtForm, amount: e.target.value})} />
              <input type="text" placeholder="الوصف / السبب (اختياري)" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={debtForm.purpose} onChange={e => setDebtForm({...debtForm, purpose: e.target.value})} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-var-tg-hint ml-2">تاريخ الاستحقاق (اختياري)</label>
                <input type="date" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={debtForm.due_date} onChange={e => setDebtForm({...debtForm, due_date: e.target.value})} />
              </div>
              <button onClick={handleAddDebt} className="w-full py-4 mt-2 rounded-xl bg-var-tg-button text-var-tg-button-text font-bold active:scale-95">حفظ الدين</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Installment Modal */}
      {showAddInstallment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end overflow-hidden">
          <div className="w-full bg-var-tg-bg rounded-t-3xl p-5 pb-10 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">خطة أقساط جديدة</h2>
              <button onClick={() => setShowAddInstallment(false)} className="text-var-tg-hint text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="اسم المنتج / الوصف" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={instForm.purpose} onChange={e => setInstForm({...instForm, purpose: e.target.value})} />
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-var-tg-hint mb-1 block">السعر الأصلي</label>
                  <input type="number" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={instForm.original_price} onChange={e => setInstForm({...instForm, original_price: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-var-tg-hint mb-1 block">السعر بعد الفائدة (الكلي)</label>
                  <input type="number" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={instForm.total_price_after_interest} onChange={e => setInstForm({...instForm, total_price_after_interest: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-var-tg-hint mb-1 block">المقدمة (الواصل)</label>
                  <input type="number" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={instForm.down_payment} onChange={e => setInstForm({...instForm, down_payment: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-var-tg-hint mb-1 block">عدد الدفعات</label>
                  <input type="number" className="w-full bg-var-tg-secondary-bg p-3 rounded-xl border-none outline-none text-var-tg-text" value={instForm.duration} onChange={e => setInstForm({...instForm, duration: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs text-var-tg-hint mb-1 block">فترة الدفع</label>
                <div className="flex gap-2 bg-var-tg-secondary-bg p-1 rounded-xl">
                  {['daily', 'weekly', 'monthly'].map(f => (
                    <button key={f} onClick={() => setInstForm({...instForm, frequency: f})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${instForm.frequency === f ? 'bg-var-tg-bg text-var-tg-link shadow-sm' : 'text-var-tg-hint'}`}>
                      {f === 'daily' ? 'يومي' : f === 'weekly' ? 'أسبوعي' : 'شهري'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Preview */}
              <InstallmentPreview 
                total={instForm.total_price_after_interest} 
                downPayment={instForm.down_payment} 
                duration={parseInt(instForm.duration || 0)} 
                frequency={instForm.frequency} 
              />

              <button onClick={handleAddInstallment} className="w-full py-4 mt-4 rounded-xl bg-var-tg-button text-var-tg-button-text font-bold active:scale-95 shadow-lg shadow-var-tg-button/30">
                تأكيد وجدولة الأقساط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
