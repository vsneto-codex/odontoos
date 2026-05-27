import { createClient } from '@/utils/supabase/server'

type Consulta = {
  id: string
  cliente_nome: string
  procedimento: string
  hora: string
  data: string
  status: string
  profissional: string
}

type Pagamento = {
  valor: number
}

const STATUS_COLORS: Record<string, string> = {
  'Confirmado':      '#22C55E',
  'Aguardando':      '#F59E0B',
  'Pendente':        '#F59E0B',
  'Em atendimento':  '#4F8EF7',
  'Urgência':        '#EC4899',
  'Encaixe':         '#6B7280',
  'Cancelado':       '#EF4444',
}

function getInitials(name: string): string {
  const words = name.trim().split(' ').filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function Dashboard() {
  const supabase = await createClient()

  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split('T')[0]

  const [
    { data: consultasHoje },
    { data: confirmadosHoje },
    { data: pendencias },
    { data: pagamentos },
  ] = await Promise.all([
    supabase
      .from('consultas')
      .select('id, cliente_nome, procedimento, hora, data, status, profissional')
      .eq('data', today)
      .order('hora', { ascending: true }),
    supabase
      .from('consultas')
      .select('id')
      .eq('data', today)
      .eq('status', 'Confirmado'),
    supabase
      .from('consultas')
      .select('id')
      .in('status', ['Pendente', 'Aguardando']),
    supabase
      .from('pagamentos')
      .select('valor')
      .gte('data_pagamento', firstDay)
      .lte('data_pagamento', lastDay),
  ])

  const totalHoje        = (consultasHoje as Consulta[] | null)?.length ?? 0
  const totalConfirmados = confirmadosHoje?.length ?? 0
  const totalPendencias  = pendencias?.length ?? 0
  const totalFaturamento = (pagamentos as Pagamento[] | null)
    ?.reduce((sum, p) => sum + (p.valor ?? 0), 0) ?? 0

  const META_MENSAL = 28000
  const percentualMeta    = Math.min(Math.round((totalFaturamento / META_MENSAL) * 100), 100)
  const confirmadoPercent = totalHoje > 0 ? Math.round((totalConfirmados / totalHoje) * 100) : 0

  const kpis = [
    {
      label: 'Pacientes hoje',
      value: String(totalHoje),
      delta: `${totalHoje} consulta${totalHoje !== 1 ? 's' : ''} agendada${totalHoje !== 1 ? 's' : ''}`,
      color: '#4F8EF7',
      up: true,
    },
    {
      label: 'Confirmados',
      value: String(totalConfirmados),
      delta: `${confirmadoPercent}% confirmados`,
      color: '#22C55E',
      up: true,
    },
    {
      label: 'Faturamento',
      value: formatCurrency(totalFaturamento),
      delta: `${percentualMeta}% da meta mensal`,
      color: '#14B8A6',
      up: true,
    },
    {
      label: 'Pendências',
      value: String(totalPendencias),
      delta: totalPendencias > 0 ? 'requerem atenção' : 'nenhuma pendência',
      color: '#F59E0B',
      up: false,
    },
  ]

  const alertas = [
    { icon: '⏰', titulo: 'Retorno vencido',    desc: 'Pedro Souza · 45 dias sem retorno',       tipo: 'danger' },
    { icon: '📄', titulo: 'Orçamento parado',   desc: 'Beatriz Lima · R$2.400 pendente',          tipo: 'warn'   },
    { icon: '💳', titulo: 'Pagamento atrasado', desc: 'Carlos Mendes · Parcela 3/6 vencida',      tipo: 'warn'   },
    { icon: '📅', titulo: 'Encaixe disponível', desc: 'Quinta 14h — Dr. Carlos',                  tipo: 'info'   },
  ]

  return (
    <div>
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-white text-xl font-semibold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1 capitalize">{formatDate(today)}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-[#1E2330] border border-white/5 rounded-xl p-4">
            <div className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">{k.label}</div>
            <div className="text-3xl font-bold mb-1 text-white">{k.value}</div>
            <div className={`text-xs flex items-center gap-1 ${k.up ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>
              {k.up ? '↑' : '↗'} {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agenda do dia */}
        <div className="lg:col-span-2 bg-[#1E2330] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Agenda de hoje</span>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            </div>
            <span className="text-[#4F8EF7] text-xs cursor-pointer hover:underline">Ver completa →</span>
          </div>

          {totalHoje === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/30 text-sm">
              Nenhuma consulta agendada para hoje
            </div>
          ) : (
            <div className="space-y-1">
              {(consultasHoje as Consulta[]).map((c) => {
                const cor     = STATUS_COLORS[c.status] ?? '#6B7280'
                const iniciais = getInitials(c.cliente_nome)
                const proc    = c.profissional
                  ? `${c.procedimento} · ${c.profissional}`
                  : c.procedimento
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${cor}20`, color: cor }}
                    >
                      {iniciais}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{c.cliente_nome}</div>
                      <div className="text-white/40 text-xs truncate">{proc}</div>
                    </div>
                    <div
                      className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: `${cor}20`, color: cor }}
                    >
                      {c.status}
                    </div>
                    <div className="text-white/40 text-xs flex-shrink-0 w-10 text-right">{c.hora}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">

          {/* Alertas */}
          <div className="bg-[#1E2330] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold text-sm">Alertas</span>
              <span className="text-[#4F8EF7] text-xs cursor-pointer">Ver todos →</span>
            </div>
            <div className="space-y-2">
              {alertas.map((a) => (
                <div
                  key={a.titulo}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                    a.tipo === 'danger' ? 'bg-red-500/10' :
                    a.tipo === 'warn'   ? 'bg-amber-500/10' : 'bg-blue-500/10'
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
          <div className="bg-[#1E2330] border border-white/5 rounded-xl p-5">
            <div className="text-white font-semibold text-sm mb-4">Faturamento</div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/40">Meta mensal</span>
              <span className="text-white font-medium">{formatCurrency(META_MENSAL)}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4F8EF7] to-[#7C5CFC]"
                style={{ width: `${percentualMeta}%` }}
              />
            </div>
            <div className="text-white/30 text-xs text-right mb-3">
              {percentualMeta}% · {formatCurrency(totalFaturamento)}
            </div>
            <div className="flex justify-between text-xs py-2 border-t border-white/5">
              <span className="text-white/40">Recebido no mês</span>
              <span className="text-[#22C55E] font-semibold">{formatCurrency(totalFaturamento)}</span>
            </div>
            <div className="flex justify-between text-xs py-2 border-t border-white/5">
              <span className="text-white/40">Falta para a meta</span>
              <span className="text-[#F59E0B] font-semibold">
                {formatCurrency(Math.max(META_MENSAL - totalFaturamento, 0))}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
