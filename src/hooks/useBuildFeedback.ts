import React from 'react';
import type { BuildFeedback } from '../types';

const STORAGE_KEY = 'build_feedback';
const MAX_STORED_FEEDBACK = 50;

export function useBuildFeedback() {
  const [feedbackList, setFeedbackList] = React.useState<BuildFeedback[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentFeedback, setRecentFeedback] = React.useState<BuildFeedback | null>(null);

  const addFeedback = React.useCallback((feedback: BuildFeedback) => {
    setFeedbackList(prev => {
      const updated = [feedback, ...prev].slice(0, MAX_STORED_FEEDBACK);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving feedback:', error);
      }
      return updated;
    });
    setRecentFeedback(feedback);
  }, []);

  const clearRecentFeedback = React.useCallback(() => {
    setRecentFeedback(null);
  }, []);

  const getChampionFeedback = React.useCallback((championId: string) => {
    return feedbackList.filter(f => f.championId === championId);
  }, [feedbackList]);

  const getSuccessRate = React.useCallback((championId: string) => {
    const feedback = getChampionFeedback(championId);
    if (feedback.length === 0) return 0;
    
    const wins = feedback.filter(f => f.success).length;
    return (wins / feedback.length) * 100;
  }, [getChampionFeedback]);

  return {
    feedbackList,
    recentFeedback,
    addFeedback,
    clearRecentFeedback,
    getChampionFeedback,
    getSuccessRate
  };
}