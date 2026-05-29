import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  // workspaceRole is a PREVIEW-ONLY field — never mutates user.role
  // Used by sidebar to preview what another role would see
  workspaceRole: string | null;
  _hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setCurrencyFormat: (format: 'IN' | 'INTL') => void;
  setWorkspaceRole: (role: string | null) => void;
  logout: () => void;
  setHasHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      currencyFormat: 'IN',
      workspaceRole: null,
      _hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setCurrencyFormat: (currencyFormat) => set({ currencyFormat }),
      // Preview a workspace role without touching user.role
      setWorkspaceRole: (workspaceRole) => set({ workspaceRole }),
      logout: () => {
        localStorage.removeItem('adrex_token');
        set({ user: null, isAuthenticated: false, workspaceRole: null });
      },
      setHasHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'adrex-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currencyFormat: state.currencyFormat,
        // workspaceRole intentionally NOT persisted — resets to null on refresh
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      },
    }
  )
);
