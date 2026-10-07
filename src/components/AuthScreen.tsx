import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firebaseConfig } from '../lib/firebase';
import { APP_LOGO_URL, BrandLogo } from './BrandLogo';

type AuthMode = 'login' | 'register' | 'reset';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, registerWithEmail, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      try {
        await sendPasswordReset(cleanEmail);
        setSuccessMsg(
          `Enviamos um link de redefinição de senha para ${cleanEmail}. Verifique sua caixa de entrada.`
        );
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Erro ao solicitar redefinição.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Informe seu nome.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas informadas não coincidem.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(cleanEmail, password);
      } else {
        await registerWithEmail(name.trim(), cleanEmail, password);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const showProviderNotice =
    errorMsg && errorMsg.includes('Sign-in method > Email/Password');

  return (
    <div className="min-h-dvh w-full bg-[#080808] text-white flex flex-col lg:flex-row relative overflow-hidden">
      {/* Painel Esquerdo Desktop */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 xl:p-16 border-r border-neutral-900 bg-gradient-to-br from-[#080808] via-[#101010] to-[#151515]">
        <div>
          <BrandLogo size="lg" />
        </div>

        <div className="max-w-xl space-y-6 my-auto">
          <p className="text-xs font-semibold tracking-wider text-[#FF202E]">
            CONTROLE FINANCEIRO PARA MOTORISTAS
          </p>
          <h1
            className="font-display text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Registre seus ganhos, controle seus gastos e acompanhe seu lucro real.
          </h1>
          <p className="text-base text-neutral-400 leading-relaxed">
            Simples, rápido e direto ao ponto: lance suas corridas em segundos por Dinheiro, Pix ou Cartão e saiba exatamente quanto sobrou no seu bolso.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-[#151515] border border-neutral-800/90">
              <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-white">Ganhos Rápidos</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Dinheiro, Pix e Cartão em poucos toques
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#151515] border border-neutral-800/90">
              <Wallet className="w-5 h-5 text-[#FF202E] mb-2" />
              <p className="text-sm font-bold text-white">Lucro Automático</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ganhos menos gastos em tempo real
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#151515] border border-neutral-800/90">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-white">Salvo na Nuvem</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Dados exclusivos da sua conta no Firebase
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-neutral-500 flex items-center justify-between">
          <span>Gestão Car • Controle Financeiro</span>
          <span>Moeda: BRL (R$)</span>
        </div>
      </div>

      {/* Formulário de Autenticação */}
      <div className="flex-1 flex flex-col justify-center items-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Cabeçalho Mobile */}
          <div className="flex flex-col items-center text-center mb-7 lg:hidden">
            <img
              src={APP_LOGO_URL}
              alt="Logo Gestão Car"
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-3xl object-contain bg-[#080808] border border-neutral-800 shadow-2xl shadow-[#FF202E]/25 mb-3"
            />
            <span className="font-display text-2xl font-extrabold tracking-tight text-white">
              GESTÃO <span className="text-[#FF202E]">CAR</span>
            </span>
            <p className="text-xs text-neutral-400 mt-1">
              Controle de ganhos, gastos e lucro para motoristas
            </p>
          </div>

          <div className="rounded-3xl bg-[#151515] border border-neutral-800/90 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FF202E] to-transparent" />

            {mode !== 'reset' && (
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#080808] border border-neutral-800 mb-6">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`min-h-[42px] rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#FF202E] text-white shadow-md shadow-[#FF202E]/25'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Entrar na Conta
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`min-h-[42px] rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#FF202E] text-white shadow-md shadow-[#FF202E]/25'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Criar Conta
                </button>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                {mode === 'login' && 'Acesse sua conta'}
                {mode === 'register' && 'Crie sua conta'}
                {mode === 'reset' && 'Recuperar senha'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {mode === 'login' && 'Entre com seu e-mail e senha cadastrados.'}
                {mode === 'register' && 'Seus registros ficam salvos com segurança no Firebase.'}
                {mode === 'reset' && 'Informe seu e-mail para redefinir sua senha.'}
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-[#FF202E]/10 border border-[#FF202E]/40 text-xs text-red-200 space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#FF202E] shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                {showProviderNotice && (
                  <div className="pt-2 border-t border-[#FF202E]/20 text-[11px] text-neutral-300 leading-relaxed">
                    <strong>Como ativar no Firebase Console:</strong> Acesse{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-white font-semibold"
                    >
                      Authentication &gt; Sign-in method
                    </a>{' '}
                    no projeto <span className="font-mono">{firebaseConfig.projectId}</span>, clique em{' '}
                    <strong>E-mail/senha (Email/Password)</strong>, ative a chave <em>Enable</em> e clique em <em>Save</em>.
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Seu nome *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Ex: Carlos Mendes"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-sm text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    maxLength={150}
                    autoComplete="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-sm text-white"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-password" className="text-xs font-medium text-neutral-300">
                      Senha *
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset')}
                        className="text-xs font-medium text-[#FF202E] hover:underline cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="Mínimo de 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full min-h-[48px] pl-10 pr-11 py-2.5 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-confirm" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Confirmar senha *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-xl bg-[#202020] border border-neutral-700 focus:border-[#FF202E] focus:outline-none text-sm text-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[50px] mt-2 px-6 py-3 rounded-xl bg-[#FF202E] hover:bg-[#e01522] disabled:opacity-50 text-sm font-bold text-white shadow-lg shadow-[#FF202E]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Aguarde...'
                    : mode === 'login'
                    ? 'Entrar no Gestão Car'
                    : mode === 'register'
                    ? 'Criar Minha Conta'
                    : 'Enviar Link de Recuperação'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {mode === 'reset' && (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-semibold text-neutral-300 hover:text-white underline cursor-pointer"
                >
                  Voltar para o login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
