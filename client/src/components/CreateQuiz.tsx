import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';

interface Question {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface CreateQuizProps {
    quizToEdit?: {
        id: number;
        title: string;
        description: string;
        questions: Question[];
    };
    onComplete?: () => void;
}

export const CreateQuiz: React.FC<CreateQuizProps> = ({ quizToEdit, onComplete }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState(0);

    // Load quiz data when editing
    useEffect(() => {
        if (quizToEdit) {
            setTitle(quizToEdit.title);
            setDescription(quizToEdit.description);
            setQuestions(quizToEdit.questions);
        }
    }, [quizToEdit]);

    const addQuestion = () => {
        if (!currentQuestion || options.some(opt => !opt)) {
            toast.error('Please fill in all fields');
            return;
        }

        setQuestions([...questions, {
            question: currentQuestion,
            options: [...options],
            correctAnswer
        }]);

        // Reset form
        setCurrentQuestion('');
        setOptions(['', '', '', '']);
        setCorrectAnswer(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (questions.length === 0) {
            toast.error('Add at least one question');
            return;
        }

        try {
            if (quizToEdit) {
                // Update existing quiz
                await api.updateQuiz({
                    id: quizToEdit.id,
                    title,
                    description,
                    questions
                });
                toast.success('Quiz updated successfully');
            } else {
                // Create new quiz
                const response = await api.createQuiz({
                    title,
                    description,
                    questions
                });
                toast.success(`Quiz created! Code: ${response.quizCode}`);
            }
            
            // Reset form and notify parent
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            toast.error(quizToEdit ? 'Failed to update quiz' : 'Failed to create quiz');
        }
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">
                {quizToEdit ? 'Edit Quiz' : 'Create Quiz'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="Quiz Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <textarea
                        placeholder="Quiz Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div className="border p-4 rounded">
                    <h3 className="font-semibold mb-2">Add Question</h3>
                    <input
                        type="text"
                        placeholder="Question"
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                    />

                    {options.map((option, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => {
                                    const newOptions = [...options];
                                    newOptions[index] = e.target.value;
                                    setOptions(newOptions);
                                }}
                                className="flex-1 p-2 border rounded"
                            />
                            <input
                                type="radio"
                                name="correctAnswer"
                                checked={correctAnswer === index}
                                onChange={() => setCorrectAnswer(index)}
                            />
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Question
                    </button>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold">Questions ({questions.length})</h3>
                    {questions.map((q, i) => (
                        <div key={i} className="border p-2 rounded flex justify-between items-start">
                            <div className="flex-1">
                                <p className="font-medium">{q.question}</p>
                                <ul className="ml-4">
                                    {q.options.map((opt, j) => (
                                        <li 
                                            key={j} 
                                            className={j === q.correctAnswer ? 'text-green-600' : ''}
                                        >
                                            {opt}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeQuestion(i)}
                                className="text-red-500 hover:text-red-700 px-2"
                                title="Remove question"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    {quizToEdit ? 'Update Quiz' : 'Create Quiz'}
                </button>
            </form>
        </div>
    );
};