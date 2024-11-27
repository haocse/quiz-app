import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, Power, Copy, Edit } from 'lucide-react';
import type { User } from '../types';

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

interface QuizListProps {
    onEditQuiz?: (quizId: number) => void;
}

export const QuizList: React.FC<QuizListProps> = ({ onEditQuiz }) => {
    const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    // Add type guard for admin check
    const isAdmin = (user: User | null): user is User & { isAdmin: true } => {
        return Boolean(user?.isAdmin);
    };

    const loadQuizzes = async () => {
        try {
            const data = await api.getQuizzes();
            setQuizzes(data);
        } catch (error) {
            toast.error('Failed to load quizzes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadQuizzes();
    }, []);

    const handleToggleStatus = async (quizId: number) => {
        try {
            const { isActive } = await api.toggleQuizStatus(quizId);
            setQuizzes(quizzes.map(quiz => 
                quiz.id === quizId ? { ...quiz, isActive } : quiz
            ));
            toast.success(`Quiz ${isActive ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error('Failed to update quiz status');
        }
    };

    const copyQuizCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Quiz code copied to clipboard');
    };

    const handleEditQuiz = (quizId: number) => {
        if (onEditQuiz) {
            onEditQuiz(quizId);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return <div className="text-center py-8">Loading quizzes...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Available Quizzes</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {quizzes.map(quiz => (
                    <div 
                        key={quiz.id}
                        className={`bg-white rounded-lg shadow-md p-6 ${
                            !quiz.isActive ? 'opacity-75' : ''
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold">{quiz.title}</h3>
                            {isAdmin(user) && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditQuiz(quiz.id)}
                                        className="p-2 rounded-full text-blue-600 hover:bg-blue-50"
                                        title="Edit quiz"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(quiz.id)}
                                        className={`p-2 rounded-full ${
                                            quiz.isActive 
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-gray-400 hover:bg-gray-50'
                                        }`}
                                        title={quiz.isActive ? 'Deactivate quiz' : 'Activate quiz'}
                                    >
                                        <Power size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-600 mb-4">{quiz.description}</p>

                        <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{formatDate(quiz.createdAt)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>{quiz.participantCount} participants</span>
                            </div>

                            {quiz.isActive && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <code className="bg-gray-100 px-2 py-1 rounded">
                                        {quiz.code}
                                    </code>
                                    <button
                                        onClick={() => copyQuizCode(quiz.code)}
                                        className="p-2 text-gray-500 hover:text-gray-700"
                                        title="Copy quiz code"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {quizzes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No quizzes available yet
                </div>
            )}
        </div>
    );
};