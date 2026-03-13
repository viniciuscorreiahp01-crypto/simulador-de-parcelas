import { SimulationResult, AmortizationRecord } from '../types';

export function formatCurrency(value: string): string {
  // Remove non-numeric characters
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return '';

  // Convert to number (cents)
  const numberValue = parseInt(cleanValue, 10) / 100;

  // Format as BRL
  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function toNumberBR(raw: string): number {
  if (!raw) return NaN;
  let s = raw.trim();
  if (!s) return NaN;
  s = s.replace(/\s/g, '').replace(/R\$/gi, '');
  s = s.replace(/\./g, '').replace(/,/g, '.');
  return Number(s);
}

export function brl(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { 
    style: "currency", 
    currency: "BRL",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2 
  });
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function parseParcelas(input: string): number[] {
  const s = String(input || "").trim();
  if (!s) return [];

  const range = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const a = parseInt(range[1], 10);
    const b = parseInt(range[2], 10);
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }

  const parts = s.split(",").map(x => x.trim()).filter(Boolean);
  const nums = parts.map(x => parseInt(x, 10)).filter(n => !isNaN(n));
  return Array.from(new Set(nums)).sort((x, y) => x - y);
}

/**
 * Juros total no SAC: P * i * (n + 1) / 2
 */
/**
 * Adiciona meses a uma data mantendo o dia se possível.
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  
  // Se o mês mudou além do esperado (ex: 31 Jan + 1 mês -> Março), 
  // ajusta para o último dia do mês correto.
  while (d.getMonth() > (targetMonth % 12)) {
    d.setDate(0);
  }
  return d;
}

/**
 * Ajusta a data para o futuro se estiver no passado.
 */
export function ajustarDataParaFuturo(dataString: string): Date {
  // Garantir que temos um formato YYYY-MM-DD
  if (!dataString) return new Date();
  
  let [year, month, day] = dataString.split('-').map(Number);
  let data = new Date(year, month - 1, day, 12, 0, 0);
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (data >= hoje) return data;

  // Ajusta para o ano atual ou próximo
  data.setFullYear(hoje.getFullYear());
  if (data < hoje) {
    data.setFullYear(hoje.getFullYear() + 1);
  }

  return data;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function gerarTabelaAmortizacao(principal: number, n: number, parcela: number, lucro: number): AmortizationRecord[] {
  const tabela: AmortizationRecord[] = [];
  let saldoDevedor = principal;
  const amortBase = principal / n;
  
  // Taxa efetiva para bater com o lucro arredondado
  const taxaEfetiva = lucro / (principal * (n + 1) / 2);

  for (let m = 1; m <= n; m++) {
    let juros = round2((principal - (m - 1) * amortBase) * taxaEfetiva);
    let amortizacao = parcela - juros;

    if (m === n) {
      // Ajuste final para zerar o saldo
      amortizacao = saldoDevedor;
      juros = parcela - amortizacao;
      saldoDevedor = 0;
    } else {
      saldoDevedor = round2(saldoDevedor - amortizacao);
    }

    tabela.push({
      n: m,
      parcela,
      principal: round2(amortizacao),
      juros: round2(juros),
      saldoDevedor: Math.max(0, saldoDevedor)
    });
  }

  return tabela;
}

export function calcularOpcao(principal: number, taxaPerc: number, n: number): SimulationResult {
  const i = taxaPerc / 100;
  const jurosTotal = principal * i * (n + 1) / 2;
  const total = principal + jurosTotal;

  const parcela = Math.round((total / n) / 5) * 5;
  const totalAjustado = parcela * n;
  const lucro = Math.round(totalAjustado - principal);

  const tabelaAmortizacao = gerarTabelaAmortizacao(principal, n, parcela, lucro);

  return { 
    n, 
    parcela, 
    total: Math.round(totalAjustado), 
    lucro,
    tabelaAmortizacao 
  };
}
