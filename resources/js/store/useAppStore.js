import { create } from 'zustand';
import axios from 'axios';

// Initialize base Axios instance
const api = axios.create({
  baseURL: '/api/app',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

const useAppStore = create((set, get) => ({
  user: null,
  isReady: false,
  dashboardData: null,
  activeCustomer: null,
  loading: false,
  error: null,

  initTelegram: () => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user || { id: '999999999', first_name: 'Test', last_name: 'User' }; // Fallback for local testing
      
      // Inject Telegram ID as Auth Header
      api.defaults.headers.common['X-Telegram-User-Id'] = user.id;
      api.defaults.headers.common['X-Telegram-User-Name'] = user.first_name + (user.last_name ? ' ' + user.last_name : '');

      set({ user, isReady: true });
      get().fetchDashboard();
    } else {
      // Local fallback
      api.defaults.headers.common['X-Telegram-User-Id'] = '999999999';
      set({ user: { id: '999999999', first_name: 'Local', last_name: 'Dev' }, isReady: true });
      get().fetchDashboard();
    }
  },

  triggerHaptic: (style = 'medium') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  },

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/dashboard');
      set({ dashboardData: response.data, loading: false });
    } catch (error) {
      console.error('Failed to fetch dashboard', error);
      set({ error: 'Failed to load dashboard', loading: false });
    }
  },

  fetchCustomerProfile: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/customers/${id}`);
      set({ activeCustomer: response.data, loading: false });
    } catch (error) {
      console.error('Failed to fetch customer profile', error);
      set({ error: 'Failed to load customer profile', loading: false });
    }
  },

  addCustomer: async (data) => {
    try {
      await api.post('/customers', data);
      get().triggerHaptic('success');
      await get().fetchDashboard(); // Refresh
      return true;
    } catch (error) {
      get().triggerHaptic('error');
      console.error(error);
      return false;
    }
  },

  addDebt: async (data) => {
    try {
      await api.post('/debts', data);
      get().triggerHaptic('success');
      if (get().activeCustomer) await get().fetchCustomerProfile(get().activeCustomer.id);
      await get().fetchDashboard();
      return true;
    } catch (error) {
      get().triggerHaptic('error');
      return false;
    }
  },

  payDebt: async (debtId, amount) => {
    try {
      await api.post(`/debts/${debtId}/pay`, { amount_paid: amount });
      get().triggerHaptic('success');
      if (get().activeCustomer) await get().fetchCustomerProfile(get().activeCustomer.id);
      await get().fetchDashboard();
      return true;
    } catch (error) {
      get().triggerHaptic('error');
      return false;
    }
  },

  addInstallment: async (data) => {
    try {
      await api.post('/installments', data);
      get().triggerHaptic('success');
      if (get().activeCustomer) await get().fetchCustomerProfile(get().activeCustomer.id);
      await get().fetchDashboard();
      return true;
    } catch (error) {
      get().triggerHaptic('error');
      return false;
    }
  },

  payInstallmentRow: async (scheduleId) => {
    try {
      await api.post(`/installments/schedules/${scheduleId}/pay`);
      get().triggerHaptic('medium');
      if (get().activeCustomer) await get().fetchCustomerProfile(get().activeCustomer.id);
      await get().fetchDashboard();
      return true;
    } catch (error) {
      get().triggerHaptic('error');
      return false;
    }
  }
}));

export default useAppStore;
