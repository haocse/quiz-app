import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import React from 'react';

const mockLogout = jest.fn();

describe('Header', () => {
  it('renders logo and title', () => {
    render(
      <AuthContext.Provider value={{ user: null, isAuthenticated: false } as any}>
        <Header />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  it('shows user info when logged in', () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout, isAuthenticated: true } as any}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    render(
      <AuthContext.Provider value={{ user: mockUser, logout: mockLogout, isAuthenticated: true } as any}>
        <Header />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTitle('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });
});