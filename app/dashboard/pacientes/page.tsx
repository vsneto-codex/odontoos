"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

type Paciente = {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  created_at: string;
};

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", cpf: "" });
  const supabase = createClient();

  async function carregarPacientes() {
    setLoading(true);
    const { data, error } = await supabase.from("pacientes").select("*").order("created_at", { ascending: false });
    if (!error && data) setPacientes(data);
    setLoading(false);
  }

  useEffect(() => { carregarPacientes(); }, []);

  async function salvarPaciente() {
    if (!form.nome || !form.telefone) return;
    setSalvando(true);
    const { error } = await supabase.from("pacientes").insert([form]);
    if (!error) {
      setForm({ nome: "", telefone: "", email: "", cpf: "" });
      setMostrarForm(false);
      carregarPacientes();
    }
    setSalvando(false);
  }

  async function excluirPaciente(id: number, nome: string) {
    if (!confirm(`Excluir ${nome}?`)) return;
    await supabase.from("pacientes").delete().eq("id", id);
    carregarPacientes();
  }

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

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.telefone?.includes(busca) ||
    p.cpf?.includes(busca)
  );

  const inputClass = "w-full h-10 bg-[#0F1117] border border-white/10 rounded-lg px-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors";
  const labelClass = "text-white/40 text-xs font-semibold uppercase tracking-wide block mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Pacientes</h1>
          <p className="text-white/40 text-sm mt-1">{pacientes.length} pacientes cadastrados</p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-4 h-9 rounded-lg hover:opacity-90 transition-opacity">
          + Novo paciente
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-[#161A22] border border-white/10 rounded-xl p-5 mb-6">
          <div className="text-white font-semibold text-sm mb-4">Novo paciente</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Nome completo *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do paciente" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefone *</label>
              <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })} placeholder="(15) 99772-7409" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>CPF</label>
              <input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })} placeholder="000.000.000-00" className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={salvarPaciente} disabled={salvando || !form.nome || !form.telefone} className="bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-5 h-9 rounded-lg hover:opacity-90 disabled:opacity-40">
              {salvando ? "Salvando..." : "Salvar paciente"}
            </button>
            <button onClick={() => setMostrarForm(false)} className="bg-white/5 border border-white/10 text-white/60 text-sm px-5 h-9 rounded-lg hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-[#161A22] border border-white/10 rounded-lg px-3 h-10 mb-4">
        <span className="text-white/30 text-sm">🔍</span>
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, telefone ou CPF..." className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none" />
      </div>

      <div className="bg-[#161A22] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Carregando pacientes...</div>
        ) : pacientesFiltrados.length === 0 ? (
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
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">E-mail</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">CPF</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Cadastrado em</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.map((p, i) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `hsl(${(i * 47) % 360}, 70%, 20%)`, color: `hsl(${(i * 47) % 360}, 70%, 70%)` }}>
                        {p.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-white text-sm font-medium">{p.nome}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-sm hidden md:table-cell">{p.telefone}</td>
                  <td className="px-4 py-3 text-white/50 text-sm hidden md:table-cell">{p.email || "—"}</td>
                  <td className="px-4 py-3 text-white/50 text-sm hidden lg:table-cell">{p.cpf || "—"}</td>
                  <td className="px-4 py-3 text-white/50 text-sm hidden lg:table-cell">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => excluirPaciente(p.id, p.nome)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all text-xs px-2 py-1 rounded">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}