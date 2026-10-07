import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit3,
  Plus,
  QrCode,
  Receipt,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { ActiveTab, Expense, Ride, UserProfile } from '../types/models';
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

interface DashboardViewProps {
  profile: UserProfile | null;
  rides: Ride[];
  expenses: Expense[];
  dataLoading: boolean;
  onOpenAddRide: () => void;
  onOpenAddExpense: () => void;
  onEditRide: (ride: Ride) => void;
  onDeleteRide: (ride: Ride) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

type DashboardPeriod = 'today' | 'week' | 'month' | 'all';

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  rides,
  expenses,
  dataLoading,
  onOpenAddRide,
  onOpenAddExpense,
  onEditRide,
  onDeleteRide,
  onEditExpense,
  onDeleteExpense,
  onNavigateTab,
}) => {
  const todayKey = getSaoPauloDateKey();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('month');
  const [selectedMonthRef, setSelectedMonthRef] = useState(todayKey);

  // Período selecionado para os cards principais e Formas de Recebimento
  const filteredData = useMemo(() => {
    if (selectedPeriod === 'today') {
      return {
        rides: rides.filter((r) => r.data === todayKey),
        expenses: expenses.filter((e) => e.data === todayKey),
        label: 'Hoje',
      };
    }
    if (selectedPeriod === 'week') {
      const wb = getWeekBounds(todayKey);
      return {
        rides: filterByDateKeyRange(rides, wb.startKey, wb.endKey),
        expenses: filterByDateKeyRange(expenses, wb.startKey, wb.endKey),
        label: 'Esta Semana',
      };
    }
    if (selectedPeriod === 'month') {
      const mb = getMonthBounds(todayKey);
      return {
        rides: filterByDateKeyRange(rides, mb.startKey, mb.endKey),
        expenses: filterByDateKeyRange(expenses, mb.startKey, mb.endKey),
        label: 'Este Mês',
      };
    }
    return {
      rides,
      expenses,
      label: 'Todo o Período',
    };
  }, [selectedPeriod, rides, expenses, todayKey]);

  const mainMetrics = useMemo(
    () => calculatePeriodMetrics(filteredData.rides, filteredData.expenses),
    [filteredData]
  );

  // Resumo Semanal (sempre referente à semana atual)
  const weekBounds = useMemo(() => getWeekBounds(todayKey), [todayKey]);
  const weeklyMetrics = useMemo(() => {
    const wRides = filterByDateKeyRange(rides, weekBounds.startKey, weekBounds.endKey);
    const wExpenses = filterByDateKeyRange(expenses, weekBounds.startKey, weekBounds.endKey);
    return calculatePeriodMetrics(wRides, wExpenses);
  }, [rides, expenses, weekBounds]);

  // Resumo Mensal (com navegação entre meses anteriores)
  const monthBounds = useMemo(() => getMonthBounds(selectedMonthRef), [selectedMonthRef]);
  const monthlyMetrics = useMemo(() => {
    const mRides = filterByDateKeyRange(rides, monthBounds.startKey, monthBounds.endKey);
    const mExpenses = filterByDateKeyRange(expenses, monthBounds.startKey, monthBounds.endKey);
    return calculatePeriodMetrics(mRides, mExpenses);
  }, [rides, expenses, monthBounds]);

  const driverFirstName = useMemo(() => {
    const full = profile?.displayName || 'Motorista';
    return full.split(' ')[0];
  }, [profile]);

  if (dataLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-[#151515] border border-neutral-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 rounded-2xl bg-[#151515] border border-neutral-800" />
          <div className="h-32 rounded-2xl bg-[#151515] border border-neutral-800" />
          <div className="h-32 rounded-2xl bg-[#151515] border border-neutral-800" />
        </div>
        <div className="h-44 rounded-2xl bg-[#151515] border border-neutral-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saudação e Botões Principais (+ Adicionar Corrida / + Adicionar Gasto) */}
      <section className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-400">Controle Financeiro Simplificado</p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Olá, {driverFirstName}
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAddRide}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-[#FF202E] hover:bg-[#e01522] active:scale-[0.99] text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#FF202E]/25 flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Adicionar Corrida</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-[#202020] hover:bg-neutral-800 active:scale-[0.99] border border-neutral-700 text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF202E] shrink-0" />
            <span>Adicionar Gasto</span>
          </button>
        </div>
      </section>

      {/* Filtro Rápido de Período do Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-neutral-300">
          Visão Geral ({filteredData.label})
        </h2>
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#151515] border border-neutral-800">
          {(
            [
              { id: 'today', label: 'Hoje' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mês' },
              { id: 'all', label: 'Tudo' },
            ] as { id: DashboardPeriod; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedPeriod(item.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedPeriod === item.id
                  ? 'bg-[#FF202E] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CARDS PRINCIPAIS: GANHOS + GASTOS + LUCRO */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ganhos */}
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">Ganhos</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono-tabular text-emerald-400 tracking-tight">
              {formatCentsToBRL(mainMetrics.grossRevenueCents)}
            </p>
          </div>
          <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
            <span>Total recebido pelas corridas</span>
            <span className="font-mono-tabular font-semibold text-neutral-200">
              {mainMetrics.ridesCount} {mainMetrics.ridesCount === 1 ? 'corrida' : 'corridas'}
            </span>
          </div>
        </div>

        {/* Gastos */}
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">Gastos</span>
            <Receipt className="w-5 h-5 text-[#FF202E]" />
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono-tabular text-[#FF202E] tracking-tight">
              {formatCentsToBRL(mainMetrics.totalExpensesCents)}
            </p>
          </div>
          <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
            <span>Total das despesas registradas</span>
            <span className="font-mono-tabular font-semibold text-neutral-200">
              {mainMetrics.expensesCount} {mainMetrics.expensesCount === 1 ? 'gasto' : 'gastos'}
            </span>
          </div>
        </div>

        {/* Lucro = Ganhos - Gastos */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1b1213] via-[#151515] to-[#151515] border border-[#FF202E]/50 p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-200">Lucro</span>
            <Wallet className="w-5 h-5 text-[#FF202E]" />
          </div>
          <div className="my-3">
            <p
              className={`text-2xl sm:text-3xl font-extrabold font-mono-tabular tracking-tight ${
                mainMetrics.netProfitCents >= 0 ? 'text-white' : 'text-[#FF202E]'
              }`}
            >
              {formatCentsToBRL(mainMetrics.netProfitCents)}
            </p>
          </div>
          <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
            <span>Cálculo automático (Ganhos - Gastos)</span>
          </div>
        </div>
      </section>

      {/* 4. FORMAS DE RECEBIMENTO (Dinheiro, Pix, Cartão) */}
      <section className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Formas de Recebimento</h2>
            <p className="text-xs text-neutral-400">
              Valores recebidos em {filteredData.label.toLowerCase()} (soma ={' '}
              {formatCentsToBRL(mainMetrics.grossRevenueCents)})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#202020] border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#151515] border border-neutral-700 flex items-center justify-center text-emerald-400">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">Dinheiro</p>
                <p className="text-base font-extrabold text-white font-mono-tabular">
                  {formatCentsToBRL(mainMetrics.cashCents)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#202020] border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#151515] border border-neutral-700 flex items-center justify-center text-[#FF202E]">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">Pix</p>
                <p className="text-base font-extrabold text-white font-mono-tabular">
                  {formatCentsToBRL(mainMetrics.pixCents)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#202020] border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#151515] border border-neutral-700 flex items-center justify-center text-neutral-200">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">Cartão</p>
                <p className="text-base font-extrabold text-white font-mono-tabular">
                  {formatCentsToBRL(mainMetrics.cardCents)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 & 7. RESUMO SEMANAL E RESUMO MENSAL */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo Semanal */}
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Resumo Semanal</h2>
              <p className="text-xs text-neutral-400">
                {formatDateKey(weekBounds.startKey)} a {formatDateKey(weekBounds.endKey)}
              </p>
            </div>
            <Calendar className="w-5 h-5 text-[#FF202E]" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-[#202020]">
              <span className="text-[11px] text-neutral-400">Ganhos da semana</span>
              <p className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono-tabular mt-0.5">
                {formatCentsToBRL(weeklyMetrics.grossRevenueCents)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#202020]">
              <span className="text-[11px] text-neutral-400">Gastos da semana</span>
              <p className="text-sm sm:text-base font-extrabold text-[#FF202E] font-mono-tabular mt-0.5">
                {formatCentsToBRL(weeklyMetrics.totalExpensesCents)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#202020] border border-[#FF202E]/30">
              <span className="text-[11px] text-neutral-300 font-semibold">Lucro da semana</span>
              <p className="text-sm sm:text-base font-extrabold text-white font-mono-tabular mt-0.5">
                {formatCentsToBRL(weeklyMetrics.netProfitCents)}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400">Quantidade de corridas</span>
              <span className="font-mono-tabular font-bold text-white">
                {weeklyMetrics.ridesCount}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400">Dinheiro recebido</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(weeklyMetrics.cashCents)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400">Pix recebido</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(weeklyMetrics.pixCents)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-neutral-400">Cartão recebido</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(weeklyMetrics.cardCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo Mensal com navegação entre meses */}
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Resumo Mensal</h2>
              <p className="text-xs text-neutral-400 capitalize">{monthBounds.monthLabelPt}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedMonthRef((prev) => shiftMonthKey(prev, -1))}
                aria-label="Mês anterior"
                className="min-h-[36px] min-w-[36px] rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonthRef(todayKey)}
                className="min-h-[36px] px-2.5 rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 text-[11px] font-semibold text-neutral-300 hover:text-white cursor-pointer"
              >
                Atual
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonthRef((prev) => shiftMonthKey(prev, 1))}
                aria-label="Próximo mês"
                className="min-h-[36px] min-w-[36px] rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-[#202020]">
              <span className="text-[11px] text-neutral-400">Ganhos do mês</span>
              <p className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono-tabular mt-0.5">
                {formatCentsToBRL(monthlyMetrics.grossRevenueCents)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#202020]">
              <span className="text-[11px] text-neutral-400">Gastos do mês</span>
              <p className="text-sm sm:text-base font-extrabold text-[#FF202E] font-mono-tabular mt-0.5">
                {formatCentsToBRL(monthlyMetrics.totalExpensesCents)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#202020] border border-[#FF202E]/30">
              <span className="text-[11px] text-neutral-300 font-semibold">Lucro do mês</span>
              <p className="text-sm sm:text-base font-extrabold text-white font-mono-tabular mt-0.5">
                {formatCentsToBRL(monthlyMetrics.netProfitCents)}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400">Quantidade de corridas</span>
              <span className="font-mono-tabular font-bold text-white">
                {monthlyMetrics.ridesCount}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400">Total recebido em dinheiro</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(monthlyMetrics.cashCents)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/80">
              <span className="text-neutral-400">Total recebido via Pix</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(monthlyMetrics.pixCents)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-neutral-400">Total recebido em cartão</span>
              <span className="font-mono-tabular font-semibold text-neutral-200">
                {formatCentsToBRL(monthlyMetrics.cardCents)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HISTÓRICO (Corridas e Gastos com Editar e Excluir) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histórico de Corridas */}
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Histórico de Corridas</h2>
              <p className="text-xs text-neutral-400">Últimos lançamentos</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('rides')}
              className="text-xs font-semibold text-[#FF202E] hover:underline cursor-pointer"
            >
              Ver todas ({rides.length})
            </button>
          </div>

          {rides.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-neutral-400">Nenhuma corrida registrada.</p>
              <button
                type="button"
                onClick={onOpenAddRide}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Corrida</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {rides.slice(0, 6).map((ride) => (
                <div
                  key={ride.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-neutral-200">
                      <span className="font-bold text-white">{ride.formaPagamento}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular text-neutral-400">
                        {formatDateKey(ride.data)} às {ride.horario}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-extrabold text-emerald-400 font-mono-tabular">
                      {formatCentsToBRL(ride.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditRide(ride)}
                      aria-label="Editar corrida"
                      className="min-h-[36px] min-w-[36px] rounded-lg bg-[#202020] hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRide(ride)}
                      aria-label="Excluir corrida"
                      className="min-h-[36px] min-w-[36px] rounded-lg bg-[#202020] hover:bg-[#FF202E]/20 text-neutral-400 hover:text-[#FF202E] flex items-center justify-center transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de Gastos */}
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Histórico de Gastos</h2>
              <p className="text-xs text-neutral-400">Últimas despesas</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('expenses')}
              className="text-xs font-semibold text-[#FF202E] hover:underline cursor-pointer"
            >
              Ver todos ({expenses.length})
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-neutral-400">Nenhum gasto registrado.</p>
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#FF202E]" />
                <span>Adicionar Gasto</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {expenses.slice(0, 6).map((exp) => (
                <div
                  key={exp.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-neutral-200">
                      <span className="font-bold text-white">{exp.categoria}</span>
                      <span aria-hidden="true">·</span>
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

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-extrabold text-[#FF202E] font-mono-tabular">
                      {formatCentsToBRL(exp.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditExpense(exp)}
                      aria-label="Editar gasto"
                      className="min-h-[36px] min-w-[36px] rounded-lg bg-[#202020] hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp)}
                      aria-label="Excluir gasto"
                      className="min-h-[36px] min-w-[36px] rounded-lg bg-[#202020] hover:bg-[#FF202E]/20 text-neutral-400 hover:text-[#FF202E] flex items-center justify-center transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
