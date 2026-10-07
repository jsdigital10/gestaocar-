import React, { useMemo, useState } from 'react';
import {
  Edit3,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  Expense,
} from '../types/models';
import {
  formatCentsToBRL,
  formatDateKey,
} from '../utils/finance';

interface ExpensesViewProps {
  expenses: Expense[];
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onRequestDeleteExpense: (expense: Expense) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onOpenAddExpense,
  onEditExpense,
  onRequestDeleteExpense,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'ALL') return expenses;
    return expenses.filter((e) => e.categoria === categoryFilter);
  }, [expenses, categoryFilter]);

  const totalFilteredCents = useMemo(
    () => filteredExpenses.reduce((acc, e) => acc + e.amountCents, 0),
    [filteredExpenses]
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
            Gastos
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Controle de despesas (Combustível, Alimentação, Manutenção, Lavagem, Estacionamento, Pedágio e Outros)
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="min-h-[48px] px-5 py-3 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-sm font-bold text-white shadow-lg shadow-[#FF202E]/25 flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Gasto</span>
        </button>
      </div>

      {/* Card de Total de Gastos */}
      <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-400">
            Total de Gastos ({filteredExpenses.length} registros)
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#FF202E] font-mono-tabular mt-1">
            {formatCentsToBRL(totalFilteredCents)}
          </p>
        </div>
        <Receipt className="w-7 h-7 text-[#FF202E]" />
      </div>

      {/* Filtro por Categoria */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            categoryFilter === 'ALL'
              ? 'bg-[#FF202E] text-white'
              : 'bg-[#151515] border border-neutral-800 text-neutral-300 hover:text-white'
          }`}
        >
          Todas
        </button>
        {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              categoryFilter === cat
                ? 'bg-[#FF202E] text-white'
                : 'bg-[#151515] border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de Gastos */}
      {filteredExpenses.length === 0 ? (
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#202020] flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6 text-[#FF202E]" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum gasto registrado</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Adicione suas despesas do dia a dia para calcular seu lucro automaticamente.
          </p>
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-xs font-bold text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Gasto</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 overflow-hidden divide-y divide-neutral-800/80">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-4 sm:p-5 hover:bg-[#202020]/50 transition-colors flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <span className="font-bold text-white">{exp.categoria}</span>
                  <span aria-hidden="true" className="text-neutral-600">
                    ·
                  </span>
                  <span className="text-neutral-400 font-mono-tabular">
                    Data: {formatDateKey(exp.data)}
                  </span>
                </div>
                {exp.descricao && (
                  <p className="text-xs text-neutral-300 truncate">{exp.descricao}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-base sm:text-lg font-extrabold text-[#FF202E] font-mono-tabular">
                  {formatCentsToBRL(exp.amountCents)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditExpense(exp)}
                    aria-label="Editar gasto"
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-[#202020] hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDeleteExpense(exp)}
                    aria-label="Excluir gasto"
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-[#202020] hover:bg-[#FF202E]/20 text-neutral-400 hover:text-[#FF202E] flex items-center justify-center transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
