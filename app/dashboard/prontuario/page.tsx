"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Cliente = {
  id: string;
  nome: string;
  data_nascimento: string | null;
};

type Prontuario = {
  id: string;
  user_id: string;
  cliente_id: string;
  cliente_nome: string;
  data: string;
  titulo: string;
  descricao: string;
  profissional: string | null;
  proximo_passo: string | null;
  alertas_medicos: string | null;
  created_at: string;
};

type ResumoFinanceiro = {
  total: number;
  quitado: number;
};

type LinhaEvolucao = {
  id: string;
  dentes: number[];
  grupoLabel: string | null;
  tag: string;
  nota: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TAGS_BASE: string[] = [
  "Consulta inicial",
  "Avaliação",
  "Limpeza",
  "Extração",
  "Restauração",
  "Canal",
  "Clareamento",
  "Prótese",
  "Implante",
  "Retorno",
];

const inputClass =
  "w-full bg-[#13161C] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors";

// ─── Utilities ────────────────────────────────────────────────────────────────

function calcularIdade(dataNascimento: string | null): string {
  if (!dataNascimento) return "";
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

function formatarData(data: string): string {
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Odontograma interativo ───────────────────────────────────────────────────

const UPPER_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const LOWER_ORDER = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

function getCoresTooth(num: number, selecionado: boolean) {
  if ([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(num))
    return selecionado
      ? { fill: "rgba(79,142,247,0.55)", stroke: "#4F8EF7", strokeW: 2, text: "#ffffff" }
      : { fill: "rgba(79,142,247,0.18)", stroke: "#4F8EF7", strokeW: 0.75, text: "#93BBFB" };
  if ([4, 5, 12, 13, 20, 21, 28, 29].includes(num))
    return selecionado
      ? { fill: "rgba(45,212,191,0.55)", stroke: "#2DD4BF", strokeW: 2, text: "#ffffff" }
      : { fill: "rgba(45,212,191,0.18)", stroke: "#2DD4BF", strokeW: 0.75, text: "#5EEAD4" };
  if ([6, 11, 22, 27].includes(num))
    return selecionado
      ? { fill: "rgba(245,158,11,0.55)", stroke: "#F59E0B", strokeW: 2, text: "#ffffff" }
      : { fill: "rgba(245,158,11,0.18)", stroke: "#F59E0B", strokeW: 0.75, text: "#FCD34D" };
  return selecionado
    ? { fill: "rgba(148,163,184,0.55)", stroke: "#94A3B8", strokeW: 2, text: "#ffffff" }
    : { fill: "rgba(107,114,128,0.18)", stroke: "#6B7280", strokeW: 0.75, text: "#9CA3AF" };
}

function OdontogramaInterativo({
  selecionados,
  onToggle,
}: {
  selecionados: Set<number>;
  onToggle: (n: number) => void;
}) {
  // Gap 2px entre dentes: SLOT = RW + 2; MARGIN centralizado = (620 - 30*16) / 2 = 70
  const W = 620;
  const MARGIN = 70;
  const SLOT = 30;
  const RW = 28;
  const RH = 26;
  const UY = 20;
  const LY = 57;
  const MID_X = W / 2;
  const SVG_H = 102;

  return (
    <div className="flex gap-3 items-center">
      <div className="flex-1 min-w-0">
        <svg viewBox={`0 0 ${W} ${SVG_H}`} className="w-full">
          <text x={MID_X} y={9} textAnchor="middle" fill="rgba(255,255,255,0.28)"
            fontSize={8} fontWeight="600" letterSpacing="2">ARCADA SUPERIOR</text>
          <text x={MARGIN} y={18} fill="rgba(255,255,255,0.16)" fontSize={7}>← Direito</text>
          <text x={W - MARGIN} y={18} textAnchor="end" fill="rgba(255,255,255,0.16)" fontSize={7}>Esquerdo →</text>

          {UPPER_ORDER.map((num, i) => {
            const x = MARGIN + i * SLOT;
            const sel = selecionados.has(num);
            const c = getCoresTooth(num, sel);
            return (
              <g key={`u${num}`} onClick={() => onToggle(num)} style={{ cursor: "pointer" }}>
                <rect x={x} y={UY} width={RW} height={RH} rx={3}
                  fill={c.fill} stroke={c.stroke} strokeWidth={c.strokeW} />
                <text x={x + RW / 2} y={UY + RH / 2 + 3}
                  textAnchor="middle" fill={c.text} fontSize={9} fontWeight="600">{num}</text>
              </g>
            );
          })}

          <line x1={MID_X} y1={UY - 3} x2={MID_X} y2={LY + RH + 3}
            stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="3,3" />
          <line x1={MARGIN} y1={(UY + RH + LY) / 2} x2={W - MARGIN} y2={(UY + RH + LY) / 2}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

          {LOWER_ORDER.map((num, i) => {
            const x = MARGIN + i * SLOT;
            const sel = selecionados.has(num);
            const c = getCoresTooth(num, sel);
            return (
              <g key={`l${num}`} onClick={() => onToggle(num)} style={{ cursor: "pointer" }}>
                <rect x={x} y={LY} width={RW} height={RH} rx={3}
                  fill={c.fill} stroke={c.stroke} strokeWidth={c.strokeW} />
                <text x={x + RW / 2} y={LY + RH / 2 + 3}
                  textAnchor="middle" fill={c.text} fontSize={9} fontWeight="600">{num}</text>
              </g>
            );
          })}

          <text x={MID_X} y={LY + RH + 14} textAnchor="middle" fill="rgba(255,255,255,0.28)"
            fontSize={8} fontWeight="600" letterSpacing="2">ARCADA INFERIOR</text>
          <text x={MARGIN} y={LY + RH + 14} fill="rgba(255,255,255,0.16)" fontSize={7}>← Direito</text>
          <text x={W - MARGIN} y={LY + RH + 14} textAnchor="end" fill="rgba(255,255,255,0.16)" fontSize={7}>Esquerdo →</text>
        </svg>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {(
          [
            { cor: "#4F8EF7", label: "Molar" },
            { cor: "#2DD4BF", label: "Pré-molar" },
            { cor: "#F59E0B", label: "Canino" },
            { cor: "#9CA3AF", label: "Incisivo" },
          ] as const
        ).map(({ cor, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm border flex-shrink-0"
              style={{ background: `${cor}30`, borderColor: cor }} />
            <span className="text-white/35 text-xs">{label}</span>
          </div>
        ))}
        <span className="text-white/15 text-xs mt-0.5">1–32</span>
      </div>
    </div>
  );
}

// ─── Form state base ──────────────────────────────────────────────────────────

const formInicial = {
  proximo_passo: "",
  alertas_medicos: "",
  data: new Date().toISOString().split("T")[0],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProntuarioPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [financeiro, setFinanceiro] = useState<ResumoFinanceiro>({ total: 0, quitado: 0 });
  const [loadingProntuarios, setLoadingProntuarios] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [form, setForm] = useState(formInicial);
  const [abaAtiva, setAbaAtiva] = useState<"evolucao" | "historico">("evolucao");

  const [dentesSelecionados, setDentesSelecionados] = useState<Set<number>>(new Set());
  const [selecaoGrupo, setSelecaoGrupo] = useState<"todos" | "superior" | "inferior" | null>(null);
  const [linhas, setLinhas] = useState<LinhaEvolucao[]>([]);
  const [tagsCustom, setTagsCustom] = useState<string[]>([]);
  const [novaTagTexto, setNovaTagTexto] = useState("");
  const [mostraInputTag, setMostraInputTag] = useState(false);
  const [tituloOverride, setTituloOverride] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const novaTagInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("clientes")
      .select("id, nome, data_nascimento")
      .order("nome", { ascending: true })
      .then(({ data }) => {
        if (data) setClientes(data);
      });
  }, []);

  const carregarProntuarios = useCallback(
    async (clienteId: string) => {
      setLoadingProntuarios(true);
      const { data } = await supabase
        .from("prontuarios")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false });
      if (data) setProntuarios(data);
      setLoadingProntuarios(false);
    },
    [supabase]
  );

  const carregarFinanceiro = useCallback(
    async (clienteId: string) => {
      const { data } = await supabase
        .from("pagamentos")
        .select("valor, status")
        .eq("cliente_id", clienteId);
      if (data) {
        const total = data.reduce((s, p) => s + (p.valor ?? 0), 0);
        const quitado = data
          .filter((p) => p.status === "Pago")
          .reduce((s, p) => s + (p.valor ?? 0), 0);
        setFinanceiro({ total, quitado });
      }
    },
    [supabase]
  );

  const selecionarCliente = useCallback(
    async (cliente: Cliente) => {
      setClienteSelecionado(cliente);
      setProntuarios([]);
      setFinanceiro({ total: 0, quitado: 0 });
      setAbaAtiva("evolucao");
      carregarProntuarios(cliente.id);
      carregarFinanceiro(cliente.id);
      // Marca consulta de hoje como "Em atendimento"
      const hoje = new Date().toISOString().split("T")[0];
      const { data: consultaHoje } = await supabase
        .from("consultas")
        .select("id")
        .eq("cliente_nome", cliente.nome)
        .eq("data", hoje)
        .in("status", ["Agendado", "Confirmado"])
        .limit(1)
        .maybeSingle();
      if (consultaHoje) {
        await supabase.from("consultas").update({ status: "Em atendimento" }).eq("id", consultaHoje.id);
      }
    },
    [carregarProntuarios, carregarFinanceiro, supabase]
  );

  // ── Estado derivado ──

  const todasTags = [...TAGS_BASE, ...tagsCustom];

  const tituloAuto = (() => {
    if (linhas.length === 0) return "";
    const porTag = new Map<string, { dentes: number[]; grupoLabel: string | null }>();
    for (const l of linhas) {
      const existing = porTag.get(l.tag);
      if (existing) {
        porTag.set(l.tag, {
          dentes: [...existing.dentes, ...l.dentes],
          grupoLabel: existing.grupoLabel ?? l.grupoLabel,
        });
      } else {
        porTag.set(l.tag, { dentes: [...l.dentes], grupoLabel: l.grupoLabel });
      }
    }
    if (porTag.size === 1) {
      const [[tag, { dentes, grupoLabel }]] = [...porTag.entries()];
      if (grupoLabel) return `${tag} — ${grupoLabel}`;
      const sorted = [...new Set(dentes)].sort((a, b) => a - b);
      const dentesStr =
        sorted.length === 1
          ? `Elemento ${sorted[0]}`
          : `Elementos ${sorted.join(", ")}`;
      return `${tag} — ${dentesStr}`;
    }
    return [...porTag.entries()]
      .map(([tag, { dentes, grupoLabel }]) =>
        grupoLabel ? `${tag} — ${grupoLabel}` : `${tag} (${dentes.length})`
      )
      .join(", ");
  })();

  const tituloExibido = tituloOverride !== null ? tituloOverride : tituloAuto;

  const prontuariosPorData = prontuarios.reduce<Record<string, Prontuario[]>>((acc, p) => {
    if (!acc[p.data]) acc[p.data] = [];
    acc[p.data].push(p);
    return acc;
  }, {});
  const datasOrdenadas = Object.keys(prontuariosPorData).sort((a, b) => b.localeCompare(a));

  // ── Handlers ──

  function toggleDente(n: number) {
    setSelecaoGrupo(null);
    setDentesSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  function toggleGrupo(grupo: "todos" | "superior" | "inferior") {
    if (selecaoGrupo === grupo) {
      setDentesSelecionados(new Set());
      setSelecaoGrupo(null);
    } else {
      const nums =
        grupo === "todos"
          ? Array.from({ length: 32 }, (_, i) => i + 1)
          : grupo === "superior"
          ? [...UPPER_ORDER]
          : Array.from({ length: 16 }, (_, i) => i + 17);
      setDentesSelecionados(new Set(nums));
      setSelecaoGrupo(grupo);
    }
  }

  function aplicarTag(tag: string) {
    if (dentesSelecionados.size === 0) return;
    let novaLinha: LinhaEvolucao;
    if (selecaoGrupo !== null) {
      const grupoLabel =
        selecaoGrupo === "todos"
          ? "Dentição completa"
          : selecaoGrupo === "superior"
          ? "Arcada superior"
          : "Arcada inferior";
      novaLinha = { id: crypto.randomUUID(), dentes: [], grupoLabel, tag, nota: "" };
    } else {
      const dentes = [...dentesSelecionados].sort((a, b) => a - b);
      novaLinha = { id: crypto.randomUUID(), dentes, grupoLabel: null, tag, nota: "" };
    }
    setLinhas((prev) => [...prev, novaLinha]);
    setDentesSelecionados(new Set());
    setSelecaoGrupo(null);
  }

  function excluirLinha(id: string) {
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  }

  function atualizarNota(id: string, nota: string) {
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, nota } : l)));
  }

  function abrirInputTag() {
    setMostraInputTag(true);
    setTimeout(() => novaTagInputRef.current?.focus(), 0);
  }

  function confirmarNovaTag() {
    const tag = novaTagTexto.trim();
    if (!tag) return;
    setTagsCustom((prev) => [...prev, tag]);
    setNovaTagTexto("");
    setMostraInputTag(false);
  }

  function composeDescricao(): string {
    return linhas
      .map((l) => {
        const dentesStr =
          l.grupoLabel ??
          (l.dentes.length === 1
            ? `Elemento ${l.dentes[0]}`
            : `Elementos ${l.dentes.join(", ")}`);
        const parts: string[] = [dentesStr];
        if (l.tag) parts.push(l.tag);
        if (l.nota) parts.push(l.nota);
        return parts.join(" — ");
      })
      .join("\n");
  }

  function resetarFormulario() {
    setDentesSelecionados(new Set());
    setSelecaoGrupo(null);
    setLinhas([]);
    setTituloOverride(null);
    setForm({ ...formInicial, data: new Date().toISOString().split("T")[0] });
  }

  async function salvarEvolucao() {
    const descricao = composeDescricao();
    if (!clienteSelecionado || !tituloExibido || !descricao) return;
    setSalvando(true);
    setErroSalvar(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErroSalvar("Sessão expirada. Recarregue a página.");
      setSalvando(false);
      return;
    }

    const { error } = await supabase.from("prontuarios").insert([
      {
        user_id: user.id,
        cliente_id: clienteSelecionado.id,
        cliente_nome: clienteSelecionado.nome,
        data: form.data,
        titulo: tituloExibido,
        descricao,
        profissional: null,
        proximo_passo: form.proximo_passo || null,
        alertas_medicos: form.alertas_medicos || null,
      },
    ]);

    if (!error) {
      resetarFormulario();
      await carregarProntuarios(clienteSelecionado.id);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      // Marca consulta de hoje como "Finalizado"
      const hoje = new Date().toISOString().split("T")[0];
      const { data: consultaEmAtendimento } = await supabase
        .from("consultas")
        .select("id")
        .eq("cliente_nome", clienteSelecionado.nome)
        .eq("data", hoje)
        .eq("status", "Em atendimento")
        .limit(1)
        .maybeSingle();
      if (consultaEmAtendimento) {
        await supabase.from("consultas").update({ status: "Finalizado" }).eq("id", consultaEmAtendimento.id);
      }
    } else {
      setErroSalvar(error.message);
    }
    setSalvando(false);
  }

  // ── Derivados para render ──

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const percentualQuitado =
    financeiro.total > 0
      ? Math.round((financeiro.quitado / financeiro.total) * 100)
      : null;

  const ultimaEvolucao = prontuarios[0] ?? null;
  const alertaAtivo =
    prontuarios.find((p) => p.alertas_medicos)?.alertas_medicos ?? null;

  const podeSalvar = !salvando && !!tituloExibido && linhas.length > 0;
  const nDentes = dentesSelecionados.size;

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden !important; }
          #print-zone {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            top: 0; left: 0; right: 0;
            padding: 28px;
            background: white !important;
            color: black !important;
            font-family: Georgia, serif;
          }
          #print-zone * { visibility: visible !important; }
        }
      `}</style>

      {/* ── Zona de impressão (histórico agrupado por data) ── */}
      {clienteSelecionado && (
        <div id="print-zone" style={{ display: "none" }}>
          <div style={{ borderBottom: "2px solid #ddd", paddingBottom: 12, marginBottom: 22 }}>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>{clienteSelecionado.nome}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Histórico impresso em{" "}
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
          </div>
          {datasOrdenadas.map((data) => (
            <div key={data} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "#222", marginBottom: 8 }}>
                {formatarData(data)}
              </div>
              {prontuariosPorData[data].map((p) => (
                <div key={p.id} style={{ marginBottom: 12, paddingLeft: 14, borderLeft: "2px solid #ccc" }}>
                  <div style={{ fontSize: 12, fontWeight: "600", marginBottom: 4 }}>{p.titulo}</div>
                  <div style={{ fontSize: 11, color: "#444", whiteSpace: "pre-line", lineHeight: 1.65 }}>
                    {p.descricao}
                  </div>
                  {p.proximo_passo && (
                    <div style={{ fontSize: 11, color: "#1a56db", marginTop: 5 }}>
                      → Próximo: {p.proximo_passo}
                    </div>
                  )}
                  {p.alertas_medicos && (
                    <div style={{ fontSize: 11, color: "#c0392b", marginTop: 4 }}>
                      ⚠ {p.alertas_medicos}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="flex -mx-6 -my-6 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

        {/* ── Painel esquerdo: lista de pacientes ── */}
        <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col bg-[#13161C]">
          <div className="p-4 border-b border-white/5 flex-shrink-0">
            <h1 className="text-white font-semibold text-base mb-3">Prontuário</h1>
            <div className="flex items-center gap-2 bg-[#0F1117] border border-white/10 rounded-lg px-3 h-9">
              <span className="text-white/30 text-xs">🔍</span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar paciente..."
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="text-white/30 hover:text-white text-xs transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {clientesFiltrados.length === 0 ? (
              <div className="p-6 text-white/30 text-xs text-center">
                {busca ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
              </div>
            ) : (
              clientesFiltrados.map((c, i) => {
                const ativo = clienteSelecionado?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => selecionarCliente(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-r-2 ${
                      ativo
                        ? "bg-[#4F8EF7]/10 border-[#4F8EF7]"
                        : "hover:bg-white/5 border-transparent"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: `hsl(${(i * 47) % 360}, 60%, 20%)`,
                        color: `hsl(${(i * 47) % 360}, 70%, 70%)`,
                      }}
                    >
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${ativo ? "text-white" : "text-white/70"}`}>
                        {c.nome}
                      </div>
                      {c.data_nascimento && (
                        <div className="text-white/30 text-xs">
                          {calcularIdade(c.data_nascimento)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Painel direito ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#13161C]">
          {!clienteSelecionado ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="text-5xl mb-4 opacity-30">📋</div>
              <div className="text-white/40 text-sm">
                Selecione um paciente para ver o prontuário
              </div>
            </div>
          ) : (
            <>
              {/* ── Cabeçalho ── */}
              <div className="border-b border-white/5 px-4 py-2 bg-[#181C24] flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#4F8EF7]/15 flex items-center justify-center text-[#4F8EF7] font-bold text-xs flex-shrink-0">
                      {clienteSelecionado.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-bold text-lg">
                      {clienteSelecionado.nome}
                    </span>
                    {clienteSelecionado.data_nascimento && (
                      <span className="text-white/40 text-xs">
                        {calcularIdade(clienteSelecionado.data_nascimento)}
                      </span>
                    )}
                    {alertaAtivo && (
                      <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                        ⚠ {alertaAtivo.length > 35 ? alertaAtivo.slice(0, 35) + "…" : alertaAtivo}
                      </span>
                    )}
                    {ultimaEvolucao && (
                      <span className="text-white/25 text-xs hidden xl:inline truncate max-w-xs">
                        · {formatarData(ultimaEvolucao.data)} — {ultimaEvolucao.titulo}
                      </span>
                    )}
                    {ultimaEvolucao?.proximo_passo && (
                      <span className="text-[#4F8EF7]/60 text-xs hidden xl:inline truncate max-w-[200px]">
                        → {ultimaEvolucao.proximo_passo}
                      </span>
                    )}
                  </div>
                  {percentualQuitado !== null && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(percentualQuitado, 100)}%`,
                            background:
                              percentualQuitado >= 100
                                ? "#22C55E"
                                : percentualQuitado >= 50
                                ? "#F59E0B"
                                : "#EF4444",
                          }}
                        />
                      </div>
                      <span className="text-white/40 text-xs">{percentualQuitado}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Tab bar ── */}
              <div className="flex border-b border-white/5 bg-[#13161C] flex-shrink-0 px-4">
                {(["evolucao", "historico"] as const).map((aba) => (
                  <button
                    key={aba}
                    onClick={() => setAbaAtiva(aba)}
                    className={`h-10 px-4 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === aba
                        ? "text-white border-[#4F8EF7]"
                        : "text-white/35 border-transparent hover:text-white/60"
                    }`}
                  >
                    {aba === "evolucao"
                      ? "Nova evolução"
                      : `Histórico${prontuarios.length > 0 ? ` (${prontuarios.length})` : ""}`}
                  </button>
                ))}
              </div>

              {/* ── Aba: Nova evolução ── */}
              {abaAtiva === "evolucao" && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="bg-[#181C24] border border-white/10 rounded-xl p-5">

                    {/* 1. Odontograma */}
                    <div className="mb-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        {(
                          [
                            { id: "todos" as const, label: "Todos" },
                            { id: "superior" as const, label: "Arcada Superior" },
                            { id: "inferior" as const, label: "Arcada Inferior" },
                          ]
                        ).map(({ id, label }) => (
                          <button
                            key={id}
                            onClick={() => toggleGrupo(id)}
                            className={`text-xs px-2.5 py-1 rounded border transition-all ${
                              selecaoGrupo === id
                                ? "bg-[#4F8EF7]/20 border-[#4F8EF7]/50 text-[#93BBFB]"
                                : "bg-white/3 border-white/10 text-white/35 hover:text-white/60 hover:border-white/20"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                        {nDentes > 0 && (
                          <span className="text-[#93BBFB] text-xs ml-1">
                            {selecaoGrupo === "todos"
                              ? "Dentição completa"
                              : selecaoGrupo === "superior"
                              ? "Arcada superior"
                              : selecaoGrupo === "inferior"
                              ? "Arcada inferior"
                              : `${nDentes} dente${nDentes > 1 ? "s" : ""}`}
                            {" "}selecionado{!selecaoGrupo && nDentes > 1 ? "s" : ""}
                            {" "}— clique um procedimento
                          </span>
                        )}
                      </div>
                      <OdontogramaInterativo
                        selecionados={dentesSelecionados}
                        onToggle={toggleDente}
                      />
                    </div>

                    {/* 2. Tags de procedimento */}
                    <div className="mb-4 pb-4 border-b border-white/5">
                      <label className="text-white/40 text-xs font-semibold uppercase tracking-wide block mb-2">
                        {nDentes > 0 ? (
                          <>
                            Procedimento para{" "}
                            <span className="text-[#93BBFB] normal-case font-semibold">
                              {selecaoGrupo === "todos"
                                ? "Dentição completa"
                                : selecaoGrupo === "superior"
                                ? "Arcada superior"
                                : selecaoGrupo === "inferior"
                                ? "Arcada inferior"
                                : nDentes === 1
                                ? `Elemento ${[...dentesSelecionados][0]}`
                                : `${nDentes} dentes`}
                            </span>
                          </>
                        ) : (
                          <>
                            Procedimento
                            <span className="text-white/20 font-normal ml-2 normal-case tracking-normal">
                              — selecione os dentes primeiro
                            </span>
                          </>
                        )}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {todasTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => aplicarTag(tag)}
                            disabled={nDentes === 0}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                              nDentes > 0
                                ? "bg-white/5 border-white/15 text-white/70 hover:bg-[#4F8EF7]/20 hover:border-[#4F8EF7]/50 hover:text-[#93BBFB] cursor-pointer active:scale-95"
                                : "bg-white/3 border-white/5 text-white/20 cursor-not-allowed"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                        {mostraInputTag ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              ref={novaTagInputRef}
                              type="text"
                              value={novaTagTexto}
                              onChange={(e) => setNovaTagTexto(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmarNovaTag();
                                if (e.key === "Escape") {
                                  setMostraInputTag(false);
                                  setNovaTagTexto("");
                                }
                              }}
                              placeholder="Nome da tag…"
                              className="h-7 w-32 bg-[#13161C] border border-[#4F8EF7]/40 rounded-full px-3 text-white text-xs placeholder-white/20 outline-none focus:border-[#4F8EF7]"
                            />
                            <button onClick={confirmarNovaTag}
                              className="text-[#4F8EF7] text-xs hover:text-white transition-colors font-semibold">✓</button>
                            <button onClick={() => { setMostraInputTag(false); setNovaTagTexto(""); }}
                              className="text-white/30 text-xs hover:text-white transition-colors">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={abrirInputTag}
                            className="text-xs px-3 py-1.5 rounded-full border border-dashed border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 transition-all"
                          >
                            + Nova tag
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 3. Notas clínicas */}
                    {linhas.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-white/5">
                        <label className="text-white/40 text-xs font-semibold uppercase tracking-wide block mb-2">
                          Notas clínicas
                        </label>
                        <div className="space-y-2">
                          {linhas.map((linha) => {
                            const dentesStr =
                              linha.grupoLabel ??
                              (linha.dentes.length === 1
                                ? `Elemento ${linha.dentes[0]}`
                                : `Elementos ${linha.dentes.join(", ")}`);
                            return (
                              <div
                                key={linha.id}
                                className="flex items-center gap-2 px-3 py-2 bg-[#13161C] border border-white/10 rounded-lg"
                              >
                                <span className="text-white/80 text-xs font-medium flex-shrink-0 truncate max-w-[140px]">
                                  {dentesStr}
                                </span>
                                <span className="text-white/20 text-xs flex-shrink-0">—</span>
                                <span className="text-white/55 text-xs flex-shrink-0 truncate max-w-[110px]">
                                  {linha.tag}
                                </span>
                                <span className="text-white/20 text-xs flex-shrink-0">—</span>
                                <input
                                  type="text"
                                  value={linha.nota}
                                  onChange={(e) => atualizarNota(linha.id, e.target.value)}
                                  placeholder="Nota clínica…"
                                  className="flex-1 bg-[#0F1117] border border-white/8 rounded px-2 py-0.5 text-white text-xs placeholder-white/20 outline-none focus:border-white/20 transition-colors min-w-0"
                                />
                                <button
                                  onClick={() => excluirLinha(linha.id)}
                                  className="text-red-400/40 hover:text-red-400 text-xs flex-shrink-0 transition-colors ml-1"
                                >
                                  Excluir
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. Data */}
                    <div className="mb-4">
                      <label className="text-white/40 text-xs font-semibold uppercase tracking-wide block mb-1">Data</label>
                      <input
                        type="date"
                        value={form.data}
                        onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                        className="w-48 bg-[#13161C] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#4F8EF7] transition-colors"
                      />
                    </div>

                    {/* 5. Título */}
                    <div className="mb-4">
                      <label className="text-white/40 text-xs font-semibold uppercase tracking-wide block mb-1">Título</label>
                      <input
                        type="text"
                        value={tituloExibido}
                        onChange={(e) => setTituloOverride(e.target.value)}
                        placeholder="Gerado automaticamente ao registrar procedimentos…"
                        className={inputClass}
                      />
                    </div>

                    {/* 6. Próximo passo */}
                    <div className="mb-3">
                      <label className="text-[#4F8EF7]/60 text-xs font-semibold uppercase tracking-wide block mb-1">
                        Próximo passo
                      </label>
                      <input
                        type="text"
                        value={form.proximo_passo}
                        onChange={(e) => setForm((f) => ({ ...f, proximo_passo: e.target.value }))}
                        placeholder="O que fazer na próxima consulta?"
                        className="w-full bg-[#13161C] border border-[#4F8EF7]/30 rounded-lg px-3 py-2 text-white text-sm placeholder-[#4F8EF7]/20 outline-none focus:border-[#4F8EF7] transition-colors"
                      />
                    </div>

                    {/* 7. Alertas médicos */}
                    <div className="mb-5">
                      <label className="text-red-400/60 text-xs font-semibold uppercase tracking-wide block mb-1">
                        Alertas médicos
                      </label>
                      <input
                        type="text"
                        value={form.alertas_medicos}
                        onChange={(e) => setForm((f) => ({ ...f, alertas_medicos: e.target.value }))}
                        placeholder="Alergias, contraindicações, cuidados especiais…"
                        className="w-full bg-[#13161C] border border-red-500/30 rounded-lg px-3 py-2 text-white text-sm placeholder-red-400/20 outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={salvarEvolucao}
                        disabled={!podeSalvar}
                        className="bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-5 h-9 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
                      >
                        {salvando ? "Salvando…" : "Registrar evolução"}
                      </button>
                      {successMsg && (
                        <span className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
                          ✓ Evolução registrada
                        </span>
                      )}
                      {erroSalvar && (
                        <span className="text-red-400 text-xs">
                          Erro: {erroSalvar}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Aba: Histórico ── */}
              {abaAtiva === "historico" && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-white/30 text-xs font-semibold uppercase tracking-wide">
                      {prontuarios.length > 0
                        ? `${prontuarios.length} evolução${prontuarios.length !== 1 ? "ões" : ""} · ${datasOrdenadas.length} data${datasOrdenadas.length !== 1 ? "s" : ""}`
                        : "Sem evoluções"}
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="h-8 px-3 bg-white/5 border border-white/10 text-white/50 text-xs rounded-lg hover:text-white hover:bg-white/10 transition-all"
                    >
                      🖨 Imprimir histórico
                    </button>
                  </div>

                  {loadingProntuarios ? (
                    <div className="text-center text-white/30 text-sm py-12">Carregando…</div>
                  ) : prontuarios.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-white/15 text-4xl mb-4">📋</div>
                      <div className="text-white/30 text-sm">Nenhuma evolução registrada ainda</div>
                    </div>
                  ) : (
                    <div>
                      {datasOrdenadas.map((data, gi) => (
                        <div key={data} className="flex gap-4">
                          {/* Eixo vertical */}
                          <div className="flex flex-col items-center w-5 flex-shrink-0">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                              style={{
                                background: gi === 0 ? "#4F8EF7" : "rgba(79,142,247,0.4)",
                                boxShadow: gi === 0 ? "0 0 0 4px rgba(79,142,247,0.12)" : "none",
                              }}
                            />
                            {gi < datasOrdenadas.length - 1 && (
                              <div className="w-px bg-white/8 flex-1 mt-1" style={{ minHeight: 24 }} />
                            )}
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0 pb-7">
                            <div className="text-white/55 text-xs font-semibold mb-3 mt-0.5">
                              {formatarData(data)}
                            </div>
                            <div className="space-y-4">
                              {prontuariosPorData[data].map((p) => (
                                <div key={p.id}>
                                  <div className="text-white/80 text-sm font-medium mb-1.5">
                                    {p.titulo}
                                  </div>
                                  <div className="space-y-0.5 mb-2">
                                    {p.descricao.split("\n").filter(Boolean).map((line, li) => (
                                      <div
                                        key={li}
                                        className="text-white/45 text-xs leading-relaxed pl-2 border-l border-white/8"
                                      >
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                  {(p.proximo_passo || p.alertas_medicos) && (
                                    <div className="space-y-1 mt-2">
                                      {p.proximo_passo && (
                                        <div className="flex items-start gap-1.5 text-xs text-[#4F8EF7]/80 bg-[#4F8EF7]/8 border border-[#4F8EF7]/15 rounded px-2.5 py-1.5">
                                          <span className="flex-shrink-0 font-medium">→</span>
                                          <span>{p.proximo_passo}</span>
                                        </div>
                                      )}
                                      {p.alertas_medicos && (
                                        <div className="flex items-start gap-1.5 text-xs text-red-400/80 bg-red-500/8 border border-red-500/15 rounded px-2.5 py-1.5">
                                          <span className="flex-shrink-0 font-medium">⚠</span>
                                          <span>{p.alertas_medicos}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
