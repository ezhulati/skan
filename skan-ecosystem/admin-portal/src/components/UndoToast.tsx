import React, { useEffect } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

const UndoToast: React.FC<UndoToastProps> = ({ 
  message, 
  onUndo, 
  onDismiss, 
  duration = 8000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="undo-toast">
      <div className="undo-toast-content">
        <span className="undo-toast-message">{message}</span>
        <div className="undo-toast-actions">
          <button 
            className="undo-button"
            onClick={onUndo}
          >
            Anulo
          </button>
          <button 
            className="dismiss-button"
            onClick={onDismiss}
          >
            ×
          </button>
        </div>
      </div>
      <div className="undo-toast-progress">
        <div className="undo-toast-progress-bar" style={{ animationDuration: `${duration}ms` }}></div>
      </div>
    </div>
  );
};

export default UndoToast;