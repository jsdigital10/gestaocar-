import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastMessage } from '../types/models';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl transition-all duration-200 bg-[#151515]/95 backdrop-blur-md ${
              isSuccess
                ? 'border-emerald-500/40 shadow-emerald-950/30'
                : isError
                ? 'border-[#FF202E]/60 shadow-[#FF202E]/20'
                : 'border-neutral-700/80 shadow-black/60'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : isError ? (
                <AlertCircle className="w-5 h-5 text-[#FF202E]" />
              ) : (
                <Info className="w-5 h-5 text-neutral-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Fechar notificação"
              className="shrink-0 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
