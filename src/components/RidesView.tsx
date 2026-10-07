import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Car,
  CreditCard,
  Edit3,
  Plus,
  QrCode,
  Trash2,
} from 'lucide-react';
import {
  RIDE_PAYMENT_METHODS,
  Ride,
} from '../types/models';
import {
  calculatePeriodMetrics,
  formatCentsToBRL,
  formatDateKey,
} from '../utils/finance';

interface RidesViewProps {
  rides: Ride[];
  onOpenAddRide: () => void;
  onEditRide: (ride: Ride) => void;
  onRequestDeleteRide: (ride: Ride) => void;
}

export const RidesView: React.FC<RidesViewProps> = ({
  rides,
  onOpenAddRide,
  onEditRide,
  onRequestDeleteRide,
}) => {
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const filteredRides = useMemo(() => {
    if (paymentFilter === 'ALL') return rides;
    return rides.filter((r) => r.formaPagamento === paymentFilter);
  }, [rides, paymentFilter]);

  const metrics = useMemo(
    () => calculatePeriodMetrics(filteredRides, []),
    [filteredRides]
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
            Corridas
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Histórico de corridas registradas (Data, Horário, Valor e Forma de pagamento)
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddRide}
          className="min-h-[48px] px-5 py-3 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-sm font-bold text-white shadow-lg shadow-[#FF202E]/25 flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Corrida</span>
        </button>
      </div>

      {/* Resumo de Recebimentos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-4">
          <span className="text-xs text-neutral-400">Ganhos ({filteredRides.length} corridas)</span>
          <p className="text-xl font-extrabold text-emerald-400 font-mono-tabular mt-1">
            {formatCentsToBRL(metrics.grossRevenueCents)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Dinheiro</span>
            <p className="text-lg font-extrabold text-white font-mono-tabular mt-1">
              {formatCentsToBRL(metrics.cashCents)}
            </p>
          </div>
          <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Pix</span>
            <p className="text-lg font-extrabold text-white font-mono-tabular mt-1">
              {formatCentsToBRL(metrics.pixCents)}
            </p>
          </div>
          <QrCode className="w-5 h-5 text-[#FF202E] shrink-0" />
        </div>
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Cartão</span>
            <p className="text-lg font-extrabold text-white font-mono-tabular mt-1">
              {formatCentsToBRL(metrics.cardCents)}
            </p>
          </div>
          <CreditCard className="w-5 h-5 text-neutral-300 shrink-0" />
        </div>
      </div>

      {/* Filtro Simples por Forma de Recebimento */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPaymentFilter('ALL')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            paymentFilter === 'ALL'
              ? 'bg-[#FF202E] text-white'
              : 'bg-[#151515] border border-neutral-800 text-neutral-300 hover:text-white'
          }`}
        >
          Todas
        </button>
        {RIDE_PAYMENT_METHODS.map((pm) => (
          <button
            key={pm}
            type="button"
            onClick={() => setPaymentFilter(pm)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              paymentFilter === pm
                ? 'bg-[#FF202E] text-white'
                : 'bg-[#151515] border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            {pm}
          </button>
        ))}
      </div>

      {/* Lista de Corridas */}
      {filteredRides.length === 0 ? (
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#202020] flex items-center justify-center mx-auto">
            <Car className="w-6 h-6 text-[#FF202E]" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhuma corrida registrada</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Clique em Adicionar Corrida para registrar o valor recebido e a forma de pagamento.
          </p>
          <button
            type="button"
            onClick={onOpenAddRide}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF202E] hover:bg-[#e01522] text-xs font-bold text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Corrida</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#151515] border border-neutral-800 overflow-hidden divide-y divide-neutral-800/80">
          {filteredRides.map((ride) => (
            <div
              key={ride.id}
              className="p-4 sm:p-5 hover:bg-[#202020]/50 transition-colors flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <span className="font-bold text-white">{ride.formaPagamento}</span>
                  <span aria-hidden="true" className="text-neutral-600">
                    ·
                  </span>
                  <span className="text-neutral-400 font-mono-tabular">
                    Data: {formatDateKey(ride.data)}
                  </span>
                  <span aria-hidden="true" className="text-neutral-600">
                    ·
                  </span>
                  <span className="text-neutral-400 font-mono-tabular">
                    Horário: {ride.horario}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono-tabular">
                  {formatCentsToBRL(ride.amountCents)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditRide(ride)}
                    aria-label="Editar corrida"
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-[#202020] hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDeleteRide(ride)}
                    aria-label="Excluir corrida"
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-[#202020] hover:bg-[#FF202E]/20 text-neutral-400 hover:text-[#FF202E] flex items-center justify-center transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
