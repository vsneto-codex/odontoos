# SESSION_RULES — Regras de trabalho no OdontoOS

Estas regras definem como o engenheiro (Claude) deve se comportar em cada sessão de trabalho neste projeto. Leia antes de escrever qualquer código.

---

## 1. Leia o CONTEXT.md antes de agir

Em toda sessão nova, leia `ARCHITECTURE_docs/CONTEXT.md` para ter o estado atual do projeto. Não assuma que o código está como você deixou — verifique os arquivos relevantes antes de propor mudanças.

## 2. Aguarde aprovação antes de implementar

Para qualquer tarefa não trivial (novo módulo, mudança de schema, refatoração):
1. Apresente o plano em texto
2. Aguarde o `ok` explícito do usuário
3. Só então escreva código

## 3. Respeite o design system

Todo novo componente deve seguir o design system documentado em CONTEXT.md:
- Cores: use apenas as variáveis definidas (`#0A0C0F`, `#161A22`, `#4F8EF7`, etc.)
- Sem bibliotecas de UI externas (shadcn, Radix, MUI, etc.)
- Tailwind direto, sem `@apply` desnecessário

## 4. Padrão de acesso ao Supabase

- **Client Components** (`"use client"`): use `utils/supabase/client.ts`
- **Server Components / Route Handlers**: use `utils/supabase/server.ts`
- Nunca importe o client do servidor em um Client Component e vice-versa

## 5. Não quebre o que já funciona

Antes de editar `agenda/page.tsx` ou `pacientes/page.tsx`, confirme que as funcionalidades existentes continuarão funcionando:
- CRUD de pacientes (listar, criar, excluir)
- Grade semanal de consultas (criar, alterar status, excluir)

## 6. Nomenclatura e idioma

- Código: inglês (variáveis, funções, tipos)
- UI e labels: português brasileiro
- Commits: português, estilo imperativo ("adiciona", "corrige", "implementa")

## 7. Tipagem TypeScript

- Sempre declare tipos explícitos para dados vindos do Supabase (como `Paciente`, `Consulta`)
- Nunca use `any`
- Prefira `type` a `interface` para objetos simples

## 8. Um arquivo por módulo

Cada módulo do dashboard vive em `app/dashboard/<modulo>/page.tsx`. Não crie arquivos de componente separados a menos que o arquivo ultrapasse ~400 linhas ou o componente seja reutilizado em 2+ módulos.

## 9. Atualize o CONTEXT.md ao concluir novas features

Quando um módulo novo for implementado ou uma tabela for criada no Supabase, atualize `CONTEXT.md` para refletir o novo estado.

## 10. Registre decisões relevantes

Toda escolha técnica não óbvia deve ser registrada em `DECISIONS.md` antes de ser implementada.
