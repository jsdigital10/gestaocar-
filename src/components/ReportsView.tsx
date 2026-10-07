import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileSpreadsheet,
  FileText,
  Trash2,
} from 'lucide-react';
import { Expense, Ride, UserProfile } from '../types/models';
import { exportReportToCSV, exportReportToPDF } from '../utils/export';
import {
  calculatePeriodMetrics,
  filterByDateKeyRange,
  formatCentsToBRL,
  formatDateKey,
  getMonthBounds,
  getSaoPauloDateKey,
  getWeekBounds,
  shiftMonthKey,
} from '../utils/finance';

interface ReportsViewProps {
  profile: UserProfile | null;
  rides: Ride[];
  expenses: Expense[];
  onEditRide: (ride: Ride) => void;
  onDeleteRide: (ride: Ride) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  profile,
  rides,
  expenses,
  onEditRide,
  onDeleteRide,
  onEditExpense,
  onDeleteExpense,
}) => {
  const todayKey = getSaoPauloDateKey();
  const [selectedMonthRef, setSelectedMonthRef] = useState(todayKey);

  // Resumo Semanal
  const weekBounds = useMemo(() => getWeekBounds(todayKey), [todayKey]);
  const weeklyRides = useMemo(
    () => filterByDateKeyRange(rides, weekBounds.startKey, weekBounds.endKey),
    [rides, weekBounds]
  );
  const weeklyExpenses = useMemo(
    () => filterByDateKeyRange(expenses, weekBounds.startKey, weekBounds.endKey),
    [expenses, weekBounds]
  );
  const weeklyMetrics = useMemo(
    () => calculatePeriodMetrics(weeklyRides, weeklyExpenses),
    [weeklyRides, weeklyExpenses]
  );

  // Resumo Mensal (com navegação entre meses)
  const monthBounds = useMemo(() => getMonthBounds(selectedMonthRef), [selectedMonthRef]);
  const monthlyRides = useMemo(
    () => filterByDateKeyRange(rides, monthBounds.startKey, monthBounds.endKey),
    [rides, monthBounds]
  );
  const monthlyExpenses = useMemo(
    () => filterByDateKeyRange(expenses, monthBounds.startKey, monthBounds.endKey),
    [expenses, monthBounds]
  );
  const monthlyMetrics = useMemo(
    () => calculatePeriodMetrics(monthlyRides, monthlyExpenses),
    [monthlyRides, monthlyExpenses]
  );

  const handleExportCSV = () => {
    exportReportToCSV({
      periodLabel: monthBounds.monthLabelPt,
      startDateKey: monthBounds.startKey,
      endDateKey: monthBounds.endKey,
      metrics: monthlyMetrics,
      rides: monthlyRides,
      expenses: monthlyExpenses,
    });
  };

  const handleExportPDF = () => {
    exportReportToPDF({
      driverName: profile?.displayName || 'Motorista',
      periodLabel: monthBounds.monthLabelPt,
      startDateKey: monthBounds.startKey,
      endDateKey: monthBounds.endKey,
      metrics: monthlyMetrics,
      rides: monthlyRides,
      expenses: monthlyExpenses,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
            Relatórios e Histórico
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Resumo Semanal, Resumo Mensal e Histórico detalhado do período
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-xs font-bold text-white shadow-lg shadow-[#FF202E]/25 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* RESUMO SEMANAL & RESUMO MENSAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6. RESUMO SEMANAL */}
        <section className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Resumo Semanal</h2>
              <p className="text-xs text-neutral-400">
                Semana de {formatDateKey(weekBounds.startKey)} a {formatDateKey(weekBounds.endKey)}
              </p>
            </div>
            <Calendar className="w-5 h-5 text-[#FF202E]" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-xl bg-[#202020]">
              <span className="text-xs text-neutral-400">Ganhos da semana</span>
              <p className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono-tabular mt-1">
                {formatCentsToBRL(weeklyMetrics.grossRevenueCents)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#202020]">
              <span className="text-xs text-neutral-400">Gastos da semana</span>
              <p className="text-base sm:text-lg font-extrabold text-[#FF202E] font-mono-tabular mt-1">
                {formatCentsToBRL(weeklyMetrics.totalExpensesCents)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#202020] border border-[#FF202E]/40">
              <span className="text-xs text-neutral-300 font-semibold">Lucro da semana</span>
              <p className="text-base sm:text-lg font-extrabold text-white font-mono-tabular mt-1">
                {formatCentsToBRL(weeklyMetrics.netProfitCents)}
              </p>
            </div>
          </div>

          <div className="divide-y divide-neutral-800/80 text-xs sm:text-sm pt-1">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-neutral-400">Quantidade de corridas</span>
              <span className="font-mono-tabular font-bold text-white">
                {weeklyMetrics.ridesCount}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-neutral-400">Dinheiro recebido</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(weeklyMetrics.cashCents)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-neutral-400">Pix recebido</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(weeklyMetrics.pixCents)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-neutral-400">Cartão recebido</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(weeklyMetrics.cardCents)}
              </span>
            </div>
          </div>
        </section>

        {/* 7. RESUMO MENSAL */}
        <section className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Resumo Mensal</h2>
              <p className="text-xs text-neutral-400 capitalize">{monthBounds.monthLabelPt}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedMonthRef((prev) => shiftMonthKey(prev, -1))}
                aria-label="Mês anterior"
                className="min-h-[38px] min-w-[38px] rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonthRef(todayKey)}
                className="min-h-[38px] px-3 rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonthRef((prev) => shiftMonthKey(prev, 1))}
                aria-label="Próximo mês"
                className="min-h-[38px] min-w-[38px] rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-xl bg-[#202020]">
              <span className="text-xs text-neutral-400">Ganhos do mês</span>
              <p className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono-tabular mt-1">
                {formatCentsToBRL(monthlyMetrics.grossRevenueCents)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#202020]">
              <span className="text-xs text-neutral-400">Gastos do mês</span>
              <p className="text-base sm:text-lg font-extrabold text-[#FF202E] font-mono-tabular mt-1">
                {formatCentsToBRL(monthlyMetrics.totalExpensesCents)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#202020] border border-[#FF202E]/40">
              <span className="text-xs text-neutral-300 font-semibold">Lucro do mês</span>
              <p className="text-base sm:text-lg font-extrabold text-white font-mono-tabular mt-1">
                {formatCentsToBRL(monthlyMetrics.netProfitCents)}
              </p>
            </div>
          </div>

          <div className="divide-y divide-neutral-800/80 text-xs sm:text-sm pt-1">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-neutral-400">Quantidade de corridas</span>
              <span className="font-mono-tabular font-bold text-white">
                {monthlyMetrics.ridesCount}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-neutral-400">Total recebido em dinheiro</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(monthlyMetrics.cashCents)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-neutral-400">Total recebido via Pix</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(monthlyMetrics.pixCents)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-neutral-400">Total recebido em cartão</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(monthlyMetrics.cardCents)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 8. HISTÓRICO DO MÊS SELECIONADO (Corridas e Gastos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6">
          <h3 className="text-base font-bold text-white mb-4">
            Corridas de {monthBounds.monthLabelPt} ({monthlyRides.length})
          </h3>
          {monthlyRides.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              Nenhuma corrida registrada neste mês.
            </p>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {monthlyRides.map((ride) => (
                <div
                  key={ride.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="text-xs text-neutral-300">
                    <span className="font-bold text-white">{ride.formaPagamento}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-tabular text-neutral-400">
                      {formatDateKey(ride.data)} às {ride.horario}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-emerald-400 font-mono-tabular">
                      {formatCentsToBRL(ride.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditRide(ride)}
                      className="min-h-[34px] min-w-[34px] rounded-lg bg-[#202020] hover:bg-neutral-700 text-neutral-300 flex items-center justify-center cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRide(ride)}
                      className="min-h-[34px] min-w-[34px] rounded-lg bg-[#202020] hover:bg-[#FF202E]/20 text-neutral-400 hover:text-[#FF202E] flex items-center justify-center cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6">
          <h3 className="text-base font-bold text-white mb-4">
            Gastos de {monthBounds.monthLabelPt} ({monthlyExpenses.length})
          </h3>
          {monthlyExpenses.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              Nenhum gasto registrado neste mês.
            </p>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {monthlyExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-neutral-300">
                      <span className="font-bold text-white">{exp.categoria}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono-tabular text-neutral-400">
                        {formatDateKey(exp.data)}
                      </span>
                    </div>
                    {exp.descricao && (
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {exp.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-[#FF202E] font-mono-tabular">
                      {formatCentsToBRL(exp.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditExpense(exp)}
                      className="min-h-[34px] min-w-[34px] rounded-lg bg-[#202020] hover:bg-neutral-700 text-neutral-300 flex items-center justify-center cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp)}
                      className="min-h-[34px] min-w-[34px] rounded-lg bg-[#202020] hover:bg-[#FF202E]/20 text-neutral-400 hover:text-[#FF202E] flex items-center justify-center cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
