import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthStore,
  User,
  ApiResponse,
  UserProfileResponse,
} from '@/types/auth.types';
import { apiClient } from '@/lib/api-client';
import { getRoleFromToken, isTokenExpired } from '@/lib/jwt-utils';
import { getQueryClient } from '@/components/providers/query-provider';
import { invalidateAttemptCache } from '@/hooks/use-attempt-history';
import { useSpeakingStore } from '@/store/speaking-store';
import { useWritingStore } from '@/store/writing-store';
import { useReadingStore } from '@/store/reading-store';
import { useListeningStore } from '@/store/listening-store';
import { usePaymentStore } from '@/store/payment-store';
import { useTourStore } from '@/store/tour-store';
import { useUserStore } from '@/store/user-store';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      token: null,
      expiryTime: null,
      user: null,
      isAuthenticated: false,

      // Actions
      setAuth: async (token: string, expiryTime: string) => {
        try {
          const role = getRoleFromToken(token) || 'USER';

          // First set the token so apiClient can use it
          set({
            token,
            expiryTime: new Date(expiryTime),
            isAuthenticated: true,
          });

          // Then fetch user profile
          const response = await apiClient.get<ApiResponse<UserProfileResponse>>(
            '/users/me',
            true
          );

          if (!response.result) {
            throw new Error('Failed to fetch user profile');
          }

          const userProfile = response.result;
          const user: User = {
            email: userProfile.email,
            fullName: userProfile.full_name,
            avatarUrl: userProfile.avatar_url,
            phoneNumber: userProfile.phoneNumber,
            dateOfBirth: userProfile.dateOfBirth,
            role,
            credit: userProfile.credit ?? 0,
          };

          set({ user });
        } catch (error) {
          console.error('Failed to set auth:', error);
          get().clearAuth();
          throw error;
        }
      },

      logout: async () => {
        const { token } = get();

        if (token) {
          try {
            await apiClient.post('/auth/logout', { token }, true);
          } catch (error) {
            console.error('Logout API call failed:', error);
          }
        }

        get().clearAuth();
      },

      checkAuth: () => {
        const { token } = get();
        if (!token) return false;
        // Check actual JWT expiry
        if (isTokenExpired(token, 0)) {
          get().clearAuth();
          return false;
        }
        return true;
      },

      clearAuth: () => {
        set({
          token: null,
          expiryTime: null,
          user: null,
          isAuthenticated: false,
        });

        // Clear React Query cache to prevent cross-user data leaks
        const queryClient = getQueryClient();
        if (queryClient) {
          queryClient.clear();
        }

        // Invalidate module-level caches
        invalidateAttemptCache();

        // Reset in-memory Zustand stores (not persisted, survive logout without this)
        useSpeakingStore.getState().reset();
        useWritingStore.getState().reset();
        useReadingStore.getState().clearAll();
        useListeningStore.getState().resetPlayer();
        usePaymentStore.getState().clear();
        useTourStore.getState().stopTour();

        // Reset user-store in-memory state (skipHydration keeps memory across localStorage removal)
        useUserStore.setState({
          targetScores: { listening: 0, reading: 0, writing: 0, speaking: 0 },
          examDate: null,
          activities: [],
          placementResult: null,
        });

        // Clear persisted stores and session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('moni-user-storage');
          localStorage.removeItem('practice-progress');
          // Writing drafts are keyed per-test, not per-user — wipe all
          Object.keys(localStorage)
            .filter((k) => k.startsWith('writing-draft-'))
            .forEach((k) => localStorage.removeItem(k));
          sessionStorage.clear();
        }
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },

      refreshProfile: async () => {
        try {
          const response = await apiClient.get<ApiResponse<UserProfileResponse>>(
            '/users/me',
            true
          );
          if (!response.result) return;

          const { token } = get();
          const role = token ? (getRoleFromToken(token) || 'USER') : 'USER';
          const userProfile = response.result;

          set({
            user: {
              email: userProfile.email,
              fullName: userProfile.full_name,
              avatarUrl: userProfile.avatar_url,
              phoneNumber: userProfile.phoneNumber,
              dateOfBirth: userProfile.dateOfBirth,
              role,
              credit: userProfile.credit ?? 0,
            },
          });
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        expiryTime: state.expiryTime,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('token-refreshed', (e: Event) => {
    const customEvent = e as CustomEvent<{ token: string; expiryTime: string }>;
    useAuthStore.setState({
      token: customEvent.detail.token,
      expiryTime: new Date(customEvent.detail.expiryTime)
    });
  });

  // Cross-tab sync: khi tab khác logout/login, tab hiện tại phải đồng bộ ngay
  // để user không lỡ vào route protected bằng state cũ trong memory.
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key !== 'auth-storage') return;
    try {
      const parsed = e.newValue ? JSON.parse(e.newValue) : null;
      const newToken: string | null = parsed?.state?.token ?? null;
      const currentToken = useAuthStore.getState().token;

      // Tab khác vừa logout → clear memory tab này + hiện dialog session-expired
      if (!newToken && currentToken) {
        useAuthStore.setState({
          token: null,
          expiryTime: null,
          user: null,
          isAuthenticated: false,
        });
        window.dispatchEvent(new CustomEvent('session-expired'));
        return;
      }

      // Tab khác login user khác → reload để re-fetch toàn bộ data tương ứng
      if (newToken && currentToken && newToken !== currentToken) {
        window.location.reload();
      }
    } catch {
      /* ignore parse errors */
    }
  });
}
