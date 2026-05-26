"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const HORAS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const DIAS = ["Seg","Ter","Qua","Qui","Sex","Sáb"];

const STATUS_PADRAO = ["Confirmado","Aguardando","Em atendimento","Finalizado","Cancelado","Urgência"];
const STATUS_CORES: Record<string, string> = {
  "Confirmado": "#4F8EF7",
  "Aguardando": "#F59E0B",
  "Em atendimento": "#22C55E",
  "Finalizado": "#6B7280",
  "Cancelado": "#EF4444",
  "Urgência": "#EC4899",
};

const PROCEDIMENTOS_PADRAO = [
  "Avaliação clínica inicial","Consulta de rotina","Limpeza dental (profilaxia)","Aplicação de flúor",
  "Selante dental","Orientação de higiene bucal","Raspagem de tártaro","Polimento dental",
  "Restauração em resina","Restauração em amálgama","Reconstrução dental","Fechamento de diastema",
  "Facetas em resina","Facetas em porcelana","Coroas dentárias","Clareamento dental caseiro",
  "Clareamento dental a laser","Lentes de contato dental","Harmonização do sorriso","Gengivoplastia estética",
  "Tratamento de canal","Retratamento de canal","Pulpectomia","Tratamento de urgência endodôntica",
  "Limpeza profunda","Raspagem subgengival","Curetagem periodontal","Cirurgia periodontal","Enxerto gengival",
  "Extração simples","Extração de siso","Cirurgia oral menor","Frenectomia","Biópsia bucal",
  "Implante dentário","Enxerto ósseo","Levantamento de seio maxilar","Prótese sobre implante",
  "Prótese total","Prótese parcial removível","Prótese fixa","Ponte dentária","Coroa provisória",
  "Aparelho fixo","Aparelho móvel","Alinhadores invisíveis","Manutenção ortodôntica","Contenção ortodôntica",
  "Atendimento infantil","Aplicação de flúor infantil","Extração de dente de leite","Mantenedor de espaço",
  "Radiografia panorâmica","Radiografia periapical","Tomografia odontológica","Escaneamento intraoral",
  "Atendimento de dor aguda","Drenagem de abscesso","Reparo provisório","Controle de sangramento","Outro",
];

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

