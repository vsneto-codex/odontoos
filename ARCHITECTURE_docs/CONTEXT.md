# CONTEXT — OdontoOS

Última atualização: 2026-05-29

## Histórico de sprints

| Sprint | Status | O que foi entregue |
|--------|--------|--------------------|
| Sprint 1 | Concluído | Tela de login (visual, sem auth real) |
| Sprint 2 | Concluído | Dashboard com layout completo, sidebar, header, tab bar mobile, KPIs e agenda do dia (dados hardcoded) |
| Sprint 3 | Concluído | Supabase configurado, CRUD de pacientes, agenda semanal com CRUD |
| Sprint 4 | Concluído | Autenticação real (Supabase Auth), proteção de rotas, Server Actions, ARCHITECTURE_docs completo |
| Sprint 5 | Concluído | RLS implementado, tabelas renomeadas (pacientes→clientes, paciente_nome→cliente_nome), nomenclatura motor/capa aplicada no código |
| Sprint 6 | Concluído | Dashboard conectado a dados reais: KPIs (pacientes hoje, confirmados, faturamento, pendências), agenda do dia e faturamento mensal via Supabase |
| Sprint 7 | Concluído | Tela de Financeiro: KPIs, alertas dinâmicos, filtros, tabela de pagamentos, modal de novo pagamento com autocomplete, parcelas e preview automático |
| Sprint 8 | Concluído | Tela de Orçamentos: KPIs, busca + filtro por status, tabela com validade tag, modal 2-colunas com favoritos + edição de preço/qtd por item, modal de visualização com alteração de status |

---

## Fase atual: Fase 2 — Pacientes e agenda (em andamento)

Fase 1 (base operacional) concluída:
- Autenticação real funcionando
- Proteção de rotas via proxy.ts
- Estrutura visual consolidada
- Base documental de arquitetura criada

Fase 2 em andamento:
- Dashboard com dados reais ✓ (Sprint 6)
- Cadastro completo de pacientes ✓ (criar, listar, buscar, editar, excluir)
- Edição de pacientes ✓ (modal centralizado com todos os campos)
- Histórico do paciente ✗ (pendente — requer tela de detalhe)

---

## O que é este projeto

OdontoOS é a primeira capa da OS Platform — um sistema de gestão para clínicas odontológicas. Centraliza agenda, clientes (pacientes), financeiro, prontuário e comunicação em uma única interface para dentistas autônomos e pequenas clínicas.

---

## Stack técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Linguagem | TypeScript — obrigatório |
| Estilização | Tailwind CSS v4 (sem biblioteca de componentes) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Cliente Supabase | @supabase/ssr — createBrowserClient no client, createServerClient no server/actions |
| Deploy | Vercel (automático via GitHub) |
| Repositório | github.com/vsneto-codex/odontoos |
| Produção | odontoos-flax.vercel.app |

---

## Estrutura de arquivos atual

```
proxy.ts                        — Proteção de rotas (Next.js 16)

app/
  page.tsx                      — Tela de login ("use client", useActionState + signIn)
  layout.tsx                    — Root layout, lang="pt-BR"
  globals.css
  actions/
    auth.ts                     — Server Actions: signIn() e signOut()
  auth/
    callback/route.ts           — Route Handler OAuth
  dashboard/
    layout.tsx                  — Sidebar + header + tab bar mobile ("use client", signOut)
    page.tsx                    — Dashboard com KPIs e agenda do dia (dados reais Supabase)
    pacientes/page.tsx          — CRUD de clientes: listar, criar, buscar, excluir (falta edição e histórico)
    agenda/page.tsx             — Grade semanal de consultas com CRUD

utils/
  supabase/
    client.ts                   — createBrowserClient (Client Components)
    server.ts                   — createServerClient (Server Components e Server Actions)

ARCHITECTURE_docs/
  CONTEXT.md                    — Este arquivo
  PLATFORM_VISION.md
  PRODUCT_VISION.md
  DECISIONS.md
  SESSION_RULES.md
```

---

## Módulos do dashboard

