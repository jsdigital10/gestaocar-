import { describe, expect, it } from 'vitest';
import { translateFirebaseAuthError } from '../lib/firebase';
import { Expense, Ride } from '../types/models';
import {
  addDaysToDateKey,
  calculatePeriodMetrics,
  centsToMaskString,
  dateTimeIsoToTimestampMs,
  extractDateKeyFromIso,
  filterByDateKeyRange,
  formatCentsToBRL,
  formatCurrencyInputMask,
  formatDateKey,
  getMonthBounds,
  getPreviousMonthBounds,
  getWeekBounds,
  parseBRLInputToCents,
  shiftMonthKey,
} from './finance';

function createSampleRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: 'ride_1',
    uid: 'user_A',
    valor: 25,
    amountCents: 2500,
    formaPagamento: 'Pix',
    data: '2026-10-06',
    horario: '14:30',
    timestampMs: dateTimeIsoToTimestampMs('2026-10-06T14:30'),
    ...overrides,
  };
}

function createSampleExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp_1',
    uid: 'user_A',
    valor: 50,
    amountCents: 5000,
    categoria: 'Combustível',
    descricao: 'Abastecimento',
    data: '2026-10-06',
    timestampMs: dateTimeIsoToTimestampMs('2026-10-06'),
    ...overrides,
  };
}

describe('Gestão Car — Testes de Ganhos, Gastos, Lucro e Formas de Recebimento', () => {
  it('1. Tradução de mensagens de autenticação e rede do Firebase', () => {
    expect(translateFirebaseAuthError({ code: 'auth/invalid-credential' })).toContain(
      'E-mail ou senha incorretos'
    );
    expect(translateFirebaseAuthError({ code: 'auth/email-already-in-use' })).toContain(
      'já está cadastrado'
    );
    expect(translateFirebaseAuthError({ code: 'auth/weak-password' })).toContain(
      'muito fraca'
    );
    expect(translateFirebaseAuthError({ code: 'auth/network-request-failed' })).toContain(
      'Falha de conexão'
    );
  });

  it('2. Isolamento de dados por UID do usuário autenticado', () => {
    const allRides = [
      createSampleRide({ id: 'r1', uid: 'driver_1', amountCents: 4000 }),
      createSampleRide({ id: 'r2', uid: 'driver_2', amountCents: 9000 }),
    ];
    const driver1Only = allRides.filter((r) => r.uid === 'driver_1');
    const metrics = calculatePeriodMetrics(driver1Only, []);
    expect(metrics.ridesCount).toBe(1);
    expect(metrics.grossRevenueCents).toBe(4000);
  });

  it('3. Cálculo de Ganhos, Gastos, Lucro (Ganhos - Gastos) e Formas de Recebimento (Dinheiro, Pix, Cartão)', () => {
    let rides: Ride[] = [
      createSampleRide({ id: 'r1', amountCents: 35000, formaPagamento: 'Dinheiro' }),
      createSampleRide({ id: 'r2', amountCents: 58000, formaPagamento: 'Pix' }),
      createSampleRide({ id: 'r3', amountCents: 42000, formaPagamento: 'Cartão' }),
    ];
    const expenses: Expense[] = [
      createSampleExpense({ id: 'e1', amountCents: 30000, categoria: 'Combustível' }),
      createSampleExpense({ id: 'e2', amountCents: 5000, categoria: 'Alimentação' }),
    ];

    let metrics = calculatePeriodMetrics(rides, expenses);
    expect(metrics.grossRevenueCents).toBe(135000); // R$ 1.350,00
    expect(metrics.cashCents).toBe(35000); // Dinheiro: R$ 350,00
    expect(metrics.pixCents).toBe(58000); // Pix: R$ 580,00
    expect(metrics.cardCents).toBe(42000); // Cartão: R$ 420,00
    expect(metrics.cashCents + metrics.pixCents + metrics.cardCents).toBe(
      metrics.grossRevenueCents
    );
    expect(metrics.totalExpensesCents).toBe(35000); // R$ 350,00
    expect(metrics.netProfitCents).toBe(100000); // Lucro = R$ 1.000,00

    // Edição de corrida (r1 passa de R$ 350,00 para R$ 400,00)
    rides = rides.map((r) => (r.id === 'r1' ? { ...r, amountCents: 40000 } : r));
    metrics = calculatePeriodMetrics(rides, expenses);
    expect(metrics.grossRevenueCents).toBe(140000);
    expect(metrics.cashCents).toBe(40000);
    expect(metrics.netProfitCents).toBe(105000);

    // Exclusão de corrida (remove r3)
    rides = rides.filter((r) => r.id !== 'r3');
    metrics = calculatePeriodMetrics(rides, expenses);
    expect(metrics.ridesCount).toBe(2);
    expect(metrics.grossRevenueCents).toBe(98000);
    expect(metrics.cardCents).toBe(0);
    expect(metrics.netProfitCents).toBe(63000);
  });

  it('4. Resumo Semanal e Mensal com navegação entre meses', () => {
    const week = getWeekBounds('2025-12-31');
    expect(week.startKey).toBe('2025-12-29');
    expect(week.endKey).toBe('2026-01-04');

    const oct2026 = getMonthBounds('2026-10-06');
    expect(oct2026.startKey).toBe('2026-10-01');
    expect(oct2026.endKey).toBe('2026-10-31');

    const prevMonth = getPreviousMonthBounds('2026-10-06');
    expect(prevMonth.yearMonth).toBe('2026-09');
    expect(shiftMonthKey('2026-01-15', -1)).toBe('2025-12-01');

    const rides = [
      createSampleRide({ id: 'r1', data: '2026-10-02', amountCents: 5000 }),
      createSampleRide({ id: 'r2', data: '2026-09-20', amountCents: 8000 }),
    ];
    const octRides = filterByDateKeyRange(rides, oct2026.startKey, oct2026.endKey);
    expect(octRides).toHaveLength(1);
    expect(octRides[0].amountCents).toBe(5000);
  });

  it('5. Tratamento de valores monetários em reais (R$) e datas', () => {
    expect(parseBRLInputToCents('R$ 25,00')).toBe(2500);
    expect(parseBRLInputToCents('1.250,50')).toBe(125050);
    expect(formatCurrencyInputMask('2500')).toBe('25,00');
    expect(centsToMaskString(2500)).toBe('25,00');
    expect(formatCentsToBRL(2500)).toContain('25,00');
    expect(formatDateKey('2026-10-06')).toBe('06/10/2026');
    expect(extractDateKeyFromIso('2026-10-06T18:45')).toBe('2026-10-06');
    expect(addDaysToDateKey('2026-10-31', 1)).toBe('2026-11-01');
  });
});
