import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import useFinanceStore from './financeStore';

const USER_TOKEN_KEY = 'userToken';
const USER_PROFILE_KEY = 'userProfile';

const useAuthStore = create((set) => ({
  user: null,
  token: null,

  // Action to save user data and token after login
  login: async (userData, token) => {
    await SecureStore.setItemAsync(USER_TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(userData || {}));
    set({ user: userData, token: token });
  },

  updateUser: async (userData) => {
    const currentUser = useAuthStore.getState().user;
    const nextUser = currentUser ? { ...currentUser, ...userData } : userData;
    await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(nextUser || {}));
    set({ user: nextUser });
  },

  // Action to clear state on logout
  logout: async () => {
    await SecureStore.deleteItemAsync(USER_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
    useFinanceStore.getState().resetFinanceMetrics();
    set({ user: null, token: null });
  },

  // Action to reload token if the app restarts
  restoreToken: async () => {
    const [token, savedUser] = await Promise.all([
      SecureStore.getItemAsync(USER_TOKEN_KEY),
      SecureStore.getItemAsync(USER_PROFILE_KEY),
    ]);

    let parsedUser = null;
    if (savedUser) {
      try {
        parsedUser = JSON.parse(savedUser);
      } catch {
        parsedUser = null;
      }
    }

    if (token || parsedUser) {
      set({ token: token || null, user: parsedUser });
    }
  },
}));

export default useAuthStore;