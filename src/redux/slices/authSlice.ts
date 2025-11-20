import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type User = {
  id: string;
  email?: string;
  name?: string;
} | null;

type AuthState = {
  isAuthenticated: boolean;   // true if logged in OR guest
  isGuest: boolean;           // true if skipped (guest session)
  user: User;                 // null for guest
};

const initialState: AuthState = {
  isAuthenticated: false,
  isGuest: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<User>) {
      state.isAuthenticated = true;
      state.isGuest = false;
      state.user = action.payload;
    },
    startGuestSession(state) {
      state.isAuthenticated = true;
      state.isGuest = true;
      state.user = null; // important: no user id on skip
    },
    logout(state) {
      state.isAuthenticated = false;
      state.isGuest = false;
      state.user = null;
    },
  },
});

export const { loginSuccess, startGuestSession, logout } = authSlice.actions;
export default authSlice.reducer;
