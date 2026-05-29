"use client"

import { useState, useEffect, useRef } from "react"
import type { CSSProperties } from "react"
import { createClient } from "@/utils/supabase/client"

// ─── Types ───────────────────────────────────────────────────────────────────

type Cliente = {
  id: string
  nome: string
}

type Orcamento = {
  id: string
  cliente_id: string
  cliente_nome: string
  total: number
  status: string
}

type Pagamento = {
  id: string
  user_id: string
  cliente_id: string
  cliente_nome: string
  orcamento_id: string | null
  valor: number
  forma: string
  parcelas: number | null
  status: string
  data_pagamento: string
  observacoes: string | null
  created_at: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMAS = [
  "Dinheiro",
  "PIX",
  "Cartão de crédito",
  "Cartão de débito",
  "Convênio",
  "Transferência",
] as const

const STATUS_CORES: Record<string, string> = {
  Pago: "#22C55E",
  Pendente: "#F59E0B",
  Atrasado: "#EF4444",
}

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
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR")
}

function diasAte(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number)
  const alvo = new Date(y, m - 1, d)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

function statusEfetivo(p: Pagamento): string {
  if (p.status === "Pago") return "Pago"
  return diasAte(p.data_pagamento) < 0 ? "Atrasado" : "Pendente"
}

function BadgeAlerta({ pagamento }: { pagamento: Pagamento }) {
  const status = statusEfetivo(pagamento)
  const dias = diasAte(pagamento.data_pagamento)

  if (status === "Atrasado") {
    const qtd = Math.abs(dias)
    return (
      <span style={{ color: "#EF4444", fontSize: 12, fontWeight: 600 }}>
        {qtd === 1 ? "1 dia em atraso" : `${qtd} dias em atraso`}
      </span>
    )
  }
  if (dias >= 0 && dias <= 3) {
    return (
      <span style={{ color: "#F59E0B", fontSize: 12, fontWeight: 600 }}>
        {dias === 0 ? "Vence hoje" : dias === 1 ? "Vence amanhã" : `Vence em ${dias} dias`}
      </span>
    )
  }
  return null
}

// ─── Modal Novo Pagamento ─────────────────────────────────────────────────────

type ModalProps = {
  onClose: () => void
  onSaved: () => void
}

