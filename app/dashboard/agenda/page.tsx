"use client";

import { useState } from "react";

const HORAS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];
const DIAS = ["Seg","Ter","Qua","Qui","Sex"];
const DATAS = ["19/05","20/05","21/05","22/05","23/05"];

const STATUS_CORES: Record<string, string> = {
  "Confirmado": "#4F8EF7",
  "Aguardando": "#F59E0B",
  "Em atendimento": "#22C55E",
  "Finalizado": "#6B7280",
  "Cancelado": "#EF4444",
  "Urgência": "#EC4899",
};

type Consulta = {
  id: number;
  paciente: string;
  procedimento: string;
  hora: string;
  dia: number;
  duracao: number;
  status: string;
  profissional: string;
};

const consultasIniciais: Consulta[] = [
  { id: 1, paciente: "Maria Fernanda", procedimento: "Canal", hora: "08:00", dia: 0, duracao: 2, status: "Em atendimento", profissional: "Dra. Ana" },
  { id: 2, paciente: "João Pedro", procedimento: "Extração", hora: "09:00", dia: 0, duracao: 1, status: "Aguardando", profissional: "Dr. Carlos" },
  { id: 3, paciente: "Laura Santos", procedimento: "Clareamento", hora: "10:00", dia: 2, duracao: 1, status: "Confirmado", profissional: "Dra. Ana" },
  { id: 4, paciente: "Rafael Torres", procedimento: "Urgência", hora: "10:00", dia: 2, duracao: 1, status: "Urgência", profissional: "Dr. Carlos" },
  { id: 5, paciente: "Carla Miranda", procedimento: "Aparelho", hora: "11:00", dia: 2, duracao: 1, status: "Confirmado", profissional: "Dra. Ana" },
  { id: 6, paciente: "André Rodrigues", procedimento: "Implante", hora: "14:00", dia: 3, duracao: 2, status: "Confirmado", profissional: "Dr. Carlos" },
  { id: 7, paciente: "Beatriz Lima", procedimento: "Limpeza", hora: "09:00", dia: 1, duracao: 1, status: "Confirmado", profissional: "Dra. Ana" },
  { id: 8, paciente: "Pedro Souza", procedimento: "Consulta", hora: "15:00", dia: 4, duracao: 1, status: "Aguardando", profissional: "Dr. Carlos" },
];

export default function Agenda() {
  const [consultas, setConsultas] = useState<Consulta[]>(consultasIniciais);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  function alterarStatus(id: number, novoStatus: string) {
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, status: novoStatus } : c));
    setConsultaSelecionada(prev => prev?.id === id ? { ...prev, status: novoStatus } : prev);
  }

  function getConsulta(dia: number, hora: string) {
    return consultas.find(c => c.dia === dia && c.hora === hora);
  }

  const horaIndex = (hora: string) => HORAS.indexOf(hora);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Agenda</h1>
          <p className="text-white/40 text-sm mt-1">Semana de 19 a 23 de maio de 2025</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {["Semana","Dia","Mês"].map(v => (
              <button key={v} className={`px-3 py-1 rounded text-xs font-semibold transition-all ${v === "Semana" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>{v}</button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-4 h-9 rounded-lg hover:opacity-90">
            + Agendar
          </button>
        </div>
      </div>

      {/* Grade da agenda */}
      <div className="bg-[#161A22] border border-white/5 rounded-xl overflow-hidden">
        {/* Header dos dias */}
        <div className="grid border-b border-white/5" style={{ gridTemplateColumns: "70px repeat(5, 1fr)" }}>
          <div className="p-3 border-r border-white/5" />
          {DIAS.map((dia, i) => (
            <div key={dia} className={`p-3 text-center border-r border-white/5 last:border-r-0 ${i === 2 ? "bg-[#4F8EF7]/5" : ""}`}>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide">{dia}</div>
              <div className={`text-lg font-bold mt-0.5 ${i === 2 ? "text-[#4F8EF7]" : "text-white"}`}>{DATAS[i]}</div>
            </div>
          ))}
        </div>

        {/* Slots de horário */}
        <div className="overflow-y-auto max-h-[580px]">
          {HORAS.map((hora) => (
            <div key={hora} className="grid border-b border-white/5 last:border-b-0" style={{ gridTemplateColumns: "70px repeat(5, 1fr)", minHeight: "64px" }}>
              <div className="p-3 border-r border-white/5 text-white/30 text-xs font-medium flex items-start pt-3">{hora}</div>
              {DIAS.map((_, diaIdx) => {
                const consulta = getConsulta(diaIdx, hora);
                const cor = consulta ? STATUS_CORES[consulta.status] || "#4F8EF7" : null;
                return (
                  <div
                    key={diaIdx}
                    className={`border-r border-white/5 last:border-r-0 p-1 relative ${diaIdx === 2 ? "bg-[#4F8EF7]/3" : ""}`}
                  >
                    {consulta && (
                      <div
                        onClick={() => { setConsultaSelecionada(consulta); setMostrarModal(true); }}
                        className="rounded-lg p-2 cursor-pointer hover:brightness-110 transition-all h-full"
                        style={{ background: `${cor}18`, borderLeft: `3px solid ${cor}` }}
                      >
                        <div className="text-white text-xs font-semibold truncate">{consulta.paciente}</div>
                        <div className="text-white/50 text-xs truncate">{consulta.procedimento}</div>
                        <div className="mt-1">
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${cor}30`, color: cor }}>
                            {consulta.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de consulta */}
      {mostrarModal && consultaSelecionada && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setMostrarModal(false)}>
          <div className="bg-[#161A22] border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold">Detalhes da consulta</div>
              <button onClick={() => setMostrarModal(false)} className="text-white/30 hover:text-white text-lg">✕</button>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Paciente</span>
                <span className="text-white font-medium">{consultaSelecionada.paciente}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Procedimento</span>
                <span className="text-white">{consultaSelecionada.procedimento}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Horário</span>
                <span className="text-white">{consultaSelecionada.hora}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Profissional</span>
                <span className="text-white">{consultaSelecionada.profissional}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-white/40">Status</span>
                <span className="font-semibold px-2 py-0.5 rounded-full text-xs" style={{ background: `${STATUS_CORES[consultaSelecionada.status]}30`, color: STATUS_CORES[consultaSelecionada.status] }}>
                  {consultaSelecionada.status}
                </span>
              </div>
            </div>
            <div>
              <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-2">Alterar status</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(STATUS_CORES).map(status => (
                  <button
                    key={status}
                    onClick={() => alterarStatus(consultaSelecionada.id, status)}
                    className={`text-xs py-2 px-3 rounded-lg font-medium transition-all border ${consultaSelecionada.status === status ? "border-white/20 bg-white/10 text-white" : "border-white/5 bg-white/5 text-white/50 hover:text-white hover:border-white/20"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}