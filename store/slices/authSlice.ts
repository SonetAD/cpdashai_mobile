import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: 'candidate' | 'recruiter';
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken: string }>
    ) => {
      console.log('Redux: setCredentials called');
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      console.log('Redux: Auth state updated, isAuthenticated:', true);
    },
    updateTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>
    ) => {
      console.log('Redux: updateTokens called');
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    },
    logout: (state) => {
      console.log('Redux: logout called');
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    setUserRole: (state, action: PayloadAction<'candidate' | 'recruiter'>) => {
      if (state.user) {
        console.log('Redux: setUserRole called');
        state.user.role = action.payload;
      }
    },
  },
});

export const { setCredentials, updateTokens, logout, setUserRole } = authSlice.actions;
export default authSlice.reducer;
