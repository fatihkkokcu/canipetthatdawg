import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: React.ReactNode;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: React.ReactNode, variant?: ToastVariant, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: React.ReactNode, variant: ToastVariant = 'info', durationMs = 2600) => {
    const id = idRef.current++;
    const item: ToastItem = { id, message, variant, duration: durationMs };
    setToasts((prev) => [item, ...prev]);
    window.setTimeout(() => removeToast(id), durationMs);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container (top-right) */}
      <div className="fixed right-4 top-20 z-[100000] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={"w-80 max-w-[88vw] rounded-md shadow-lg overflow-hidden " + 
              (
                t.variant === 'success'
                ? 'bg-emerald-100'
                : t.variant === 'info'
                ? 'bg-blue-100'
                : t.variant === 'warning'
                ? 'bg-amber-100'
                : 'bg-red-100'
              )
            }
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 p-3">
              <span className="flex">
                {t.variant === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                {t.variant === 'info' && <Info className="h-5 w-5 text-blue-600" />}
                {t.variant === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                {t.variant === 'error' && <X className="h-5 w-5 text-red-600" />}
              </span>
              <div className="flex-1 text-sm text-gray-800 leading-5">{t.message}</div>
              {/* <button
                className="p-1 rounded text-gray-500"
                aria-label="Dismiss notification"
                onClick={() => removeToast(t.id)}
              >
                <X className="h-4 w-4" />
              </button> */}
            </div>
            {/* <div
              className={
                'h-1 w-full ' +
                (t.variant === 'success'
                  ? 'bg-emerald-500'
                  : t.variant === 'info'
                  ? 'bg-blue-500'
                  : t.variant === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-red-500')
              }
              style={{ opacity: 0.2 }}
            /> */}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
