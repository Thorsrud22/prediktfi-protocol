'use client';

import { useState, useCallback } from 'react';
import { TOPICS, HORIZONS } from '../../lib/ai/types';

interface InsightFormProps {
  onSubmit?: (data: { question: string; topic: string; horizon: string }) => void;
  onPredict?: (data: { question: string; topic: string; horizon: string }) => void;
  loading?: boolean;
  isLoading?: boolean;
}

const InsightForm: React.FC<InsightFormProps> = ({ onSubmit, onPredict, isLoading = false, loading = false }) => {
  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState('');
  const [horizon, setHorizon] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFormLoading = isLoading || loading;

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!question.trim()) {
      newErrors.question = 'Question is required';
    } else if (question.length < 10) {
      newErrors.question = 'Question must be at least 10 characters';
    } else if (question.length > 200) {
      newErrors.question = 'Question must be less than 200 characters';
    }
    
    if (!topic) {
      newErrors.topic = 'Topic is required';
    }
    
    if (!horizon) {
      newErrors.horizon = 'Time horizon is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [question, topic, horizon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const formData = { question: question.trim(), topic, horizon };
      if (onSubmit) onSubmit(formData);
      if (onPredict) onPredict(formData);
    }
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 200) {
      setQuestion(value);
      // Clear question error when user starts typing
      if (errors.question) {
        setErrors(prev => ({ ...prev, question: '' }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="question" className="block text-sm font-medium text-[--text] mb-2">
          Prediction Question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={handleQuestionChange}
          placeholder="What will happen in the future? Be specific and measurable..."
          className={`w-full px-3 py-2 border rounded-lg bg-[--surface] text-[--text] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[--accent] ${
            errors.question ? 'border-red-500' : 'border-[--border]'
          }`}
          rows={3}
          disabled={isFormLoading}
        />
        <div className="flex justify-between mt-1">
          {errors.question ? (
            <span className="text-sm text-red-500">{errors.question}</span>
          ) : (
            <span className="text-sm text-gray-500">
              Be specific and measurable for better predictions
            </span>
          )}
          <span className={`text-sm ${question.length > 180 ? 'text-red-500' : 'text-gray-500'}`}>
            {question.length}/200
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-[--text] mb-2">
          Topic Category
        </label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            if (errors.topic) {
              setErrors(prev => ({ ...prev, topic: '' }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-lg bg-[--surface] text-[--text] focus:outline-none focus:ring-2 focus:ring-[--accent] ${
            errors.topic ? 'border-red-500' : 'border-[--border]'
          }`}
          disabled={isFormLoading}
        >
          <option value="">Select a category...</option>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.topic && (
          <span className="text-sm text-red-500 mt-1">{errors.topic}</span>
        )}
      </div>

      <div>
        <label htmlFor="horizon" className="block text-sm font-medium text-[--text] mb-2">
          Time Horizon
        </label>
        <select
          id="horizon"
          value={horizon}
          onChange={(e) => {
            setHorizon(e.target.value);
            if (errors.horizon) {
              setErrors(prev => ({ ...prev, horizon: '' }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-lg bg-[--surface] text-[--text] focus:outline-none focus:ring-2 focus:ring-[--accent] ${
            errors.horizon ? 'border-red-500' : 'border-[--border]'
          }`}
          disabled={isFormLoading}
        >
          <option value="">When will this resolve?</option>
          {HORIZONS.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
        {errors.horizon && (
          <span className="text-sm text-red-500 mt-1">{errors.horizon}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isFormLoading || !question.trim() || !topic || !horizon}
        className="w-full bg-[--accent] text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[--accent]/90 transition-colors"
      >
        {isFormLoading ? 'Getting AI Insight...' : 'Get AI Insight'}
      </button>
    </form>
  );
};

export default InsightForm;
