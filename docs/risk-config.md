# Guia de Preenchimento: `riskConfig.json`

Este guia técnico descreve como preencher e manter o arquivo de configuração de riscos [./static/risk-matrix/riskConfig.json](./static/risk-matrix/riskConfig.json), que atua como a **fonte da verdade** para a governança administrativa e parâmetros estatísticos da Matriz de Riscos (5×5) e do Quadro de Riscos.

---

## 1. Visão Geral da Estrutura

O arquivo está dividido em três seções principais:
1. **`eventos`:** Onde são cadastrados os macroeventos (ex: "Desvio de Conduta") e suas respectivas causas/riscos individuais (ex: "Assédio Moral").
2. **`thresholds.probabilidade`:** Limites e descrições dos níveis de probabilidade calculados com base nos indicadores do Excel.
3. **`thresholds.score`:** Definição das faixas de score (1–25) e o mapeamento de cores (verde, amarelo, laranja, vermelho) da classificação de criticidade do risco.

---

## 2. Dicionário de Campos das Causas (Riscos)

Cada item do array `"causas"` dentro de um macroevento deve ser preenchido de acordo com as seguintes regras de negócio e tipos de dados:

### A. Parâmetros Estatísticos (Lógica de Riscos)
* **`id`** *(string, obrigatório):* Identificador único da causa em letras minúsculas e separado por underline (ex: `"assedio_moral"`, `"nepotismo"`). Este ID é usado como chave de mapeamento nos testes.
* **`nome`** *(string, obrigatório):* Nome de exibição amigável do risco na interface (ex: `"Assédio Moral"`, `"Conflito de Interesses"`).
* **`indicador`** *(string ou null, obrigatório):* Código do indicador de integridade vinculado ao cálculo de probabilidade (ex: `"I01"`, `"I07"`).
  * **Riscos de Escanteio:** Se a causa não possuir métricas ativas ou indicador implementado, defina obrigatoriamente este campo como `null`.
* **`impacto`** *(number, 1 a 5, obrigatório):* Gravidade fixa do risco caso ele ocorra (1 = Muito Baixa, 5 = Muito Alta). O impacto é estático e varia por causa (ex: Assédio Sexual = 5, Assédio Moral = 3).
* **`justificativa`** *(string, opcional):* Explicação técnica por trás da nota de impacto atribuída (ex: `"Crime + passivo trabalhista + dano institucional"`).
* **`validado`** *(boolean, opcional, padrão: `false`):* Define se a nota de impacto atribuída já foi homologada formalmente pela superintendência da PRGA. Se for `false`, o modal de detalhes exibirá o alerta de *"Impacto não validado"*.

### B. Parâmetros Administrativos (Quadro de Riscos)
* **`statusTratamento`** *(string, opcional, padrão: `"Pendente"`):* Indica o estágio do esforço da CAESB para conter o risco. Os valores aceitos são:
  * `"Pendente"`: Sem planos ou ações estruturadas em andamento.
  * `"Em Tratamento"`: Planos de mitigação ativos e em execução.
  * `"Mitigado"`: Risco sob controle (probabilidade estatística reduzida).
  * `"Aceito"`: A superintendência optou por conviver com o nível de risco inerente sem novas ações.
* **`dono`** *(string, opcional, padrão: `"Área não designada"`):* Setor responsável pela execução das ações de mitigação (ex: `"PRGA"`, `"PRGA / CECC"`).
* **`prazo`** *(string, opcional, padrão: `"Prazo não definido"`):* Data limite para a execução das ações (formato recomendado: `YYYY-MM-DD`).
* **`planoAcao`** *(string, opcional):* Descrição textual clara das medidas e ações que a companhia está adotando para mitigar o risco.

### C. Histórico de Avaliações
* **`reavaliacoes`** *(array, opcional, padrão: `[]`):* Lista contendo os scores de risco avaliados em ciclos passados, permitindo analisar a linha de evolução do risco. Cada objeto dentro do array contém:
  * `"data"` *(string, obrigatório):* Período em que a reavaliação ocorreu (formatos aceitos: `YYYY-MM-DD` ou `YYYY-MM`).
  * `"score"` *(number, 1 a 25, obrigatório):* Score final obtido naquele período (Impacto × Probabilidade da época).
  * *Nota:* A classificação textual (ex: "Alto", "Moderado") é calculada em tempo real pelo sistema; portanto, não deve ser inserida no JSON.

---

## 3. Exemplos Práticos de Preenchimento

### Exemplo 1: Risco Ativo e Monitorado (Assédio Moral)o
Usa dados dinâmicos do indicador `I01` e possui controle administrativo completo:

```json
{
  "id": "assedio_moral",
  "nome": "Assédio Moral",
  "indicador": "I01",
  "impacto": 3,
  "justificativa": "Sanção administrativa + passivo trabalhista",
  "validado": true,
  "statusTratamento": "Em Tratamento",
  "dono": "PRGA",
  "prazo": "2026-12-31",
  "planoAcao": "Implementar rodas de conversa setoriais periódicas, realizar workshops obrigatórios para a liderança e ampliar os canais seguros de ouvidoria interna liderados pela PRGA.",
  "reavaliacoes": [
    { "data": "2025-06-30", "score": 12 },
    { "data": "2025-12-31", "score": 12 },
    { "data": "2026-06-30", "score": 9 }
  ]
}
```

### Exemplo 2: Risco de Escanteio (Sem Indicador Vinculado)
Risco mapeado que não possui métricas ativas ou indicador no momento, sendo identificado como secundário na interface:

```json
{
  "id": "furto_bens",
  "nome": "Furto de Bens Patrimoniais",
  "indicador": null,
  "impacto": 3,
  "justificativa": "Prejuízo financeiro direto",
  "validado": false
}
```

---

## 4. Boas Práticas e Manutenção

1. **Validação de Sintaxe:** Antes de salvar alterações no `riskConfig.json`, certifique-se de que o arquivo mantém a sintaxe JSON correta (aspas duplas em chaves e valores string, e vírgulas corretas ao final de objetos em arrays).
2. **Homologação PRGA:** Lembre-se de alterar a flag `"validado"` para `true` assim que a superintendência chancelar oficialmente o peso do `"impacto"` e a `"justificativa"` de cada causa.
3. **Recarga de Cache:** O servidor Flask gerencia o cache de dados. Se as mudanças aplicadas no JSON estático não refletirem imediatamente na tela do navegador ao recarregar a página, você pode forçar a atualização deletando os arquivos locais `.data_cache.json` e `.excel_cache.xlsx` ou aguardando o tempo limite (TTL) de 5 minutos do cache.
