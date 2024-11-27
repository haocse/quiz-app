import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizList } from '../../components/QuizList';
import { api } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import React from 'react';

jest.mock('../../utils/api');
jest.mock('react-hot-toast');

const mockQuizzes = [
  {
    id: 1,
    title: 'Test Quiz',
    description: 'Test Description',
    code: 'ABC123',
    isActive: true,
    createdAt: '2024-01-01T12:00:00Z',
    creatorName: 'testuser',
    participantCount: 5
  }
];

describe('QuizList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getQuizzes as jest.Mock).mockResolvedValue(mockQuizzes);
  });

  it('renders quiz list', async () => {
    render(
      <AuthContext.Provider value={{ user: null } as any}>
        <QuizList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('5 participants')).toBeInTheDocument();
    });
  });

  it('copies quiz code to clipboard', async () => {
    const mockClipboard = {
      writeText: jest.fn()
    };
    Object.assign(navigator, {
      clipboard: mockClipboard
    });

    render(
      <AuthContext.Provider value={{ user: null } as any}>
        <QuizList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Copy quiz code'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
      expect(toast.success).toHaveBeenCalledWith('Quiz code copied to clipboard');
    });
  });
});