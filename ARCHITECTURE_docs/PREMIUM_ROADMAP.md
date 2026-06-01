# PREMIUM_ROADMAP.md
# Funcionalidades reservadas para o plano Premium
# Atualizado em: 2026-05-30

---

## Ativação do Premium
- Comando de voz ou frase secreta → solicita senha → desbloqueia o pacote
- Efeito visual de desbloqueio na interface
- Funcionalidades aparecem integradas naturalmente ao sistema

---

## Prontuário Premium
- Odontograma interativo com linha do tempo por elemento dental
- Galeria de imagens com comparação antes/depois
- Entrada por voz para evolução clínica (integração Whisper/OpenAI)

### Entrada por voz — evolução clínica
- Botão "🎤 Gravar evolução" no formulário de prontuário
- Dentista aperta uma vez para iniciar, aperta novamente para processar
- Áudio enviado para API Whisper (OpenAI) para transcrição
- Texto transcrito enviado para Claude API para classificação automática nos 3 campos:
  dentes tratados, procedimento realizado, observações
- Exemplo: "Elemento 26, restauração em resina, paciente relatou sensibilidade ao frio, retorno em 30 dias"
  → Dentes: "Elemento 26" / Procedimento: "Restauração em resina" / Observações: "Paciente relatou sensibilidade ao frio. Retorno em 30 dias."
- Funciona em qualquer tela que tenha campo de texto (agenda, comunicação, tarefas)
- Preço estimado: ~$0,006 por minuto de áudio (Whisper) + tokens Claude

---

## Comunicação Premium
- Integração com WhatsApp
- Envio automático de mensagens (confirmação de consulta, retorno, aniversário)
- Aniversariantes com alerta no dashboard e mensagem automática

---

## Dashboard Premium
- Alertas dinâmicos inteligentes (retornos em atraso, orçamentos parados)
- Indicadores avançados de desempenho

---

## Financeiro Premium
- Relatórios exportáveis em PDF
- Análise de inadimplência

---

## IA Premium
- Sugestão automática de próximo procedimento
- Análise de padrões de cancelamento
- Assistente de diagnóstico

---

## Ideias em aberto (ainda sem categoria)
- (adicionar aqui conforme surgirem)

---

## Regra
Nenhuma funcionalidade premium deve ser construída antes do Standard estar completo.
O arquivo deve ser atualizado sempre que surgir uma nova ideia premium.
