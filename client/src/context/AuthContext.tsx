import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, User } from '../types';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string, remember: boolean) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.checkAuth();
        setState({
          user: userData,
          isAuthenticated: true,
        });
      } catch (error) {
        setState({
          user: null,
          isAuthenticated: false,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (identifier: string, password: string, remember: boolean): Promise<boolean> => {
    try {
      const loginData = {
        [identifier.includes('@') ? 'email' : 'username']: identifier,
        password,
        rememberMe: remember,
      };

      const userData = await api.login(loginData);
      const authState = { 
        user: userData,
        isAuthenticated: true 
      };
      
      setState(authState);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error('Invalid credentials');
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      await api.register({ username, email, password, isAdmin: false });
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setState({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};