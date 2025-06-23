'use client';

import React, { createContext, useContext, useState, useId, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Toast, ToastContextType } from '@/interfaces';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const baseId = useId();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [counter, setCounter] = useState(0);

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = `${baseId}-${counter}`;
    const newToast: Toast = { id, title, description, variant, duration };
    
    setToasts(prev => [...prev, newToast]);
    setCounter(prev => prev + 1);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, [baseId, counter]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getToastStyles = (variant: Toast['variant']) => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-white border-gray-200 text-gray-800';
    }
  };

  const getToastIcon = (variant: Toast['variant']) => {
    const iconClass = "h-5 w-5";
    switch (variant) {
      case 'destructive':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
          {toasts.map((toastItem) => (
            <div
              key={toastItem.id}
              className={`
                ${getToastStyles(toastItem.variant)}
                border rounded-lg p-4 shadow-lg transform transition-all duration-300
                animate-in slide-in-from-top-2
              `}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getToastIcon(toastItem.variant)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{toastItem.title}</p>
                  {toastItem.description && (
                    <p className="mt-1 text-sm opacity-90">{toastItem.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toastItem.id)}
                  className="ml-4 flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 