import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

/**
 * Supports both VITE_FIREBASE_* environment variables (for Vercel / external deployments)
 * and automatic fallback to firebase-applet-config.json (provisioned in AI Studio).
 */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

export const firestoreDatabaseId =
  env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || '(default)';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Por favor, verifique a configuração do seu projeto Firebase.');
    }
  }
}

// Run connection check on boot in browser environment
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {});
}

export function translateFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  const msg = error instanceof Error ? error.message : String(error);

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return 'E-mail ou senha incorretos. Verifique os dados informados e tente novamente.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Este endereço de e-mail já está cadastrado. Tente entrar na sua conta ou recuperar a senha.';
  }
  if (code === 'auth/weak-password') {
    return 'A senha escolhida é muito fraca. Utilize no mínimo 6 caracteres com letras e números.';
  }
  if (code === 'auth/invalid-email') {
    return 'O formato do e-mail informado é inválido.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Muitas tentativas seguidas. Por segurança, aguarde alguns instantes antes de tentar novamente.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Falha de conexão com a internet. Verifique sua rede e tente novamente.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'Por segurança, confirme sua senha atual para realizar esta alteração sensível.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'O provedor E-mail/Senha ainda não foi ativado no Console do Firebase (Authentication > Sign-in method > Email/Password).';
  }
  if (msg.includes('Quota exceeded')) {
    return 'Limite diário gratuito do banco de dados atingido. A cota será renovada no próximo dia.';
  }
  return 'Ocorreu um erro ao processar sua solicitação. Verifique seus dados e tente novamente.';
}
