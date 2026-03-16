# Análise geral e precificação – PWA Devolução

## 1. Visão geral do produto

**Tipo:** PWA (Progressive Web App) para **gestão de devolução de mercadorias** em operação de logística/centro de distribuição.

**Objetivo:** Permitir que operadores realizem no celular/tablet, inclusive **offline**, o fluxo completo de uma demanda de devolução: validar demanda, checklist (fotos baú, temperatura), conferência item a item (quantidades esperadas x conferidas), registro de anomalias (com fotos e replicação), itens extras e finalização com fotos de término, com sincronização posterior quando houver internet.

---

## 2. Escopo funcional

### 2.1 Módulos e telas

| Módulo        | Telas / fluxos | Descrição resumida |
|---------------|----------------|--------------------|
| **Home**      | 1              | Página inicial (homepage). |
| **Demandas**  | 3              | Listagem de demandas; itens da demanda (validate); validação com senha. |
| **Checklist** | 1              | Checklist por demanda (fotos baú aberto/fechado, temperaturas, anomalias texto). |
| **Conferência** | 3            | Lista de itens; conferência por item (quantidades, lote, extra); adicionar item extra. |
| **Anomalias** | 1              | Cadastro de anomalia em múltiplos passos (natureza, tipo, causa, fotos, observação, quantidades); **replicar anomalia para todos os itens** (com quantidade conferida por item). |
| **Finalização** | 1            | Resumo da demanda; **fotos de término** (opcional); confirmar finalização e disparar sincronização. |
| **Admin/Debug** | 1            | Debug: tabelas locais (checklists, conferências, anomalias, demandas, fotos término, produtos), tamanho de imagens, limpar dados, exportar DB. |
| **Autenticação** | -            | Keycloak (SSO), rota protegida, guard de inicialização. |

**Total:** ~10 rotas/páginas principais + fluxos multi-step (anomalia, checklist).

### 2.2 Funcionalidades de destaque

- **Offline-first:** Dados principais em IndexedDB (Dexie): demandas, conferências, anomalias, checklists, fotos de término, produtos.
- **Sincronização em camadas:** Produtos → Anomalias → Conferências → Checklists → Fotos de término → Demandas (ordem controlada); presigned URL + upload Minio + APIs REST.
- **Fotos:** Captura/upload em checklist, anomalias (com compressão WebP e replicação com upload único por grupo) e fotos de término; persistência local e sync quando online.
- **Regras de negócio:** Conferência por item com esperado x conferido (un/cx), itens extras, anomalias com natureza/tipo/causa e replicação usando quantidade conferida por item.
- **PWA:** vite-plugin-pwa, uso em mobile/desktop.

---

## 3. Stack técnico

| Camada        | Tecnologias |
|---------------|-------------|
| **Frontend**  | React 19, TypeScript, Vite 7 |
| **UI**        | Tailwind CSS 4, Radix UI, shadcn-style (components), Lucide ícones |
| **Roteamento**| TanStack Router (code-based) |
| **Estado / servidor** | Zustand (stores locais), TanStack Query (API) |
| **Persistência local** | Dexie (IndexedDB) |
| **Formulários / validação** | React Hook Form, Zod |
| **API**       | Axios, Orval (cliente e schemas gerados) |
| **Auth**      | Keycloak (keycloak-js) |
| **Imagens**   | browser-image-compression (WebP), upload via presigned (Minio) |
| **Build / PWA** | Vite, vite-plugin-pwa |

---

## 4. Arquitetura e tamanho do código

- **Estrutura:** Camadas separadas: `_services` (API/Orval), `_shared` (DB, stores, UI, layout, providers), `modules` (devolucao, admin, homepage), `hooks/logic` (sync e fluxos), `auth`.
- **Stores (Zustand):** demandStore, conferenceStore, checklistStore, finishPhotoStore, produtoStore, identityStore.
- **Tabelas (Dexie):** demands, conferences, anomalies, checklists, finishPhotos (versão 2 do schema).
- **Hooks de sync:** use-sync-produtos, use-sync-anomalia, use-sync-conferencia, use-sync-check-list, use-sync-finish-photos, use-sync-demand (orquestra fotos de término + finalização).
- **APIs (Orval):** serviço de devolução (demandas, conferências, anomalias, checklist, presigned URLs, imagens fim, etc.), produto, user, app.
- **Volume aproximado:** ~486 arquivos em `src` (incluindo ~418 em `_services`, em boa parte gerados por Orval). Código “de negócio” e UI concentrado em `modules`, `_shared`, `hooks` e `auth`.

---

## 5. Complexidade

| Aspecto            | Nível   | Observação |
|--------------------|---------|------------|
| **Integração API** | Alta    | Múltiplos endpoints, Orval, presigned + Minio, fluxos de sync ordenados. |
| **Offline / sync** | Alta    | Vários stores e tabelas, conflitos evitados por ordem de sync e flags de sincronizado. |
| **Formulários**    | Média   | Múltiplos passos (anomalia, checklist), validação com Zod. |
| **UI**             | Média   | Muitos componentes reutilizáveis (Radix/shadcn), layout responsivo e mobile-first. |
| **Auth**           | Média   | Keycloak, rotas protegidas, inicialização e token. |
| **Regras de negócio** | Média | Conferência, divergências, replicação de anomalia com quantidade por item, fotos de término. |

---

## 6. Precificação (estimativa)

Estimativa em **valor de projeto único** (entrega do produto no estado atual), em **BRL**, para mercado brasileiro (referência 2025). Valores podem ser convertidos para USD (~R$ 5,80/USD).

### 6.1 Metodologia

