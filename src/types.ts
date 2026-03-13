export interface AmortizationRecord {
  n: number;
  parcela: number;
  principal: number;
  juros: number;
  saldoDevedor: number;
}

export interface SimulationResult {
  n: number;
  parcela: number;
  total: number;
  lucro: number;
  tabelaAmortizacao: AmortizationRecord[];
}

export interface SimulationInput {
  valor: number;
  juros: number;
  parcelas: number[];
}
