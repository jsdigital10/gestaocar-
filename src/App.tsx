/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Car,
  LayoutDashboard,
  LogOut,
  Plus,
  Receipt,
  User as UserIcon,
} from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { APP_LOGO_URL, BrandLogo } from './components/BrandLogo';
import { ConfirmModal } from './components/ConfirmModal';
import { DashboardView } from './components/DashboardView';
import { ExpenseModal } from './components/ExpenseModal';
import { ExpensesView } from './components/ExpensesView';
import { ProfileView } from './components/ProfileView';
import { ReportsView } from './components/ReportsView';
import { RideModal } from './components/RideModal';
import { RidesView } from './components/RidesView';
import { ToastContainer } from './components/ToastContainer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActiveTab, Expense, ExpenseInput, Ride, RideInput } from './types/models';

const MainAppShell: React.FC = () => {
  const {
    user,
    authReady,
    dataLoading,
    profile,
    rides,
    expenses,
    toasts,
    removeToast,
    logout,
    addRide,
    updateRide,
    deleteRide,
    addExpense,
    updateExpense,
    deleteExpense,
    saveProfile,
    changePasswordWithReauth,
    deleteAccountAndAllData,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [rideModalOpen, setRideModalOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  if (!authReady) {
    return (
      <div className="min-h-dvh w-full bg-[#080808] flex flex-col items-center justify-center p-6">
        <img
          src={APP_LOGO_URL}
          alt="Logo Gestão Car"
          referrerPolicy="no-referrer"
          className="w-20 h-20 rounded-2xl object-contain bg-[#080808] border border-neutral-800 shadow-2xl shadow-[#FF202E]/30 animate-pulse"
        />
        <p className="mt-4 text-xs font-semibold text-neutral-400 tracking-wide">
          Carregando Gestão Car...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <AuthScreen />
      </>
    );
  }

  const handleOpenAddRide = () => {
    setEditingRide(null);
    setRideModalOpen(true);
  };

  const handleOpenEditRide = (ride: Ride) => {
    setEditingRide(ride);
    setRideModalOpen(true);
  };

  const handleSaveRide = async (input: RideInput, rideId?: string) => {
    if (rideId) {
      await updateRide(rideId, input);
    } else {
      await addRide(input);
    }
  };

  const handleConfirmDeleteRide = async () => {
    if (!rideToDelete || deletingItem) return;
    setDeletingItem(true);
    try {
      await deleteRide(rideToDelete.id);
      setRideToDelete(null);
    } finally {
      setDeletingItem(false);
    }
  };

  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (input: ExpenseInput, expenseId?: string) => {
    if (expenseId) {
      await updateExpense(expenseId, input);
    } else {
      await addExpense(input);
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete || deletingItem) return;
    setDeletingItem(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } finally {
      setDeletingItem(false);
    }
  };

  // 14. MENU SIMPLIFICADO: Dashboard, Corridas, Gastos, Relatórios, Perfil/Sair
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rides', label: 'Corridas', icon: Car },
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'profile', label: 'Perfil/Sair', icon: UserIcon },
  ];

  return (
    <div className="min-h-dvh w-full bg-[#080808] text-white flex flex-col lg:flex-row">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Menu Lateral Desktop */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col justify-between bg-[#151515] border-r border-neutral-800/90 p-5 sticky top-0 h-dvh">
        <div className="space-y-7">
          {/* Logo e Nome Gestão Car bem posicionados */}
          <div className="px-2 pt-1">
            <BrandLogo size="md" />
          </div>

          {/* Botões Rápidos */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleOpenAddRide}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-[#FF202E]/20 transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Corrida</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddExpense}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF202E] shrink-0" />
              <span>Gasto</span>
            </button>
          </div>

          {/* Navegação Principal */}
          <nav aria-label="Menu principal" className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#202020] text-white border-l-4 border-[#FF202E]'
                      : 'text-neutral-400 hover:text-white hover:bg-[#202020]/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#FF202E]' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé Desktop com Sair */}
        <div className="p-3.5 rounded-2xl bg-[#202020]/70 border border-neutral-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {profile?.displayName || user.displayName || 'Motorista'}
            </p>
            <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sair da conta"
            title="Sair da conta"
            className="min-h-[38px] min-w-[38px] shrink-0 rounded-xl bg-[#151515] hover:bg-[#FF202E]/20 flex items-center justify-center text-neutral-300 hover:text-[#FF202E] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 12. CABEÇALHO MOBILE CORRIGIDO (Sem elementos sobrepostos ao nome Gestão Car) */}
      <header className="lg:hidden sticky top-0 z-30 w-full bg-[#080808]/95 backdrop-blur-md border-b border-neutral-900 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="shrink-0 flex items-center text-left focus:outline-none cursor-pointer"
          >
            <BrandLogo size="sm" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddRide}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-[#FF202E]/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Corrida</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddExpense}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF202E] shrink-0" />
              <span>Gasto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-10 pt-5 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            rides={rides}
            expenses={expenses}
            dataLoading={dataLoading}
            onOpenAddRide={handleOpenAddRide}
            onOpenAddExpense={handleOpenAddExpense}
            onEditRide={handleOpenEditRide}
            onDeleteRide={(ride) => setRideToDelete(ride)}
            onEditExpense={handleOpenEditExpense}
            onDeleteExpense={(exp) => setExpenseToDelete(exp)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'rides' && (
          <RidesView
            rides={rides}
            onOpenAddRide={handleOpenAddRide}
            onEditRide={handleOpenEditRide}
            onRequestDeleteRide={(ride) => setRideToDelete(ride)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            onOpenAddExpense={handleOpenAddExpense}
            onEditExpense={handleOpenEditExpense}
            onRequestDeleteExpense={(exp) => setExpenseToDelete(exp)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            profile={profile}
            rides={rides}
            expenses={expenses}
            onEditRide={handleOpenEditRide}
            onDeleteRide={(ride) => setRideToDelete(ride)}
            onEditExpense={handleOpenEditExpense}
            onDeleteExpense={(exp) => setExpenseToDelete(exp)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            userEmail={user.email || ''}
            profile={profile}
            onSaveProfile={saveProfile}
            onChangePassword={changePasswordWithReauth}
            onDeleteAccount={deleteAccountAndAllData}
            onLogout={logout}
          />
        )}
      </main>

      {/* Navegação Inferior Mobile: Dashboard, Corridas, Gastos, Relatórios, Perfil/Sair */}
      <nav
        aria-label="Navegação inferior móvel"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#151515]/95 backdrop-blur-md border-t border-neutral-800 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  active ? 'text-[#FF202E]' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modais */}
      <RideModal
        isOpen={rideModalOpen}
        editingRide={editingRide}
        onClose={() => {
          setRideModalOpen(false);
          setEditingRide(null);
        }}
        onSave={handleSaveRide}
      />

      <ExpenseModal
        isOpen={expenseModalOpen}
        editingExpense={editingExpense}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
      />

      <ConfirmModal
        isOpen={Boolean(rideToDelete)}
        title="Excluir Corrida"
        description="Tem certeza de que deseja excluir esta corrida? O valor será descontado imediatamente dos seus ganhos e do lucro."
        loading={deletingItem}
        onConfirm={handleConfirmDeleteRide}
        onCancel={() => setRideToDelete(null)}
      />

      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title="Excluir Gasto"
        description="Tem certeza de que deseja excluir este gasto? O cálculo do seu lucro será atualizado imediatamente."
        loading={deletingItem}
        onConfirm={handleConfirmDeleteExpense}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppShell />
    </AuthProvider>
  );
}
