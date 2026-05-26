# CONTEXT — OdontoOS

Última atualização: 2026-05-26

## Histórico de sprints

| Sprint | Status | O que foi entregue |
|--------|--------|--------------------|
| Sprint 1 | Concluído | Tela de login (visual, sem auth real) |
| Sprint 2 | Concluído | Dashboard com layout completo, sidebar, header, tab bar mobile, KPIs e agenda do dia (dados hardcoded) |
| Sprint 3 | Concluído | Supabase configurado, CRUD de pacientes, agenda semanal com CRUD |
| Sprint 4 | Concluído | Autenticação real (Supabase Auth), proteção de rotas, Server Actions, ARCHITECTURE_docs completo |
| Sprint 5 | Concluído | RLS implementado, tabelas renomeadas (`pacientes`→`clientes`, `paciente_nome`→`cliente_nome`), nomenclatura motor/capa aplicada no código |

---

## Fase atual: Fase 1 concluída — entrando na Fase 2

Fase 1 (base operacional) está completa:
- Autenticação real funcionando
- Proteção de rotas via proxy.ts
- Estrutura visual consolidada
- Base documental de arquitetura criada

Próxima fase: Fase 2 — Pacientes e agenda (PRODUCT_VISION.md)
- Cadastro completo de pacientes (base existe, precisa de edição e histórico)
- Dashboard com dados reais (hoje é mock)
- Histórico básico do cliente

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
| Cliente Supabase | `@supabase/ssr` — `createBrowserClient` no client, `createServerClient` no server/actions |
| Deploy | Vercel (automático via GitHub) |

---

## Estrutura de arquivos atual

```
proxy.ts                       — Proteção de rotas (Next.js 16 — antigo middleware.ts)

app/
  page.tsx                     — Tela de login ("use client", useActionState + signIn)
  layout.tsx                   — Root layout, lang="pt-BR"
  globals.css
  actions/
    auth.ts                    — Server Actions: signIn() e signOut()
  auth/
    callback/route.ts          — Route Handler OAuth (troca code por sessão)
  dashboard/
    layout.tsx                 — Sidebar + header + tab bar mobile ("use client", signOut)
    page.tsx                   — Dashboard com KPIs e agenda do dia (dados estáticos/mock)
    pacientes/page.tsx         — CRUD de clientes conectado ao Supabase
    agenda/page.tsx            — Grade semanal de consultas conectada ao Supabase

utils/
  supabase/
    client.ts                  — createBrowserClient (uso em Client Components)
    server.ts                  — createServerClient (uso em Server Components e Server Actions)

ARCHITECTURE_docs/
  CONTEXT.md                   — Este arquivo
  PLATFORM_VISION.md           — Visão da plataforma multi-capa e filosofia dos planos
  PRODUCT_VISION.md            — Visão específica do OdontoOS, MVP e faseação
  DECISIONS.md                 — Decisões arquiteturais registradas
  SESSION_RULES.md             — Regras de comportamento em sessão
```

---

## Módulos planejados (sidebar)

| Módulo | Rota | Estado |
|--------|------|--------|
| Dashboard | /dashboard | Implementado (dados mock — precisa dados reais) |
| Agenda | /dashboard/agenda | Implementado + Supabase |
| Pacientes | /dashboard/pacientes | Implementado + Supabase (falta edição e histórico) |
| Prontuário | /dashboard/prontuario | Não iniciado |
| Financeiro | /dashboard/financeiro | Não iniciado |
| Orçamentos | /dashboard/orcamentos | Não iniciado |
| Comunicação | /dashboard/comunicacao | Não iniciado |
| Tarefas | /dashboard/tarefas | Não iniciado |
| Relatórios | /dashboard/relatorios | Não iniciado |

---

## Tabelas Supabase confirmadas

### `clientes`
```
id           integer (PK)
nome         text
telefone     text
email        text
cpf          text
user_id      uuid NOT NULL → auth.users(id)
created_at   timestamptz
```
RLS ativo — política: `user_id = auth.uid()`

### `consultas`
```
id              integer (PK)
cliente_nome    text   ← denormalizado (não é FK para clientes.id)
procedimento    text
hora            text   ← formato "HH:MM"
data            text   ← formato ISO "YYYY-MM-DD"
duracao         integer
status          text
profissional    text
observacoes     text
user_id         uuid NOT NULL → auth.users(id)
```
RLS ativo — política: `user_id = auth.uid()`

---

## Design system

- **Background base:** `#0A0C0F`
- **Superfície de cards:** `#161A22`
- **Sidebar/Header:** `#0F1117`
- **Acento primário:** `#4F8EF7` (azul) → `#7C5CFC` (roxo) — gradiente
- **Verde sucesso:** `#22C55E`
- **Âmbar aviso:** `#F59E0B`
- **Vermelho erro:** `#EF4444`
- **Rosa urgência:** `#EC4899`

---

## Variáveis de ambiente necessárias

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

---

## Débitos técnicos conhecidos

| Débito | Impacto | Prioridade |
|--------|---------|------------|
| Dashboard com dados mock | Não reflete operação real | Alta — próximo sprint |
| `consultas.cliente_nome` denormalizado (não é FK) | Risco de dessincronização | Média |
| Profissionais hardcoded no select da agenda | Não escalável | Baixa |
