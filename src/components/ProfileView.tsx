import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  KeyRound,
  LogOut,
  Save,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { UserProfile } from '../types/models';

interface ProfileViewProps {
  userEmail: string;
  profile: UserProfile | null;
  onSaveProfile: (displayName: string) => Promise<void>;
  onChangePassword: (currentPass: string, newPass: string) => Promise<void>;
  onDeleteAccount: (currentPass: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userEmail,
  profile,
  onSaveProfile,
  onChangePassword,
  onDeleteAccount,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      await onSaveProfile(displayName.trim() || 'Motorista');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    if (!currentPassword) {
      setPassError('Informe sua senha atual.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassError('A confirmação da nova senha não confere.');
      return;
    }
    setSavingPass(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setSavingPass(false);
    }
  };

  const handleConfirmAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError('Confirme sua senha atual para excluir a conta.');
      return;
    }
    setDeletingAccount(true);
    try {
      await onDeleteAccount(deletePassword);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Falha ao excluir conta.');
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
            Perfil e Conta
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Gerencie sua conta autenticada ({userEmail})
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#FF202E]/25 flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nome do Motorista */}
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-3">
            <UserIcon className="w-5 h-5 text-[#FF202E]" />
            <div>
              <h2 className="text-base font-bold text-white">Dados da Conta</h2>
              <p className="text-xs text-neutral-400">{userEmail}</p>
            </div>
          </div>

          <div>
            <label htmlFor="prof-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nome de exibição *
            </label>
            <input
              id="prof-name"
              type="text"
              required
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-sm text-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#FF202E]" />
              <span>{savingProfile ? 'Salvando...' : 'Salvar Nome'}</span>
            </button>
          </div>
        </form>

        {/* Alterar Senha */}
        <form
          onSubmit={handlePasswordSubmit}
          className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-3">
            <KeyRound className="w-5 h-5 text-[#FF202E]" />
            <div>
              <h2 className="text-base font-bold text-white">Alterar Senha</h2>
              <p className="text-xs text-neutral-400">
                Confirme sua senha atual para alterar
              </p>
            </div>
          </div>

          {passError && (
            <div className="p-3 rounded-xl bg-[#FF202E]/10 border border-[#FF202E]/40 text-xs text-red-200">
              {passError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="cur-pass" className="block text-xs text-neutral-300 mb-1">
                Senha atual *
              </label>
              <input
                id="cur-pass"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#202020] border border-neutral-700 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="new-pass" className="block text-xs text-neutral-300 mb-1">
                  Nova senha *
                </label>
                <input
                  id="new-pass"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#202020] border border-neutral-700 text-xs text-white"
                />
              </div>
              <div>
                <label htmlFor="conf-new-pass" className="block text-xs text-neutral-300 mb-1">
                  Confirmar nova senha *
                </label>
                <input
                  id="conf-new-pass"
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#202020] border border-neutral-700 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPass}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#202020] hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              {savingPass ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </div>
        </form>
      </div>

      {/* Zona de Exclusão da Conta */}
      <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#FF202E]">
          <AlertTriangle className="w-4 h-4" />
          <span>Excluir Conta e Todos os Dados</span>
        </div>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FF202E]/10 hover:bg-[#FF202E]/20 border border-[#FF202E]/40 text-xs font-semibold text-[#FF202E] inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Solicitar exclusão permanente da conta</span>
          </button>
        ) : (
          <form
            onSubmit={handleConfirmAccountDeletion}
            className="p-4 rounded-xl bg-[#080808] border border-[#FF202E]/50 space-y-3 max-w-md"
          >
            <p className="text-xs text-neutral-300">
              Esta ação apagará permanentemente todas as suas corridas, gastos e sua conta. Confirme sua senha atual:
            </p>
            {deleteError && (
              <p className="text-xs text-[#FF202E] font-medium">{deleteError}</p>
            )}
            <input
              type="password"
              required
              placeholder="Digite sua senha atual"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#151515] border border-neutral-700 text-xs text-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError(null);
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#202020] text-xs text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deletingAccount}
                className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#FF202E] text-xs font-bold text-white"
              >
                {deletingAccount ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