| Módulo | Rota | Estado |
|--------|------|--------|
| Dashboard | /dashboard | ✅ Implementado + dados reais |
| Agenda | /dashboard/agenda | ✅ Implementado + Supabase |
| Pacientes | /dashboard/pacientes | ⚠️ Parcial — falta histórico de consultas |
| Prontuário | /dashboard/prontuario | ❌ Não iniciado (sem page.tsx) |
| Financeiro | /dashboard/financeiro | ✅ Implementado + Supabase |
| Orçamentos | /dashboard/orcamentos | ✅ Implementado + Supabase |
| Comunicação | /dashboard/comunicacao | ❌ Não iniciado (sem page.tsx) |
| Tarefas | /dashboard/tarefas | ❌ Não iniciado (sem page.tsx) |
| Relatórios | /dashboard/relatorios | ❌ Não iniciado (sem page.tsx) |

---

## Tabelas Supabase — schema completo confirmado

### `clientes`
```
id                uuid PK
user_id           uuid NOT NULL → auth.users(id)
nome              text NOT NULL
telefone          text
email             text
cpf               text
data_nascimento   date
endereco          text
cidade            text
estado            text
cep               text
convenio          text
numero_convenio   text
observacoes       text
ativo             boolean
created_at        timestamptz
```
RLS ativo — política: user_id = auth.uid()

### `consultas`
```
id                uuid PK
user_id           uuid NOT NULL → auth.users(id)
cliente_id        uuid → clientes(id)
cliente_nome      text NOT NULL (denormalizado)
procedimento_id   uuid → procedimentos(id)
procedimento      text NOT NULL (denormalizado)
profissional      text NOT NULL
data              date NOT NULL
hora              text NOT NULL (formato "HH:MM")
duracao           integer
status            text
observacoes       text
created_at        timestamptz
```
RLS ativo — política: user_id = auth.uid()

### `procedimentos`
```
id                uuid PK
user_id           uuid NOT NULL → auth.users(id)
nome              text NOT NULL
categoria         text NOT NULL
preco             numeric
duracao_min       integer
favorito          boolean
ativo             boolean
created_at        timestamptz
```
RLS ativo — política: user_id = auth.uid()
Nota: tabela existe e está pronta. Tela não implementada ainda.

### `orcamentos`
```
id                uuid PK
user_id           uuid NOT NULL → auth.users(id)
cliente_id        uuid NOT NULL → clientes(id)
cliente_nome      text NOT NULL (denormalizado)
status            text
total             numeric
validade          date
observacoes       text
created_at        timestamptz
```
RLS ativo — política: user_id = auth.uid()
Nota: tabela existe e está pronta. Tela não implementada ainda.

### `orcamento_itens`
```
id                uuid PK
orcamento_id      uuid NOT NULL → orcamentos(id)
procedimento_id   uuid → procedimentos(id)
procedimento_nome text NOT NULL (denormalizado)
preco             numeric
quantidade        integer
```

### `pagamentos`
```
id                uuid PK
user_id           uuid NOT NULL → auth.users(id)
cliente_id        uuid NOT NULL → clientes(id)
cliente_nome      text NOT NULL (denormalizado)
orcamento_id      uuid → orcamentos(id)
valor             numeric NOT NULL
forma             text NOT NULL
parcelas          integer
status            text
data_pagamento    date NOT NULL
observacoes       text
created_at        timestamptz
```
RLS ativo — política: user_id = auth.uid()
Nota: tabela existe e está pronta. Tela não implementada ainda.

---

## Débitos técnicos conhecidos

| Débito | Impacto | Prioridade |
|--------|---------|------------|
| `pacientes/page.tsx` usa `id: number` mas banco é uuid | Bug potencial na exclusão | Alta |
| `consultas.cliente_nome` denormalizado (não é FK) | Risco de dessincronização | Média |
| Profissionais hardcoded na agenda | Não escalável | Baixa |
| Módulos Prontuário→Relatórios sem page.tsx | 404 ao clicar no menu | Baixa (não atrapalha uso) |

---

## Design system

- Background base: #0A0C0F
- Superfície de cards: #161A22
- Sidebar/Header: #0F1117
- Acento primário: #4F8EF7 (azul) → #7C5CFC (roxo) — gradiente
- Verde sucesso: #22C55E
- Âmbar aviso: #F59E0B
- Vermelho erro: #EF4444
- Rosa urgência: #EC4899

---

## Variáveis de ambiente necessárias

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```
