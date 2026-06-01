"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  convenio: string | null;
  numero_convenio: string | null;
  observacoes: string | null;
  ativo: boolean | null;
  created_at: string;
};

type Consulta = {
  id: string;
  cliente_nome: string;
  procedimento: string;
  hora: string;
  data: string;
  status: string;
  profissional: string;
  observacoes: string | null;
};

const STATUS_CORES: Record<string, string> = {
  "Confirmado": "#4F8EF7",
  "Aguardando": "#F59E0B",
  "Em atendimento": "#22C55E",
  "Finalizado": "#6B7280",
  "Cancelado": "#EF4444",
  "Urgência": "#EC4899",
  "Concluído": "#22C55E",
};

const inputClass = "w-full h-10 bg-[#13161C] border border-white/10 rounded-lg px-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors";
const labelClass = "text-white/40 text-xs font-semibold uppercase tracking-wide block mb-1";

function formatarTelefone(valor: string) {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  return nums.length <= 10
    ? nums.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
    : nums.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function formatarCPF(valor: string) {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
}

function formatarCEP(valor: string) {
  const nums = valor.replace(/\D/g, "").slice(0, 8);
  return nums.replace(/(\d{5})(\d{0,3})/, "$1-$2");
}

function ModalPaciente({
  cliente, onFechar, onSalvar, onExcluir,
}: {
  cliente: Cliente;
  onFechar: () => void;
  onSalvar: (dados: Partial<Cliente>) => Promise<void>;
  onExcluir: (id: string, nome: string) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<Cliente>>(cliente);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [aba, setAba] = useState<"dados" | "historico">("dados");
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loadingConsultas, setLoadingConsultas] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onFechar(); }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onFechar]);

  useEffect(() => {
    if (aba === "historico") carregarHistorico();
  }, [aba]);

  async function carregarHistorico() {
    setLoadingConsultas(true);
    const { data } = await supabase
      .from("consultas")
      .select("*")
      .eq("cliente_nome", cliente.nome)
      .order("data", { ascending: false })
      .order("hora", { ascending: false });
    if (data) setConsultas(data);
    setLoadingConsultas(false);
  }

  async function handleSalvar() {
    setSalvando(true);
    await onSalvar(form);
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  const iniciais = cliente.nome?.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#181C24] border border-white/10 rounded-2xl shadow-2xl flex flex-col">

        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "rgba(79,142,247,0.15)", color: "#4F8EF7" }}>
            {iniciais}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm truncate">{cliente.nome}</div>
            <div className="text-white/40 text-xs">{cliente.telefone || "Sem telefone"}</div>
          </div>
          <button onClick={onFechar} className="text-white/30 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5" title="Fechar (ESC)">✕</button>
        </div>

        <div className="flex border-b border-white/5 flex-shrink-0 px-6">
          {(["dados", "historico"] as const).map((a) => (
            <button key={a} onClick={() => setAba(a)}
              className={`py-3 px-4 text-xs font-semibold uppercase tracking-wide transition-colors ${aba === a ? "text-[#4F8EF7] border-b-2 border-[#4F8EF7]" : "text-white/30 hover:text-white/60"}`}>
              {a === "dados" ? "Dados" : `Histórico${consultas.length > 0 ? ` (${consultas.length})` : ""}`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {aba === "dados" && (
            <div className="space-y-4">
              <div className="text-white/20 text-xs uppercase tracking-widest font-semibold pb-1 border-b border-white/5">Informações básicas</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={labelClass}>Nome completo</label><input type="text" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Telefone</label><input type="text" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Data de nascimento</label><input type="date" value={form.data_nascimento ?? ""} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>E-mail</label><input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>CPF</label><input type="text" value={form.cpf ?? ""} onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })} className={inputClass} /></div>
              </div>
              <div className="text-white/20 text-xs uppercase tracking-widest font-semibold pb-1 border-b border-white/5 pt-2">Endereço</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={labelClass}>Endereço</label><input type="text" value={form.endereco ?? ""} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número" className={inputClass} /></div>
                <div><label className={labelClass}>Cidade</label><input type="text" value={form.cidade ?? ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Estado</label><input type="text" value={form.estado ?? ""} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>CEP</label><input type="text" value={form.cep ?? ""} onChange={(e) => setForm({ ...form, cep: formatarCEP(e.target.value) })} placeholder="00000-000" className={inputClass} /></div>
              </div>
              <div className="text-white/20 text-xs uppercase tracking-widest font-semibold pb-1 border-b border-white/5 pt-2">Convênio</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Convênio</label><input type="text" value={form.convenio ?? ""} onChange={(e) => setForm({ ...form, convenio: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Número</label><input type="text" value={form.numero_convenio ?? ""} onChange={(e) => setForm({ ...form, numero_convenio: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="text-white/20 text-xs uppercase tracking-widest font-semibold pb-1 border-b border-white/5 pt-2">Observações</div>
              <div><label className={labelClass}>Observações</label><textarea value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} placeholder="Anotações importantes..." className="w-full bg-[#13161C] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors resize-none" /></div>
            </div>
          )}

          {aba === "historico" && (
            <div>
              {loadingConsultas ? (
                <div className="flex items-center justify-center h-32 text-white/30 text-sm">Carregando histórico...</div>
              ) : consultas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <div className="text-white/20 text-3xl mb-3">📋</div>
                  <div className="text-white/40 text-sm">Nenhuma consulta registrada</div>
                  <div className="text-white/20 text-xs mt-1">As consultas agendadas aparecerão aqui</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {consultas.map((c) => {
                    const cor = STATUS_CORES[c.status] ?? "#4F8EF7";
                    const dataFormatada = new Date(c.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                    return (
                      <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:bg-white/5 transition-colors" style={{ background: `${cor}08` }}>
                        <div className="flex-shrink-0 text-center min-w-[60px]">
                          <div className="text-white text-sm font-semibold">{c.hora}</div>
                          <div className="text-white/40 text-xs">{dataFormatada}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{c.procedimento}</div>
                          <div className="text-white/40 text-xs truncate">{c.profissional}</div>
                          {c.observacoes && <div className="text-white/30 text-xs truncate mt-0.5">{c.observacoes}</div>}
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0" style={{ background: `${cor}20`, color: cor }}>{c.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {aba === "dados" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 flex-shrink-0">
            <button onClick={() => onExcluir(cliente.id, cliente.nome)} className="text-white/30 hover:text-red-400 text-sm transition-colors">Excluir paciente</button>
            <div className="flex gap-3">
              <button onClick={onFechar} className="h-9 px-5 bg-white/5 border border-white/10 text-white/60 text-sm rounded-lg hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSalvar} disabled={salvando} className="h-9 px-6 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
                {salvando ? "Salvando..." : salvo ? "✓ Salvo" : "Salvar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pacientes() {
  const searchParams = useSearchParams();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", cpf: "" });
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("novo") === "true") setMostrarForm(true);
  }, [searchParams]);

  const carregarClientes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("clientes").select("*").order("nome", { ascending: true });
    if (!error && data) setClientes(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { carregarClientes(); }, [carregarClientes]);

  async function salvarNovoCliente() {
    if (!form.nome || !form.telefone) return;
    setSalvando(true);
    const { error } = await supabase.from("clientes").insert([form]);
    if (!error) { setForm({ nome: "", telefone: "", email: "", cpf: "" }); setMostrarForm(false); carregarClientes(); }
    setSalvando(false);
  }

  async function salvarEdicao(id: string, dados: Partial<Cliente>) {
    await supabase.from("clientes").update(dados).eq("id", id);
    await carregarClientes();
    setClienteSelecionado((prev) => prev ? { ...prev, ...dados } : null);
  }

  async function excluirCliente(id: string, nome: string) {
    if (!confirm(`Excluir ${nome}? Esta ação não pode ser desfeita.`)) return;
    await supabase.from("clientes").delete().eq("id", id);
    setClienteSelecionado(null);
    carregarClientes();
  }

  const clientesFiltrados = clientes.filter((c) =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca) ||
    c.cpf?.includes(busca)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Pacientes</h1>
          <p className="text-white/40 text-sm mt-1">{clientes.length} paciente{clientes.length !== 1 ? "s" : ""} cadastrado{clientes.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-4 h-9 rounded-lg hover:opacity-90 transition-opacity">
          + Novo paciente
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-[#1E2330] border border-white/10 rounded-xl p-5 mb-6">
          <div className="text-white font-semibold text-sm mb-4">Novo paciente</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className={labelClass}>Nome completo *</label><input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do paciente" className={inputClass} /></div>
            <div><label className={labelClass}>Telefone *</label><input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })} placeholder="(15) 99999-0000" className={inputClass} /></div>
            <div><label className={labelClass}>E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className={inputClass} /></div>
            <div><label className={labelClass}>CPF</label><input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })} placeholder="000.000.000-00" className={inputClass} /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={salvarNovoCliente} disabled={salvando || !form.nome || !form.telefone} className="bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-5 h-9 rounded-lg hover:opacity-90 disabled:opacity-40">
              {salvando ? "Salvando..." : "Salvar paciente"}
            </button>
            <button onClick={() => setMostrarForm(false)} className="bg-white/5 border border-white/10 text-white/60 text-sm px-5 h-9 rounded-lg hover:text-white transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-[#1E2330] border border-white/10 rounded-lg px-3 h-10 mb-4">
        <span className="text-white/30 text-sm">🔍</span>
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, telefone ou CPF..." className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none" />
        {busca && <button onClick={() => setBusca("")} className="text-white/30 hover:text-white text-xs transition-colors">✕</button>}
      </div>

      <div className="bg-[#1E2330] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Carregando pacientes...</div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-white/20 text-4xl mb-3">👥</div>
            <div className="text-white/40 text-sm">{busca ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado ainda"}</div>
            {!busca && <button onClick={() => setMostrarForm(true)} className="mt-3 text-[#4F8EF7] text-sm hover:underline">Cadastrar primeiro paciente →</button>}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3">Paciente</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Telefone</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Convênio</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Cadastrado em</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c, i) => (
                <tr key={c.id} onClick={() => setClienteSelecionado(c)} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `hsl(${(i * 47) % 360}, 70%, 20%)`, color: `hsl(${(i * 47) % 360}, 70%, 70%)` }}>
                        {c.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{c.nome}</div>
                        {c.email && <div className="text-white/30 text-xs">{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-sm hidden md:table-cell">{c.telefone || "—"}</td>
                  <td className="px-4 py-3 text-white/50 text-sm hidden lg:table-cell">{c.convenio || "—"}</td>
                  <td className="px-4 py-3 text-white/30 text-xs hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {clienteSelecionado && (
        <ModalPaciente
          cliente={clienteSelecionado}
          onFechar={() => setClienteSelecionado(null)}
          onSalvar={(dados) => salvarEdicao(clienteSelecionado.id, dados)}
          onExcluir={excluirCliente}
        />
      )}
    </div>
  );
}