import { api } from '../../utils/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Utils', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('auth endpoints', () => {
    it('login makes correct API call', async () => {
      const mockResponse = { username: 'testuser', email: 'test@example.com' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.login({
        username: 'testuser',
        password: 'password123',
        rememberMe: false
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123',
            rememberMe: false,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('register makes correct API call', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User created successfully' }),
      });

      await api.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
    });

    it('checkAuth makes correct API call', async () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await api.checkAuth();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('logout makes correct API call', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await api.logout();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  describe('error handling', () => {
    it('throws error when API call fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(api.login({
        username: 'testuser',
        password: 'wrong',
        rememberMe: false
      }))
        .rejects
        .toThrow('Invalid credentials');  // Changed from 'Failed to login'
    });
    
  });
});