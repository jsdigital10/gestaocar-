import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar exclusão',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#151515] border border-neutral-800 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF202E]/15 border border-[#FF202E]/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#FF202E]" />
            </div>
            <h2 id="confirm-modal-title" className="text-lg font-bold text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Fechar janela de confirmação"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-neutral-300 leading-relaxed">{description}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#202020] hover:bg-neutral-800 text-sm font-medium text-neutral-200 transition-colors whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF202E] hover:bg-[#e01522] disabled:opacity-50 text-sm font-semibold text-white shadow-lg shadow-[#FF202E]/25 transition-all whitespace-nowrap"
          >
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
