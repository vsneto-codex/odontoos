"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

type Procedimento = {
  id: string;
  nome: string;
  categoria: string;
  preco: number | null;
  duracao_min: number | null;
  favorito: boolean | null;
  ativo: boolean | null;
  created_at: string;
};

const CATEGORIAS = [
  "Limpeza e prevenção",
  "Restaurações",
  "Extrações",
  "Implantes",
  "Ortodontia",
  "Estética",
  "Endodontia",
  "Cirurgia",
  "Emergências",
  "Outros",
];

const inputClass = "h-8 bg-[#13161C] border border-white/10 rounded-lg px-2 text-white text-sm outline-none focus:border-[#4F8EF7] transition-colors w-full";

function formatarMoeda(valor: number | null) {
  if (!valor) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export default function Procedimentos() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formEdit, setFormEdit] = useState<Partial<Procedimento>>({});
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formNovo, setFormNovo] = useState({ nome: "", categoria: CATEGORIAS[0], preco: "", duracao_min: "" });
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const editRef = useRef<HTMLTableRowElement>(null);
  const supabase = createClient();

  const carregarProcedimentos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("procedimentos")
      .select("*")
      .order("favorito", { ascending: false })
      .order("nome", { ascending: true });
    if (!error && data) setProcedimentos(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { carregarProcedimentos(); }, [carregarProcedimentos]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (editRef.current && !editRef.current.contains(e.target as Node)) {
        setEditandoId(null);
      }
    }
    if (editandoId) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editandoId]);

  function iniciarEdicao(p: Procedimento) {
    setEditandoId(p.id);
    setFormEdit({ ...p });
  }

  async function salvarEdicao() {
    if (!editandoId) return;
    setSalvando(true);
    await supabase.from("procedimentos").update({
      nome: formEdit.nome,
      categoria: formEdit.categoria,
      preco: formEdit.preco ?? null,
      duracao_min: formEdit.duracao_min ?? null,
    }).eq("id", editandoId);
    await carregarProcedimentos();
    setEditandoId(null);
    setSalvando(false);
  }

  async function toggleFavorito(p: Procedimento) {
    await supabase.from("procedimentos").update({ favorito: !p.favorito }).eq("id", p.id);
    setProcedimentos(prev => prev.map(x => x.id === p.id ? { ...x, favorito: !x.favorito } : x));
  }

  async function toggleAtivo(p: Procedimento) {
    await supabase.from("procedimentos").update({ ativo: !p.ativo }).eq("id", p.id);
    setProcedimentos(prev => prev.map(x => x.id === p.id ? { ...x, ativo: !x.ativo } : x));
  }

  async function salvarNovo() {
    if (!formNovo.nome || !formNovo.categoria) return;
    setSalvandoNovo(true);
    await supabase.from("procedimentos").insert([{
      nome: formNovo.nome,
      categoria: formNovo.categoria,
      preco: formNovo.preco ? parseFloat(formNovo.preco.replace(",", ".")) : null,
      duracao_min: formNovo.duracao_min ? parseInt(formNovo.duracao_min) : null,
      favorito: false,
      ativo: true,
    }]);
    setFormNovo({ nome: "", categoria: CATEGORIAS[0], preco: "", duracao_min: "" });
    setMostrarForm(false);
    await carregarProcedimentos();
    setSalvandoNovo(false);
  }

  const categorias = ["todas", ...CATEGORIAS];

  const filtrados = procedimentos.filter((p) => {
    const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase());
    const catOk = categoriaFiltro === "todas" || p.categoria === categoriaFiltro;
    return buscaOk && catOk;
  });

  const favoritos = filtrados.filter(p => p.favorito);
  const outros = filtrados.filter(p => !p.favorito);
  const lista = [...favoritos, ...outros];

  const labelClass = "text-white/40 text-xs font-semibold uppercase tracking-wide block mb-1";
  const inputFormClass = "w-full h-10 bg-[#13161C] border border-white/10 rounded-lg px-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4F8EF7] transition-colors";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-semibold">Procedimentos</h1>
          <p className="text-white/40 text-sm mt-1">{procedimentos.filter(p => p.ativo !== false).length} procedimentos ativos</p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-4 h-9 rounded-lg hover:opacity-90 transition-opacity">
          + Novo procedimento
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-[#1E2330] border border-white/10 rounded-xl p-5 mb-6">
          <div className="text-white font-semibold text-sm mb-4">Novo procedimento</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Nome *</label>
              <input type="text" value={formNovo.nome} onChange={e => setFormNovo({...formNovo, nome: e.target.value})} placeholder="Ex: Limpeza dental" className={inputFormClass} />
            </div>
            <div>
              <label className={labelClass}>Categoria *</label>
              <select value={formNovo.categoria} onChange={e => setFormNovo({...formNovo, categoria: e.target.value})} className={inputFormClass}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Preço (R$)</label>
              <input type="text" value={formNovo.preco} onChange={e => setFormNovo({...formNovo, preco: e.target.value})} placeholder="150,00" className={inputFormClass} />
            </div>
            <div>
              <label className={labelClass}>Duração (min)</label>
              <input type="number" value={formNovo.duracao_min} onChange={e => setFormNovo({...formNovo, duracao_min: e.target.value})} placeholder="60" className={inputFormClass} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={salvarNovo} disabled={salvandoNovo || !formNovo.nome}
              className="bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white text-sm font-semibold px-5 h-9 rounded-lg hover:opacity-90 disabled:opacity-40">
              {salvandoNovo ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setMostrarForm(false)}
              className="bg-white/5 border border-white/10 text-white/60 text-sm px-5 h-9 rounded-lg hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-[#1E2330] border border-white/10 rounded-lg px-3 h-10 flex-1 min-w-[200px]">
          <span className="text-white/30 text-sm">🔍</span>
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar procedimento..."
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none" />
          {busca && <button onClick={() => setBusca("")} className="text-white/30 hover:text-white text-xs">✕</button>}
        </div>
        <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
          className="h-10 bg-[#1E2330] border border-white/10 rounded-lg px-3 text-white text-sm outline-none focus:border-[#4F8EF7] transition-colors">
          {categorias.map(c => <option key={c} value={c}>{c === "todas" ? "Todas as categorias" : c}</option>)}
        </select>
      </div>

      <div className="bg-[#1E2330] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Carregando procedimentos...</div>
        ) : lista.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-white/20 text-4xl mb-3">🦷</div>
            <div className="text-white/40 text-sm">Nenhum procedimento encontrado</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3">Procedimento</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Categoria</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Preço</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Duração</th>
                <th className="text-left text-white/30 text-xs font-semibold uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const editando = editandoId === p.id;
                return (
                  <tr key={p.id}
                    ref={editando ? editRef : null}
                    className={`border-b border-white/5 transition-colors ${editando ? "bg-[#4F8EF7]/5" : "hover:bg-white/3"} ${p.ativo === false ? "opacity-40" : ""}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleFavorito(p)}
                        className={`text-lg transition-all ${p.favorito ? "text-yellow-400" : "text-white/15 hover:text-yellow-400/50"}`}
                        title={p.favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                        ★
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {editando ? (
                        <input autoFocus value={formEdit.nome ?? ""} onChange={e => setFormEdit({...formEdit, nome: e.target.value})}
                          className={inputClass} onKeyDown={e => e.key === "Enter" && salvarEdicao()} />
                      ) : (
                        <div className="text-white text-sm font-medium cursor-pointer" onClick={() => iniciarEdicao(p)}>{p.nome}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {editando ? (
                        <select value={formEdit.categoria ?? ""} onChange={e => setFormEdit({...formEdit, categoria: e.target.value})} className={inputClass}>
                          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span className="text-white/50 text-xs px-2 py-1 rounded-full bg-white/5 cursor-pointer" onClick={() => iniciarEdicao(p)}>{p.categoria}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {editando ? (
                        <input type="number" value={formEdit.preco ?? ""} onChange={e => setFormEdit({...formEdit, preco: parseFloat(e.target.value)})} className={inputClass} placeholder="0.00" />
                      ) : (
                        <span className="text-white/50 text-sm cursor-pointer" onClick={() => iniciarEdicao(p)}>{formatarMoeda(p.preco)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {editando ? (
                        <input type="number" value={formEdit.duracao_min ?? ""} onChange={e => setFormEdit({...formEdit, duracao_min: parseInt(e.target.value)})} className={inputClass} placeholder="min" />
                      ) : (
                        <span className="text-white/50 text-sm cursor-pointer" onClick={() => iniciarEdicao(p)}>{p.duracao_min ? `${p.duracao_min} min` : "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAtivo(p)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-all ${p.ativo !== false ? "bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E]/25" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>
                        {p.ativo !== false ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editando ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={salvarEdicao} disabled={salvando}
                            className="text-xs font-semibold px-3 h-7 bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC] text-white rounded-lg hover:opacity-90 disabled:opacity-40">
                            {salvando ? "..." : "Salvar"}
                          </button>
                          <button onClick={() => setEditandoId(null)} className="text-xs text-white/30 hover:text-white transition-colors px-2 h-7">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => iniciarEdicao(p)} className="text-white/20 hover:text-white text-xs px-2 py-1 rounded transition-all">Editar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-white/20 text-xs mt-3 text-center">Clique em qualquer linha para editar • ★ para favoritar • Enter para salvar</p>
    </div>
  );
}