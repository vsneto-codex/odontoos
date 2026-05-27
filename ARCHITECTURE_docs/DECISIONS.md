# DECISIONS — Registro de decisões arquiteturais

Formato de cada entrada:
- **Data** — quando foi decidido
- **Decisão** — o que foi escolhido
- **Motivo** — por que, e quais alternativas foram descartadas
- **Impacto** — o que isso afeta

---

## [2026-05] Supabase como backend

**Decisão:** Usar Supabase (PostgreSQL gerenciado + Auth + SDK JavaScript) como único backend.

**Motivo:** Velocidade de desenvolvimento — não requer servidor próprio, ORM ou migrations manuais. Alternativas descartadas: Firebase (sem SQL nativo), backend Express próprio (aumentaria complexidade de infra).

**Impacto:** Todo acesso a dados passa pelo `@supabase/ssr`. Schema evolui via Supabase Dashboard. Sem ORM local (sem Prisma, Drizzle, etc.).

---

## [2026-05] Next.js App Router (sem Pages Router)

**Decisão:** Usar exclusivamente o App Router (`app/`) do Next.js.

**Motivo:** Padrão atual do Next.js, suporta Server Components nativamente, facilita uso do `createServerClient` do Supabase.

**Impacto:** Layouts aninhados (`layout.tsx`), Server Components por padrão, `"use client"` explícito quando necessário.

---

## [2026-05] Sem biblioteca de componentes UI

**Decisão:** Toda UI escrita com Tailwind CSS puro, sem shadcn/ui, Radix, MUI, Ant Design ou similares.

**Motivo:** Controle total sobre design, zero abstração extra, curva de aprendizado mínima. O design system do OdontoOS é suficientemente simples.

**Impacto:** Cada componente visual é escrito do zero. Reutilização via cópia de padrões estabelecidos (inputClass, labelClass, etc.).

---

## [2026-05] Dashboard: 4 queries em paralelo via Promise.all

**Decisão:** O dashboard busca todos os dados via `Promise.all` com 4 queries simultâneas ao Supabase no momento do render (Server Component `async`).

**Motivo:** Sem cache intermediário, sem estado client-side — o dashboard reflete o banco em tempo real a cada carregamento. Alternativas descartadas: SWR/React Query (desnecessário num Server Component), query única com joins complexos (mais difícil de manter).

**Impacto:** Cada acesso ao dashboard faz 4 queries ao Supabase. Aceitável no volume atual. Se o dashboard ficar lento, o próximo passo é `unstable_cache` do Next.js com revalidação por tag.

---

## [2026-05] `consultas.paciente_nome` como texto denormalizado

**Decisão:** A coluna `paciente_nome` na tabela `consultas` armazena o nome como string, não como FK para `pacientes.id`.

**Motivo:** Simplifica as queries (sem joins), permite agendar consultas com nome livre (cliente não cadastrado). Decisão de sprint 3 para mover rápido.

**Impacto:** Risco de dessincronização se o nome do cliente for atualizado. A ser revisado quando o módulo de Prontuário for implementado (exigirá FK real para `clientes.id`).

---

## [2026-05] Profissionais hardcoded no select

**Decisão:** Lista de profissionais (`Dr. Leandro Pássaro`, `Dra. Ana Lima`, `Dr. Carlos Santos`) está hardcoded no componente da Agenda.

**Motivo:** Sem módulo de usuários ainda. Solução provisória para sprint 3.

**Impacto:** Para adicionar/remover profissional é necessário editar o código. Será substituído por tabela `profissionais` no Supabase quando o módulo de gestão de usuários for implementado.

---

## [2026-05] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` em vez de `ANON_KEY`

**Decisão:** A variável de ambiente usa o nome `PUBLISHABLE_KEY` em vez do convencional `ANON_KEY`.

**Motivo:** Nomenclatura adotada pelo Supabase em versões mais recentes do CLI/SDK. Não é um erro — é o novo padrão.

**Impacto:** Documentação antiga do Supabase usa `ANON_KEY`. Qualquer exemplo copiado da internet deve ter a variável renomeada.

---

## [2026-05] Next.js 16 — middleware renomeado para `proxy.ts`

**Decisão:** O arquivo de proteção de rotas usa a convenção `proxy.ts` (raiz do projeto), não `middleware.ts`.

**Motivo:** Next.js 16 deprecou `middleware.ts` e renomeou para `proxy.ts`. A função exportada também muda de `middleware` para `proxy`. A funcionalidade é idêntica — apenas o nome mudou.

**Impacto:** Qualquer documentação ou tutorial que referencie `middleware.ts` deve ser adaptado. O codemod oficial é `npx @next/codemod@canary middleware-to-proxy .`. Exemplos do Supabase que usam `middleware.ts` precisam ser ajustados para `proxy.ts`.

---

## [2026-05] Autenticação via Server Actions + `useActionState`

**Decisão:** Login e logout implementados como Server Actions (`app/actions/auth.ts` com `'use server'`). A página de login usa `useActionState` do React 19 para gerenciar estado de erro e loading.

**Motivo:** Padrão recomendado pelo Next.js 16 para mutações com formulários. Evita exposição de lógica de auth no client. Alternativas descartadas: fetch client-side para API route (mais verboso, sem progressive enhancement), auth em Client Component com `supabase.auth.signInWithPassword` diretamente no browser (funciona mas não aproveita Server Actions).

**Impacto:** `app/page.tsx` é `"use client"` (necessário para `useActionState`). `app/actions/auth.ts` roda sempre no servidor. Logout usa `<form action={signOut}>` no layout do dashboard. Callback OAuth em `app/auth/callback/route.ts`.

---

## [2026-05] OS Platform — arquitetura multi-capa e nomenclatura motor/capa

**Decisão:** OdontoOS é a primeira capa de uma plataforma maior (OS Platform). O motor central usa nomenclatura agnóstica. A capa adapta a terminologia visível ao usuário final.

**Regra bidirecional inviolável:**
- O usuário nunca vê "cliente" na interface do OdontoOS — vê "Paciente"
- O código nunca usa "paciente" fora da camada de interface

**Tabela de capas e termos de interface:**

| Capa | Termo na interface |
|------|--------------------|
| OdontoOS | Paciente |
| MecânicaOS | Cliente |
| ImóveisOS | Comprador ou Lead |
| FisioOS | Paciente |
| PersonalOS | Aluno |
| MassagemOS | Cliente |

**Motivo:** Permite reutilizar o motor para outras especialidades sem reescrever a base. A separação motor/capa cria um contrato claro — o motor é agnóstico ao nicho, a capa é responsável pela identidade e linguagem do produto.

**Impacto:**
- Tabelas no Supabase: `clientes` (não `pacientes`)
- Variáveis, funções e tipos TypeScript: `cliente`, `clienteId`, `ClienteType`
- Labels e textos na UI do OdontoOS: "Paciente", "Novo paciente", "Buscar paciente"
- A tabela atual `pacientes` é um débito técnico — renomear para `clientes` antes de implementar RLS
- A coluna `consultas.paciente_nome` deve ser renomeada para `consultas.cliente_nome`
