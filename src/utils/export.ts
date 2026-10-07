import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Expense, PeriodMetrics, Ride } from '../types/models';
import { formatCentsToBRL, formatDateKey } from './finance';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportReportToCSV(params: {
  periodLabel: string;
  startDateKey: string;
  endDateKey: string;
  metrics: PeriodMetrics;
  rides: Ride[];
  expenses: Expense[];
}) {
  const { periodLabel, startDateKey, endDateKey, metrics, rides, expenses } = params;
  const lines: string[] = [];

  lines.push('GESTÃO CAR - RELATÓRIO FINANCEIRO');
  lines.push(`Período;${escapeCsvCell(periodLabel)} (${formatDateKey(startDateKey)} a ${formatDateKey(endDateKey)})`);
  lines.push('');
  lines.push('RESUMO FINANCEIRO');
  lines.push(`Ganhos;${formatCentsToBRL(metrics.grossRevenueCents)}`);
  lines.push(`Gastos;${formatCentsToBRL(metrics.totalExpensesCents)}`);
  lines.push(`Lucro;${formatCentsToBRL(metrics.netProfitCents)}`);
  lines.push(`Quantidade de Corridas;${metrics.ridesCount}`);
  lines.push(`Dinheiro Recebido;${formatCentsToBRL(metrics.cashCents)}`);
  lines.push(`Pix Recebido;${formatCentsToBRL(metrics.pixCents)}`);
  lines.push(`Cartão Recebido;${formatCentsToBRL(metrics.cardCents)}`);
  lines.push('');

  lines.push('CORRIDAS');
  lines.push('Data;Horário;Forma de Pagamento;Valor (R$)');
  for (const r of rides) {
    lines.push(
      [
        escapeCsvCell(formatDateKey(r.data)),
        escapeCsvCell(r.horario),
        escapeCsvCell(r.formaPagamento),
        escapeCsvCell((r.amountCents / 100).toFixed(2).replace('.', ',')),
      ].join(';')
    );
  }

  lines.push('');
  lines.push('GASTOS');
  lines.push('Data;Categoria;Descrição;Valor (R$)');
  for (const e of expenses) {
    lines.push(
      [
        escapeCsvCell(formatDateKey(e.data)),
        escapeCsvCell(e.categoria),
        escapeCsvCell(e.descricao),
        escapeCsvCell((e.amountCents / 100).toFixed(2).replace('.', ',')),
      ].join(';')
    );
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `gestao-car-relatorio-${startDateKey}-a-${endDateKey}.csv`);
}

export function exportReportToPDF(params: {
  driverName: string;
  periodLabel: string;
  startDateKey: string;
  endDateKey: string;
  metrics: PeriodMetrics;
  rides: Ride[];
  expenses: Expense[];
}) {
  const { driverName, periodLabel, startDateKey, endDateKey, metrics, rides, expenses } = params;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(8, 8, 8);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(255, 32, 46);
  doc.rect(0, 32, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GESTAO CAR', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(210, 210, 210);
  doc.text(
    `Relatorio Financeiro — ${periodLabel} (${formatDateKey(startDateKey)} a ${formatDateKey(endDateKey)})`,
    14,
    21
  );
  doc.text(`Motorista: ${driverName || 'Motorista'}`, 14, 27);

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Resumo Financeiro', 14, 43);

  autoTable(doc, {
    startY: 46,
    head: [['Ganhos', 'Gastos', 'Lucro', 'Corridas', 'Dinheiro', 'Pix', 'Cartao']],
    body: [
      [
        formatCentsToBRL(metrics.grossRevenueCents),
        formatCentsToBRL(metrics.totalExpensesCents),
        formatCentsToBRL(metrics.netProfitCents),
        String(metrics.ridesCount),
        formatCentsToBRL(metrics.cashCents),
        formatCentsToBRL(metrics.pixCents),
        formatCentsToBRL(metrics.cardCents),
      ],
    ],
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [21, 21, 21], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  const afterSummaryY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 68;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Corridas (${rides.length})`, 14, afterSummaryY + 10);

  if (rides.length > 0) {
    autoTable(doc, {
      startY: afterSummaryY + 13,
      head: [['Data', 'Horario', 'Forma de Pagamento', 'Valor']],
      body: rides.map((r) => [
        formatDateKey(r.data),
        r.horario,
        r.formaPagamento,
        formatCentsToBRL(r.amountCents),
      ]),
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [255, 32, 46], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
  }

  const afterRidesY =
    rides.length > 0
      ? (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ||
        afterSummaryY + 25
      : afterSummaryY + 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Gastos (${expenses.length})`, 14, afterRidesY + 10);

  if (expenses.length > 0) {
    autoTable(doc, {
      startY: afterRidesY + 13,
      head: [['Data', 'Categoria', 'Descricao', 'Valor']],
      body: expenses.map((e) => [
        formatDateKey(e.data),
        e.categoria,
        e.descricao || '-',
        formatCentsToBRL(e.amountCents),
      ]),
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [32, 32, 32], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
  }

  doc.save(`gestao-car-relatorio-${startDateKey}-a-${endDateKey}.pdf`);
}
