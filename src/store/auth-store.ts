import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthStore,
  User,
  ApiResponse,
  UserProfileResponse,
} from '@/types/auth.types';
import { apiClient } from '@/lib/api-client';

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
          };

          set({
            user,
          });
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
            // Continue with local logout even if API fails
          }
        }

        get().clearAuth();
      },

      checkAuth: () => {
        const { token, expiryTime } = get();

        if (!token || !expiryTime) {
          return false;
        }

        // Check if token expired
        const now = new Date();
        if (now >= expiryTime) {
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
      },
    }),
    {
      name: 'auth-storage',
      // Only persist specific fields
      partialize: (state) => ({
        token: state.token,
        expiryTime: state.expiryTime,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
