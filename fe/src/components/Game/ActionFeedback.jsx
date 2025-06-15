import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext-refactored';

/**
 * Component to display action feedback and notifications
 * Provides visual feedback when actions are performed
 */
const ActionFeedback = () => {
  const { lastActionFeedback } = useGame();
  
  if (!lastActionFeedback) return null;
  
  // Determine style based on feedback type
  const getTypeStyle = () => {
    switch (lastActionFeedback.type) {
      case 'success':
        return 'border-green-500 bg-green-900/30 text-green-400';
      case 'error':
        return 'border-red-500 bg-red-900/30 text-red-400';
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/30 text-yellow-400';
      default:
        return 'border-blue-500 bg-blue-900/30 text-blue-400';
    }
  };
  
  // Get appropriate icon for the notification
  const getTypeIcon = () => {
    switch (lastActionFeedback.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };
  
  return (
    <div className="fixed bottom-8 right-8 z-50 animate-slideIn">
      <div className={`rounded-lg border-l-4 shadow-lg p-4 max-w-md ${getTypeStyle()}`}>
        <div className="flex items-start">
          <div className="mr-3 text-2xl font-bold">
            {getTypeIcon()}
          </div>
          <div>
            <div className="font-semibold mb-1">
              {lastActionFeedback.type.charAt(0).toUpperCase() + lastActionFeedback.type.slice(1)}
            </div>
            <div className="text-sm">
              {lastActionFeedback.message}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Animation styles to be added to the global CSS
 * Add this to index.css or a separate stylesheet
 */
const styles = `
@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateX(100%);
  }
  10% {
    opacity: 1;
    transform: translateX(0);
  }
  90% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

.animate-slideIn {
  animation: slideIn 5s ease-in-out forwards;
}
`;

export default ActionFeedback;
