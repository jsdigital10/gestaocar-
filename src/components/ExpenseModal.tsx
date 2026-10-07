import React, { useEffect, useState } from 'react';
import { AlertCircle, Receipt, X } from 'lucide-react';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  Expense,
  ExpenseInput,
} from '../types/models';
import {
  centsToMaskString,
  formatCurrencyInputMask,
  getSaoPauloDateKey,
  parseBRLInputToCents,
} from '../utils/finance';

interface ExpenseModalProps {
  isOpen: boolean;
  editingExpense?: Expense | null;
  onClose: () => void;
  onSave: (input: ExpenseInput, expenseId?: string) => Promise<void>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  editingExpense,
  onClose,
  onSave,
}) => {
  const [amountMask, setAmountMask] = useState('');
  const [categoria, setCategoria] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(getSaoPauloDateKey());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);

    if (editingExpense) {
      setAmountMask(centsToMaskString(editingExpense.amountCents));
      setCategoria(editingExpense.categoria || DEFAULT_EXPENSE_CATEGORIES[0]);
      setDescricao(editingExpense.descricao || '');
      setData(editingExpense.data || getSaoPauloDateKey());
    } else {
      setAmountMask('');
      setCategoria(DEFAULT_EXPENSE_CATEGORIES[0]);
      setDescricao('');
      setData(getSaoPauloDateKey());
    }
  }, [isOpen, editingExpense]);

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
      setErrorMsg('Informe um valor válido maior que R$ 0,00 para o gasto.');
      return;
    }

    if (!categoria.trim()) {
      setErrorMsg('Selecione uma categoria para o gasto.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      setErrorMsg('Selecione uma data válida.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await onSave(
        {
          amountCents,
          categoria: categoria.trim(),
          descricao: descricao.trim().slice(0, 200),
          data,
        },
        editingExpense?.id
      );
      setAmountMask('');
      setDescricao('');
      onClose();
    } catch (err) {
      console.error('Falha ao salvar gasto:', err);
      setErrorMsg('Não foi possível salvar o gasto. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-[#151515] border border-neutral-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#151515] border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-[#FF202E]" />
            <h2 id="expense-modal-title" className="text-lg font-bold text-white">
              {editingExpense ? 'Editar Gasto' : 'Adicionar Gasto'}
            </h2>
          </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FF202E]/15 border border-[#FF202E]/50 text-xs font-medium text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-[#FF202E] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Valor do gasto */}
          <div>
            <label
              htmlFor="expense-amount"
              className="block text-xs font-semibold text-neutral-300 mb-2"
            >
              Valor do gasto (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-[#FF202E] font-mono-tabular">
                R$
              </span>
              <input
                id="expense-amount"
                type="text"
                inputMode="numeric"
                autoFocus
                required
                placeholder="50,00"
                value={amountMask}
                onChange={handleAmountChange}
                disabled={submitting}
                className="w-full min-h-[54px] pl-12 pr-4 py-3 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-2xl font-extrabold text-white font-mono-tabular transition-colors"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label
              htmlFor="expense-category"
              className="block text-xs font-semibold text-neutral-300 mb-2"
            >
              Categoria *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEFAULT_EXPENSE_CATEGORIES.map((cat) => {
                const active = categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    disabled={submitting}
                    onClick={() => setCategoria(cat)}
                    className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#FF202E] border-[#FF202E] text-white'
                        : 'bg-[#202020] border-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data */}
          <div>
            <label
              htmlFor="expense-date"
              className="block text-xs font-semibold text-neutral-300 mb-1.5"
            >
              Data *
            </label>
            <input
              id="expense-date"
              type="date"
              required
              disabled={submitting}
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-sm text-white font-mono-tabular"
            />
          </div>

          {/* Descrição opcional */}
          <div>
            <label
              htmlFor="expense-desc"
              className="block text-xs font-medium text-neutral-300 mb-1.5"
            >
              Descrição (opcional)
            </label>
            <input
              id="expense-desc"
              type="text"
              maxLength={200}
              disabled={submitting}
              placeholder="Ex: Abastecimento etanol, almoço..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-sm text-white"
            />
          </div>

          {/* Botões */}
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
              {submitting ? 'Salvando...' : 'Salvar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
