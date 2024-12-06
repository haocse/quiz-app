import React, { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { useAuth } from './context/AuthContext';
import { CreateQuiz } from './components/CreateQuiz';
import { QuizRoom } from './components/QuizRoom';
import { QuizList } from './components/QuizList';
import { api } from './utils/api';
import type { User } from './types';  

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [quizCode, setQuizCode] = useState<string>('');
  const [joinedQuizCode, setJoinedQuizCode] = useState<string>('');
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null);

  // Type guard for checking admin status
  const isAdmin = (user: User | null): user is User & { isAdmin: true } => {
    return Boolean(user?.isAdmin);
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      (document.getElementById('auth-modal') as HTMLDialogElement)?.close();
    }
  }, [isAuthenticated]);

  const handleEditQuiz = useCallback(async (quizId: number) => {
    if (!isAdmin(user)) return;
    try {
      const quiz = await api.getQuizForEdit(quizId);
      setQuizToEdit(quiz);
    } catch (error) {
      console.error('Failed to fetch quiz for editing:', error);
    }
  }, [user]);

  const handleJoinQuiz = useCallback(async () => {
    try {
      const response = await fetch(`/api/quiz/${quizCode}`);
      if (!response.ok) {
        throw new Error('Quiz not found or inactive');
      }
      setJoinedQuizCode(quizCode);
    } catch (error) {
      console.error('Failed to join quiz:', error);
    }
  }, [quizCode]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          <>
            {isAdmin(user) && (
              <div className="mb-8">
                <CreateQuiz 
                  quizToEdit={quizToEdit}
                  onComplete={() => {
                    setQuizToEdit(null);
                    window.location.reload();
                  }}
                />
              </div>
            )}
            
            {!joinedQuizCode && (
              <>
                <div className="mb-8">
                  <QuizList onEditQuiz={handleEditQuiz} />
                </div>
                
                {!isAdmin(user) && (
                  <div className="flex gap-4 mb-8">
                    <input
                      type="text"
                      placeholder="Enter Quiz Code"
                      value={quizCode}
                      onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                      className="p-2 border rounded"
                    />
                    <button
                      onClick={handleJoinQuiz}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Join Quiz
                    </button>
                  </div>
                )}
              </>
            )}
            {joinedQuizCode && (
              <QuizRoom 
                quizCode={joinedQuizCode} 
                onExit={() => setJoinedQuizCode('')}
              />
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Please sign in to access the quiz system
            </h2>
            <div className="bg-blue-100 p-4 rounded mb-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                Admin account details:<br/>
                Username: admin<br/>
                Password: Admin@123<br/>
                Email: admin@example.com
              </p>
              <hr className="my-2 border-blue-200"/>
              <p className="text-sm text-blue-800">
                Test user accounts:<br/>
                Username: user1<br/>
                Password: User1@123<br/>
                Email: user1@example.com
                <br/><br/>
                Username: user2<br/>
                Password: User2@123<br/>
                Email: user2@example.com
              </p>
            </div>
            <button
              onClick={() => (document.getElementById('auth-modal') as HTMLDialogElement)?.showModal()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              Sign in
            </button>
          </div>
        )}
        <dialog id="auth-modal" className="rounded-lg shadow-xl p-0">
          <div className="p-4">
            <button
              onClick={() => (document.getElementById('auth-modal') as HTMLDialogElement)?.close()}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <AuthForm />
          </div>
        </dialog>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;