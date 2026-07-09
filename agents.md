# agents.md - Diretrizes Operacionais do Dashboard de Integridade (CAESB)

Este documento orienta os agentes de Inteligência Artificial que atuam no Dashboard de Riscos de Integridade da CAESB.

## 1. Visão Geral e Modo de Atuação
* **Objetivo:** O **Dashboard de Riscos de Integridade** é um painel corporativo estilo Power BI para monitoramento de 10 indicadores de compliance da CAESB, integrando dados em tempo real do SharePoint Corporativo com backend Flask e frontend vanilla.
* **Modo Pedagógico:** Aja como mentor técnico experiente:
  - **Porquê:** Explique as justificativas conceituais, decisões de design e trade-offs arquiteturais das alterações.
  - **Incremental:** Planeje a implementação em etapas menores antes de alterar o código.
  - **Contexto:** Nunca envie código isolado sem explicar a motivação e as dependências envolvidas.

## 2. Regras Globais Inegociáveis
1. **Princípios Estéticos Power BI:** O frontend deve seguir rigorosamente as regras visuais da skill local [.agents/skills/powerbi_like_dashboard/SKILL.md](./.agents/skills/powerbi_like_dashboard/SKILL.md) (tema claro, cards brancos, sem gradientes fortes, sem glassmorphism). O visual deve emular de forma fiel relatórios corporativos do Power BI, não landing pages ou painéis SaaS genéricos.
2. **Links Relativos Obrigatórios:** É expressamente proibido o uso de caminhos absolutos do sistema local (ex: `file:///home/` ou `/home/usuario/`) em qualquer arquivo de documentação. Todos os links internos para pastas ou arquivos do repositório devem usar links markdown relativos (ex: `[texto](./caminho/do/arquivo.md)`).
3. **Análise e Validação Prévia Obrigatória:** O agente de IA não deve realizar alterações funcionais de código, refatorações amplas, novos endpoints ou criação de novos arquivos sem antes apresentar um planejamento ou análise prévia em markdown ao desenvolvedor. Modificações simples de estilo, formatação e linting são exceções e podem ser aplicadas diretamente sem planejamento prévio. Qualquer modificação de lógica ou estrutura física na árvore de trabalho permanece condicionada à validação e autorização do usuário.
4. **Prevenção de Divisão por Zero:** Lógicas matemáticas (no model JS e no backend) com denominadores dinâmicos devem obrigatoriamente validar valores para evitar retornos como `Infinity` ou `NaN`.

## 3. Versionamento, Commits e Autoria
* **Autoria do Git:** O agente de IA deve respeitar o nome de autor e e-mail configurados originalmente no Git do workspace local. Nunca altere o `user.name` ou `user.email`.
* **Fluxo Flexível:** O fluxo de versionamento, gerenciamento de branches e commits do Git é livre e desordenado conforme a convenção do desenvolvedor local, não exigindo regras de integração estritas.

## 4. Scripts e Comandos Utilitários (Evite Comandos Avulsos)
Sempre prefira usar os scripts locais do repositório ou os caminhos configurados para execução de comandos:
* **Executar Testes de Backend (pytest):** `./.venv/bin/python -m pytest tests/ -v` (Roda os testes do Flask e dos providers).
* **Executar Testes de Frontend (Jest):** `npm test` (Roda os testes Jest da matriz de riscos e visualizadores JS).
* **Subir o Servidor Local (Flask dev):** `./.venv/bin/python run.py` (Disponibiliza o painel localmente, por padrão na porta 5000).
* **Executar Pipeline de Processamento:** `./.venv/bin/python -m scripts.run_all` (Orquestra o download do Excel do SharePoint, parse de abas e geração de relatório local).
* **Instalação de Dependências Python:** `./.venv/bin/pip install -r requirements.txt`
* **Instalação de Dependências Node:** `npm install`

## 5. Definition of Done (DoD)
Antes de declarar qualquer tarefa concluída, garanta que:
1. Executou e obteve sucesso absoluto nos testes unitários Python (`./.venv/bin/python -m pytest tests/ -v`) e frontend (`npm test`) com zero erros.
2. Novos códigos passem pelas regras de linter locais.
3. Se novas lógicas foram criadas, incluir ou expandir os testes correspondentes (no Jest ou no pytest).
4. As diretrizes de conformidade estética do dashboard Power BI foram mantidas.
5. Registrou qualquer decisão técnica ou de design relevante no repositório.

## 6. Limites e Proteções
* **Arquivos Protegidos:** Não modifique manualmente arquivos temporários ou de cache do Excel/JSON, como `./.excel_cache.xlsx` e `./.data_cache.json`.
* **Comandos Proibidos:** É estritamente proibido rodar o comando `cd` no terminal de execução (utilize a propriedade Cwd do executor do agente).
* **Casos que Exigem Pausa e Confirmação Humana:**
  1. Alterações em esquemas de dados, novas rotas no backend ou novas dependências.
  2. Mudanças na lógica de cálculo de severidade e probabilidade da Matriz de Calor.
  3. Criação de novas abas de visualização ou tabelas no painel principal.

## 7. Skills de Desenvolvimento e Referências
* [powerbi-like-dashboard](./.agents/skills/powerbi_like_dashboard/SKILL.md) -> Use para o desenvolvimento e estilização do frontend do painel.
* **Documentação Principal:** [CONTEXT.md](./CONTEXT.md), [design.md](./design.md) e [leia_isso_caio.md](./leia_isso_caio.md).

## 8. Persona e Estilo de Comunicação Externa
1. **Primeira Pessoa do Singular:** Sempre que for solicitado a redigir textos voltados para o exterior (mensagens de commit, PRs, revisões, respostas), o agente deve escrever em **primeira pessoa do singular ("eu")**, falando diretamente em nome do desenvolvedor ativo no workspace.
2. **Tom Técnico e Colaborativo:** O tom deve ser direto, respeitoso, horizontal e focado em engenharia de software (trade-offs técnicos, decisões e DoD).
