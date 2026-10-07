import React, { useEffect, useState } from 'react';
import { AlertCircle, Banknote, Check, CreditCard, QrCode, X } from 'lucide-react';
import {
  RIDE_PAYMENT_METHODS,
  Ride,
  RideInput,
  RidePaymentMethod,
} from '../types/models';
import {
  centsToMaskString,
  formatCurrencyInputMask,
  parseBRLInputToCents,
} from '../utils/finance';

interface RideModalProps {
  isOpen: boolean;
  editingRide?: Ride | null;
  onClose: () => void;
  onSave: (input: RideInput, rideId?: string) => Promise<void>;
}

export const RideModal: React.FC<RideModalProps> = ({
  isOpen,
  editingRide,
  onClose,
  onSave,
}) => {
  const [amountMask, setAmountMask] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<RidePaymentMethod>('Pix');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);

    if (editingRide) {
      setAmountMask(centsToMaskString(editingRide.amountCents));
      setFormaPagamento(editingRide.formaPagamento || 'Pix');
    } else {
      setAmountMask('');
      setFormaPagamento('Pix');
    }
  }, [isOpen, editingRide]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountMask(formatCurrencyInputMask(e.target.value));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const amountCents = parseBRLInputToCents(amountMask);
    if (!amountMask.trim() || amountCents <= 0) {
      setErrorMsg('Informe um valor válido maior que R$ 0,00 para a corrida.');
      return;
    }

    if (!RIDE_PAYMENT_METHODS.includes(formaPagamento)) {
      setErrorMsg('Selecione uma forma de recebimento válida.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await onSave(
        {
          amountCents,
          formaPagamento,
        },
        editingRide?.id
      );
      // Limpar os campos para uma próxima corrida e fechar após confirmação do Firebase
      setAmountMask('');
      setFormaPagamento('Pix');
      onClose();
    } catch (err) {
      console.error('Falha ao salvar corrida:', err);
      setErrorMsg('Não foi possível salvar a corrida. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentIcon = (method: RidePaymentMethod) => {
    if (method === 'Dinheiro') return <Banknote className="w-5 h-5" />;
    if (method === 'Pix') return <QrCode className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ride-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-[#151515] border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#151515] border-b border-neutral-800">
          <h2 id="ride-modal-title" className="text-lg font-bold text-white">
            {editingRide ? 'Editar Corrida' : 'Adicionar Corrida'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar janela"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FF202E]/15 border border-[#FF202E]/50 text-xs font-medium text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-[#FF202E] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Valor da corrida */}
          <div>
            <label
              htmlFor="ride-amount"
              className="block text-xs font-semibold text-neutral-300 mb-2"
            >
              Valor da corrida (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-[#FF202E] font-mono-tabular">
                R$
              </span>
              <input
                id="ride-amount"
                type="text"
                inputMode="numeric"
                autoFocus
                required
                placeholder="25,00"
                value={amountMask}
                onChange={handleAmountChange}
                disabled={submitting}
                className="w-full min-h-[54px] pl-12 pr-4 py-3 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-2xl font-extrabold text-white font-mono-tabular transition-colors"
              />
            </div>
          </div>

          {/* 2. Forma de recebimento */}
          <div>
            <span className="block text-xs font-semibold text-neutral-300 mb-2">
              Forma de recebimento *
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {RIDE_PAYMENT_METHODS.map((method) => {
                const active = formaPagamento === method;
                return (
                  <button
                    key={method}
                    type="button"
                    disabled={submitting}
                    onClick={() => setFormaPagamento(method)}
                    className={`min-h-[68px] p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#FF202E]/15 border-[#FF202E] text-white ring-1 ring-[#FF202E]'
                        : 'bg-[#202020] border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div className={active ? 'text-[#FF202E]' : 'text-neutral-400'}>
                      {getPaymentIcon(method)}
                    </div>
                    <span className="text-xs font-bold flex items-center gap-1">
                      {method}
                      {active && <Check className="w-3.5 h-3.5 text-[#FF202E]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 min-h-[50px] px-4 py-3 rounded-xl bg-[#202020] hover:bg-neutral-800 disabled:opacity-50 text-sm font-semibold text-neutral-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 min-h-[50px] px-5 py-3 rounded-xl bg-[#FF202E] hover:bg-[#e01522] disabled:opacity-50 text-sm font-bold text-white shadow-lg shadow-[#FF202E]/25 transition-all cursor-pointer"
            >
              {submitting ? 'Salvando...' : 'Salvar Corrida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
