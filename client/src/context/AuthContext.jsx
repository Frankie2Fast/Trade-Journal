import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const AUTH_KEY  = 'tj_logged_in';
const USER_KEY  = 'tj_username';
const PASS_KEY  = 'tj_password';
const SETUP_KEY = 'tj_setup_done';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_KEY) === 'true'
  );
  const [isFirstRun, setIsFirstRun] = useState(
    () => !localStorage.getItem(SETUP_KEY)
  );

  const _getCreds = () => ({
    username: localStorage.getItem(USER_KEY) || '',
    password: localStorage.getItem(PASS_KEY) || '',
  });

  const getUsername = () => localStorage.getItem(USER_KEY) || '';

  const login = (username, password) => {
    const { username: u, password: p } = _getCreds();
    if (username === u && password === p) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const setupAccount = (username, password) => {
    localStorage.setItem(USER_KEY, username);
    localStorage.setItem(PASS_KEY, password);
    localStorage.setItem(SETUP_KEY, 'true');
    localStorage.setItem(AUTH_KEY, 'true');
    setIsFirstRun(false);
    setIsAuthenticated(true);
  };

  // Returns { success: true } or { success: false, error: string }
  const changeCredentials = (currentPassword, { newUsername, newPassword } = {}) => {
    const { password: storedPw } = _getCreds();
    if (currentPassword !== storedPw) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    if (newUsername) localStorage.setItem(USER_KEY, newUsername);
    if (newPassword) localStorage.setItem(PASS_KEY, newPassword);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isFirstRun,
      login, setupAccount, changeCredentials, getUsername, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
