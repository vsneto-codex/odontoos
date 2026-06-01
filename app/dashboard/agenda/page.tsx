"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const HORAS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const DIAS = ["Seg","Ter","Qua","Qui","Sex","Sáb"];

const STATUS_PADRAO = ["Agendado","Confirmado","Cancelado","Urgência"];
const STATUS_CORES: Record<string, string> = {
  "Agendado": "#8B5CF6",
  "Confirmado": "#4F8EF7",
  "Aguardando": "#F59E0B",
  "Em atendimento": "#22C55E",
  "Finalizado": "#6B7280",
  "Cancelado": "#EF4444",
  "Urgência": "#EC4899",
};

type Consulta = {
  id: number;
  cliente_nome: string;
  procedimento: string;
  hora: string;
  data: string;
  duracao: number;
  status: string;
  profissional: string;
  observacoes: string;
};

type Cliente = { id: number; nome: string; };

function getSegundaFeira(data: Date) {
  const d = new Date(data);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatarDataBR(data: Date) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function toISO(data: Date) {
  return data.toISOString().split("T")[0];
}

export default function Agenda() {
  const router = useRouter();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [semanaAtual, setSemanaAtual] = useState(getSegundaFeira(new Date()));
  const [statusLista] = useState(STATUS_PADRAO);
  const [tipoAtendimento, setTipoAtendimento] = useState<string | null>(null);

  // ── Modo de visualização ──
  const [modoVisualizacao, setModoVisualizacao] = useState<"semana" | "dia">("semana");
  const [diaSelecionado, setDiaSelecionado] = useState<Date>(new Date());

  // ── Agendamento rápido ──
  const [slotRapido, setSlotRapido] = useState<{ data: string; hora: string } | null>(null);
  const [buscaRapida, setBuscaRapida] = useState("");
  const [mostrarSugestoesRapidas, setMostrarSugestoesRapidas] = useState(false);
  const [convenioRapido, setConvenioRapido] = useState<"particular" | "convenio">("particular");
  const [salvandoRapido, setSalvandoRapido] = useState(false);

  const supabase = createClient();
  const buscaRapidaRef = useRef<HTMLDivElement>(null);

  async function carregarDados() {
    setLoading(true);
    const [{ data: cons }, { data: clis }] = await Promise.all([
      supabase.from("consultas").select("*").order("data").order("hora"),
      supabase.from("clientes").select("id, nome").order("nome"),
    ]);
    if (cons) setConsultas(cons);
    if (clis) setClientes(clis);
    setLoading(false);
  }

  useEffect(() => { carregarDados(); }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (buscaRapidaRef.current && !buscaRapidaRef.current.contains(e.target as Node)) {
        setMostrarSugestoesRapidas(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!consultaSelecionada) { setTipoAtendimento(null); return; }
    supabase
      .from("prontuarios")
      .select("id")
      .eq("cliente_nome", consultaSelecionada.cliente_nome)
      .limit(1)
      .then(({ data }) => {
        setTipoAtendimento(data && data.length > 0 ? "Retorno" : "1ª consulta");
      });
  }, [consultaSelecionada]);

  async function salvarRapido() {
    if (!slotRapido || !buscaRapida.trim()) return;
    setSalvandoRapido(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("consultas").insert([{
      user_id: user?.id,
      cliente_nome: buscaRapida.trim(),
      procedimento: "",
      profissional: "Dr. Leandro Pássaro",
      data: slotRapido.data,
      hora: slotRapido.hora,
      duracao: 1,
      status: "Agendado",
      observacoes: convenioRapido === "convenio" ? "Convênio" : "",
    }]);
    if (!error) {
      setSlotRapido(null);
      setBuscaRapida("");
      setConvenioRapido("particular");
      carregarDados();
    }
    setSalvandoRapido(false);
  }

  async function alterarStatus(id: number, novoStatus: string) {
    await supabase.from("consultas").update({ status: novoStatus }).eq("id", id);
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, status: novoStatus } : c));
    setConsultaSelecionada(prev => prev?.id === id ? { ...prev, status: novoStatus } : prev);
  }

  async function excluirConsulta(id: number) {
    if (!confirm("Excluir esta consulta?")) return;
    await supabase.from("consultas").delete().eq("id", id);
    setMostrarModal(false);
    carregarDados();
  }

  // ── Derivados ──

  const diasSemana = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(semanaAtual);
    d.setDate(semanaAtual.getDate() + i);
    return d;
  });

  function getConsulta(data: Date, hora: string) {
    const iso = toISO(data);
    return consultas.find(c => c.data === iso && c.hora === hora);
  }

  const sugestoesRapidas = buscaRapida.length >= 1
    ? clientes.filter(c => c.nome.toLowerCase().includes(buscaRapida.toLowerCase())).slice(0, 5)
    : [];

  const clientesCadastrados = new Set(clientes.map(c => c.nome.toLowerCase().trim()));
  function isCadastroIncompleto(nome: string) {
    return !clientesCadastrados.has(nome.toLowerCase().trim());
  }

  function abrirSlotRapido(data: Date, hora: string) {
    setSlotRapido({ data: toISO(data), hora });
    setBuscaRapida("");
    setConvenioRapido("particular");
    setMostrarSugestoesRapidas(false);
  }

  function irParaDia(dia: Date) {
    setDiaSelecionado(dia);
    setModoVisualizacao("dia");
  }

  function voltarParaSemana() {
    setSemanaAtual(getSegundaFeira(diaSelecionado));
    setModoVisualizacao("semana");
  }

  function proximaVaga() {
    const hojeISO = toISO(new Date());
    let semana = getSegundaFeira(new Date());
    for (let w = 0; w < 12; w++) {
      const dias = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(semana);
        d.setDate(semana.getDate() + i);
        return d;
      });
      for (const dia of dias) {
        const iso = toISO(dia);
        if (iso < hojeISO) continue;
        const horasOcupadas = new Set(consultas.filter(c => c.data === iso).map(c => c.hora));
        if (HORAS.some(h => !horasOcupadas.has(h))) {
          setSemanaAtual(semana);
          setModoVisualizacao("semana");
          return;
        }
      }
      const next = new Date(semana);
      next.setDate(next.getDate() + 7);
      semana = next;
    }
  }

  const mesAno = modoVisualizacao === "dia"
    ? diaSelecionado.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : semanaAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Agenda</h1>
          <p className="text-white/40 text-sm mt-1 capitalize">{mesAno}</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Toggle Semana / Dia */}
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={voltarParaSemana}
              className={`px-3 h-8 text-xs transition-colors ${modoVisualizacao === "semana" ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setModoVisualizacao("dia")}
              className={`px-3 h-8 text-xs transition-colors border-l border-white/10 ${modoVisualizacao === "dia" ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70"}`}
            >
              Dia
            </button>
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-1">
            {modoVisualizacao === "semana" ? (
              <>
                <button onClick={() => { const d = new Date(semanaAtual); d.setDate(d.getDate()-7); setSemanaAtual(d); }} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white flex items-center justify-center">‹</button>
                <button onClick={() => setSemanaAtual(getSegundaFeira(new Date()))} className="px-3 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white text-xs">Hoje</button>
                <button onClick={() => { const d = new Date(semanaAtual); d.setDate(d.getDate()+7); setSemanaAtual(d); }} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white flex items-center justify-center">›</button>
              </>
            ) : (
              <>
                <button onClick={() => { const d = new Date(diaSelecionado); d.setDate(d.getDate()-1); setDiaSelecionado(d); }} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white flex items-center justify-center">‹</button>
                <button onClick={() => setDiaSelecionado(new Date())} className="px-3 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white text-xs">Hoje</button>
                <button onClick={() => { const d = new Date(diaSelecionado); d.setDate(d.getDate()+1); setDiaSelecionado(d); }} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white flex items-center justify-center">›</button>
              </>
            )}
          </div>

          <button
            onClick={proximaVaga}
            className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-4 h-9 rounded-lg hover:opacity-90 transition-opacity"
          >
            Próxima vaga
          </button>
          <button
            onClick={() => router.push("/dashboard/pacientes?novo=true")}
            className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-4 h-9 rounded-lg hover:opacity-90 transition-opacity"
          >
            + Cadastro
          </button>
        </div>
      </div>

      {/* ── Grade: Modo Semana ── */}
      {modoVisualizacao === "semana" && (
        <div className="bg-[#1E2330] border border-white/5 rounded-xl overflow-hidden">
          <div className="grid border-b border-white/5" style={{ gridTemplateColumns: "70px repeat(6, 1fr)" }}>
            <div className="p-3 border-r border-white/5" />
            {diasSemana.map((dia, i) => {
              const hoje = toISO(new Date()) === toISO(dia);
              return (
                <div
                  key={i}
                  onClick={() => irParaDia(dia)}
                  className={`p-3 text-center border-r border-white/5 last:border-r-0 cursor-pointer hover:bg-white/5 transition-colors ${hoje ? "bg-[#4F8EF7]/5" : ""}`}
                >
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-wide">{DIAS[i]}</div>
                  <div className={`text-lg font-bold mt-0.5 ${hoje ? "text-[#4F8EF7]" : "text-white"}`}>{formatarDataBR(dia)}</div>
                </div>
              );
            })}
          </div>
          <div className="overflow-y-auto max-h-[520px]">
            {loading ? (
              <div className="p-8 text-center text-white/40 text-sm">Carregando agenda...</div>
            ) : (
              HORAS.map(hora => (
                <div key={hora} className="grid border-b border-white/5 last:border-b-0" style={{ gridTemplateColumns: "70px repeat(6, 1fr)", minHeight: "64px" }}>
                  <div className="p-3 border-r border-white/5 text-white/30 text-xs font-medium flex items-start pt-3">{hora}</div>
                  {diasSemana.map((dia, diaIdx) => {
                    const consulta = getConsulta(dia, hora);
                    const cor = consulta ? (STATUS_CORES[consulta.status] ?? "#4F8EF7") : null;
                    const hoje = toISO(new Date()) === toISO(dia);
                    const incompleto = consulta && isCadastroIncompleto(consulta.cliente_nome);
                    return (
                      <div
                        key={diaIdx}
                        className={`border-r border-white/5 last:border-r-0 p-1 transition-colors ${hoje ? "bg-[#4F8EF7]/3" : ""} ${!consulta ? "cursor-pointer hover:bg-white/3 group" : ""}`}
                        onClick={() => !consulta && abrirSlotRapido(dia, hora)}
                      >
                        {consulta && cor ? (
                          <div
                            onClick={e => { e.stopPropagation(); setConsultaSelecionada(consulta); setMostrarModal(true); }}
                            className="rounded-lg p-2 cursor-pointer hover:brightness-110 transition-all h-full"
                            style={{ background: `${cor}18`, borderLeft: `3px solid ${cor}` }}
                          >
                            <div className="flex items-center gap-1">
                              <div className="text-white text-xs font-semibold truncate">{consulta.cliente_nome}</div>
                              {incompleto && (
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Cadastro incompleto" />
                              )}
                            </div>
                            <div className="text-white/50 text-xs truncate">{consulta.procedimento}</div>
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${cor}30`, color: cor }}>{consulta.status}</span>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white/25 text-xl leading-none">+</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Grade: Modo Dia ── */}
      {modoVisualizacao === "dia" && (
        <div className="bg-[#1E2330] border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide">
                {diaSelecionado.toLocaleDateString("pt-BR", { weekday: "long" })}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`text-lg font-bold ${toISO(diaSelecionado) === toISO(new Date()) ? "text-[#4F8EF7]" : "text-white"}`}>
                  {formatarDataBR(diaSelecionado)}
                </span>
                <span className="text-white/30 text-sm capitalize">
                  {diaSelecionado.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </span>
                {toISO(diaSelecionado) === toISO(new Date()) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#4F8EF7]/15 text-[#4F8EF7] border border-[#4F8EF7]/20">
                    Hoje
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={voltarParaSemana}
              className="text-white/40 text-xs hover:text-white transition-colors flex items-center gap-1"
            >
              ← Semana
            </button>
          </div>

          <div className="overflow-y-auto max-h-[540px]">
            {loading ? (
              <div className="p-8 text-center text-white/40 text-sm">Carregando agenda...</div>
            ) : (
              HORAS.map(hora => {
                const consulta = getConsulta(diaSelecionado, hora);
                const cor = consulta ? (STATUS_CORES[consulta.status] ?? "#4F8EF7") : null;
                const incompleto = consulta && isCadastroIncompleto(consulta.cliente_nome);
                return (
                  <div
                    key={hora}
                    className="flex border-b border-white/5 last:border-b-0"
                    style={{ minHeight: 80 }}
                  >
                    <div className="w-16 flex-shrink-0 border-r border-white/5 text-white/30 text-xs font-medium flex items-start pt-4 px-3">
                      {hora}
                    </div>
                    <div className="flex-1 p-2">
                      {consulta && cor ? (
                        <div
                          onClick={() => { setConsultaSelecionada(consulta); setMostrarModal(true); }}
                          className="rounded-lg p-3 cursor-pointer hover:brightness-110 transition-all h-full"
                          style={{ background: `${cor}18`, borderLeft: `3px solid ${cor}` }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold text-sm">{consulta.cliente_nome}</span>
                            {incompleto && (
                              <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Cadastro incompleto — completar quando o paciente chegar" />
                            )}
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-auto" style={{ background: `${cor}30`, color: cor }}>
                              {consulta.status}
                            </span>
                          </div>
                          <div className="text-white/50 text-xs">
                            {consulta.procedimento || <span className="italic text-white/25">Procedimento não informado</span>}
                          </div>
                          {consulta.observacoes && (
                            <div className="text-white/30 text-xs mt-1">{consulta.observacoes}</div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => abrirSlotRapido(diaSelecionado, hora)}
                          className="w-full h-full flex items-center justify-center text-white/15 hover:text-white/35 hover:bg-white/3 rounded-lg transition-all"
                        >
                          <span className="text-2xl leading-none">+</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Agendamento rápido ── */}
      {slotRapido && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSlotRapido(null)}>
          <div className="bg-[#1E2330] border border-white/10 rounded-2xl p-6 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-white font-semibold text-sm">Novo agendamento</div>
                <div className="text-white/40 text-xs mt-1">
                  {new Date(slotRapido.data + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "short", day: "2-digit", month: "short",
                  })}
                  {" · "}{slotRapido.hora}
                </div>
              </div>
              <button onClick={() => setSlotRapido(null)} className="text-white/30 hover:text-white text-lg mt-0.5">✕</button>
            </div>

            <div ref={buscaRapidaRef} className="relative mb-3">
              <label className="text-white/40 text-xs font-semibold uppercase tracking-wide block mb-1">Paciente</label>
              <input
                type="text"
                value={buscaRapida}
                onChange={e => { setBuscaRapida(e.target.value); setMostrarSugestoesRapidas(true); }}
                onFocus={() => setMostrarSugestoesRapidas(true)}
                placeholder="Nome do paciente..."
                autoFocus
                className="w-full h-10 bg-[#13161C] border border-white/10 rounded-lg px-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors"
              />
              {mostrarSugestoesRapidas && sugestoesRapidas.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1C2130] border border-white/10 rounded-lg overflow-hidden shadow-xl">
                  {sugestoesRapidas.map(c => (
                    <div
                      key={c.id}
                      onClick={() => { setBuscaRapida(c.nome); setMostrarSugestoesRapidas(false); }}
                      className="px-3 py-2.5 text-sm text-white hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0"
                    >
                      {c.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="text-white/40 text-xs font-semibold uppercase tracking-wide block mb-1">Tipo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setConvenioRapido("particular")}
                  className={`flex-1 h-9 text-sm rounded-lg border transition-all ${
                    convenioRapido === "particular"
                      ? "bg-[#4F8EF7]/20 border-[#4F8EF7]/50 text-[#93BBFB] font-medium"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  Particular
                </button>
                <button
                  onClick={() => setConvenioRapido("convenio")}
                  className={`flex-1 h-9 text-sm rounded-lg border transition-all ${
                    convenioRapido === "convenio"
                      ? "bg-[#4F8EF7]/20 border-[#4F8EF7]/50 text-[#93BBFB] font-medium"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  Convênio
                </button>
              </div>
            </div>

            <button
              onClick={salvarRapido}
              disabled={salvandoRapido || !buscaRapida.trim()}
              className="w-full bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold h-9 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {salvandoRapido ? "Agendando…" : "Agendar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Detalhes da consulta ── */}
      {mostrarModal && consultaSelecionada && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setMostrarModal(false)}>
          <div className="bg-[#1E2330] border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold">Detalhes da consulta</div>
              <button onClick={() => setMostrarModal(false)} className="text-white/30 hover:text-white text-lg">✕</button>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm"><span className="text-white/40">Paciente</span><span className="text-white font-medium">{consultaSelecionada.cliente_nome}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Tipo</span><span className="text-white">{tipoAtendimento ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Data</span><span className="text-white">{new Date(consultaSelecionada.data + "T12:00:00").toLocaleDateString("pt-BR")}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Horário</span><span className="text-white">{consultaSelecionada.hora}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Profissional</span><span className="text-white">{consultaSelecionada.profissional}</span></div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-white/40">Status</span>
                <span className="font-semibold px-2 py-0.5 rounded-full text-xs" style={{ background: `${STATUS_CORES[consultaSelecionada.status] ?? "#4F8EF7"}30`, color: STATUS_CORES[consultaSelecionada.status] ?? "#4F8EF7" }}>{consultaSelecionada.status}</span>
              </div>
              {consultaSelecionada.observacoes && <div className="flex justify-between text-sm"><span className="text-white/40">Obs.</span><span className="text-white text-right max-w-[60%]">{consultaSelecionada.observacoes}</span></div>}
            </div>
            <div className="mb-4">
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Alterar status</div>
              <div className="grid grid-cols-2 gap-2">
                {statusLista.map(status => (
                  <button key={status} onClick={() => alterarStatus(consultaSelecionada.id, status)} className={`text-xs py-2 px-3 rounded-lg font-medium transition-all border ${consultaSelecionada.status === status ? "border-white/20 bg-white/10 text-white" : "border-white/5 bg-white/5 text-white/50 hover:text-white"}`}>{status}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setMostrarModal(false); router.push("/dashboard/pacientes?novo=true"); }}
                className="flex-1 py-2 text-[#4F8EF7] text-sm border border-[#4F8EF7]/20 rounded-lg hover:bg-[#4F8EF7]/10 transition-colors"
              >
                Cadastrar paciente
              </button>
              <button onClick={() => excluirConsulta(consultaSelecionada.id)} className="flex-1 py-2 text-red-400 text-sm border border-red-400/20 rounded-lg hover:bg-red-400/10 transition-colors">Excluir consulta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
