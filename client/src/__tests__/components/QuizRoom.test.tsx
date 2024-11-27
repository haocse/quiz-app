import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizRoom } from '../../components/QuizRoom';
import { api } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import React from 'react';

jest.mock('../../utils/api');
jest.mock('react-hot-toast');

const mockQuiz = {
  title: 'Test Quiz',
  questions: [
    {
      question: 'Question 1',
      options: ['A', 'B', 'C', 'D']
    }
  ]
};

describe('QuizRoom', () => {
  let mockWebSocket: any;

  beforeEach(() => {
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn()
    };
    
    (global as any).WebSocket = jest.fn().mockImplementation(() => mockWebSocket);
    (api.getQuiz as jest.Mock).mockResolvedValue(mockQuiz);
  });

  it('renders quiz room and handles answers', async () => {
    const mockOnExit = jest.fn();
    
    render(
      <AuthContext.Provider value={{ user: { id: 1, username: 'testuser' } } as any}>
        <QuizRoom quizCode="ABC123" onExit={mockOnExit} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    // Test answering a question
    fireEvent.click(screen.getByText('A'));
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"answer"')
    );
  });

  it('handles websocket messages correctly', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 1, username: 'testuser' } } as any}>
        <QuizRoom quizCode="ABC123" onExit={() => {}} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      // Simulate receiving leaderboard update
      const message = {
        type: 'leaderboard',
        data: [{ username: 'testuser', score: 10 }]
      };
      mockWebSocket.onmessage({ data: JSON.stringify(message) });
      
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('shows completion dialog for finished quiz', async () => {
    const mockQuizWithParticipation = {
      ...mockQuiz,
      participations: [{
        user: { username: 'testuser' },
        answers: ['A']
      }]
    };
    (api.getQuiz as jest.Mock).mockResolvedValue(mockQuizWithParticipation);
    
    render(
      <AuthContext.Provider value={{ user: { username: 'testuser' } } as any}>
        <QuizRoom quizCode="ABC123" onExit={() => {}} />
      </AuthContext.Provider>
    );

    // Mock user choosing not to retry
    window.confirm = jest.fn(() => false);

    await waitFor(() => {
      expect(screen.getByText('Quiz Completed')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });
});