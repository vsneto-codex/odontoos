# Visão de Plataforma — OS Platform

---

## O que é a OS Platform

OS Platform é uma plataforma SaaS multi-capa para
gestão operacional de consultórios e clínicas.

Cada capa é um produto vertical independente,
construído sobre um motor central compartilhado.

OdontoOS é a primeira capa.
Futuras capas poderão atender outras especialidades.

---

## Arquitetura de capas

```
OS Platform (motor central)
│
├── OdontoOS        ← capa 1 (em desenvolvimento)
├── [futura capa 2]
└── [futura capa N]
```

O motor central gerencia:
- Autenticação e multi-tenancy
- Gestão de usuários e permissões
- Clientes (pacientes, em odonto)
- Financeiro base
- Infraestrutura de dados (Supabase + RLS)

Cada capa gerencia:
- Interface e identidade visual própria
- Terminologia específica da especialidade
- Procedimentos e fluxos do nicho

---

## Nomenclatura do motor — obrigatória

| Motor (universal) | Capa odonto (interface) |
|-------------------|------------------------|
| usuário           | dentista / recepcionista |
| cliente           | paciente               |
| procedimento      | procedimento           |
| plano             | plano                  |

O motor nunca usa "paciente".
A interface do OdontoOS pode exibir "paciente" ao usuário final.
O código sempre usa "cliente" na camada de dados.

---

## Filosofia dos planos

### Standard — premium real

Standard é completo, desejável e funcional por si só.
Nunca castrar funcionalidade essencial do dia a dia.

O usuário no plano Standard deve conseguir:
- Gerenciar toda a operação do consultório
- Atender clientes com eficiência
- Controlar financeiro básico
- Nunca sentir que está "faltando algo essencial"

### Premium — superpoderes

Premium multiplica o negócio com IA e automação avançada.
Nunca colocar o essencial apenas no premium.

O usuário no plano Premium ganha:
- Automações que economizam horas por semana
- IA aplicada a diagnóstico e sugestões
- Relatórios e inteligência avançada
- Integrações externas (WhatsApp, e-mail, etc.)

### Pergunta de validação por plano

"O usuário precisa disso todo dia?"
"Isso evita que ele perca dinheiro?"
→ Se sim para as duas: é Standard.

"Isso vai além do dia a dia e multiplica o negócio?"
→ Se sim: é Premium.

---

## Multi-tenancy

Cada clínica ou dentista autônomo é um tenant isolado.

Regras invioláveis:
- Nunca acessar dados de um tenant a partir de outro
- RLS (Row Level Security) obrigatório em todas as tabelas
- Cada usuário vê apenas os dados da sua clínica
- Isolamento garantido no banco, não apenas na aplicação

---

## Stack da plataforma

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Linguagem | TypeScript — obrigatório |
| Estilo | Tailwind CSS v4 |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Segurança | Supabase RLS |
| Deploy | Vercel (automático via GitHub) |

---

## Princípios da plataforma

1. Motor agnóstico à especialidade
2. Capa responsável pela identidade do nicho
3. Dados isolados por tenant — sempre
4. Standard funciona sozinho — Premium expande
5. Velocidade de entrega sem comprometer segurança
6. Cada decisão técnica serve ao usuário final

---

## O que nunca fazer na plataforma

- Vazar dados entre tenants
- Colocar essencial atrás de paywall
- Criar dependência entre capas distintas
- Hardcodar dados que pertencem ao banco
- Construir funcionalidade de Premium no Standard
  e vice-versa sem validação da pergunta de plano
