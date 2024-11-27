import { render, act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import React from 'react';

jest.mock('../../utils/api');

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock checkAuth to reject instead of resolve with null
    (api.checkAuth as jest.Mock).mockRejectedValue(new Error('Not authenticated'));
  });

  it('provides authentication state', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    let result: any;
    await act(async () => {
      const hook = renderHook(() => useAuth(), { wrapper });
      result = hook.result;
      // Wait for the checkAuth promise to reject
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('handles login successfully', async () => {
    const mockUser = { username: 'testuser', email: 'test@example.com' };
    (api.login as jest.Mock).mockResolvedValueOnce(mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('testuser', 'password123', false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('handles logout successfully', async () => {
    (api.logout as jest.Mock).mockResolvedValueOnce({ success: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });
});