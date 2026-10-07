import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  translateFirebaseAuthError,
} from '../lib/firebase';
import {
  Expense,
  ExpenseInput,
  Ride,
  RideInput,
  RidePaymentMethod,
  ToastMessage,
  UserProfile,
} from '../types/models';
import {
  dateTimeIsoToTimestampMs,
  extractDateKeyFromIso,
  getSaoPauloDateKey,
  getSaoPauloTimeStr,
} from '../utils/finance';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  dataLoading: boolean;
  profile: UserProfile | null;
  rides: Ride[];
  expenses: Expense[];
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  addRide: (input: RideInput) => Promise<void>;
  updateRide: (id: string, input: RideInput) => Promise<void>;
  deleteRide: (id: string) => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  saveProfile: (displayName: string) => Promise<void>;
  changePasswordWithReauth: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccountAndAllData: (currentPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

function normalizePaymentMethod(raw: unknown): RidePaymentMethod {
  if (raw === 'Dinheiro' || raw === 'Pix' || raw === 'Cartão') {
    return raw;
  }
  return 'Cartão';
}

function normalizeRideDoc(id: string, raw: Record<string, unknown>, fallbackUid: string): Ride {
  const amountCents =
    typeof raw.amountCents === 'number' && Number.isFinite(raw.amountCents)
      ? Math.round(raw.amountCents)
      : typeof raw.valor === 'number' && Number.isFinite(raw.valor)
      ? Math.round(raw.valor * 100)
      : 0;

  const valor = Math.round(amountCents) / 100;
  const formaPagamento = normalizePaymentMethod(raw.formaPagamento ?? raw.paymentMethod);

  const dataStr =
    typeof raw.data === 'string' && raw.data.length >= 10
      ? raw.data.slice(0, 10)
      : typeof raw.dateKey === 'string' && raw.dateKey.length >= 10
      ? raw.dateKey.slice(0, 10)
      : getSaoPauloDateKey();

  let horarioStr = '00:00';
  if (typeof raw.horario === 'string' && raw.horario.length >= 4) {
    horarioStr = raw.horario;
  } else if (typeof raw.dateTimeIso === 'string' && raw.dateTimeIso.includes('T')) {
    horarioStr = raw.dateTimeIso.split('T')[1]?.slice(0, 5) || '00:00';
  }

  const timestampMs =
    typeof raw.timestampMs === 'number' && Number.isFinite(raw.timestampMs)
      ? raw.timestampMs
      : dateTimeIsoToTimestampMs(`${dataStr}T${horarioStr}`);

  return {
    id,
    uid: typeof raw.uid === 'string' ? raw.uid : fallbackUid,
    valor,
    amountCents,
    formaPagamento,
    data: dataStr,
    horario: horarioStr,
    timestampMs,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeExpenseDoc(id: string, raw: Record<string, unknown>, fallbackUid: string): Expense {
  const amountCents =
    typeof raw.amountCents === 'number' && Number.isFinite(raw.amountCents)
      ? Math.round(raw.amountCents)
      : typeof raw.valor === 'number' && Number.isFinite(raw.valor)
      ? Math.round(raw.valor * 100)
      : 0;

  const valor = Math.round(amountCents) / 100;
  const categoria =
    typeof raw.categoria === 'string' && raw.categoria.trim()
      ? raw.categoria.trim()
      : typeof raw.category === 'string' && raw.category.trim()
      ? raw.category.trim()
      : 'Outros';

  const descricao =
    typeof raw.descricao === 'string'
      ? raw.descricao
      : typeof raw.description === 'string'
      ? raw.description
      : '';

  const dataStr =
    typeof raw.data === 'string' && raw.data.length >= 10
      ? raw.data.slice(0, 10)
      : typeof raw.dateKey === 'string' && raw.dateKey.length >= 10
      ? raw.dateKey.slice(0, 10)
      : getSaoPauloDateKey();

  const timestampMs =
    typeof raw.timestampMs === 'number' && Number.isFinite(raw.timestampMs)
      ? raw.timestampMs
      : dateTimeIsoToTimestampMs(dataStr);

  return {
    id,
    uid: typeof raw.uid === 'string' ? raw.uid : fallbackUid,
    valor,
    amountCents,
    categoria,
    descricao,
    data: dataStr,
    timestampMs,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const mutationLockRef = useRef<Set<string>>(new Set());

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateSafeId('toast');
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ensureUserProfile = useCallback(async (firebaseUser: User, customName?: string) => {
    const uid = firebaseUser.uid;
    const displayName = (
      customName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Motorista'
    )
      .trim()
      .slice(0, 100);
    const email = (firebaseUser.email || 'motorista@gestaocar.app').trim().slice(0, 150);

    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          displayName: displayName || 'Motorista',
          email,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Aviso ao sincronizar perfil do usuário:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setProfile(null);
        setRides([]);
        setExpenses([]);
        setDataLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    setDataLoading(true);
    const uid = user.uid;

    // Ensure profile exists without blocking rides/expenses listeners
    ensureUserProfile(user).catch(() => {});

    const userRef = doc(db, 'users', uid);
    const unsubProfile = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile({
            uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Motorista',
            email: user.email || '',
          });
        }
      },
      (err) => {
        console.error('Erro ao ler perfil do Firestore:', err);
      }
    );

    const ridesQuery = query(collection(db, 'users', uid, 'rides'), where('uid', '==', uid));
    const unsubRides = onSnapshot(
      ridesQuery,
      (snap) => {
        const list: Ride[] = snap.docs.map((d) =>
          normalizeRideDoc(d.id, d.data() as Record<string, unknown>, uid)
        );
        list.sort((a, b) => b.timestampMs - a.timestampMs);
        setRides(list);
        setDataLoading(false);
      },
      (err) => {
        console.error('Erro ao carregar corridas do Firestore:', err);
        setDataLoading(false);
      }
    );

    const expensesQuery = query(
      collection(db, 'users', uid, 'expenses'),
      where('uid', '==', uid)
    );
    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snap) => {
        const list: Expense[] = snap.docs.map((d) =>
          normalizeExpenseDoc(d.id, d.data() as Record<string, unknown>, uid)
        );
        list.sort((a, b) => b.timestampMs - a.timestampMs);
        setExpenses(list);
      },
      (err) => {
        console.error('Erro ao carregar gastos do Firestore:', err);
      }
    );

    return () => {
      unsubProfile();
      unsubRides();
      unsubExpenses();
    };
  }, [authReady, user, ensureUserProfile]);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      addToast({
        type: 'success',
        title: 'Bem-vindo de volta!',
      });
    } catch (error) {
      throw new Error(translateFirebaseAuthError(error));
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    try {
      const cleanName = name.trim().slice(0, 100);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
      }
      await ensureUserProfile(cred.user, cleanName);
      addToast({
        type: 'success',
        title: 'Conta criada com sucesso!',
      });
    } catch (error) {
      throw new Error(translateFirebaseAuthError(error));
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      addToast({
        type: 'info',
        title: 'E-mail de recuperação enviado!',
      });
    } catch (error) {
      throw new Error(translateFirebaseAuthError(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    addToast({
      type: 'info',
      title: 'Sessão encerrada com segurança.',
    });
  };

  const addRide = async (input: RideInput) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) {
      throw new Error('Não foi possível salvar a corrida. Tente novamente.');
    }
    if (mutationLockRef.current.has('addRide')) return;
    mutationLockRef.current.add('addRide');

    const uid = currentUser.uid;
    const rideId = generateSafeId('ride');

    try {
      const now = new Date();
      const data = getSaoPauloDateKey(now);
      const horario = getSaoPauloTimeStr(now);
      const timestampMs = now.getTime();
      const amountCents = Math.max(1, Math.min(100000000, Math.round(input.amountCents)));
      const valor = Math.round(amountCents) / 100;

      const payload = {
        id: rideId,
        uid,
        valor,
        amountCents,
        formaPagamento: input.formaPagamento,
        data,
        horario,
        timestampMs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', uid, 'rides', rideId), payload);

      // Atualização otimista imediata caso o listener leve alguns milissegundos
      setRides((prev) => {
        if (prev.some((r) => r.id === rideId)) return prev;
        const next: Ride[] = [
          {
            id: rideId,
            uid,
            valor,
            amountCents,
            formaPagamento: input.formaPagamento,
            data,
            horario,
            timestampMs,
          },
          ...prev,
        ];
        next.sort((a, b) => b.timestampMs - a.timestampMs);
        return next;
      });

      addToast({
        type: 'success',
        title: 'Corrida adicionada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar corrida no Firebase Firestore:', error);
      throw new Error('Não foi possível salvar a corrida. Tente novamente.');
    } finally {
      mutationLockRef.current.delete('addRide');
    }
  };

  const updateRide = async (rideId: string, input: RideInput) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) {
      throw new Error('Não foi possível salvar a corrida. Tente novamente.');
    }
    const uid = currentUser.uid;
    const existingRide = rides.find((r) => r.id === rideId);

    try {
      const amountCents = Math.max(1, Math.min(100000000, Math.round(input.amountCents)));
      const valor = Math.round(amountCents) / 100;
      const data = existingRide?.data || getSaoPauloDateKey();
      const horario = existingRide?.horario || getSaoPauloTimeStr();
      const timestampMs = existingRide?.timestampMs || Date.now();

      await setDoc(
        doc(db, 'users', uid, 'rides', rideId),
        {
          id: rideId,
          uid,
          valor,
          amountCents,
          formaPagamento: input.formaPagamento,
          data,
          horario,
          timestampMs,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setRides((prev) =>
        prev.map((r) =>
          r.id === rideId
            ? {
                ...r,
                valor,
                amountCents,
                formaPagamento: input.formaPagamento,
              }
            : r
        )
      );

      addToast({
        type: 'success',
        title: 'Corrida atualizada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar corrida no Firebase Firestore:', error);
      throw new Error('Não foi possível salvar a corrida. Tente novamente.');
    }
  };

  const deleteRide = async (rideId: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const uid = currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'rides', rideId));
      setRides((prev) => prev.filter((r) => r.id !== rideId));
      addToast({
        type: 'info',
        title: 'Corrida excluída com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir corrida no Firebase Firestore:', error);
      throw new Error('Não foi possível excluir a corrida.');
    }
  };

  const addExpense = async (input: ExpenseInput) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) {
      throw new Error('Não foi possível salvar o gasto. Tente novamente.');
    }
    if (mutationLockRef.current.has('addExpense')) return;
    mutationLockRef.current.add('addExpense');

    const uid = currentUser.uid;
    const expenseId = generateSafeId('exp');

    try {
      const data = extractDateKeyFromIso(input.data || getSaoPauloDateKey());
      const timestampMs = dateTimeIsoToTimestampMs(data);
      const amountCents = Math.max(1, Math.min(100000000, Math.round(input.amountCents)));
      const valor = Math.round(amountCents) / 100;
      const categoria = input.categoria.trim().slice(0, 60) || 'Outros';
      const descricao = (input.descricao || '').trim().slice(0, 200);

      const payload = {
        id: expenseId,
        uid,
        valor,
        amountCents,
        categoria,
        descricao,
        data,
        timestampMs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', uid, 'expenses', expenseId), payload);

      setExpenses((prev) => {
        if (prev.some((e) => e.id === expenseId)) return prev;
        const next: Expense[] = [
          {
            id: expenseId,
            uid,
            valor,
            amountCents,
            categoria,
            descricao,
            data,
            timestampMs,
          },
          ...prev,
        ];
        next.sort((a, b) => b.timestampMs - a.timestampMs);
        return next;
      });

      addToast({
        type: 'success',
        title: 'Gasto adicionado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar gasto no Firebase Firestore:', error);
      throw new Error('Não foi possível salvar o gasto. Tente novamente.');
    } finally {
      mutationLockRef.current.delete('addExpense');
    }
  };

  const updateExpense = async (expenseId: string, input: ExpenseInput) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) {
      throw new Error('Não foi possível salvar o gasto. Tente novamente.');
    }
    const uid = currentUser.uid;

    try {
      const data = extractDateKeyFromIso(input.data || getSaoPauloDateKey());
      const timestampMs = dateTimeIsoToTimestampMs(data);
      const amountCents = Math.max(1, Math.min(100000000, Math.round(input.amountCents)));
      const valor = Math.round(amountCents) / 100;
      const categoria = input.categoria.trim().slice(0, 60) || 'Outros';
      const descricao = (input.descricao || '').trim().slice(0, 200);

      await setDoc(
        doc(db, 'users', uid, 'expenses', expenseId),
        {
          id: expenseId,
          uid,
          valor,
          amountCents,
          categoria,
          descricao,
          data,
          timestampMs,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                valor,
                amountCents,
                categoria,
                descricao,
                data,
                timestampMs,
              }
            : e
        )
      );

      addToast({
        type: 'success',
        title: 'Gasto atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar gasto no Firebase Firestore:', error);
      throw new Error('Não foi possível salvar o gasto. Tente novamente.');
    }
  };

  const deleteExpense = async (expenseId: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const uid = currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'expenses', expenseId));
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      addToast({
        type: 'info',
        title: 'Gasto excluído com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir gasto no Firebase Firestore:', error);
      throw new Error('Não foi possível excluir o gasto.');
    }
  };

  const saveProfile = async (displayName: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const uid = currentUser.uid;
    const cleanName = displayName.trim().slice(0, 100) || 'Motorista';
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          displayName: cleanName,
          email: (currentUser.email || profile?.email || 'motorista@gestaocar.app').slice(0, 150),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await updateProfile(currentUser, { displayName: cleanName });
      addToast({
        type: 'success',
        title: 'Nome atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      throw new Error('Não foi possível atualizar o perfil.');
    }
  };

  const changePasswordWithReauth = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error('Usuário não autenticado.');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      addToast({
        type: 'success',
        title: 'Senha alterada com sucesso!',
      });
    } catch (error) {
      throw new Error(translateFirebaseAuthError(error));
    }
  };

  const deleteAccountAndAllData = async (currentPassword: string) => {
    if (!user || !user.email) throw new Error('Usuário não autenticado.');
    const uid = user.uid;
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      const ridesSnap = await getDocs(
        query(collection(db, 'users', uid, 'rides'), where('uid', '==', uid))
      );
      for (const rDoc of ridesSnap.docs) {
        await deleteDoc(rDoc.ref);
      }

      const expSnap = await getDocs(
        query(collection(db, 'users', uid, 'expenses'), where('uid', '==', uid))
      );
      for (const eDoc of expSnap.docs) {
        await deleteDoc(eDoc.ref);
      }

      await deleteDoc(doc(db, 'users', uid)).catch(() => {});
      await deleteUser(user);
    } catch (error) {
      throw new Error(translateFirebaseAuthError(error));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        dataLoading,
        profile,
        rides,
        expenses,
        toasts,
        addToast,
        removeToast,
        loginWithEmail,
        registerWithEmail,
        sendPasswordReset,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return ctx;
}
