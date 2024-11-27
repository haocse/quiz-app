import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateQuiz } from '../../components/CreateQuiz';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';

// Mock the dependencies
jest.mock('../../utils/api');
jest.mock('react-hot-toast');

describe('CreateQuiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create quiz form', () => {
    render(<CreateQuiz />);
    
    expect(screen.getByRole('heading', { name: 'Create Quiz' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Quiz Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Quiz Description')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add Question' })).toBeInTheDocument();
  });

  it('adds a question when all fields are filled', () => {
    render(<CreateQuiz />);
    
    // Fill in question details
    fireEvent.change(screen.getByPlaceholderText('Question'), {
      target: { value: 'Test Question' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), {
      target: { value: 'Option 1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 2'), {
      target: { value: 'Option 2' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 3'), {
      target: { value: 'Option 3' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 4'), {
      target: { value: 'Option 4' },
    });
    
    // Add question
    fireEvent.click(screen.getByRole('button', { name: 'Add Question' }));
    
    // Verify question was added
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('shows error when trying to add incomplete question', () => {
    render(<CreateQuiz />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Add Question' }));
    
    expect(toast.error).toHaveBeenCalledWith('Please fill in all fields');
  });

  it('creates new quiz successfully', async () => {
    (api.createQuiz as jest.Mock).mockResolvedValue({ id: 1, code: "ABC123" }); // Add code to mock response
    
    render(<CreateQuiz />);
    
    // Fill in quiz details
    fireEvent.change(screen.getByPlaceholderText('Quiz Title'), {
      target: { value: 'Test Quiz' },
    });
    fireEvent.change(screen.getByPlaceholderText('Quiz Description'), {
      target: { value: 'Test Description' },
    });
    
    // Fill in and add a question first
    fireEvent.change(screen.getByPlaceholderText('Question'), {
      target: { value: 'Test Question' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), {
      target: { value: 'Option 1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 2'), {
      target: { value: 'Option 2' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 3'), {
      target: { value: 'Option 3' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 4'), {
      target: { value: 'Option 4' },
    });
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Add Question' }));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Quiz' }));
    
    // Wait for the async operation to complete
    await screen.findByText('Test Question');
    
    // Verify success message
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Quiz created!'));
  });

  
});