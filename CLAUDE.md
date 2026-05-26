# CLAUDE.md
# Instruções permanentes — OdontoOS

Este arquivo é lido automaticamente pelo Claude Code
em toda sessão. Seguir estas instruções é obrigatório.

---

## Identidade do projeto

OdontoOS é a primeira capa da OS Platform.

É um sistema operacional de consultório odontológico
para dentistas autônomos e pequenas clínicas.

Não é um quiz. Não é um ERP. Não é um site.
É uma plataforma SaaS operacional.

---

## Documentos obrigatórios

Antes de qualquer ação em cada sessão, leia:

1. ARCHITECTURE_docs/CONTEXT.md
   Estado atual do projeto, sprints, decisões.

2. ARCHITECTURE_docs/PLATFORM_VISION.md
   Visão da plataforma multi-capa e filosofia dos planos.

3. ARCHITECTURE_docs/PRODUCT_VISION.md
   Visão específica do OdontoOS, MVP e faseação.

4. ARCHITECTURE_docs/DECISIONS.md
   Decisões arquiteturais já tomadas.

5. ARCHITECTURE_docs/SESSION_RULES.md
   Regras de comportamento em cada sessão.

Nunca agir sem ter lido estes documentos primeiro.

---

## Nomenclatura obrigatória — MOTOR vs CAPA

### Definições fixas

Usuário — quem assina o plano e opera o sistema.
O dentista, a recepcionista, o gestor da clínica.

Cliente — quem o usuário atende.
No motor: sempre "cliente". Na interface: depende da capa.

### Motor (banco de dados, código, variáveis, funções, tipos)

Usa sempre "cliente" — nunca terminologia específica de profissão.

Obrigatório em:
- Nomes de tabelas no Supabase
- Variáveis, funções e tipos TypeScript
- Server Actions e Route Handlers
- Comentários de código

### Interface por capa (labels, textos, títulos visíveis ao usuário)

| Capa | Termo na interface |
|------|--------------------|
| OdontoOS | Paciente |
| MecânicaOS | Cliente |
| ImóveisOS | Comprador ou Lead |
| FisioOS | Paciente |
| PersonalOS | Aluno |
| MassagemOS | Cliente |

### Regra bidirecional — inviolável

O usuário nunca vê "cliente" na interface do OdontoOS.
O código nunca usa "paciente" fora da camada de interface.

---

## Stack do projeto

- Next.js 16 com App Router
- React 19
- TypeScript — obrigatório em todos os arquivos
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth + RLS)
- Vercel (deploy automático via GitHub)

---

## Regras de desenvolvimento

1. Ler os documentos antes de qualquer ação
2. Nunca alterar mais de uma responsabilidade por sessão
3. Nunca criar arquivo sem justificativa clara
4. Nunca criar componente duplicado
5. Nunca misturar lógica com visual
6. Sempre usar TypeScript — nunca any
7. Sempre tratar erros visivelmente ao usuário
8. Sempre perguntar: isso é do motor ou da capa?
9. RLS obrigatório em todas as tabelas do Supabase
10. Atualizar CONTEXT.md ao concluir cada feature
11. Registrar decisões em DECISIONS.md

---

## Filosofia dos planos — nunca violar

Standard é premium real.
Completo, desejável e funcional por si só.
Nunca castrar funcionalidade essencial do dia a dia.

Premium são superpoderes.
Multiplica o negócio com IA e automação avançada.
Nunca colocar o essencial apenas no premium.

Pergunta de validação para cada funcionalidade:
"O usuário precisa disso todo dia?"
"Isso evita que ele perca dinheiro?"
Se sim para as duas — é standard.
Se vai além do dia a dia — é premium.

---

## O que nunca fazer

- Nunca acessar dados de um tenant a partir de outro
- Nunca criar rota sem proteger com proxy.ts
- Nunca fazer fetch do Supabase sem tratar erro
- Nunca hardcodar dados que deveriam vir do banco
- Nunca criar tela sem seguir PRODUCT_VISION.md
- Nunca criar funcionalidade fora do MVP atual
- Nunca usar "paciente" no motor central
- Nunca usar "usuário" para se referir ao cliente
  do usuário — usar sempre "cliente"
- Nunca fazer refatoração ampla sem aprovação
- Nunca avançar sem confirmação quando propuser
  algo que afete arquitetura ou dados

---

## Comportamento em cada sessão

Início:
1. Ler os 5 documentos obrigatórios
2. Confirmar o estado atual do projeto
3. Declarar o objetivo da sessão
4. Declarar quais arquivos serão tocados
5. Aguardar confirmação antes de agir

Durante:
- Alterar um arquivo por vez
- Explicar cada alteração antes de gerar código
- Avisar se o escopo estiver crescendo
- Nunca gerar código sem aprovação da direção

Fim:
- Atualizar CONTEXT.md com o que foi feito
- Registrar decisões em DECISIONS.md
- Declarar próximo passo recomendado

---

## Formato de entrega de cada alteração

O QUE alterou:
ONDE alterou:
POR QUE alterou:
IMPACTO:
PRÓXIMO PASSO:
