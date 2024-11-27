import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '../../components/AuthForm';
import { AuthContext } from '../../context/AuthContext';
import React from 'react';

const mockLogin = jest.fn();
const mockRegister = jest.fn();

describe('AuthForm', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockRegister.mockClear();
  });

  it('renders login form by default', () => {
    render(
      <AuthContext.Provider value={{ login: mockLogin, register: mockRegister } as any}>
        <AuthForm />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username or Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('switches to registration form', async () => {
    render(
      <AuthContext.Provider value={{ login: mockLogin, register: mockRegister } as any}>
        <AuthForm />
      </AuthContext.Provider>
    );
  
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
  
    // Change this line to be more specific
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('submits login form', async () => {
    mockLogin.mockResolvedValueOnce(true);

    render(
      <AuthContext.Provider value={{ login: mockLogin, register: mockRegister } as any}>
        <AuthForm />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText('Username or Email'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123', false);
    });
  });

  it('submits registration form', async () => {
    mockRegister.mockResolvedValueOnce(true);

    render(
      <AuthContext.Provider value={{ login: mockLogin, register: mockRegister } as any}>
        <AuthForm />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
    });
  });
});