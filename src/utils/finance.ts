import { Expense, PeriodMetrics, Ride } from '../types/models';

export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data atual YYYY-MM-DD no fuso America/Sao_Paulo.
 */
export function getSaoPauloDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Retorna o horário atual HH:mm no fuso America/Sao_Paulo.
 */
export function getSaoPauloTimeStr(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  const hour = map.hour === '24' ? '00' : map.hour || '00';
  const minute = map.minute || '00';
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

/**
 * Extrai YYYY-MM-DD de uma string ISO ou YYYY-MM-DD.
 */
export function extractDateKeyFromIso(dateTimeIso: string): string {
  const trimmed = (dateTimeIso || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return getSaoPauloDateKey(parsed);
  }
  return getSaoPauloDateKey();
}

/**
 * Converte uma string YYYY-MM-DD ou YYYY-MM-DDTHH:mm em timestamp ms.
 */
export function dateTimeIsoToTimestampMs(dateTimeIso: string): number {
  const trimmed = (dateTimeIso || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const dt = new Date(`${trimmed}T12:00:00-03:00`);
    return Number.isNaN(dt.getTime()) ? Date.now() : dt.getTime();
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const dt = new Date(`${trimmed}:00-03:00`);
    return Number.isNaN(dt.getTime()) ? Date.now() : dt.getTime();
  }
  const dt = new Date(trimmed);
  return Number.isNaN(dt.getTime()) ? Date.now() : dt.getTime();
}

/**
 * Formata YYYY-MM-DD para DD/MM/YYYY.
 */
export function formatDateKey(
  dateKey: string,
  format: 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  if (format === 'YYYY-MM-DD') return dateKey;
  const [y, m, d] = dateKey.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formata centavos inteiros em moeda BRL (ex: 2550 -> "R$ 25,50").
 */
export function formatCentsToBRL(cents: number, hideValues = false): string {
  if (hideValues) return 'R$ ••••';
  if (!Number.isFinite(cents)) return 'R$ 0,00';
  const safeCents = Math.round(cents);
  const value = safeCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte string de valor BRL em centavos inteiros (ex: "25,00" -> 2500).
 */
export function parseBRLInputToCents(rawInput: string): number {
  if (!rawInput || typeof rawInput !== 'string') return 0;
  const cleaned = rawInput.replace(/[^\d.,-]/g, '').trim();
  if (!cleaned) return 0;

  const isNegative = cleaned.startsWith('-');
  const unsigned = cleaned.replace(/-/g, '');

  if (unsigned.includes(',')) {
    const normalized = unsigned.replace(/\./g, '').replace(',', '.');
    const floatVal = Number.parseFloat(normalized);
    if (!Number.isFinite(floatVal)) return 0;
    return Math.round(floatVal * 100) * (isNegative ? -1 : 1);
  }

  const dotParts = unsigned.split('.');
  if (dotParts.length === 2 && dotParts[1].length <= 2) {
    const floatVal = Number.parseFloat(unsigned);
    if (!Number.isFinite(floatVal)) return 0;
    return Math.round(floatVal * 100) * (isNegative ? -1 : 1);
  }

  const plainNumber = Number.parseFloat(unsigned.replace(/\./g, ''));
  if (!Number.isFinite(plainNumber)) return 0;
  return Math.round(plainNumber * 100) * (isNegative ? -1 : 1);
}

/**
 * Formata digitação numérica para máscara brasileira (ex: "2500" -> "25,00").
 */
export function formatCurrencyInputMask(rawValue: string): string {
  const digitsOnly = rawValue.replace(/\D/g, '');
  if (!digitsOnly) return '';
  const cents = Number.parseInt(digitsOnly, 10);
  if (!Number.isFinite(cents) || cents === 0) return '0,00';
  const reais = (cents / 100).toFixed(2);
  const [intPart, decPart] = reais.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedInt},${decPart}`;
}

export function centsToMaskString(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return '';
  return formatCurrencyInputMask(String(Math.round(cents)));
}

export function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const year = utc.getUTCFullYear();
  const month = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekBounds(referenceDateKey: string): {
  startKey: string;
  endKey: string;
  days: string[];
} {
  const [y, m, d] = referenceDateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = utc.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startKey = addDaysToDateKey(referenceDateKey, diffToMonday);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDaysToDateKey(startKey, i));
  }
  return {
    startKey,
    endKey: days[6],
    days,
  };
}

export function getMonthBounds(referenceDateKey: string): {
  startKey: string;
  endKey: string;
  daysInMonth: number;
  yearMonth: string;
  monthLabelPt: string;
} {
  const [y, m] = referenceDateKey.split('-').map(Number);
  const lastDayDate = new Date(Date.UTC(y, m, 0));
  const daysInMonth = lastDayDate.getUTCDate();
  const monthStr = String(m).padStart(2, '0');
  const monthNamesPt = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return {
    startKey: `${y}-${monthStr}-01`,
    endKey: `${y}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`,
    daysInMonth,
    yearMonth: `${y}-${monthStr}`,
    monthLabelPt: `${monthNamesPt[(m - 1) % 12] || ''} de ${y}`,
  };
}

export function shiftMonthKey(referenceDateKey: string, deltaMonths: number): string {
  const [y, m] = referenceDateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1 + deltaMonths, 1));
  const nextY = utc.getUTCFullYear();
  const nextM = String(utc.getUTCMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}-01`;
}

export function getPreviousMonthBounds(referenceDateKey: string) {
  return getMonthBounds(shiftMonthKey(referenceDateKey, -1));
}

export function filterByDateKeyRange<T extends { data: string }>(
  items: T[],
  startKey: string,
  endKey: string
): T[] {
  return items.filter((item) => item.data >= startKey && item.data <= endKey);
}

/**
 * Motor Principal de Cálculo Financeiro:
 * CORRIDAS = GANHOS
 * GASTOS = DESPESAS
 * GANHOS - GASTOS = LUCRO
 * Soma também os recebimentos por forma de pagamento: Dinheiro, Pix e Cartão.
 */
export function calculatePeriodMetrics(rides: Ride[], expenses: Expense[]): PeriodMetrics {
  let grossRevenueCents = 0;
  let cashCents = 0;
  let pixCents = 0;
  let cardCents = 0;

  for (const ride of rides) {
    const amount = Number.isFinite(ride.amountCents) ? Math.round(ride.amountCents) : 0;
    if (amount > 0) {
      grossRevenueCents += amount;
      if (ride.formaPagamento === 'Dinheiro') {
        cashCents += amount;
      } else if (ride.formaPagamento === 'Pix') {
        pixCents += amount;
      } else {
        cardCents += amount;
      }
    }
  }

  let totalExpensesCents = 0;
  for (const expense of expenses) {
    const amount = Number.isFinite(expense.amountCents) ? Math.round(expense.amountCents) : 0;
    if (amount > 0) {
      totalExpensesCents += amount;
    }
  }

  const netProfitCents = grossRevenueCents - totalExpensesCents;

  return {
    grossRevenueCents,
    totalExpensesCents,
    netProfitCents,
    ridesCount: rides.length,
    expensesCount: expenses.length,
    cashCents,
    pixCents,
    cardCents,
  };
}