function formatarDataInput(valor: string) {
  const nums = valor.replace(/\D/g, "").slice(0, 8);
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0,2)}/${nums.slice(2)}`;
  return `${nums.slice(0,2)}/${nums.slice(2,4)}/${nums.slice(4)}`;
}

function parseDateBR(valor: string): string {
  const parts = valor.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return "";
}

export default function Agenda() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [semanaAtual, setSemanaAtual] = useState(getSegundaFeira(new Date()));
  const [procedimentos, setProcedimentos] = useState(PROCEDIMENTOS_PADRAO);
  const [statusLista, setStatusLista] = useState(STATUS_PADRAO);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [dataInput, setDataInput] = useState("");
  const [procedimentoCustom, setProcedimentoCustom] = useState("");
  const [statusCustom, setStatusCustom] = useState("");
  const supabase = createClient();
  const buscaRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    cliente_nome: "",
    procedimento: "",
    procedimento_outro: "",
    profissional: "Dr. Leandro Pássaro",
    data: "",
    hora: "08:00",
    duracao: 1,
    status: "Confirmado",
    status_outro: "",
    observacoes: "",
  });

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
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function salvarConsulta() {
    const dataISO = parseDateBR(dataInput);
    if (!form.cliente_nome || !dataISO || !form.hora) return;

    const procFinal = form.procedimento === "Outro" ? procedimentoCustom : form.procedimento;
    const statusFinal = form.status === "Outro" ? statusCustom : form.status;

    if (form.procedimento === "Outro" && procedimentoCustom && !procedimentos.includes(procedimentoCustom)) {
      setProcedimentos(prev => [...prev.slice(0, -1), procedimentoCustom, "Outro"]);
    }
    if (form.status === "Outro" && statusCustom && !statusLista.includes(statusCustom)) {
      setStatusLista(prev => [...prev, statusCustom]);
      STATUS_CORES[statusCustom] = "#14B8A6";
    }

    setSalvando(true);
    const { error } = await supabase.from("consultas").insert([{
      cliente_nome: form.cliente_nome,
      procedimento: procFinal,
      profissional: form.profissional,
      data: dataISO,
      hora: form.hora,
      duracao: form.duracao,
      status: statusFinal,
      observacoes: form.observacoes,
    }]);

    if (!error) {
      setForm({ cliente_nome: "", procedimento: "", procedimento_outro: "", profissional: "Dr. Leandro Pássaro", data: "", hora: "08:00", duracao: 1, status: "Confirmado", status_outro: "", observacoes: "" });
      setDataInput("");
      setBuscaCliente("");
      setProcedimentoCustom("");
      setStatusCustom("");
      setMostrarForm(false);
      carregarDados();
    }
    setSalvando(false);
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

  const diasSemana = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(semanaAtual);
    d.setDate(semanaAtual.getDate() + i);
    return d;
  });

  function getConsulta(data: Date, hora: string) {
    const iso = toISO(data);
    return consultas.find(c => c.data === iso && c.hora === hora);
  }

  const sugestoesClientes = buscaCliente.length >= 1
    ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 8)
    : [];

  const mesAno = semanaAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const inputClass = "w-full h-10 bg-[#0F1117] border border-white/10 rounded-lg px-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors";
  const labelClass = "text-white/40 text-xs font-semibold uppercase tracking-wide block mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Agenda</h1>
          <p className="text-white/40 text-sm mt-1 capitalize">{mesAno}</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1">
            <button onClick={() => { const d = new Date(semanaAtual); d.setDate(d.getDate()-7); setSemanaAtual(d); }} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white flex items-center justify-center">‹</button>
            <button onClick={() => setSemanaAtual(getSegundaFeira(new Date()))} className="px-3 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white text-xs">Hoje</button>
            <button onClick={() => { const d = new Date(semanaAtual); d.setDate(d.getDate()+7); setSemanaAtual(d); }} className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white flex items-center justify-center">›</button>
          </div>
          <button onClick={() => setMostrarForm(!mostrarForm)} className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-4 h-9 rounded-lg hover:opacity-90">
            + Agendar
          </button>
        </div>
      </div>

      {mostrarForm && (
        <div className="bg-[#161A22] border border-white/10 rounded-xl p-5 mb-6">
          <div className="text-white font-semibold text-sm mb-4">Nova consulta</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Autocomplete paciente */}
            <div ref={buscaRef} className="relative">
              <label className={labelClass}>Paciente *</label>
              <input
                type="text"
                value={buscaCliente}
                onChange={e => {
                  setBuscaCliente(e.target.value);
                  setForm({...form, cliente_nome: e.target.value});
                  setMostrarSugestoes(true);
                }}
                onFocus={() => setMostrarSugestoes(true)}
                placeholder="Digite o nome..."
                className={inputClass}
              />
              {mostrarSugestoes && sugestoesClientes.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1C2130] border border-white/10 rounded-lg overflow-hidden shadow-xl">
                  {sugestoesClientes.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setBuscaCliente(c.nome);
                        setForm({...form, cliente_nome: c.nome});
                        setMostrarSugestoes(false);
                      }}
                      className="px-3 py-2.5 text-sm text-white hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0"
                    >
                      {c.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Procedimento */}
            <div>
              <label className={labelClass}>Procedimento</label>
              <select value={form.procedimento} onChange={e => setForm({...form, procedimento: e.target.value})} className={inputClass}>
                <option value="">Selecione...</option>
                {procedimentos.map(p => <option key={p}>{p}</option>)}
              </select>
              {form.procedimento === "Outro" && (
                <input
                  type="text"
                  value={procedimentoCustom}
                  onChange={e => setProcedimentoCustom(e.target.value)}
                  placeholder="Digite o procedimento..."
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>

            {/* Profissional */}
            <div>
              <label className={labelClass}>Profissional</label>
              <select value={form.profissional} onChange={e => setForm({...form, profissional: e.target.value})} className={inputClass}>
                <option>Dr. Leandro Pássaro</option>
                <option>Dra. Ana Lima</option>
                <option>Dr. Carlos Santos</option>
              </select>
            </div>

            {/* Data */}
            <div>
              <label className={labelClass}>Data * (DD/MM/AAAA)</label>
              <input
                type="text"
                value={dataInput}
                onChange={e => setDataInput(formatarDataInput(e.target.value))}
                placeholder="24/05/2026"
                maxLength={10}
                className={inputClass}
              />
            </div>

            {/* Hora */}
            <div>
              <label className={labelClass}>Horário *</label>
              <select value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} className={inputClass}>
                {HORAS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputClass}>
                {statusLista.map(s => <option key={s}>{s}</option>)}
                <option value="Outro">Outro...</option>
              </select>
              {form.status === "Outro" && (
                <input
                  type="text"
                  value={statusCustom}
                  onChange={e => setStatusCustom(e.target.value)}
                  placeholder="Digite o status..."
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Observações</label>
            <input type="text" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} placeholder="Observações opcionais..." className={inputClass} />
          </div>

          <div className="flex gap-3">
            <button onClick={salvarConsulta} disabled={salvando || !form.cliente_nome || !dataInput} className="bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-5 h-9 rounded-lg hover:opacity-90 disabled:opacity-40">
              {salvando ? "Salvando..." : "Salvar consulta"}
            </button>
            <button onClick={() => { setMostrarForm(false); setBuscaCliente(""); setDataInput(""); }} className="bg-white/5 border border-white/10 text-white/60 text-sm px-5 h-9 rounded-lg hover:text-white">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#161A22] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid border-b border-white/5" style={{ gridTemplateColumns: "70px repeat(6, 1fr)" }}>
          <div className="p-3 border-r border-white/5" />
          {diasSemana.map((dia, i) => {
            const hoje = toISO(new Date()) === toISO(dia);
            return (
              <div key={i} className={`p-3 text-center border-r border-white/5 last:border-r-0 ${hoje ? "bg-[#4F8EF7]/5" : ""}`}>
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
                  return (
                    <div key={diaIdx} className={`border-r border-white/5 last:border-r-0 p-1 ${hoje ? "bg-[#4F8EF7]/3" : ""}`}>
                      {consulta && cor && (
                        <div
                          onClick={() => { setConsultaSelecionada(consulta); setMostrarModal(true); }}
                          className="rounded-lg p-2 cursor-pointer hover:brightness-110 transition-all h-full"
                          style={{ background: `${cor}18`, borderLeft: `3px solid ${cor}` }}
                        >
                          <div className="text-white text-xs font-semibold truncate">{consulta.cliente_nome}</div>
                          <div className="text-white/50 text-xs truncate">{consulta.procedimento}</div>
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${cor}30`, color: cor }}>
                            {consulta.status}
                          </span>
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

      {mostrarModal && consultaSelecionada && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setMostrarModal(false)}>
          <div className="bg-[#161A22] border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold">Detalhes da consulta</div>
              <button onClick={() => setMostrarModal(false)} className="text-white/30 hover:text-white text-lg">✕</button>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm"><span className="text-white/40">Paciente</span><span className="text-white font-medium">{consultaSelecionada.cliente_nome}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Procedimento</span><span className="text-white">{consultaSelecionada.procedimento}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Data</span><span className="text-white">{new Date(consultaSelecionada.data + "T12:00:00").toLocaleDateString("pt-BR")}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Horário</span><span className="text-white">{consultaSelecionada.hora}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Profissional</span><span className="text-white">{consultaSelecionada.profissional}</span></div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-white/40">Status</span>
                <span className="font-semibold px-2 py-0.5 rounded-full text-xs" style={{ background: `${STATUS_CORES[consultaSelecionada.status] ?? "#4F8EF7"}30`, color: STATUS_CORES[consultaSelecionada.status] ?? "#4F8EF7" }}>
                  {consultaSelecionada.status}
                </span>
              </div>
              {consultaSelecionada.observacoes && (
                <div className="flex justify-between text-sm"><span className="text-white/40">Obs.</span><span className="text-white text-right max-w-[60%]">{consultaSelecionada.observacoes}</span></div>
              )}
            </div>
            <div className="mb-4">
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Alterar status</div>
              <div className="grid grid-cols-2 gap-2">
                {statusLista.map(status => (
                  <button key={status} onClick={() => alterarStatus(consultaSelecionada.id, status)}
                    className={`text-xs py-2 px-3 rounded-lg font-medium transition-all border ${consultaSelecionada.status === status ? "border-white/20 bg-white/10 text-white" : "border-white/5 bg-white/5 text-white/50 hover:text-white"}`}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => excluirConsulta(consultaSelecionada.id)} className="w-full py-2 text-red-400 text-sm border border-red-400/20 rounded-lg hover:bg-red-400/10 transition-colors">
              Excluir consulta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
