import React from 'react';
import { Trophy, X } from 'lucide-react';
import type { BuildFeedback } from '../types';

interface BuildFeedbackToastProps {
  feedback: BuildFeedback;
  onClose: () => void;
}

export function BuildFeedbackToast({ feedback, onClose }: BuildFeedbackToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const timeAgo = React.useMemo(() => {
    const seconds = Math.floor((Date.now() - feedback.timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'a while ago';
  }, [feedback.timestamp]);

  return (
    <div 
      className={`fixed bottom-4 right-4 max-w-sm bg-[#1E2328]/95 border border-[#785A28] rounded-lg p-4 shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-[#F0E6D2]/60 hover:text-[#F0E6D2]"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${feedback.success ? 'bg-[#0AC8B9]/20' : 'bg-[#FF4655]/20'}`}>
          <Trophy className={`h-5 w-5 ${feedback.success ? 'text-[#0AC8B9]' : 'text-[#FF4655]'}`} />
        </div>
        
        <div>
          <p className="text-[#F0E6D2]">
            <span className="font-bold text-[#C8AA6E]">{feedback.playerName}</span>
            {' '}
            {feedback.success ? 'won' : 'lost'}
            {' '}
            using our recommended build
            {feedback.role && (
              <span className="text-[#F0E6D2]/70">
                {' '}as {feedback.role}
              </span>
            )}
          </p>
          
          <p className="text-sm text-[#F0E6D2]/60 mt-1">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
}