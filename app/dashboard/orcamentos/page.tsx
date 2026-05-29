"use client"

import { useState, useEffect, useRef } from "react"
import type { CSSProperties } from "react"
import { createClient } from "@/utils/supabase/client"

// ─── Types ───────────────────────────────────────────────────────────────────

type Cliente = {
  id: string
  nome: string
  telefone: string | null
}

type Procedimento = {
  id: string
  nome: string
  categoria: string
  preco: number | null
  favorito: boolean | null
}

type OrcamentoItem = {
  id: string
  orcamento_id: string
  procedimento_id: string | null
  procedimento_nome: string
  preco: number
  quantidade: number
}

type Orcamento = {
  id: string
  user_id: string
  cliente_id: string
  cliente_nome: string
  status: string
  total: number
  validade: string | null
  observacoes: string | null
  created_at: string
  orcamento_itens: OrcamentoItem[]
}

type ItemForm = {
  procedimento_id: string
  procedimento_nome: string
  preco: number
  quantidade: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_ORCAMENTO = ["Pendente", "Aprovado", "Recusado", "Cancelado"] as const

const STATUS_CORES: Record<string, string> = {
  Pendente: "#F59E0B",
  Aprovado: "#22C55E",
  Recusado: "#EF4444",
  Cancelado: "#6B7280",
}

const VALIDADE_OPCOES = [
  { label: "5 dias", dias: 5 },
  { label: "10 dias", dias: 10 },
  { label: "15 dias", dias: 15 },
  { label: "1 mês", dias: 30 },
  { label: "2 meses", dias: 60 },
  { label: "Personalizado", dias: -1 },
]

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputCss: CSSProperties = {
  width: "100%",
  background: "#0F1117",
  border: "1px solid #1E2533",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#F8FAFC",
  fontSize: 14,
  boxSizing: "border-box",
}

const btnSec: CSSProperties = {
  background: "#1E2533",
  border: "none",
  borderRadius: 8,
  color: "#94A3B8",
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
}

const btnPrimary: CSSProperties = {
  background: "linear-gradient(135deg, #4F8EF7, #7C5CFC)",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function formatarData(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR")
}

function diasAteValidade(dateStr: string): number {
  const alvo = new Date(dateStr + "T00:00:00")
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

function ValidadeTag({ validade }: { validade: string | null }) {
  if (!validade) return <span style={{ color: "#475569", fontSize: 13 }}>—</span>
  const dias = diasAteValidade(validade)
  const cor = dias < 0 ? "#EF4444" : dias <= 5 ? "#F59E0B" : "#22C55E"
  const label = dias < 0 ? "Vencido" : dias === 0 ? "Vence hoje" : `${dias}d`
  return (
    <span style={{ background: `${cor}20`, color: cor, padding: "3px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {label}
    </span>
  )
}

// ─── Modal Novo Orçamento ─────────────────────────────────────────────────────

type ModalNovoProps = { onClose: () => void; onSaved: () => void }

function ModalNovoOrcamento({ onClose, onSaved }: ModalNovoProps) {
  const buscaClienteRef = useRef<HTMLDivElement>(null)

  // Autocomplete paciente
  const [buscaCliente, setBuscaCliente] = useState("")
  const [clientesSug, setClientesSug] = useState<Cliente[]>([])
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null)
  const [showClientes, setShowClientes] = useState(false)

  // Procedimentos
  const [todosProceds, setTodosProceds] = useState<Procedimento[]>([])
  const [buscaProc, setBuscaProc] = useState("")

  // Itens
  const [itens, setItens] = useState<ItemForm[]>([])

  // Validade
  const [validadeIdx, setValidadeIdx] = useState(3) // default: 1 mês
  const [validadeCustom, setValidadeCustom] = useState("")

  const [observacoes, setObservacoes] = useState("")
  const [salvando, setSalvando] = useState(false)

  const total = itens.reduce((acc, it) => acc + it.preco * it.quantidade, 0)

  // Carrega todos os procedimentos na abertura do modal
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("procedimentos")
      .select("id, nome, categoria, preco, favorito")
      .eq("ativo", true)
      .order("favorito", { ascending: false })
      .order("nome")
      .then(({ data }) => setTodosProceds(data ?? []))
  }, [])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (buscaClienteRef.current && !buscaClienteRef.current.contains(e.target as Node)) {
        setShowClientes(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Busca clientes no Supabase com debounce
  useEffect(() => {
    if (buscaCliente.length < 2 || clienteSel) {
      setClientesSug([])
      setShowClientes(false)
      return
    }
    const t = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("clientes")
        .select("id, nome, telefone")
        .ilike("nome", `%${buscaCliente}%`)
        .limit(6)
      setClientesSug(data ?? [])
      setShowClientes(true)
    }, 250)
    return () => clearTimeout(t)
  }, [buscaCliente, clienteSel])

  function selecionarCliente(c: Cliente) {
    setClienteSel(c)
    setBuscaCliente(c.nome)
    setShowClientes(false)
    setClientesSug([])
  }

  const listaProcs = todosProceds.filter(p =>
    p.nome.toLowerCase().includes(buscaProc.toLowerCase()) ||
    p.categoria.toLowerCase().includes(buscaProc.toLowerCase())
  )

  function adicionarItem(p: Procedimento) {
    setItens(prev => {
      const existe = prev.find(it => it.procedimento_id === p.id)
      if (existe) return prev.map(it => it.procedimento_id === p.id ? { ...it, quantidade: it.quantidade + 1 } : it)
      return [...prev, { procedimento_id: p.id, procedimento_nome: p.nome, preco: p.preco ?? 0, quantidade: 1 }]
    })
  }

  function removerItem(id: string) {
    setItens(prev => prev.filter(it => it.procedimento_id !== id))
  }

  function atualizarQtd(id: string, qtd: number) {
    if (qtd < 1) return
    setItens(prev => prev.map(it => it.procedimento_id === id ? { ...it, quantidade: qtd } : it))
  }

  function atualizarPreco(id: string, preco: number) {
    setItens(prev => prev.map(it => it.procedimento_id === id ? { ...it, preco } : it))
  }

  function calcularDataValidade(): string {
    const opcao = VALIDADE_OPCOES[validadeIdx]
    const dias = opcao.dias === -1 ? parseInt(validadeCustom) || 0 : opcao.dias
    const dt = new Date()
    dt.setDate(dt.getDate() + dias)
    return dt.toISOString().split("T")[0]
  }

  const opcaoPersonalizada = VALIDADE_OPCOES[validadeIdx].dias === -1
  const podeSalvar = !!clienteSel && itens.length > 0 && !salvando && (!opcaoPersonalizada || !!validadeCustom)

  async function salvar() {
    if (!podeSalvar || !clienteSel) return
    setSalvando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }

    const { data: orc, error } = await supabase
      .from("orcamentos")
      .insert({
        user_id: user.id,
        cliente_id: clienteSel.id,
        cliente_nome: clienteSel.nome,
        status: "Pendente",
        total,
        validade: calcularDataValidade(),
        observacoes: observacoes || null,
      })
      .select("id")
      .single()

    if (error || !orc) { setSalvando(false); return }

    await supabase.from("orcamento_itens").insert(
      itens.map(it => ({
        orcamento_id: orc.id,
        procedimento_id: it.procedimento_id,
        procedimento_nome: it.procedimento_nome,
        preco: it.preco,
        quantidade: it.quantidade,
      }))
    )
    setSalvando(false)
    onSaved()
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: "#161A22", borderRadius: 16, width: "100%", maxWidth: 780, maxHeight: "92vh", display: "flex", flexDirection: "column", border: "1px solid #1E2533", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid #1E2533", flexShrink: 0 }}>
          <div>
            <h2 style={{ color: "#F8FAFC", fontSize: 17, fontWeight: 700, margin: 0 }}>Novo Orçamento</h2>
            <p style={{ color: "#64748B", fontSize: 13, margin: "2px 0 0" }}>Selecione o paciente e adicione os procedimentos</p>
          </div>
          <button onClick={onClose} style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Corpo — 2 colunas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* Coluna esquerda */}
          <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", borderRight: "1px solid #1E2533", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Paciente */}
            <div>
              <label style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Paciente *</label>
              <div ref={buscaClienteRef} style={{ position: "relative" }}>
                {clienteSel ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.25)", borderRadius: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(79,142,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F8EF7", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {clienteSel.nome.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 500, margin: 0 }}>{clienteSel.nome}</p>
                      {clienteSel.telefone && <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{clienteSel.telefone}</p>}
                    </div>
                    <button onClick={() => { setClienteSel(null); setBuscaCliente("") }} style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 2 }}>✕</button>
                  </div>
                ) : (
                  <>
                    <input
                      value={buscaCliente}
                      onChange={e => { setBuscaCliente(e.target.value); setClienteSel(null) }}
                      onFocus={() => clientesSug.length > 0 && setShowClientes(true)}
                      placeholder="Digite o nome do paciente..."
                      style={inputCss}
                      autoComplete="off"
                    />
                    {showClientes && clientesSug.length > 0 && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1E2533", borderRadius: 8, border: "1px solid #2D3748", zIndex: 10, overflow: "hidden" }}>
                        {clientesSug.map(c => (
                          <button key={c.id} onClick={() => selecionarCliente(c)} style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", color: "#F8FAFC", background: "none", border: "none", borderBottom: "1px solid #2D3748", cursor: "pointer", fontSize: 14 }}>
                            {c.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Buscar procedimento */}
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Adicionar procedimento</label>
              <input
                value={buscaProc}
                onChange={e => setBuscaProc(e.target.value)}
                placeholder="Buscar por nome ou categoria..."
                style={{ ...inputCss, marginBottom: 8 }}
              />
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {listaProcs.length === 0 ? (
                  <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "1rem 0" }}>
                    {todosProceds.length === 0 ? "Carregando..." : "Nenhum procedimento encontrado"}
                  </p>
                ) : listaProcs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => adicionarItem(p)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", background: "none", border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <span style={{ color: p.favorito ? "#FBBF24" : "#2D3748", fontSize: 14, flexShrink: 0 }}>★</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#F8FAFC", fontSize: 13, display: "block" }}>{p.nome}</span>
                      <span style={{ color: "#64748B", fontSize: 11 }}>{p.categoria}</span>
                    </div>
                    {p.preco != null && (
                      <span style={{ color: "#64748B", fontSize: 12, flexShrink: 0 }}>{formatarMoeda(p.preco)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Validade */}
            <div>
              <label style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Validade</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {VALIDADE_OPCOES.map((op, idx) => (
                  <button
                    key={op.label}
                    onClick={() => setValidadeIdx(idx)}
                    style={{
                      padding: "6px 12px", borderRadius: 20, border: "1px solid",
                      cursor: "pointer", fontSize: 12, fontWeight: 500,
                      background: validadeIdx === idx ? "rgba(79,142,247,0.15)" : "transparent",
                      color: validadeIdx === idx ? "#4F8EF7" : "#64748B",
                      borderColor: validadeIdx === idx ? "rgba(79,142,247,0.4)" : "#1E2533",
                    }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              {opcaoPersonalizada && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input
                    type="number"
                    value={validadeCustom}
                    onChange={e => setValidadeCustom(e.target.value)}
                    placeholder="Número de dias"
                    min="1"
                    style={{ ...inputCss, flex: 1 }}
                  />
                  <span style={{ color: "#64748B", fontSize: 13, flexShrink: 0 }}>dias</span>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Observações</label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Condições, formas de pagamento, notas..."
                rows={3}
                style={{ ...inputCss, resize: "vertical" }}
              />
            </div>
          </div>

          {/* Coluna direita — itens */}
          <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <label style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Itens {itens.length > 0 && <span style={{ color: "#4F8EF7" }}>({itens.length})</span>}
            </label>

            {itens.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569", gap: 8 }}>
                <span style={{ fontSize: 36 }}>📋</span>
                <p style={{ fontSize: 13, margin: 0 }}>Nenhum procedimento adicionado</p>
                <p style={{ fontSize: 12, margin: 0, color: "#334155" }}>Busque e clique para adicionar</p>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {itens.map(it => (
                  <div key={it.procedimento_id} style={{ background: "#0F1117", border: "1px solid #1E2533", borderRadius: 10, padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 500, flex: 1, paddingRight: 8 }}>{it.procedimento_nome}</span>
                      <button onClick={() => removerItem(it.procedimento_id)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>×</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Qtd */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "#475569", fontSize: 11 }}>Qtd</span>
                        <button onClick={() => atualizarQtd(it.procedimento_id, it.quantidade - 1)} style={{ width: 24, height: 24, borderRadius: 4, background: "#1E2533", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                        <span style={{ color: "#F8FAFC", fontSize: 13, minWidth: 20, textAlign: "center" }}>{it.quantidade}</span>
                        <button onClick={() => atualizarQtd(it.procedimento_id, it.quantidade + 1)} style={{ width: 24, height: 24, borderRadius: 4, background: "#1E2533", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      </div>
                      {/* Preço editável */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                        <span style={{ color: "#475569", fontSize: 11 }}>R$</span>
                        <input
                          type="number"
                          value={it.preco}
                          onChange={e => atualizarPreco(it.procedimento_id, parseFloat(e.target.value) || 0)}
                          style={{ flex: 1, background: "#161A22", border: "1px solid #1E2533", borderRadius: 6, padding: "4px 8px", color: "#F8FAFC", fontSize: 13, outline: "none" }}
                        />
                      </div>
                      <span style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                        {formatarMoeda(it.preco * it.quantidade)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #1E2533", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748B", fontSize: 14 }}>Total</span>
              <span style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 700 }}>{formatarMoeda(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderTop: "1px solid #1E2533", flexShrink: 0 }}>
          <button onClick={onClose} style={btnSec}>Cancelar</button>
          <button
            onClick={salvar}
            disabled={!podeSalvar}
            style={{ ...btnPrimary, opacity: podeSalvar ? 1 : 0.4, cursor: podeSalvar ? "pointer" : "not-allowed" }}
          >
            {salvando ? "Salvando..." : "Criar Orçamento"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Visualização ───────────────────────────────────────────────────────

type ModalVisualizacaoProps = {
  orcamento: Orcamento
  onClose: () => void
  onAlterarStatus: (id: string, status: string) => void
}

function ModalVisualizacao({ orcamento, onClose, onAlterarStatus }: ModalVisualizacaoProps) {
  const dias = orcamento.validade ? diasAteValidade(orcamento.validade) : null

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: "#161A22", borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", border: "1px solid #1E2533" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid #1E2533" }}>
          <h2 style={{ color: "#F8FAFC", fontSize: 17, fontWeight: 700, margin: 0 }}>Orçamento</h2>
          <button onClick={onClose} style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 4px" }}>Paciente</p>
              <p style={{ color: "#F8FAFC", fontSize: 16, fontWeight: 600, margin: 0 }}>{orcamento.cliente_nome}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 4px" }}>
                {orcamento.validade ? "Válido até" : "Criado em"}
              </p>
              <p style={{ color: dias != null && dias < 0 ? "#EF4444" : "#CBD5E1", fontSize: 13, margin: 0, fontWeight: dias != null && dias < 0 ? 600 : 400 }}>
                {orcamento.validade ? formatarData(orcamento.validade) : formatarData(orcamento.created_at)}
                {dias != null && dias < 0 && " (vencido)"}
              </p>
            </div>
          </div>

          {/* Itens */}
          <div style={{ background: "#0F1117", borderRadius: 10, overflow: "hidden", border: "1px solid #1E2533" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E2533" }}>
                  {["Procedimento", "Qtd", "Valor unit.", "Total"].map((col, i) => (
                    <th key={col} style={{ padding: "10px 14px", color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: i === 0 ? "left" : "right" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orcamento.orcamento_itens.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "1.5rem", textAlign: "center", color: "#475569", fontSize: 13 }}>Sem itens registrados.</td>
                  </tr>
                ) : orcamento.orcamento_itens.map((it, i) => (
                  <tr key={it.id} style={{ borderBottom: i < orcamento.orcamento_itens.length - 1 ? "1px solid #1E2533" : "none" }}>
                    <td style={{ padding: "10px 14px", color: "#F8FAFC", fontSize: 13 }}>{it.procedimento_nome}</td>
                    <td style={{ padding: "10px 14px", color: "#94A3B8", fontSize: 13, textAlign: "right" }}>{it.quantidade}</td>
                    <td style={{ padding: "10px 14px", color: "#94A3B8", fontSize: 13, textAlign: "right" }}>{formatarMoeda(it.preco)}</td>
                    <td style={{ padding: "10px 14px", color: "#F8FAFC", fontSize: 13, fontWeight: 600, textAlign: "right" }}>{formatarMoeda(it.preco * it.quantidade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderTop: "2px solid #1E2533" }}>
              <span style={{ color: "#94A3B8", fontSize: 14, fontWeight: 600 }}>Total</span>
              <span style={{ color: "#F8FAFC", fontSize: 20, fontWeight: 700 }}>{formatarMoeda(orcamento.total)}</span>
            </div>
          </div>

          {/* Observações */}
          {orcamento.observacoes && (
            <div style={{ background: "#0F1117", borderRadius: 8, padding: "0.75rem 1rem", border: "1px solid #1E2533" }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Observações</p>
              <p style={{ color: "#CBD5E1", fontSize: 13, margin: 0 }}>{orcamento.observacoes}</p>
            </div>
          )}

          {/* Alterar status */}
          <div>
            <p style={{ color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Status</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STATUS_ORCAMENTO.map(s => (
                <button
                  key={s}
                  onClick={() => onAlterarStatus(orcamento.id, s)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, border: "1px solid",
                    cursor: "pointer", fontSize: 13, fontWeight: 500,
                    background: orcamento.status === s ? `${STATUS_CORES[s]}20` : "transparent",
                    color: orcamento.status === s ? STATUS_CORES[s] : "#64748B",
                    borderColor: orcamento.status === s ? `${STATUS_CORES[s]}40` : "#1E2533",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)
  const [visualizando, setVisualizando] = useState<Orcamento | null>(null)
  const [filtroStatus, setFiltroStatus] = useState("Todos")
  const [busca, setBusca] = useState("")
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    setCarregando(true)
    supabase
      .from("orcamentos")
      .select("*, orcamento_itens(*)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrcamentos((data ?? []) as Orcamento[])
        setCarregando(false)
      })
  }, [tick])

  const reload = () => setTick(t => t + 1)

  async function alterarStatus(id: string, novoStatus: string) {
    const supabase = createClient()
    await supabase.from("orcamentos").update({ status: novoStatus }).eq("id", id)
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, status: novoStatus } : o))
    if (visualizando?.id === id) setVisualizando(prev => prev ? { ...prev, status: novoStatus } : null)
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este orçamento e todos os seus itens?")) return
    const supabase = createClient()
    await supabase.from("orcamento_itens").delete().eq("orcamento_id", id)
    await supabase.from("orcamentos").delete().eq("id", id)
    reload()
  }

  // KPIs
  const pendentes = orcamentos.filter(o => o.status === "Pendente")
  const aprovados = orcamentos.filter(o => o.status === "Aprovado")
  const totalPendente = pendentes.reduce((acc, o) => acc + o.total, 0)
  const totalAprovado = aprovados.reduce((acc, o) => acc + o.total, 0)

  const hoje = new Date()
  const firstDay = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`
  const doMes = orcamentos.filter(o => o.created_at >= firstDay).length

  // Lista filtrada
  const listaFiltrada = orcamentos.filter(o => {
    const statusOk = filtroStatus === "Todos" || o.status === filtroStatus
    const buscaOk = o.cliente_nome.toLowerCase().includes(busca.toLowerCase())
    return statusOk && buscaOk
  })

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <h1 style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Orçamentos</h1>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>{orcamentos.length} orçamento{orcamentos.length !== 1 ? "s" : ""} no total</p>
        </div>
        <button onClick={() => setModalNovo(true)} style={btnPrimary}>+ Novo Orçamento</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Pendentes", valor: String(pendentes.length), sub: formatarMoeda(totalPendente), cor: "#F59E0B" },
          { label: "Aprovados", valor: String(aprovados.length), sub: formatarMoeda(totalAprovado), cor: "#22C55E" },
          { label: "Criados este mês", valor: String(doMes), sub: "orçamentos", cor: "#4F8EF7" },
          { label: "Em aberto", valor: formatarMoeda(totalPendente + totalAprovado), sub: `${pendentes.length + aprovados.length} orçamentos`, cor: "#7C5CFC" },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: "#161A22", borderRadius: 12, padding: "1.25rem", border: "1px solid #1E2533" }}>
            <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 6px" }}>{kpi.label}</p>
            <p style={{ color: kpi.cor, fontSize: 24, fontWeight: 700, margin: "0 0 2px" }}>{kpi.valor}</p>
            <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        {/* Busca */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#161A22", border: "1px solid #1E2533", borderRadius: 8, padding: "0 12px", height: 40, flex: 1, minWidth: 200 }}>
          <span style={{ color: "#475569", fontSize: 14 }}>🔍</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por paciente..."
            style={{ flex: 1, background: "none", border: "none", color: "#F8FAFC", fontSize: 14, outline: "none" }}
          />
          {busca && (
            <button onClick={() => setBusca("")} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✕</button>
          )}
        </div>

        {/* Pills de status */}
        <div style={{ display: "flex", gap: 6 }}>
          {["Todos", ...STATUS_ORCAMENTO].map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1px solid",
                cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: filtroStatus === s ? `${STATUS_CORES[s] ?? "#4F8EF7"}20` : "transparent",
                color: filtroStatus === s ? (STATUS_CORES[s] ?? "#4F8EF7") : "#64748B",
                borderColor: filtroStatus === s ? `${STATUS_CORES[s] ?? "#4F8EF7"}40` : "#1E2533",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <span style={{ color: "#64748B", fontSize: 13 }}>
          {listaFiltrada.length} {listaFiltrada.length === 1 ? "resultado" : "resultados"}
        </span>
      </div>

      {/* Tabela */}
      <div style={{ background: "#161A22", borderRadius: 12, border: "1px solid #1E2533", overflow: "hidden" }}>
        {carregando ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748B", fontSize: 14 }}>Carregando...</div>
        ) : listaFiltrada.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 8px" }}>
              {busca || filtroStatus !== "Todos" ? "Nenhum orçamento encontrado." : "Nenhum orçamento criado ainda."}
            </p>
            {!busca && filtroStatus === "Todos" && (
              <button onClick={() => setModalNovo(true)} style={{ color: "#4F8EF7", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
                Criar primeiro orçamento →
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E2533" }}>
                  {["Paciente", "Criado", "Validade", "Itens", "Total", "Status", "Ações"].map(col => (
                    <th key={col} style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((o, i) => (
                  <tr
                    key={o.id}
                    style={{ borderBottom: i < listaFiltrada.length - 1 ? "1px solid #1E2533" : "none", cursor: "pointer" }}
                    onClick={() => setVisualizando(o)}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 500 }}>{o.cliente_nome}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 13, whiteSpace: "nowrap" }}>
                      {formatarData(o.created_at)}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      {o.validade ? <ValidadeTag validade={o.validade} /> : <span style={{ color: "#475569", fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 13 }}>
                      {o.orcamento_itens.length} {o.orcamento_itens.length === 1 ? "item" : "itens"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#F8FAFC", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {formatarMoeda(o.total)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: `${STATUS_CORES[o.status] ?? "#6B7280"}20`, color: STATUS_CORES[o.status] ?? "#6B7280", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {o.status === "Pendente" && (
                          <button onClick={() => alterarStatus(o.id, "Aprovado")} style={{ ...btnSec, fontSize: 12, padding: "5px 10px", color: "#22C55E" }}>
                            Aprovar
                          </button>
                        )}
                        {o.status === "Aprovado" && (
                          <button onClick={() => alterarStatus(o.id, "Recusado")} style={{ ...btnSec, fontSize: 12, padding: "5px 10px", color: "#F59E0B" }}>
                            Recusar
                          </button>
                        )}
                        <button onClick={() => excluir(o.id)} style={{ ...btnSec, fontSize: 12, padding: "5px 10px", color: "#EF4444" }}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {modalNovo && (
        <ModalNovoOrcamento
          onClose={() => setModalNovo(false)}
          onSaved={() => { setModalNovo(false); reload() }}
        />
      )}
      {visualizando && (
        <ModalVisualizacao
          orcamento={visualizando}
          onClose={() => setVisualizando(null)}
          onAlterarStatus={alterarStatus}
        />
      )}
    </div>
  )
}
