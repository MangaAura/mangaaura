'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { HelpCircle, CheckCircle2, XCircle, Coins, Loader2 } from 'lucide-react';

interface QuizQuestion {
  question: string;
  answers: string[];
  correctAnswer: number;
  chapterTitle: string;
  chapterId: string;
}

interface QuizPopupProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  chapterId: string;
}

const FALLBACK_QUESTION: QuizQuestion = {
  question: "¿Cuál fue la técnica que utilizó el protagonista en la batalla final del capítulo?",
  answers: [
    "Corte del Dragón Oscuro",
    "Estallido de Sombras",
    "Relámpago Carmesí",
    "Escudo de Maná Absoluto"
  ],
  correctAnswer: 1,
  chapterTitle: '',
  chapterId: '',
};

export default function QuizPopup({ isOpen, onClose, chapterTitle, chapterId }: QuizPopupProps) {
  const { data: session } = useSession();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizQuestion>(FALLBACK_QUESTION);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (isOpen && chapterId) {
      setIsFetching(true);
      fetch(`/api/quiz?chapterId=${encodeURIComponent(chapterId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.question && data.answers) {
            setQuizData(data);
          }
        })
        .catch(() => {
          // Usar fallback
        })
        .finally(() => setIsFetching(false));
    }
  }, [isOpen, chapterId]);

  if (!isOpen) return null;

  const { question, answers, correctAnswer } = quizData;

  const handleSubmit = async () => {
    if (selectedAnswer !== null) {
      setIsLoading(true);

      if (selectedAnswer === correctAnswer && session?.user?.id) {
        try {
          await fetch('/api/gamification/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: 50,
              source: 'quiz_completion',
              referenceId: chapterId,
            })
          });
        } catch (error) {
          console.error("Failed to reward XP", error);
        }
      }

      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  if (isFetching) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-secondary w-full max-w-md rounded-2xl shadow-2xl p-6 border border-custom text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-accent-blue mb-4" />
          <p className="text-muted">Generando pregunta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-secondary w-full max-w-md rounded-2xl shadow-2xl p-6 border border-custom">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-blue/10 text-accent-blue mb-4">
            <HelpCircle size={24} />
          </div>
          <h2 className="text-xl font-bold mb-1">Pop Quiz: {chapterTitle}</h2>
          <p className="text-sm text-muted">¡Responde correctamente para ganar experiencia!</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4 text-center">{question}</h3>
          <div className="space-y-3">
            {answers.map((answer, index) => {
              const isSelected = selectedAnswer === index;
              let btnClass = "w-full text-left p-4 rounded-xl border transition-all ";

              if (!isSubmitted) {
                btnClass += isSelected
                  ? "border-accent-blue bg-accent-blue/5 shadow-md"
                  : "border-custom hover:bg-tertiary";
              } else {
                if (index === correctAnswer) {
                  btnClass += "border-accent-green bg-accent-green/10 text-accent-green font-semibold";
                } else if (isSelected && index !== correctAnswer) {
                  btnClass += "border-accent-red bg-accent-red/10 text-accent-red opacity-50";
                } else {
                  btnClass += "border-custom opacity-50";
                }
              }

              return (
                <button
                  key={`answer-${index}`}
                  disabled={isSubmitted || isLoading}
                  onClick={() => setSelectedAnswer(index)}
                  className={btnClass + ' cursor-pointer'}
                >
                  <div className="flex justify-between items-center">
                    <span>{answer}</span>
                    {isSubmitted && index === correctAnswer && <CheckCircle2 size={20} />}
                    {isSubmitted && isSelected && index !== correctAnswer && <XCircle size={20} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center animate-fade-in-up">
            {selectedAnswer === correctAnswer ? (
              <div className="mb-6 p-4 bg-accent-green/10 rounded-xl text-accent-green font-bold flex flex-col items-center">
                <span className="text-2xl mb-1">¡Correcto!</span>
                <span className="flex items-center text-lg"><Coins size={20} className="mr-2" /> +50 XP Ganada</span>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-accent-red/10 rounded-xl text-accent-red font-bold">
                Respuesta incorrecta. ¡Suerte a la próxima!
              </div>
            )}
            <button onClick={onClose} className="w-full bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-semibold py-3 rounded-xl transition-colors cursor-pointer">
              Continuar Lectura
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || isLoading}
            className={`w-full font-semibold py-3 rounded-xl transition-all flex justify-center items-center cursor-pointer ${selectedAnswer !== null ? 'bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] shadow-md' : 'bg-tertiary text-muted cursor-not-allowed'}`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Comprobar Respuesta'}
          </button>
        )}
      </div>
    </div>
  );
}
