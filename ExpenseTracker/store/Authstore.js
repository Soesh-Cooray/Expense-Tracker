import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const useAuthStore = create((set) => ({
  user: null,
  token: null,

  // Action to save user data and token after login
  login: async (userData, token) => {
    // Save token securely on the device
    await SecureStore.setItemAsync('userToken', token);
    set({ user: userData, token: token });
  },

  updateUser: (userData) => set((state) => ({
    user: state.user ? { ...state.user, ...userData } : userData,
  })),

  // Action to clear state on logout
  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    set({ user: null, token: null });
  },

  // Action to reload token if the app restarts
  restoreToken: async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) set({ token: token });
  },
}));

export default useAuthStore;