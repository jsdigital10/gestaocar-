export type RidePaymentMethod = 'Dinheiro' | 'Pix' | 'Cartão';

export const RIDE_PAYMENT_METHODS: RidePaymentMethod[] = [
  'Dinheiro',
  'Pix',
  'Cartão',
];

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Combustível',
  'Alimentação',
  'Manutenção',
  'Lavagem',
  'Estacionamento',
  'Pedágio',
  'Outros',
];

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Ride {
  id: string;
  uid: string;
  /** Valor em reais (ex: 25.5) */
  valor: number;
  /** Valor em centavos inteiros (ex: 2550) para cálculo exato */
  amountCents: number;
  formaPagamento: RidePaymentMethod;
  /** Data em America/Sao_Paulo: YYYY-MM-DD */
  data: string;
  /** Horário em America/Sao_Paulo: HH:mm */
  horario: string;
  /** Timestamp em milissegundos para ordenação cronológica */
  timestampMs: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RideInput {
  amountCents: number;
  formaPagamento: RidePaymentMethod;
}

export interface Expense {
  id: string;
  uid: string;
  /** Valor em reais (ex: 50.0) */
  valor: number;
  /** Valor em centavos inteiros (ex: 5000) */
  amountCents: number;
  categoria: string;
  descricao: string;
  /** Data em America/Sao_Paulo: YYYY-MM-DD */
  data: string;
  timestampMs: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExpenseInput {
  amountCents: number;
  categoria: string;
  descricao: string;
  data: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'rides'
  | 'expenses'
  | 'reports'
  | 'profile';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

export interface PeriodMetrics {
  grossRevenueCents: number;
  totalExpensesCents: number;
  netProfitCents: number;
  ridesCount: number;
  expensesCount: number;
  cashCents: number;
  pixCents: number;
  cardCents: number;
}
