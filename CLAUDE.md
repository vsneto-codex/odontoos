# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Instruções permanentes — OdontoOS

---

## Identidade do projeto

OdontoOS é a primeira capa da OS Platform — um sistema operacional de consultório odontológico para dentistas autônomos e pequenas clínicas. Não é um ERP. É uma plataforma SaaS operacional.

---

## Documentos obrigatórios

Leia antes de qualquer ação em cada sessão:

1. `ARCHITECTURE_docs/CONTEXT.md` — Estado atual, sprints, schema completo do banco
2. `ARCHITECTURE_docs/PLATFORM_VISION.md` — Visão multi-capa e filosofia dos planos
3. `ARCHITECTURE_docs/PRODUCT_VISION.md` — MVP, faseação e princípios de UX
4. `ARCHITECTURE_docs/DECISIONS.md` — Decisões arquiteturais já tomadas
5. `ARCHITECTURE_docs/SESSION_RULES.md` — Regras de comportamento por sessão

---

## Comandos

```bash
npm run dev      # servidor local em http://localhost:3000
npm run build    # build de produção
npm run lint     # ESLint (sem --fix automático)
```

Não há testes automatizados no projeto atualmente.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Linguagem | TypeScript obrigatório — nunca `any` |
| Estilização | Tailwind CSS v4 puro — sem biblioteca de componentes |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Cliente Supabase | `@supabase/ssr` |
| Deploy | Vercel (automático via GitHub) |

Variáveis de ambiente necessárias:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   # novo nome do ANON_KEY no Supabase atual
```

---

## Arquitetura

### Proteção de rotas — `proxy.ts`

Next.js 16 renomeou `middleware.ts` para `proxy.ts` e a função exportada de `middleware` para `proxy`. Toda rota `/dashboard/*` é protegida aqui. Nunca criar rota protegida sem passar por este arquivo.

### Acesso ao Supabase

Dois clientes distintos — nunca misturar:

- `utils/supabase/client.ts` → `createBrowserClient` — use em Client Components (`"use client"`)
- `utils/supabase/server.ts` → `createServerClient` — use em Server Components, Server Actions e Route Handlers

### Autenticação

- Login: `app/page.tsx` (`"use client"` + `useActionState`) chama `app/actions/auth.ts` (Server Action)
- Logout: `<form action={signOut}>` no `app/dashboard/layout.tsx`
- Callback OAuth: `app/auth/callback/route.ts`

### Estrutura dos módulos do dashboard

Cada módulo vive em `app/dashboard/<modulo>/page.tsx`. Não criar arquivos de componente separados a menos que o arquivo ultrapasse ~400 linhas ou o componente seja reutilizado em 2+ módulos. O layout compartilhado (sidebar, header, tab bar mobile) está em `app/dashboard/layout.tsx` (`"use client"`).

### Queries ao Supabase

- Dashboard: `Promise.all` com 4 queries em paralelo no render (Server Component `async`) — sem cache
- Módulos: queries diretas no Server Component ou via Server Action para mutações
- Nunca fazer fetch sem tratar erro visivelmente ao usuário

---

## Nomenclatura motor/capa — inviolável

**Motor** (banco, código, variáveis, tipos, Server Actions): usa sempre `cliente`
**Interface OdontoOS** (labels, textos visíveis): usa sempre `Paciente`

| Camada | Termo correto |
|--------|--------------|
| Tabelas Supabase | `clientes`, `cliente_id`, `cliente_nome` |
| TypeScript | `cliente`, `ClienteType`, `clienteId` |
| UI do OdontoOS | "Paciente", "Novo paciente", "Buscar paciente" |

O usuário nunca vê "cliente" na interface. O código nunca usa "paciente" fora da camada de interface.

---

## Design system

Sem bibliotecas de UI externas. Tailwind direto, sem `@apply` desnecessário.

| Token | Valor |
|-------|-------|
| Background base | `#0A0C0F` |
| Superfície de cards | `#161A22` |
| Sidebar/Header | `#181C24` |
| Acento primário | `#4F8EF7` (azul) → `#7C5CFC` (roxo) como gradiente |
| Verde sucesso | `#22C55E` |
| Âmbar aviso | `#F59E0B` |
| Vermelho erro | `#EF4444` |
| Rosa urgência | `#EC4899` |

---

## Filosofia dos planos

**Standard** = funcionalidade essencial do dia a dia. Nunca castrar.
**Premium** = superpoderes (IA, automação avançada). Nunca colocar o essencial aqui.

Validação: "O usuário precisa disso todo dia?" + "Isso evita que ele perca dinheiro?" → se sim para as duas, é standard.

---

## Regras de desenvolvimento

- Nunca alterar mais de uma responsabilidade por sessão
- Nunca criar arquivo sem justificativa clara; nunca duplicar componente
- Nunca misturar lógica com visual
- RLS obrigatório em todas as tabelas do Supabase
- Nunca hardcodar dados que deveriam vir do banco
- Nunca criar funcionalidade fora do MVP atual (ver `ARCHITECTURE_docs/PRODUCT_VISION.md`)
- Nunca acessar dados de um tenant a partir de outro
- Commits em português, estilo imperativo ("adiciona", "corrige", "implementa")

---

## Comportamento em cada sessão

**Início:**
1. Ler os 5 documentos obrigatórios
2. Confirmar estado atual do projeto
3. Declarar objetivo da sessão e arquivos que serão tocados
4. Aguardar confirmação antes de agir

**Durante:**
- Alterar um arquivo por vez; explicar cada alteração antes de gerar código
- Avisar se o escopo estiver crescendo
- Para mudanças de schema ou arquitetura: apresentar plano e aguardar `ok` explícito

**Fim:**
- Atualizar `ARCHITECTURE_docs/CONTEXT.md` com o que foi feito
- Registrar decisões não óbvias em `ARCHITECTURE_docs/DECISIONS.md`

---

## Formato de entrega de cada alteração

```
O QUE alterou:
ONDE alterou:
POR QUE alterou:
IMPACTO:
PRÓXIMO PASSO:
```
