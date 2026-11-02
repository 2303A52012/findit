import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('findit_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Sync and verify current user with the server on startup
  useEffect(() => {
    const token = localStorage.getItem('findit_token');
    if (token) {
      api
        .get('/auth/me')
        .then(({ data }) => {
          if (data.user) {
            localStorage.setItem('findit_user', JSON.stringify(data.user));
            setUser(data.user);
          }
        })
        .catch(() => {
          // Token is invalid, expired, or user deleted -> clear stale session
          localStorage.removeItem('findit_token');
          localStorage.removeItem('findit_user');
          setUser(null);
        });
    }
  }, []);

  async function register(values) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', values);
      saveSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function registerModerator(values) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register-moderator', values);
      saveSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function login(values) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      saveSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function saveSession(data) {
    localStorage.setItem('findit_token', data.token);
    localStorage.setItem('findit_user', JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('findit_token');
    localStorage.removeItem('findit_user');
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, register, registerModerator, login, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
