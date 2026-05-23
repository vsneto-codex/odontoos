export default function Dashboard() {
  const kpis = [
    { label: "Pacientes hoje", value: "18", delta: "+3 vs ontem", color: "#4F8EF7", up: true },
    { label: "Confirmados", value: "12", delta: "67% confirmados", color: "#22C55E", up: true },
    { label: "Faturamento", value: "R$4.820", delta: "+12% vs semana", color: "#14B8A6", up: true },
    { label: "Pendências", value: "5", delta: "2 urgentes", color: "#F59E0B", up: false },
  ];

  const consultas = [
    { iniciais: "MF", nome: "Maria Fernanda Costa", proc: "Canal · Dra. Ana", hora: "08:30", status: "Em atendimento", cor: "#22C55E" },
    { iniciais: "JP", nome: "João Pedro Alves", proc: "Extração · Dr. Carlos", hora: "09:00", status: "Aguardando", cor: "#F59E0B" },
    { iniciais: "LS", nome: "Laura Santos Mendes", proc: "Clareamento · Dra. Ana", hora: "10:00", status: "Confirmado", cor: "#4F8EF7" },
    { iniciais: "RT", nome: "Rafael Torres", proc: "Urgência · Dr. Carlos", hora: "10:30", status: "Urgência", cor: "#EC4899" },
    { iniciais: "CM", nome: "Carla Miranda", proc: "Aparelho · Dra. Ana", hora: "11:00", status: "Confirmado", cor: "#4F8EF7" },
    { iniciais: "AR", nome: "André Rodrigues", proc: "Implante · Dr. Carlos", hora: "14:00", status: "Encaixe", cor: "#6B7280" },
  ];

  const alertas = [
    { icon: "⏰", titulo: "Retorno vencido", desc: "Pedro Souza · 45 dias sem retorno", tipo: "danger" },
    { icon: "📄", titulo: "Orçamento parado", desc: "Beatriz Lima · R$2.400 pendente", tipo: "warn" },
    { icon: "💳", titulo: "Pagamento atrasado", desc: "Carlos Mendes · Parcela 3/6 vencida", tipo: "warn" },
    { icon: "📅", titulo: "Encaixe disponível", desc: "Quinta 14h — Dr. Carlos", tipo: "info" },
  ];

  return (
    <div>
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Sexta-feira, 23 de maio de 2026</p>
      </div>

      {/* KPIs */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
  {kpis.map((k) => (
    <div key={k.label} className="bg-[#161A22] border border-white/5 rounded-xl p-4">
      <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">{k.label}</div>
      <div className="text-3xl font-bold mb-1 text-white">{k.value}</div>
      <div className={`text-xs flex items-center gap-1 ${k.up ? "text-[#22C55E]" : "text-[#F59E0B]"}`}>
        {k.up ? "↑" : "↗"} {k.delta}
      </div>
    </div>
  ))}
</div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agenda do dia */}
        <div className="lg:col-span-2 bg-[#161A22] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Agenda de hoje</span>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            </div>
            <span className="text-[#4F8EF7] text-xs cursor-pointer hover:underline">Ver completa →</span>
          </div>
          <div className="space-y-1">
            {consultas.map((c) => (
              <div key={c.nome} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${c.cor}20`, color: c.cor }}
                >
                  {c.iniciais}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{c.nome}</div>
                  <div className="text-white/40 text-xs truncate">{c.proc}</div>
                </div>
                <div
                  className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: `${c.cor}20`, color: c.cor }}
                >
                  {c.status}
                </div>
                <div className="text-white/40 text-xs flex-shrink-0 w-10 text-right">{c.hora}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">

          {/* Alertas */}
          <div className="bg-[#161A22] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold text-sm">Alertas</span>
              <span className="text-[#4F8EF7] text-xs cursor-pointer">Ver todos →</span>
            </div>
            <div className="space-y-2">
              {alertas.map((a) => (
                <div key={a.titulo} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                    a.tipo === "danger" ? "bg-red-500/10" :
                    a.tipo === "warn" ? "bg-amber-500/10" : "bg-blue-500/10"
                  }`}>
                    {a.icon}
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">{a.titulo}</div>
                    <div className="text-white/40 text-xs mt-0.5">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meta financeira */}
          <div className="bg-[#161A22] border border-white/5 rounded-xl p-5">
            <div className="text-white font-semibold text-sm mb-4">Faturamento</div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/40">Meta mensal</span>
              <span className="text-white font-medium">R$28.000</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
              <div className="h-full rounded-full bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC]" style={{ width: "68%" }} />
            </div>
            <div className="text-white/30 text-xs text-right mb-3">68% · R$19.040</div>
            <div className="flex justify-between text-xs py-2 border-t border-white/5">
              <span className="text-white/40">Recebido hoje</span>
              <span className="text-[#22C55E] font-semibold">R$1.240</span>
            </div>
            <div className="flex justify-between text-xs py-2 border-t border-white/5">
              <span className="text-white/40">A receber hoje</span>
              <span className="text-[#F59E0B] font-semibold">R$3.580</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}