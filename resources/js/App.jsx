import React, { useEffect, useState } from 'react';
import useAppStore from './store/useAppStore';

/* ─── Hero Balance Component ───────────────────────────────── */
function BalanceHero({ user, onAction }) {
  return (
    <div className="flex flex-col items-center pt-8 pb-6 px-4">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-var-tg-secondary-bg mb-4 shadow-sm ring-1 ring-var-tg-hint-color/20 flex items-center justify-center">
        {user?.photo_url ? (
          <img src={user.photo_url} alt="User Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-var-tg-text">
            {(user?.first_name?.[0] || '?').toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-var-tg-hint font-medium text-sm mb-1">Total Balance</p>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-5xl font-black text-var-tg-text tracking-tight">$1,250</span>
        <span className="text-xl font-bold text-var-tg-hint">.00</span>
      </div>

      <div className="flex w-full max-w-sm justify-center gap-4">
        <button
          onClick={() => onAction('send')}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </div>
          <span className="text-xs font-semibold text-var-tg-text">Send</span>
        </button>

        <button
          onClick={() => onAction('receive')}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </div>
          <span className="text-xs font-semibold text-var-tg-text">Receive</span>
        </button>

        <button
          onClick={() => onAction('history')}
          className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-var-tg-secondary-bg text-var-tg-text flex items-center justify-center shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span className="text-xs font-semibold text-var-tg-text">History</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Search Bar ───────────────────────────────────────────── */
function SearchBar({ value, onChange }) {
  return (
    <div className="sticky top-0 z-20 bg-var-tg-bg px-4 py-3 border-b border-var-tg-hint-color/10">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-var-tg-hint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search assets..."
          className="w-full pl-10 pr-4 py-2.5 bg-var-tg-secondary-bg border-none rounded-xl text-var-tg-text placeholder-var-tg-hint focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-[15px]"
        />
      </div>
    </div>
  );
}

/* ─── Asset List Item ──────────────────────────────────────── */
function AssetItem({ icon, name, symbol, balance, fiat, change }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-var-tg-secondary-bg transition-colors cursor-pointer border-b border-var-tg-hint-color/5 last:border-0 active:scale-[0.98]">
      <div className="flex items-center gap-3.5">
        <div className="text-3xl w-10 h-10 flex items-center justify-center bg-var-tg-secondary-bg rounded-full">{icon}</div>
        <div>
          <h3 className="text-[16px] font-semibold text-var-tg-text leading-tight mb-0.5">{name}</h3>
          <p className="text-[13px] text-var-tg-hint font-medium">{symbol}</p>
        </div>
      </div>
      <div className="text-right">
        <h3 className="text-[16px] font-semibold text-var-tg-text leading-tight mb-0.5">{balance}</h3>
        <p className="text-[13px] text-var-tg-hint font-medium">
          ${fiat} <span className={change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}>{change}</span>
        </p>
      </div>
    </div>
  );
}

/* ─── Main App ─────────────────────────────────────────────── */
export default function App() {
  const { user, isReady, initTelegram, triggerHaptic } = useAppStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    initTelegram();
    // Inject Telegram Theme Variables into CSS
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

  const handleAction = (action) => {
    triggerHaptic('light');
    console.log('Action clicked:', action);
  };

  const assets = [
    { id: 1, icon: '💎', name: 'Toncoin', symbol: 'TON', balance: '145.2', fiat: '750.00', change: '+2.4%' },
    { id: 2, icon: '💵', name: 'Tether', symbol: 'USDT', balance: '300.00', fiat: '300.00', change: '+0.01%' },
    { id: 3, icon: '🚀', name: 'Bitcoin', symbol: 'BTC', balance: '0.005', fiat: '200.00', change: '-1.2%' },
    { id: 4, icon: '🐹', name: 'Hamster Kombat', symbol: 'HMSTR', balance: '1,500,000', fiat: '0.00', change: '+0%' },
  ];

  const filteredAssets = assets.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol.toLowerCase().includes(search.toLowerCase())
  );

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-var-tg-bg">
        <div className="w-8 h-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-var-tg-bg text-var-tg-text font-sans antialiased" dir="ltr">
      <BalanceHero user={user} onAction={handleAction} />
      <SearchBar value={search} onChange={setSearch} />
      
      <div className="pb-8">
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => <AssetItem key={asset.id} {...asset} />)
        ) : (
          <div className="py-12 text-center text-var-tg-hint">
            <p>No assets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
