import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  agencyId: string;
  bio?: string;
  phone?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  currencyFormat: 'IN' | 'INTL';
  _hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setCurrencyFormat: (format: 'IN' | 'INTL') => void;
  logout: () => void;
  setHasHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      currencyFormat: 'IN',
      _hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setCurrencyFormat: (currencyFormat) => set({ currencyFormat }),
      logout: () => {
        localStorage.removeItem('adrex_token');
        set({ user: null, isAuthenticated: false });
      },
      setHasHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'adrex-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, currencyFormat: state.currencyFormat }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      },
    }
  )
);
