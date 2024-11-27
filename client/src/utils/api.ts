interface LoginData {
    username?: string;
    email?: string;
    password: string;
    rememberMe?: boolean;
  }
  
  interface RegisterData {
    username: string;
    email: string;
    password: string;
    isAdmin?: boolean;
  }

  interface CreateQuizData {
    title: string;
    description: string;
    questions: {
        question: string;
        options: string[];
        correctAnswer: number;
    }[];
  }

  interface QuizListItem {
    id: number;
    title: string;
    description: string;
    code: string;
    isActive: boolean;
    createdAt: string;
    creatorName: string;
    participantCount: number;
  }

  interface UpdateQuizData extends CreateQuizData {
      id: number;
  }

  interface User {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
}

  const API_URL = 'http://localhost:81/api';
  
  
  export const api = {
    async login(data: LoginData): Promise<User> {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      return response.json();
    },
  
    async register(data: RegisterData) {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details?.[0]?.message || 'Registration failed');
      }
  
      return response.json();
    },
  
    async logout() {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Logout failed');
      }
  
      return response.json();
    },

    async checkAuth(): Promise<User> {
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include',
        });
        
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        
        return response.json();
    },

    async createQuiz(data: CreateQuizData) {
        const response = await fetch(`${API_URL}/quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details?.[0]?.message || 'Failed to create quiz');
        }

        return response.json();
    },

    async getQuiz(code: string) {
        const response = await fetch(`${API_URL}/quiz/${code}`, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch quiz');
        }

        return response.json();
    },

    async getQuizzes(): Promise<QuizListItem[]> {
      const response = await fetch(`${API_URL}/quiz`, {
          credentials: 'include',
      });

      if (!response.ok) {
          throw new Error('Failed to fetch quizzes');
      }

      return response.json();
    },

    async toggleQuizStatus(quizId: number): Promise<{ isActive: boolean }> {
        const response = await fetch(`${API_URL}/quiz/${quizId}/toggle-status`, {
            method: 'PATCH',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to toggle quiz status');
        }

        return response.json();
    }, 
    async updateQuiz(data: UpdateQuizData) {
      const response = await fetch(`${API_URL}/quiz/${data.id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
      });

      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details?.[0]?.message || 'Failed to update quiz');
      }

      return response.json();
    },

    async getQuizForEdit(id: number) {
        const response = await fetch(`${API_URL}/quiz/${id}/edit`, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch quiz');
        }

        return response.json();
    },
  };