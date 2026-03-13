/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { 
  Moon, 
  Sun, 
  Calculator, 
  Copy, 
  Check, 
  Smartphone, 
  Zap,
  TrendingUp,
  Wallet,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Lock,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  toNumberBR, 
  brl, 
  parseParcelas, 
  calcularOpcao,
  formatCurrency,
  addMonths,
  formatDate,
  ajustarDataParaFuturo
} from './utils/calculations';
import { SimulationResult } from './types';

import { EntryFlow } from './components/EntryFlow';

// Remove internal LoginScreen since it's now in components/LoginScreen.tsx

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('sf_session') === 'active');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('sf_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [juros, setJuros] = useState('');
  const [parcelas, setParcelas] = useState('');
  const [parcelaManual, setParcelaManual] = useState('');
  const [dataPrimeiroPagamento, setDataPrimeiroPagamento] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [resultado, setResultado] = useState('');
  const [opcoesGeradas, setOpcoesGeradas] = useState<SimulationResult[]>([]);
  const [simulationStatus, setSimulationStatus] = useState<{ message: string; isError: boolean }>({ message: 'Pronto para simular.', isError: false });
  const [kpis, setKpis] = useState<{ total: number; lucro: number }>({ total: NaN, lucro: NaN });
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SimulationResult | null>(null);
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  const inputValorRef = useRef<HTMLInputElement>(null);
  const inputJurosRef = useRef<HTMLInputElement>(null);
  const inputParcelasRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('sf_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  const handleLogout = () => {
    localStorage.removeItem('sf_session');
    setIsLoggedIn(false);
  };

  const handleGerar = useCallback(() => {
    setIsLoading(true);
    setSimulationStatus({ message: 'Calculando...', isError: false });

    setTimeout(() => {
      try {
        const principal = Math.round(toNumberBR(valor));
        const taxa = toNumberBR(juros);
        const lista = parseParcelas(parcelas);
        const manualVal = toNumberBR(parcelaManual);

        if (!isFinite(principal) || principal <= 0) {
          setSimulationStatus({ message: 'Informe um valor válido.', isError: true });
          setIsLoading(false);
          return;
        }
        if (!isFinite(taxa) || taxa <= 0) {
          setSimulationStatus({ message: 'Informe uma taxa válida.', isError: true });
          setIsLoading(false);
          return;
        }
        if (!lista.length) {
          setSimulationStatus({ message: 'Informe as parcelas.', isError: true });
          setIsLoading(false);
          return;
        }

        const resultados = lista.map(n => {
          const res = calcularOpcao(principal, taxa, n);
          if (manualVal > 0) {
            const totalManual = manualVal * n;
            return {
              ...res,
              parcela: manualVal,
              total: totalManual,
              lucro: totalManual - principal
            };
          }
          return res;
        });
        setOpcoesGeradas(resultados);
        const base = resultados[0];
        setKpis({ total: base.total, lucro: base.lucro });

        if (resultados.length === 1) {
          gerarPropostaFinal(resultados[0], principal, taxa);
        } else {
          const texto = `📄 *SIMULAÇÃO${nome ? ' ' + nome.toUpperCase() : ''}*\n\n💰 Valor solicitado: ${brl(principal)}\n📈 Taxa aplicada: ${taxa}% a.m\n\n💳 Opções disponíveis:\n\n${resultados.map(r => `➡️ ${r.n}x de ${brl(r.parcela)}`).join("\n")}\n\n📌 Escolha uma opção acima.`;
          setResultado(texto);
          setSimulationStatus({ message: 'Opções geradas. Selecione uma! ✅', isError: false });
        }
      } catch (err) {
        setSimulationStatus({ message: 'Erro ao gerar simulação.', isError: true });
      } finally {
        setIsLoading(false);
      }
    }, 400);
  }, [valor, juros, parcelas, parcelaManual, nome, dataPrimeiroPagamento]);

  const gerarPropostaFinal = (r: SimulationResult, p?: number, t?: number) => {
    const principal = p ?? Math.round(toNumberBR(valor));
    const taxa = t ?? toNumberBR(juros);
    
    // USAR A DATA SELECIONADA (com ajuste para o futuro se necessário)
    const dataBase = ajustarDataParaFuturo(dataPrimeiroPagamento);
    
    let cronograma = "";
    for (let i = 0; i < r.n; i++) {
      const dataParcela = addMonths(dataBase, i);
      cronograma += `📅 Parcela ${String(i + 1).padStart(2, '0')}/${String(r.n).padStart(2, '0')}: ${formatDate(dataParcela)} - ${brl(r.parcela)}\n`;
    }

    const prazoTexto = r.n === 1 ? 'À vista' : `${r.n} meses`;
    const obsTexto = r.n === 1 ? 'Parcela fixa mensal.' : 'Parcelas fixas mensais.';

    const texto = `📄 *PROPOSTA${nome ? ' ' + nome.toUpperCase() : ''}*\n\n` +
      `💰 *Valor:* ${brl(principal)}\n` +
      `📈 *Taxa:* ${taxa}% a.m\n` +
      `📅 *Prazo:* ${prazoTexto}\n\n` +
      `💳 *CRONOGRAMA DE PAGAMENTOS:*\n\n` +
      cronograma +
      `\n📌 *Observação:* ${obsTexto}`;
      
    setResultado(texto);
    setKpis({ total: r.total, lucro: r.lucro });
    setSelectedOption(r);
    setSimulationStatus({ message: `Proposta de ${r.n}x gerada! ✅`, isError: false });
  };

  const handleCopiar = async () => {
    if (!resultado.trim()) return;
    try {
      await navigator.clipboard.writeText(resultado);
      setIsCopied(true);
      setSimulationStatus({ message: 'Copiado ✅', isError: false });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      setSimulationStatus({ message: 'Erro ao copiar.', isError: true });
    }
  };

  const handleLimpar = () => {
    setNome('');
    setValor('');
    setJuros('');
    setParcelas('');
    setParcelaManual('');
    setResultado('');
    setOpcoesGeradas([]);
    setSelectedOption(null);
    setIsTableExpanded(false);
    setKpis({ total: NaN, lucro: NaN });
    setSimulationStatus({ message: 'Campos limpos.', isError: false });
    const today = new Date();
    setDataPrimeiroPagamento(today.toISOString().split('T')[0]);
  };

  if (!isLoggedIn) {
    return <EntryFlow onAuthenticated={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500/30 print:bg-white print:text-black">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none print:hidden">
        {/* Main Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full bg-emerald-500/[0.03] blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-500/[0.03] blur-[100px]" />
        
        {/* Accent Glows */}
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-emerald-400/[0.02] blur-[80px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] rounded-full bg-zinc-500/[0.02] blur-[90px]" />

        {/* Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 print:py-0 print:px-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-12 print:mb-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center shadow-emerald-500/10 shadow-2xl">
              <Calculator size={28} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Simulador de Parcelas</h1>
              <p className={`text-xs font-medium uppercase tracking-widest mt-1 ${simulationStatus.isError ? 'text-red-400' : 'text-emerald-500/60'}`}>
                {simulationStatus.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogout}
              className="p-3.5 rounded-xl glass-card hover:scale-110 transition-all active:scale-95 group text-zinc-500 hover:text-red-400 print:hidden"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-3.5 rounded-xl glass-card hover:scale-110 transition-all active:scale-95 group print:hidden"
              aria-label="Alternar Tema"
            >
              {theme === 'dark' ? (
                <Sun size={20} className="group-hover:text-yellow-400 transition-colors" />
              ) : (
                <Moon size={20} className="group-hover:text-indigo-500 transition-colors" />
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Section */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 flex flex-col gap-8"
          >
            <div className="glass-card rounded-[2.5rem] p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1">Primeiro Nome</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Caio"
                      className="input-field pl-12 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1">Valor do Empréstimo</label>
                  <div className="relative group">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      ref={inputValorRef}
                      type="text"
                      inputMode="numeric"
                      value={valor}
                      onChange={(e) => setValor(formatCurrency(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && inputJurosRef.current?.focus()}
                      placeholder="R$ 0,00"
                      className="input-field pl-12 text-xl font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1 block min-h-[30px] flex items-end">Taxa (% a.m)</label>
                    <input 
                      ref={inputJurosRef}
                      type="text"
                      inputMode="decimal"
                      value={juros}
                      onChange={(e) => setJuros(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && inputParcelasRef.current?.focus()}
                      placeholder="15"
                      className="input-field text-center font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1 block min-h-[30px] flex items-end">Parcelas</label>
                    <input 
                      ref={inputParcelasRef}
                      type="text"
                      value={parcelas}
                      onChange={(e) => setParcelas(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGerar()}
                      placeholder="1-7"
                      className="input-field text-center font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1 block min-h-[30px] flex items-end">Ajuste Parcela</label>
                    <input 
                      type="text"
                      value={parcelaManual}
                      onChange={(e) => setParcelaManual(formatCurrency(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && handleGerar()}
                      placeholder="R$ 0,00"
                      className="input-field text-center font-bold font-mono border-emerald-500/10 focus:border-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1">Data do 1º Pagamento</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 bg-emerald-500/20 blur-lg rounded-full" />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-emerald-500 transition-colors" />
                    <input 
                      type="date"
                      value={dataPrimeiroPagamento}
                      onChange={(e) => setDataPrimeiroPagamento(e.target.value)}
                      className="input-field pl-12 font-bold font-mono [color-scheme:dark] light:[color-scheme:light]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleGerar}
                  disabled={isLoading}
                  className="w-full py-5 rounded-2xl bg-emerald-500 text-zinc-950 font-black text-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Zap size={22} className="animate-bounce" />
                  ) : (
                    <>
                      <Zap size={22} fill="currentColor" />
                      Gerar Simulação
                    </>
                  )}
                </button>

                <button 
                  onClick={handleLimpar}
                  className="w-full py-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-500/60 font-bold text-sm hover:bg-emerald-500/10 hover:text-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Limpar Tudo
                </button>
              </div>
            </div>
          </motion.section>

          {/* Results Section */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7 flex flex-col gap-6 print:lg:col-span-12"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card group hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-3 opacity-40">
                  <TrendingUp size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Total a Receber</p>
                </div>
                <p className="text-3xl font-black tracking-tighter font-mono">
                  {isNaN(kpis.total) ? '—' : brl(kpis.total)}
                </p>
              </div>
              <div className="stat-card group hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-3 opacity-40">
                  <Zap size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Lucro Estimado</p>
                </div>
                <p className="text-3xl font-black tracking-tighter font-mono text-emerald-500">
                  {isNaN(kpis.lucro) ? '—' : brl(kpis.lucro)}
                </p>
              </div>
            </div>

            {/* Editor/Result Area */}
            <div className="glass-card rounded-[2.5rem] p-8 flex-1 flex flex-col gap-6 min-h-[400px] print:min-h-0 print:border-none print:shadow-none print:bg-transparent">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                  <Smartphone size={14} /> Texto Formatado
                </h3>
                {resultado && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md print:hidden">
                    PRONTO
                  </span>
                )}
              </div>

              {opcoesGeradas.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-2 print:hidden">
                  {opcoesGeradas.map((r) => (
                    <button
                      key={r.n}
                      onClick={() => gerarPropostaFinal(r)}
                      className={`text-[10px] font-black px-3 py-2 rounded-xl glass-card hover:border-emerald-500/50 transition-all active:scale-95 ${selectedOption?.n === r.n ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-500' : ''}`}
                    >
                      Selecionar {r.n}x
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex-1">
                <textarea 
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value)}
                  placeholder="Os detalhes da simulação aparecerão aqui..."
                  className="w-full h-full bg-transparent outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-zinc-700 print:text-black print:overflow-visible"
                />
                <AnimatePresence>
                  {!resultado && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-5">
                      <Calculator size={80} />
                      <p className="text-xs font-bold uppercase tracking-widest mt-4">Aguardando Dados</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleCopiar}
                disabled={!resultado}
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20 print:hidden
                  ${isCopied 
                    ? 'bg-emerald-500 text-zinc-950' 
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}
              >
                {isCopied ? <Check size={22} /> : <Copy size={22} />}
                {isCopied ? 'Copiado' : 'Copiar para WhatsApp'}
              </button>
            </div>
          </motion.section>
        </div>

        {/* Amortization Table Section */}
        <AnimatePresence>
          {selectedOption && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8 overflow-hidden print:mt-4 print:break-inside-avoid"
            >
              <div className="glass-card rounded-[2.5rem] p-8 print:border-none print:shadow-none print:bg-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 print:hidden">
                      <Calendar size={18} />
                    </div>
                    <h3 className="text-sm font-black tracking-tight uppercase">Tabela de Amortização ({selectedOption.n}x)</h3>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button 
                      onClick={() => setIsTableExpanded(!isTableExpanded)}
                      className="p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-500/60 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all flex items-center gap-2 text-xs font-bold"
                    >
                      {isTableExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{isTableExpanded ? 'Ocultar' : 'Ver Detalhes'}</span>
                    </button>
                  </div>
                </div>

                <motion.div 
                  initial={false}
                  animate={{ height: isTableExpanded ? 'auto' : '0px', opacity: isTableExpanded ? 1 : 0 }}
                  className="overflow-hidden print:!h-auto print:!opacity-100"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-500/10">
                          <th className="py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Nº</th>
                          <th className="py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Parcela</th>
                          <th className="py-4 text-[10px] font-bold uppercase tracking-widest opacity-40 hidden sm:table-cell">Principal</th>
                          <th className="py-4 text-[10px] font-bold uppercase tracking-widest opacity-40 hidden sm:table-cell">Juros</th>
                          <th className="py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Saldo Devedor</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                        {selectedOption.tabelaAmortizacao.map((item) => (
                          <tr key={item.n} className="border-b border-emerald-500/5 hover:bg-emerald-500/[0.02] transition-colors">
                            <td className="py-4 font-bold text-emerald-500/60">{String(item.n).padStart(2, '0')}</td>
                            <td className="py-4 font-bold">{brl(item.parcela)}</td>
                            <td className="py-4 opacity-80 hidden sm:table-cell">{brl(item.principal)}</td>
                            <td className="py-4 text-emerald-500/80 hidden sm:table-cell">{brl(item.juros)}</td>
                            <td className="py-4 font-bold opacity-60">{brl(item.saldoDevedor)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-emerald-500/5 border-t border-emerald-500/20 font-bold">
                          <td className="py-4 px-2 opacity-40 uppercase text-[9px]">Totais</td>
                          <td className="py-4">{brl(selectedOption.total)}</td>
                          <td className="py-4 hidden sm:table-cell">{brl(toNumberBR(valor))}</td>
                          <td className="py-4 text-emerald-500 hidden sm:table-cell">{brl(selectedOption.lucro)}</td>
                          <td className="py-4 opacity-40">—</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </motion.div>
                
                {!isTableExpanded && (
                  <div className="text-center py-4 print:hidden">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Clique em "Ver Detalhes" para conferir o cronograma completo</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