- **Base:** Escopo descrito acima, considerando PWA completo, offline-first, 10 rotas principais, 6 fluxos de sync, 5+ stores, integração com backend (REST + Minio + Keycloak).
- **Referência de esforço:** Aproximadamente **4 a 7 meses** de 1 dev fullstack pleno/senior (dependendo de ritmo, reuso e maturidade do backend).
- **Cálculo:** dias úteis × faixa diária do nível (júnior exige mais dias; sênior, menos).

### 6.2 Expectativa por nível: Júnior, Pleno e Sênior

| Nível | Faixa diária (BRL) | Faixa horária (BRL) | Dias estimados (este projeto) | Perfil resumido |
|-------|--------------------|----------------------|--------------------------------|------------------|
| **Júnior** | R$ 400 – R$ 650 | R$ 50 – R$ 85/h | 150 – 220 | Menos autonomia; precisa de code review e apoio em arquitetura/sync; tende a levar mais tempo e a precisar de correções. |
| **Pleno** | R$ 700 – R$ 1.100 | R$ 90 – R$ 140/h | 100 – 150 | Autonomia em features; domina React, API e persistência local; consegue desenhar fluxos de sync e integrações com orientação pontual. |
| **Sênior** | R$ 1.100 – R$ 1.700 | R$ 140 – R$ 220/h | 70 – 110 | Alta autonomia; define padrões, revisa código e resolve problemas de offline/sync e integração; entrega em menos tempo com boa qualidade. |

**Valor total do projeto por nível** (considerando faixa de dias e diária acima):

| Nível | Cenário | Dias | Diária (BRL) | Valor total (BRL) |
|-------|---------|------|----------------|-------------------|
| **Júnior** | Mínimo | 150 | 400 – 500 | R$ 60.000 – R$ 75.000 |
| **Júnior** | Máximo | 220 | 550 – 650 | R$ 121.000 – R$ 143.000 |
| **Pleno** | Mínimo | 100 | 700 – 900 | R$ 70.000 – R$ 90.000 |
| **Pleno** | Máximo | 150 | 1.000 – 1.100 | R$ 150.000 – R$ 165.000 |
| **Sênior** | Mínimo | 70 | 1.100 – 1.300 | R$ 77.000 – R$ 91.000 |
| **Sênior** | Máximo | 110 | 1.500 – 1.700 | R$ 165.000 – R$ 187.000 |

**Resumo por nível (faixa de valor total para este escopo):**

| Nível | Faixa de valor total (BRL) |
|-------|----------------------------|
| **Júnior** | R$ 60.000 – R$ 143.000 |
| **Pleno** | R$ 70.000 – R$ 165.000 |
| **Sênior** | R$ 77.000 – R$ 187.000 |

*Observação:* Com Júnior o custo por dia é menor, mas o número de dias costuma ser maior (e pode haver mais retrabalho). Com Sênior a diária é maior, mas o prazo tende a ser menor e a qualidade/consistência maiores. Pleno costuma ser o melhor custo-benefício para este tipo de projeto.

### 6.3 Faixa de valor do projeto (valor total)

**Sugestão de referência para “precificar esta aplicação” (como está):**  
**R$ 100.000 – R$ 150.000** (valor total do projeto, entrega em estado atual, considerando perfil **pleno** ou **sênior**, sem garantia estendida nem suporte pós-entrega incluído).

### 6.4 Outras formas de precificar

- **Hora técnica (manutenção/evolução):** Júnior R$ 50 – R$ 85/h | Pleno R$ 90 – R$ 140/h | Sênior R$ 140 – R$ 220/h.
- **Mensalidade (suporte + evolução):** Júnior R$ 4.000 – R$ 7.000/mês | Pleno R$ 8.000 – R$ 12.000/mês | Sênior R$ 12.000 – R$ 18.000/mês (dedicação parcial, dependendo de escopo).
- **Por entrega de feature:** Valores por pacote a partir do esforço em dias × faixa diária do nível (ex.: nova tela, novo fluxo de sync).

---

## 7. Riscos e considerações

- **Backend e APIs:** A precificação assume que backend (REST, Minio, Keycloak) já existe ou foi contratado à parte; mudanças grandes de contrato podem impactar esforço.
- **Orval:** Código gerado em `_services` deve ser atualizado quando a API mudar (regerar Orval); manutenção deve considerar isso.
- **Testes:** Projeto com Vitest configurado; cobertura de testes não foi mensurada. Aumentar cobertura tende a aumentar custo de desenvolvimento.
- **Documentação:** README genérico; documentação de negócio e de arquitetura podem ser cobradas à parte.

---

## 8. Resumo executivo

| Item            | Conteúdo |
|-----------------|----------|
| **O que é**     | PWA offline-first para operação de devolução (conferência, checklist, anomalias, fotos de término, sync). |
| **Escopo**      | ~10 telas, 6 fluxos de sync, 5+ stores, auth Keycloak, integração REST + Minio. |
| **Stack**       | React 19, TypeScript, Vite, TanStack (Router, Query), Zustand, Dexie, Tailwind, Radix, Orval. |
| **Complexidade**| Alta (offline, sync, múltiplas entidades e integrações). |
| **Precificação sugerida (projeto)** | **R$ 100.000 – R$ 150.000** (pleno/sênior). Júnior R$ 60k–143k | Pleno R$ 70k–165k | Sênior R$ 77k–187k (ver §6.2). |

Este documento serve como **análise geral e base para precificação**; valores devem ser ajustados conforme região, relação comercial, escopo exato e responsabilidades (ex.: garantia, suporte, documentação).
