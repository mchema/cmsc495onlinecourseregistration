/* 
v.2 
-checks the live session on app load with /api/auth/me
-stores auth state in React only
-supports firstLogin
-normalizes role values like ADMIN and STUDENT
*/ 

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firstLogin, setFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await client.get('/user/me');
      const authUser = data?.User || data?.user || null;

      if (authUser) {
        setUser({
          ...authUser,
          role: normalizeRole(authUser.role),
        });
        setFirstLogin(Boolean(authUser.firstLogin ?? data?.firstLogin ?? false));
      } else {
        setUser(null);
        setFirstLogin(false);
      }
    } catch (error) {
      setUser(null);
      setFirstLogin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = ({ user: userData, firstLogin: firstLoginFlag = false }) => {
    const normalizedUser = {
      ...userData,
      role: normalizeRole(userData?.role),
    };

    setUser(normalizedUser);
    setFirstLogin(Boolean(firstLoginFlag));
  };

  const logout = async () => {
    try {
      await client.get('/user/logout');
    } catch (error) {
      // Even if backend logout fails, clear frontend auth state
    } finally {
      setUser(null);
      setFirstLogin(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      firstLogin,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }),
    [user, firstLogin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}


/*v.1 restores user only from localStorage
stores token in localStorage
never asks the backend whether the session is still valid

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Rehydrate user from localStorage on page refresh
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}*/