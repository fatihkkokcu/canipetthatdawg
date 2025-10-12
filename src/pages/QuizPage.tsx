import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Check, X, RotateCcw, Trophy, Target } from 'lucide-react';
import { animals } from '../data/animals';
import { Animal } from '../types/Animal';

interface QuizState {
  currentAnimal: Animal | null;
  score: number;
  totalAnswered: number;
  feedback: {
    show: boolean;
    isCorrect: boolean;
    message: string;
  };
  isComplete: boolean;
  remainingAnimals: Animal[];
}

interface DragItem {
  type: string;
  animal: Animal;
}

const ITEM_TYPE = 'QUIZ_ANIMAL';

// Limit number of questions in the quiz
const MAX_QUESTIONS = 10;

const pickQuizAnimals = () => {
  const pool = [...animals];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(MAX_QUESTIONS, pool.length));
};

const QuizAnimalCard: React.FC<{ animal: Animal }> = ({ animal }) => {
  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ITEM_TYPE,
    item: { type: ITEM_TYPE, animal },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Hide default drag image; custom layer renders centered preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      ref={drag as any}
      className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 cursor-grab active:cursor-grabbing transition-all duration-300 ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-xl hover:scale-105'
      }`}
      style={{ width: '300px', height: '350px' }}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <img 
          src={animal.image_url} 
          alt={animal.name}
          className="w-32 h-32 object-contain mb-10"
        />
        <h3 className="text-2xl font-bold text-gray-800 text-center">{animal.name}</h3>
        <p className="text-gray-600 mt-2 text-center">Drag me to your answer!</p>
      </div>
    </div>
  );
};

const DropZone: React.FC<{
  isPettable: boolean;
  onDrop: (animal: Animal, guess: boolean) => void;
  isActive: boolean;
}> = ({ isPettable, onDrop, isActive }) => {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ITEM_TYPE,
    drop: (item) => {
      onDrop(item.animal, isPettable);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const bgColor = isPettable ? 'bg-green-100' : 'bg-red-100';
  const borderColor = isPettable ? 'border-green-300' : 'border-red-300';
  const textColor = isPettable ? 'text-green-700' : 'text-red-700';
  const hoverBg = isPettable ? 'bg-green-200' : 'bg-red-200';

  return (
    <div
      ref={drop as any}
      className={`
        ${bgColor} ${borderColor} ${textColor}
        border-4 border-dashed rounded-2xl p-8 
        transition-all duration-300 flex flex-col items-center justify-center
        min-h-[200px] w-full max-w-md
        ${isOver && canDrop ? hoverBg : ''}
        ${canDrop ? 'border-solid' : ''}
        ${!isActive ? 'opacity-50' : ''}
      `}
    >
      {isPettable ? (
        <>
          <Check className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">PETTABLE</h3>
        </>
      ) : (
        <>
          <X className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">NOT PETTABLE</h3>
        </>
      )}
      {isOver && canDrop && (
        <p className="text-sm mt-2 font-semibold">Drop here!</p>
      )}
    </div>
  );
};

export const QuizPage: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>({
    currentAnimal: null,
    score: 0,
    totalAnswered: 0,
    feedback: {
      show: false,
      isCorrect: false,
      message: '',
    },
    isComplete: false,
    remainingAnimals: pickQuizAnimals(),
  });

  // Initialize with first random animal
  useEffect(() => {
    if (quizState.remainingAnimals.length > 0 && !quizState.currentAnimal) {
      const randomIndex = Math.floor(Math.random() * quizState.remainingAnimals.length);
      const nextAnimal = quizState.remainingAnimals[randomIndex];
      setQuizState(prev => ({
        ...prev,
        currentAnimal: nextAnimal,
      }));
    }
  }, [quizState.remainingAnimals, quizState.currentAnimal]);

  const handleDrop = (animal: Animal, guess: boolean) => {
    const isCorrect = animal.isPettable === guess;
    
    setQuizState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      totalAnswered: prev.totalAnswered + 1,
      feedback: {
        show: true,
        isCorrect,
        message: isCorrect 
          ? `Correct! ${animal.name} is ${animal.isPettable ? 'safe to pet' : 'NOT safe to pet'}!`
          : `Wrong! ${animal.name} is ${animal.isPettable ? 'safe to pet' : 'NOT safe to pet'}!`,
      },
    }));

    // Show feedback for 2 seconds, then move to next animal
    setTimeout(() => {
      setQuizState(prev => {
        const newRemainingAnimals = prev.remainingAnimals.filter(a => a.id !== animal.id);
        
        if (newRemainingAnimals.length === 0) {
          return {
            ...prev,
            currentAnimal: null,
            isComplete: true,
            feedback: { show: false, isCorrect: false, message: '' },
            remainingAnimals: newRemainingAnimals,
          };
        }

        const randomIndex = Math.floor(Math.random() * newRemainingAnimals.length);
        const nextAnimal = newRemainingAnimals[randomIndex];

        return {
          ...prev,
          currentAnimal: nextAnimal,
          feedback: { show: false, isCorrect: false, message: '' },
          remainingAnimals: newRemainingAnimals,
        };
      });
    }, 2000);
  };

  const resetQuiz = () => {
    setQuizState({
      currentAnimal: null,
      score: 0,
      totalAnswered: 0,
      feedback: {
        show: false,
        isCorrect: false,
        message: '',
      },
      isComplete: false,
      remainingAnimals: pickQuizAnimals(),
    });
  };

  const getScoreColor = () => {
    const percentage = (quizState.score / quizState.totalAnswered) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Target className="h-10 w-10 text-blue-600" />
            Animal Quiz
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Drag each animal to the correct zone - can you pet it or not?
          </p>
          
          {/* Score Display */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="bg-white rounded-lg px-6 py-3 shadow-md">
              <span className="text-sm text-gray-600">Score: </span>
              <span className={`text-xl font-bold ${getScoreColor()}`}>
                {quizState.score}/{quizState.totalAnswered}
              </span>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 shadow-md">
              <span className="text-sm text-gray-600">Remaining: </span>
              <span className="text-xl font-bold text-blue-600">
                {quizState.remainingAnimals.length}
              </span>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        {!quizState.isComplete ? (
          <div className="space-y-8">
            {/* Current Animal or Feedback - Fixed Height Container */}
            <div className="flex justify-center" style={{ minHeight: '350px' }}>
              {quizState.currentAnimal && !quizState.feedback.show && (
                <QuizAnimalCard animal={quizState.currentAnimal} />
              )}
              
              {/* Feedback */}
              {quizState.feedback.show && (
                <div className="flex items-center justify-center">
                  <div className={`
                    p-6 rounded-2xl shadow-lg max-w-md text-center
                    ${quizState.feedback.isCorrect 
                      ? 'bg-green-100 border-2 border-green-300 text-green-800' 
                      : 'bg-red-100 border-2 border-red-300 text-red-800'
                    }
                  `}>
                    <div className="flex items-center justify-center mb-3">
                      {quizState.feedback.isCorrect ? (
                        <Check className="h-8 w-8" />
                      ) : (
                        <X className="h-8 w-8" />
                      )}
                    </div>
                    <p className="text-xl font-bold">{quizState.feedback.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Drop Zones - Fixed Position */}
            <div className="flex justify-center gap-8 flex-wrap">
              <DropZone 
                isPettable={true} 
                onDrop={handleDrop}
                isActive={!quizState.feedback.show && !!quizState.currentAnimal}
              />
              <DropZone 
                isPettable={false} 
                onDrop={handleDrop}
                isActive={!quizState.feedback.show && !!quizState.currentAnimal}
              />
            </div>
          </div>
        ) : (
          /* Quiz Complete */
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
              <div className="mb-6">
                <p className="text-lg text-gray-600 mb-2">Final Score:</p>
                <p className={`text-4xl font-bold ${getScoreColor()}`}>
                  {quizState.score}/{quizState.totalAnswered}
                </p>
                <p className="text-lg text-gray-600 mt-2">
                  ({quizState.totalAnswered > 0 ? Math.round((quizState.score / quizState.totalAnswered) * 100) : 0}%)
                </p>
              </div>
              
              <div className="mb-6">
                {quizState.totalAnswered > 0 && quizState.score === quizState.totalAnswered ? (
                  <p className="text-green-600 font-semibold">Perfect score! You're an animal expert! 🎉</p>
                ) : quizState.totalAnswered > 0 && quizState.score >= quizState.totalAnswered * 0.8 ? (
                  <p className="text-blue-600 font-semibold">Great job! You know your animals well! 👏</p>
                ) : quizState.totalAnswered > 0 && quizState.score >= quizState.totalAnswered * 0.6 ? (
                  <p className="text-yellow-600 font-semibold">Not bad! Keep learning about animals! 📚</p>
                ) : (
                  <p className="text-red-600 font-semibold">Keep practicing! Animals can be tricky! 💪</p>
                )}
              </div>

              <button
                onClick={resetQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                <RotateCcw className="h-5 w-5" />
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
