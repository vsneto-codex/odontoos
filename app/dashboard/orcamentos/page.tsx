"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

type Cliente = { id: string; nome: string; telefone: string | null; };
type Procedimento = { id: string; nome: string; categoria: string; preco: number | null; favorito: boolean | null; };
type ItemOrcamento = { procedimento_id: string; procedimento_nome: string; preco: number; quantidade: number; };
type Orcamento = {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  status: string;
  total: number;
  validade: string | null;
  observacoes: string | null;
  created_at: string;
  itens?: ItemOrcamento[];
};

const STATUS_CORES: Record<string, string> = {
  "Pendente": "#F59E0B",
  "Aprovado": "#22C55E",
  "Recusado": "#EF4444",
  "Expirado": "#6B7280",
};

const VALIDADE_OPCOES = [
  { label: "5 dias",  valor: "5" },
  { label: "10 dias", valor: "10" },
  { label: "15 dias", valor: "15" },
  { label: "1 mês",   valor: "30" },
  { label: "Outros",  valor: "outros" },
];

function diasRestantes(validade: string | null): number | null {
  if (!validade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const val = new Date(validade + "T00:00:00");
  val.setHours(0, 0, 0, 0);
  return Math.round((val.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function ValidadeTag({ validade }: { validade: string | null }) {
  if (!validade) return <span className="text-white/30 text-xs">—</span>;
  const dias = diasRestantes(validade);
  if (dias === null) return <span className="text-white/30 text-xs">—</span>;
  if (dias < 0) return (
    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#EF4444]/15 text-[#EF4444]">Vencido</span>
  );
  if (dias === 0) return (
    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B]">Vence hoje</span>
  );
  const cor = dias <= 5 ? "#EF4444" : dias <= 10 ? "#F59E0B" : "#22C55E";
  return (
    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${cor}15`, color: cor }}>
      {dias} dias
    </span>
  );
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function formatarData(data: string) {
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
}

function ModalNovoOrcamento({ onFechar, onSalvo }: { onFechar: () => void; onSalvo: () => void; }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [buscaProc, setBuscaProc] = useState("");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [validadeOpcao, setValidadeOpcao] = useState("30");
  const [validadeCustom, setValidadeCustom] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const buscaRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function carregar() {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("clientes").select("id, nome, telefone").order("nome"),
        supabase.from("procedimentos").select("*").eq("ativo", true).order("favorito", { ascending: false }).order("nome"),
      ]);
      if (c) setClientes(c);
      if (p) setProcedimentos(p);
    }
    carregar();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onFechar(); }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onFechar]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) setMostrarSugestoes(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sugestoesClientes = buscaCliente.length >= 1
    ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 6)
    : [];

  const procsFiltrados = procedimentos.filter(p =>
    p.nome.toLowerCase().includes(buscaProc.toLowerCase()) ||
    p.categoria.toLowerCase().includes(buscaProc.toLowerCase())
  );
  const favoritos = procsFiltrados.filter(p => p.favorito);
  const outros = procsFiltrados.filter(p => !p.favorito);
  const listaProcs = [...favoritos, ...outros];

  function adicionarItem(p: Procedimento) {
    const existe = itens.find(i => i.procedimento_id === p.id);
    if (existe) {
      setItens(prev => prev.map(i => i.procedimento_id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i));
    } else {
      setItens(prev => [...prev, { procedimento_id: p.id, procedimento_nome: p.nome, preco: p.preco ?? 0, quantidade: 1 }]);
    }
    setBuscaProc("");
  }

  function removerItem(id: string) { setItens(prev => prev.filter(i => i.procedimento_id !== id)); }
  function atualizarPreco(id: string, preco: number) { setItens(prev => prev.map(i => i.procedimento_id === id ? { ...i, preco } : i)); }
  function atualizarQtd(id: string, quantidade: number) {
    if (quantidade < 1) return;
    setItens(prev => prev.map(i => i.procedimento_id === id ? { ...i, quantidade } : i));
  }

  const total = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

  async function salvar() {
    if (!clienteSelecionado || itens.length === 0) return;
    if (validadeOpcao === "outros" && !validadeCustom) return;
    setSalvando(true);
    const diasValidade = validadeOpcao === "outros" ? parseInt(validadeCustom) : parseInt(validadeOpcao);
    const dataValidade = new Date();
    dataValidade.setDate(dataValidade.getDate() + diasValidade);
    const validadeStr = dataValidade.toISOString().split("T")[0];
    const { data: orc, error } = await supabase.from("orcamentos").insert([{
      cliente_id: clienteSelecionado.id,
      cliente_nome: clienteSelecionado.nome,
      status: "Pendente",
      total,
      validade: validadeStr,
      observacoes: observacoes || null,
    }]).select().single();
    if (!error && orc) {
      await supabase.from("orcamento_itens").insert(
        itens.map(i => ({ orcamento_id: orc.id, procedimento_id: i.procedimento_id, procedimento_nome: i.procedimento_nome, preco: i.preco, quantidade: i.quantidade }))
      );
      onSalvo();
    }
    setSalvando(false);
  }

  const inputClass = "w-full h-10 bg-[#13161C] border border-white/10 rounded-lg px-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#181C24] border border-white/10 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div>
            <div className="text-white font-semibold">Novo orçamento</div>
            <div className="text-white/40 text-xs mt-0.5">Selecione o paciente e adicione os procedimentos</div>
          </div>
          <button onClick={onFechar} className="text-white/30 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">

            <div className="p-6 space-y-5">
              <div>
                <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Paciente *</div>
                <div ref={buscaRef} className="relative">
                  {clienteSelecionado ? (
                    <div className="flex items-center gap-3 p-3 bg-[#4F8EF7]/10 border border-[#4F8EF7]/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[#4F8EF7]/20 flex items-center justify-center text-xs font-bold text-[#4F8EF7] flex-shrink-0">
                        {clienteSelecionado.nome.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">{clienteSelecionado.nome}</div>
                        {clienteSelecionado.telefone && <div className="text-white/40 text-xs">{clienteSelecionado.telefone}</div>}
                      </div>
                      <button onClick={() => { setClienteSelecionado(null); setBuscaCliente(""); }} className="text-white/30 hover:text-white text-xs">✕</button>
                    </div>
                  ) : (
                    <>
                      <input type="text" value={buscaCliente}
                        onChange={e => { setBuscaCliente(e.target.value); setMostrarSugestoes(true); }}
                        onFocus={() => setMostrarSugestoes(true)}
                        placeholder="Digite o nome do paciente..." className={inputClass} />
                      {mostrarSugestoes && sugestoesClientes.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1C2130] border border-white/10 rounded-lg overflow-hidden shadow-xl">
                          {sugestoesClientes.map(c => (
                            <div key={c.id} onClick={() => { setClienteSelecionado(c); setBuscaCliente(""); setMostrarSugestoes(false); }}
                              className="px-3 py-2.5 text-sm text-white hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0">
                              {c.nome}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Adicionar procedimento</div>
                <input type="text" value={buscaProc} onChange={e => setBuscaProc(e.target.value)} placeholder="Buscar procedimento..." className={inputClass} />
                <div className="mt-2 max-h-52 overflow-y-auto space-y-1 pr-1">
                  {listaProcs.length === 0 ? (
                    <div className="text-white/30 text-xs text-center py-4">Nenhum procedimento encontrado</div>
                  ) : listaProcs.map(p => (
                    <button key={p.id} onClick={() => adicionarItem(p)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group">
                      <span className={`text-sm flex-shrink-0 ${p.favorito ? "text-yellow-400" : "text-white/20"}`}>★</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{p.nome}</div>
                        <div className="text-white/30 text-xs">{p.categoria}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.preco && <span className="text-white/50 text-xs">{formatarMoeda(p.preco)}</span>}
                        <span className="text-[#4F8EF7] text-xs opacity-0 group-hover:opacity-100 transition-opacity">+ Adicionar</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Validade</div>
                <select value={validadeOpcao}
                  onChange={e => { setValidadeOpcao(e.target.value); setValidadeCustom(""); }}
                  className={inputClass}>
                  {VALIDADE_OPCOES.map(o => (
                    <option key={o.valor} value={o.valor}>{o.label}</option>
                  ))}
                </select>
                {validadeOpcao === "outros" && (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="number" value={validadeCustom}
                      onChange={e => setValidadeCustom(e.target.value)}
                      placeholder="Número de dias" min="1"
                      className={inputClass} />
                    <span className="text-white/40 text-sm whitespace-nowrap">dias</span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Observações</div>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                  placeholder="Condições, formas de pagamento, observações..."
                  rows={3} className="w-full bg-[#13161C] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors resize-none" />
              </div>
            </div>

            <div className="p-6 flex flex-col">
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">
                Itens {itens.length > 0 && <span className="text-[#4F8EF7]">({itens.length})</span>}
              </div>
              {itens.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="text-white/10 text-4xl mb-3">📋</div>
                  <div className="text-white/30 text-sm">Nenhum procedimento adicionado</div>
                  <div className="text-white/20 text-xs mt-1">Busque e clique para adicionar</div>
                </div>
              ) : (
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {itens.map(item => (
                    <div key={item.procedimento_id} className="bg-[#13161C] border border-white/5 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-white text-sm font-medium flex-1">{item.procedimento_nome}</div>
                        <button onClick={() => removerItem(item.procedimento_id)} className="text-white/20 hover:text-red-400 transition-colors text-xs flex-shrink-0">✕</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-white/30 text-xs">Qtd</span>
                          <button onClick={() => atualizarQtd(item.procedimento_id, item.quantidade - 1)} className="w-6 h-6 rounded bg-white/5 text-white/50 hover:text-white text-xs flex items-center justify-center">−</button>
                          <span className="text-white text-sm w-6 text-center">{item.quantidade}</span>
                          <button onClick={() => atualizarQtd(item.procedimento_id, item.quantidade + 1)} className="w-6 h-6 rounded bg-white/5 text-white/50 hover:text-white text-xs flex items-center justify-center">+</button>
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-white/30 text-xs">R$</span>
                          <input type="number" value={item.preco} onChange={e => atualizarPreco(item.procedimento_id, parseFloat(e.target.value) || 0)}
                            className="flex-1 h-7 bg-[#181C24] border border-white/10 rounded px-2 text-white text-sm outline-none focus:border-[#4F8EF7] transition-colors" />
                        </div>
                        <div className="text-white text-sm font-semibold text-right min-w-[80px]">{formatarMoeda(item.preco * item.quantidade)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">Total</span>
                  <span className="text-white text-2xl font-bold">{formatarMoeda(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 flex-shrink-0">
          <button onClick={onFechar} className="h-9 px-5 bg-white/5 border border-white/10 text-white/60 text-sm rounded-lg hover:text-white transition-colors">Cancelar</button>
          <button onClick={salvar} disabled={salvando || !clienteSelecionado || itens.length === 0 || (validadeOpcao === "outros" && !validadeCustom)}
            className="h-9 px-6 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
            {salvando ? "Salvando..." : "Criar orçamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalVisualizacao({ orcamento, onFechar, onAlterarStatus }: {
  orcamento: Orcamento;
  onFechar: () => void;
  onAlterarStatus: (id: string, status: string) => void;
}) {
  const cor = STATUS_CORES[orcamento.status] ?? "#6B7280";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#181C24] border border-white/10 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div className="text-white font-semibold">Orçamento</div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="h-8 px-4 bg-white/5 border border-white/10 text-white/60 text-xs rounded-lg hover:text-white transition-colors">🖨️ Imprimir</button>
            <button onClick={onFechar} className="text-white/30 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-white font-bold text-lg">OdontoOS</div>
              <div className="text-white/40 text-xs">Sistema de Gestão Odontológica</div>
            </div>
            <div className="text-right">
              <div className="text-white/40 text-xs">Data</div>
              <div className="text-white text-sm">{formatarData(orcamento.created_at)}</div>
              {orcamento.validade && (
                <>
                  <div className="text-white/40 text-xs mt-1">Validade</div>
                  <div className="text-white text-sm">{formatarData(orcamento.validade)}</div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Paciente</div>
            <div className="text-white font-semibold">{orcamento.cliente_nome}</div>
          </div>

          <div>
            <div className="text-white/40 text-xs uppercase tracking-wide mb-2">Procedimentos</div>
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-white/30 text-xs px-4 py-2">Procedimento</th>
                    <th className="text-center text-white/30 text-xs px-4 py-2">Qtd</th>
                    <th className="text-right text-white/30 text-xs px-4 py-2">Valor unit.</th>
                    <th className="text-right text-white/30 text-xs px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamento.itens?.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="text-white text-sm px-4 py-2.5">{item.procedimento_nome}</td>
                      <td className="text-white/50 text-sm px-4 py-2.5 text-center">{item.quantidade}</td>
                      <td className="text-white/50 text-sm px-4 py-2.5 text-right">{formatarMoeda(item.preco)}</td>
                      <td className="text-white text-sm px-4 py-2.5 text-right font-medium">{formatarMoeda(item.preco * item.quantidade)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-white/40">Total do orçamento</span>
            <span className="text-white text-2xl font-bold">{formatarMoeda(orcamento.total)}</span>
          </div>

          {orcamento.observacoes && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Observações</div>
              <div className="text-white/70 text-sm">{orcamento.observacoes}</div>
            </div>
          )}

          <div>
            <div className="text-white/40 text-xs uppercase tracking-wide mb-2">Alterar status</div>
            <div className="flex gap-2 flex-wrap">
              {["Pendente", "Aprovado", "Recusado"].map(s => (
                <button key={s} onClick={() => onAlterarStatus(orcamento.id, s)}
                  className={`text-sm px-4 h-8 rounded-lg font-medium transition-all border ${
                    orcamento.status === s ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [orcamentoAberto, setOrcamentoAberto] = useState<Orcamento | null>(null);
  const supabase = createClient();

  const carregarOrcamentos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("orcamentos").select("*").order("created_at", { ascending: false });
    if (data) {
      const comItens = await Promise.all(data.map(async (o) => {
        const { data: itens } = await supabase.from("orcamento_itens").select("*").eq("orcamento_id", o.id);
        return { ...o, itens: itens ?? [] };
      }));
      setOrcamentos(comItens);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { carregarOrcamentos(); }, [carregarOrcamentos]);

  async function alterarStatus(id: string, status: string) {
    await supabase.from("orcamentos").update({ status }).eq("id", id);
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (orcamentoAberto?.id === id) setOrcamentoAberto(prev => prev ? { ...prev, status } : null);
  }

  const filtrados = orcamentos.filter(o => {
    const statusOk = filtroStatus === "todos" || o.status === filtroStatus;
    const buscaOk = o.cliente_nome.toLowerCase().includes(busca.toLowerCase());
    return statusOk && buscaOk;
  });

  const totais = {
    Pendente: orcamentos.filter(o => o.status === "Pendente").length,
    Aprovado: orcamentos.filter(o => o.status === "Aprovado").length,
    Recusado: orcamentos.filter(o => o.status === "Recusado").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Orçamentos</h1>
          <p className="text-white/40 text-sm mt-1">{orcamentos.length} orçamento{orcamentos.length !== 1 ? "s" : ""} no total</p>
        </div>
        <button onClick={() => setMostrarNovo(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-4 h-9 rounded-lg hover:opacity-90 transition-opacity">
          + Novo orçamento
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", valor: orcamentos.length, cor: "#4F8EF7", filtro: "todos" },
          { label: "Pendentes", valor: totais.Pendente, cor: "#F59E0B", filtro: "Pendente" },
          { label: "Aprovados", valor: totais.Aprovado, cor: "#22C55E", filtro: "Aprovado" },
          { label: "Recusados", valor: totais.Recusado, cor: "#EF4444", filtro: "Recusado" },
        ].map(k => (
          <div key={k.label} className="bg-[#1E2330] border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setFiltroStatus(k.filtro)}>
            <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">{k.label}</div>
            <div className="text-2xl font-bold" style={{ color: k.cor }}>{k.valor}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-[#1E2330] border border-white/10 rounded-lg px-3 h-10 flex-1 min-w-[200px]">
          <span className="text-white/30 text-sm">🔍</span>
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por paciente..." className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none" />
          {busca && <button onClick={() => setBusca("")} className="text-white/30 hover:text-white text-xs">✕</button>}
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="h-10 bg-[#1E2330] border border-white/10 rounded-lg px-3 text-white text-sm outline-none focus:border-[#4F8EF7] transition-colors">
          <option value="todos">Todos os status</option>
          <option value="Pendente">Pendente</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Recusado">Recusado</option>
        </select>
      </div>

      <div className="bg-[#1E2330] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Carregando orçamentos...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-white/20 text-4xl mb-3">📄</div>
            <div className="text-white/40 text-sm">{busca || filtroStatus !== "todos" ? "Nenhum orçamento encontrado" : "Nenhum orçamento criado ainda"}</div>
            {!busca && filtroStatus === "todos" && (
              <button onClick={() => setMostrarNovo(true)} className="mt-3 text-[#4F8EF7] text-sm hover:underline">Criar primeiro orçamento →</button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3">Paciente</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Itens</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Validade</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3">Total</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(o => {
                const cor = STATUS_CORES[o.status] ?? "#6B7280";
                return (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer" onClick={() => setOrcamentoAberto(o)}>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm font-medium">{o.cliente_nome}</div>
                      <div className="text-white/30 text-xs">{formatarData(o.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-sm hidden md:table-cell">{o.itens?.length ?? 0} proc.</td>
                    <td className="px-4 py-3 hidden lg:table-cell"><ValidadeTag validade={o.validade} /></td>
                    <td className="px-4 py-3"><span className="text-white font-semibold text-sm">{formatarMoeda(o.total)}</span></td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${cor}20`, color: cor }}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right"><span className="text-white/20 hover:text-white text-xs transition-colors">Ver →</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {mostrarNovo && <ModalNovoOrcamento onFechar={() => setMostrarNovo(false)} onSalvo={() => { setMostrarNovo(false); carregarOrcamentos(); }} />}
      {orcamentoAberto && <ModalVisualizacao orcamento={orcamentoAberto} onFechar={() => setOrcamentoAberto(null)} onAlterarStatus={alterarStatus} />}
    </div>
  );
}