function ModalNovoPagamento({ onClose, onSaved }: ModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [buscaPaciente, setBuscaPaciente] = useState("")
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [showSugestoes, setShowSugestoes] = useState(false)

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [orcamentoId, setOrcamentoId] = useState("")

  const [valor, setValor] = useState("")
  const [forma, setForma] = useState("PIX")
  const [parcelas, setParcelas] = useState(1)
  const [dataVencimento, setDataVencimento] = useState(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
  const [observacoes, setObservacoes] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Autocomplete de paciente
  useEffect(() => {
    if (buscaPaciente.length < 2 || clienteSelecionado) {
      setClientesSugeridos([])
      setShowSugestoes(false)
      return
    }
    const t = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("clientes")
        .select("id, nome")
        .ilike("nome", `%${buscaPaciente}%`)
        .limit(6)
      setClientesSugeridos(data ?? [])
      setShowSugestoes(true)
    }, 250)
    return () => clearTimeout(t)
  }, [buscaPaciente, clienteSelecionado])

  // Busca orçamentos do cliente selecionado
  useEffect(() => {
    if (!clienteSelecionado) {
      setOrcamentos([])
      setOrcamentoId("")
      return
    }
    const supabase = createClient()
    supabase
      .from("orcamentos")
      .select("id, cliente_id, cliente_nome, total, status")
      .eq("cliente_id", clienteSelecionado.id)
      .neq("status", "Cancelado")
      .then(({ data }) => setOrcamentos(data ?? []))
  }, [clienteSelecionado])

  function selecionarCliente(c: Cliente) {
    setClienteSelecionado(c)
    setBuscaPaciente(c.nome)
    setShowSugestoes(false)
    setClientesSugeridos([])
  }

  const valorNum = parseFloat(valor.replace(",", ".")) || 0
  const valorParcela = parcelas > 0 ? valorNum / parcelas : 0

  function gerarPreview(): { data: string; valor: number }[] {
    if (!dataVencimento || valorNum <= 0) return []
    const pad = (n: number) => String(n).padStart(2, "0")
    const [y, m, d] = dataVencimento.split("-").map(Number)
    return Array.from({ length: parcelas }, (_, i) => {
      const dt = new Date(y, m - 1 + i, d)
      return {
        data: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
        valor: valorParcela,
      }
    })
  }

  const preview = gerarPreview()

  async function salvar() {
    if (!clienteSelecionado || valorNum <= 0) return
    setSalvando(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }

    const rows = preview.map((p, i) => ({
      user_id: user.id,
      cliente_id: clienteSelecionado.id,
      cliente_nome: clienteSelecionado.nome,
      orcamento_id: orcamentoId || null,
      valor: Math.round(p.valor * 100) / 100,
      forma,
      parcelas: parcelas > 1 ? parcelas : null,
      status: "Pendente",
      data_pagamento: p.data,
      observacoes: parcelas > 1
        ? `Parcela ${i + 1}/${parcelas}${observacoes ? ` — ${observacoes}` : ""}`
        : (observacoes || null),
    }))

    const { error } = await supabase.from("pagamentos").insert(rows)
    setSalvando(false)
    if (!error) onSaved()
  }

  const podeSalvar = !!clienteSelecionado && valorNum > 0 && !salvando

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: "1rem",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "#161A22", borderRadius: 16, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto", padding: "1.5rem",
        border: "1px solid #1E2533",
      }}>
        {/* Header do modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#F8FAFC", fontSize: 18, fontWeight: 700, margin: 0 }}>Novo Pagamento</h2>
          <button
            onClick={onClose}
            style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Paciente */}
        <div style={{ marginBottom: "1rem", position: "relative" }}>
          <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>Paciente *</label>
          <input
            ref={inputRef}
            value={buscaPaciente}
            onChange={e => { setBuscaPaciente(e.target.value); setClienteSelecionado(null) }}
            placeholder="Digite o nome do paciente..."
            style={inputCss}
            autoComplete="off"
          />
          {showSugestoes && clientesSugeridos.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
              background: "#1E2533", borderRadius: 8, border: "1px solid #2D3748",
              zIndex: 10, overflow: "hidden",
            }}>
              {clientesSugeridos.map(c => (
                <button
                  key={c.id}
                  onClick={() => selecionarCliente(c)}
                  style={{
                    display: "block", width: "100%", padding: "10px 14px",
                    textAlign: "left", color: "#F8FAFC", background: "none",
                    border: "none", borderBottom: "1px solid #2D3748",
                    cursor: "pointer", fontSize: 14,
                  }}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Orçamento opcional */}
        {orcamentos.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>
              Vincular Orçamento (opcional)
            </label>
            <select value={orcamentoId} onChange={e => setOrcamentoId(e.target.value)} style={inputCss}>
              <option value="">Sem vínculo</option>
              {orcamentos.map(o => (
                <option key={o.id} value={o.id}>
                  {formatarMoeda(o.total)} — {o.status}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Valor e Forma */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>Valor total (R$) *</label>
            <input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              style={inputCss}
            />
          </div>
          <div>
            <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>Forma de pagamento *</label>
            <select value={forma} onChange={e => setForma(e.target.value)} style={inputCss}>
              {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Parcelas e Data de vencimento */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>Parcelas</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setParcelas(p => Math.max(1, p - 1))}
                style={{ ...btnSec, width: 36, height: 36, padding: 0, textAlign: "center", flexShrink: 0, fontSize: 18 }}
              >
                −
              </button>
              <span style={{ color: "#F8FAFC", fontSize: 16, fontWeight: 700, minWidth: 32, textAlign: "center" }}>
                {parcelas}x
              </span>
              <button
                onClick={() => setParcelas(p => Math.min(24, p + 1))}
                style={{ ...btnSec, width: 36, height: 36, padding: 0, textAlign: "center", flexShrink: 0, fontSize: 18 }}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>
              {parcelas > 1 ? "1ª data de vencimento" : "Data de vencimento"} *
            </label>
            <input
              type="date"
              value={dataVencimento}
              onChange={e => setDataVencimento(e.target.value)}
              style={inputCss}
            />
          </div>
        </div>

        {/* Preview das parcelas */}
        {preview.length > 0 && valorNum > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>
              {parcelas > 1
                ? `Preview — ${parcelas}x de ${formatarMoeda(valorParcela)}`
                : `Total: ${formatarMoeda(valorNum)}`}
            </label>
            <div style={{
              background: "#0F1117", borderRadius: 8, padding: "0.75rem",
              maxHeight: 180, overflowY: "auto",
            }}>
              {preview.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "5px 0", fontSize: 13,
                    borderBottom: i < preview.length - 1 ? "1px solid #1E2533" : "none",
                  }}
                >
                  <span style={{ color: "#94A3B8" }}>
                    {parcelas > 1 ? `${i + 1}/${parcelas}` : "Pagamento"} — {formatarData(p.data)}
                  </span>
                  <span style={{ color: "#F8FAFC", fontWeight: 600 }}>{formatarMoeda(p.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>Observações</label>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Anotações sobre este pagamento..."
            rows={2}
            style={{ ...inputCss, resize: "vertical" }}
          />
        </div>

        {/* Botões */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSec}>Cancelar</button>
          <button
            onClick={salvar}
            disabled={!podeSalvar}
            style={{
              ...btnPrimary,
              opacity: podeSalvar ? 1 : 0.5,
              cursor: podeSalvar ? "pointer" : "not-allowed",
            }}
          >
            {salvando
              ? "Salvando..."
              : parcelas > 1
                ? `Criar ${parcelas} parcelas`
                : "Registrar Pagamento"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function Financeiro() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState("Todos")
  const [filtroForma, setFiltroForma] = useState("Todas")
  const [tick, setTick] = useState(0)

  const pad = (n: number) => String(n).padStart(2, "0")
  const hoje = new Date()
  const todayStr = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`
  const firstDayStr = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-01`
  const lastDayDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  const lastDayStr = `${lastDayDate.getFullYear()}-${pad(lastDayDate.getMonth() + 1)}-${pad(lastDayDate.getDate())}`
  const plus3 = new Date(hoje)
  plus3.setDate(plus3.getDate() + 3)
  const plus3Str = `${plus3.getFullYear()}-${pad(plus3.getMonth() + 1)}-${pad(plus3.getDate())}`

  useEffect(() => {
    const supabase = createClient()
    setCarregando(true)
    supabase
      .from("pagamentos")
      .select("*")
      .order("data_pagamento", { ascending: true })
      .then(({ data }) => {
        setPagamentos(data ?? [])
        setCarregando(false)
      })
  }, [tick])

  const reload = () => setTick(t => t + 1)

  async function marcarPago(id: string) {
    const supabase = createClient()
    await supabase.from("pagamentos").update({ status: "Pago" }).eq("id", id)
    reload()
  }

  async function excluir(id: string) {
    if (!confirm("Confirmar exclusão deste pagamento?")) return
    const supabase = createClient()
    await supabase.from("pagamentos").delete().eq("id", id)
    reload()
  }

  // KPIs
  const recebidoNoMes = pagamentos
    .filter(p => p.status === "Pago" && p.data_pagamento >= firstDayStr && p.data_pagamento <= lastDayStr)
    .reduce((acc, p) => acc + p.valor, 0)

  const atrasados = pagamentos.filter(p => statusEfetivo(p) === "Atrasado")

  const vencendoEm3 = pagamentos.filter(
    p =>
      statusEfetivo(p) === "Pendente" &&
      p.data_pagamento >= todayStr &&
      p.data_pagamento <= plus3Str,
  )

  const aReceber = pagamentos
    .filter(p => statusEfetivo(p) === "Pendente")
    .reduce((acc, p) => acc + p.valor, 0)

  const emAtraso = atrasados.reduce((acc, p) => acc + p.valor, 0)
  const alertasAtivos = atrasados.length + vencendoEm3.length
  const alertasCombinados = [...atrasados, ...vencendoEm3]

  // Tabela filtrada
  const listaFiltrada = pagamentos.filter(p => {
    const s = statusEfetivo(p)
    return (
      (filtroStatus === "Todos" || s === filtroStatus) &&
      (filtroForma === "Todas" || p.forma === filtroForma)
    )
  })

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <h1 style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Financeiro</h1>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Controle de pagamentos e recebimentos</p>
        </div>
        <button onClick={() => setModalAberto(true)} style={btnPrimary}>
          + Novo Pagamento
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Recebido no mês", valor: formatarMoeda(recebidoNoMes), cor: "#22C55E" },
          { label: "A receber", valor: formatarMoeda(aReceber), cor: "#4F8EF7" },
          { label: "Em atraso", valor: formatarMoeda(emAtraso), cor: "#EF4444" },
          { label: "Alertas ativos", valor: String(alertasAtivos), cor: "#F59E0B" },
        ].map(kpi => (
          <div
            key={kpi.label}
            style={{ background: "#161A22", borderRadius: 12, padding: "1.25rem", border: "1px solid #1E2533" }}
          >
            <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 8px" }}>{kpi.label}</p>
            <p style={{ color: kpi.cor, fontSize: 24, fontWeight: 700, margin: 0 }}>{kpi.valor}</p>
          </div>
        ))}
      </div>

      {/* Alertas dinâmicos */}
      {alertasCombinados.length > 0 && (
        <div style={{
          background: "#161A22", borderRadius: 12, padding: "1.25rem",
          border: "1px solid #1E2533", marginBottom: "1.5rem",
        }}>
          <h2 style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 600, margin: "0 0 1rem" }}>
            Alertas ({alertasCombinados.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {alertasCombinados.map(p => {
              const isAtrasado = statusEfetivo(p) === "Atrasado"
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0.75rem 1rem", borderRadius: 8, gap: "0.75rem",
                    background: isAtrasado ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                    border: `1px solid ${isAtrasado ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flex: 1 }}>
                    <span style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 500 }}>{p.cliente_nome}</span>
                    <span style={{ color: "#94A3B8", fontSize: 13 }}>{formatarMoeda(p.valor)}</span>
                    <BadgeAlerta pagamento={p} />
                  </div>
                  <button
                    onClick={() => marcarPago(p.id)}
                    style={{
                      ...btnSec,
                      fontSize: 12, padding: "6px 12px",
                      color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)",
                      flexShrink: 0,
                    }}
                  >
                    Marcar pago
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={{ color: "#64748B", fontSize: 12, display: "block", marginBottom: 4 }}>Status</label>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            style={{ ...inputCss, width: "auto", padding: "8px 12px", fontSize: 13 }}
          >
            {["Todos", "Pendente", "Pago", "Atrasado"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ color: "#64748B", fontSize: 12, display: "block", marginBottom: 4 }}>Forma</label>
          <select
            value={filtroForma}
            onChange={e => setFiltroForma(e.target.value)}
            style={{ ...inputCss, width: "auto", padding: "8px 12px", fontSize: 13 }}
          >
            <option value="Todas">Todas</option>
            {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <span style={{ color: "#64748B", fontSize: 13 }}>
          {listaFiltrada.length} {listaFiltrada.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {/* Tabela */}
      <div style={{ background: "#161A22", borderRadius: 12, border: "1px solid #1E2533", overflow: "hidden" }}>
        {carregando ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748B", fontSize: 14 }}>
            Carregando...
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748B", fontSize: 14 }}>
            Nenhum pagamento encontrado.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E2533" }}>
                  {["Paciente", "Vencimento", "Forma", "Valor", "Status", "Ações"].map(col => (
                    <th
                      key={col}
                      style={{
                        padding: "12px 16px", textAlign: "left",
                        color: "#64748B", fontSize: 12, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((p, i) => {
                  const status = statusEfetivo(p)
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: i < listaFiltrada.length - 1 ? "1px solid #1E2533" : "none" }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ color: "#F8FAFC", fontSize: 14 }}>{p.cliente_nome}</span>
                        {p.observacoes && (
                          <p style={{ color: "#64748B", fontSize: 12, margin: "2px 0 0" }}>{p.observacoes}</p>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#CBD5E1", fontSize: 14, whiteSpace: "nowrap" }}>
                        {formatarData(p.data_pagamento)}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#CBD5E1", fontSize: 14, whiteSpace: "nowrap" }}>
                        {p.forma}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#F8FAFC", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {formatarMoeda(p.valor)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: `${STATUS_CORES[status] ?? "#64748B"}20`,
                          color: STATUS_CORES[status] ?? "#64748B",
                          padding: "3px 10px", borderRadius: 20,
                          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          {status !== "Pago" && (
                            <button
                              onClick={() => marcarPago(p.id)}
                              style={{ ...btnSec, fontSize: 12, padding: "5px 10px", color: "#22C55E" }}
                            >
                              Marcar pago
                            </button>
                          )}
                          <button
                            onClick={() => excluir(p.id)}
                            style={{ ...btnSec, fontSize: 12, padding: "5px 10px", color: "#EF4444" }}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalNovoPagamento
          onClose={() => setModalAberto(false)}
          onSaved={() => { setModalAberto(false); reload() }}
        />
      )}
    </div>
  )
}
