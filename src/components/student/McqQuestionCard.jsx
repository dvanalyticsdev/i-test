import React from 'react';
import { Flag, CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';

export const McqQuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isMarkedForReview,
  onSelectOption,
  onToggleReview,
  onNext,
  onPrev
}) => {
  if (!question) return null;

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full select-none">
      <div>
        {/* Header: Question Number & Flag Button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
              Domain: {question.domain?.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Mark for Review Toggle */}
          <button
            onClick={onToggleReview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              isMarkedForReview
                ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isMarkedForReview ? 'fill-current text-amber-600' : ''}`} />
            <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
          </button>
        </div>

        {/* Question Prompt */}
        <h2 className="text-base font-bold text-slate-900 leading-snug mb-6">
          {question.question}
        </h2>

        {/* Options List - NO IMMEDIATE RIGHT/WRONG FEEDBACK! */}
        <div className="space-y-3 mb-6">
          {question.options.map((optionText, idx) => {
            const isSelected = selectedAnswer === idx;
            return (
              <button
                key={idx}
                onClick={() => onSelectOption(idx)}
                className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-sky-50 border-sky-500 text-sky-950 shadow-sm ring-1 ring-sky-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {optionLabels[idx]}
                  </span>
                  <span className="mt-0.5 leading-relaxed">{optionText}</span>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 ml-2" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={onPrev}
          disabled={questionNumber === 1}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="text-xs text-slate-400 font-medium">
          {selectedAnswer !== undefined ? 'Answer Selected' : 'Unanswered'}
        </span>

        <button
          onClick={onNext}
          disabled={questionNumber === totalQuestions}
          className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-40"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
