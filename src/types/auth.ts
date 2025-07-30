export interface LineUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}

export interface AuthState {
  user: LineUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => void;
  clearError: () => void;
}

export interface LineLoginConfig {
  channelId: string;
  redirectUri: string;
  scope: string;
}