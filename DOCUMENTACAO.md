# 📖 Documentação Técnica e do Usuário - Portal de Logística Follow-UP
## Cloud Sync Enterprise 4.0 (Grupo Dass)

Seja bem-vindo à documentação oficial consolidada do **Portal de Logística Follow-UP**. Este documento serve como o manual definitivo de engenharia, arquitetura e operação do sistema. Ele foi planejado para fornecer a engenheiros, administradores de TI e operadores uma visão aprofundada de todo o ecossistema, incluindo as novas integrações avançadas do **Google Workspace (Central Gmail & Google Chat)**.

---

## 🗺️ 1. Visão Geral da Arquitetura

O portal opera sobre uma arquitetura **Serverless & SPA (Single Page Application)** otimizada para alto desempenho, redundância total e custo zero de infraestrutura física.

```
       💻 FRONTEND REATIVO (Vite/React)
       ┌──────────────────────────────┐
       │ - React 19 + TypeScript      │
       │ - Tailwind (Light/Dark Mode) │
       │ - Recharts & BI Analytics   │
       └──────────────┬───────────────┘
                     │ ▲
                     │ │  Requisições REST HTTPS (JSON, Base64)
                     ▼ │
       ☁️ GOOGLE APPS SCRIPT WEB APP (Backend)
       ┌──────────────────────────────┐
       │ - API Gateway Executora      │
       │ - Manipulador de CRUD/Drive  │
       │ - Motor de Chat & Histórico  │
       └──────────────┬───────────────┘
                     │
      ┌──────────────┴──────────────┬────────────────────────┐
      ▼                             ▼                        ▼
📂 STORAGE DRIVE              📊 BANCO DE DADOS Sheets      📧 GOOGLE WORKSPACE API
┌─────────────────────────┐   ┌──────────────────────────┐   ┌────────────────────────┐
│ Google Drive Public/Res │   │ Abas:                    │   │ - Gmail API            │
│                         │   │ - AWB (Controle Cargas)  │   │   (Read / Send Scopes) │
│ - Notas Fiscais e PDFs  │   │ - PRE (Pré-Embarque)     │   │ - Chat Spaces API      │
│ - Imagens do Chat       │   │ - CADASTRO USUÁRIO       │   │   (Spaces / Messages)  │
│ - Comprovantes Físicos  │   │ - CHAT & ESPACO          │   │ - Google UserInfo      │
└─────────────────────────┘   └──────────────────────────┘   └────────────────────────┘
```

### Componentes Principais:
1. **Frontend (Vite + React 19 + TypeScript):** Interface rica de tela única (SPA) com roteamento interno reativo. Apresenta controles granulares de busca, relatórios analíticos de Business Intelligence (BI) dinâmicos com **Recharts**, visualização unificada de follow-ups e a nova central de comunicações corporativas.
2. **Backend Serverless (Google Apps Script - Web App):** Atua como o API Gateway do sistema, interpretando requisições `POST` com payloads JSON para realizar operações de cadastro, leitura e exclusão diretamente nas planilhas, além de hospedar anexos em formato binário Base64 no Google Drive.
3. **Database Relacional Leve (Google Sheets):** A planilha Google atua como o banco de dados principal. Cada aba é mapeada logicamente como uma tabela relacional. As planilhas podem ser editadas diretamente na nuvem por operadores, refletindo as alterações no sistema reativamente em tempo real.
4. **Google Workspace APIs Integradas (Direct Client-to-Cloud):** Integrações autorizadas via fluxo seguro de **OAuth 2.0 (implicit grant / token manual)** para carregar a Caixa de Entrada corporativa, disparar follow-ups formatados em e-mail HTML com PDFs reais anexados de forma automatizada e sincronizar conversas com os **Espaços do Google Chat**.

---

## 🗄️ 2. Modelo de Dados (Estrutura do Google Sheets)

A planilha integrada deve respeitar a nomenclatura exata de abas e cabeçalhos abaixo (todas as letras em maiúsculo na primeira linha):

### A. Aba: `AWB` (Controle Geral de Embarques e Pré-Embarques)
Centraliza todo o fluxo logístico nacional e internacional de cargas e agendamentos.
*   **Cabeçalhos (Linha 1):**
    `ID` | `Fornecedor` | `Saída` | `NF's` | `AWB` | `Status` | `Chegada` | `Marca` | `Material` | `Observação` | `Rastreio` | `Documentos` | `Previsão Agend.` | `Link Agendamento` | `PDF_1` | `PDF_2` | `PDF_3` | `PDF_4` | `PDF_5` | `PDF_6` | `PDF_7` | `PDF_8` | `PDF_9` | `PDF_10` | `PDF_11`
*   **Campos de Pré-Embarque:** Registros com status de pré-embarque utilizam prioritariamente as colunas `Previsão Agend.`, `Link Agendamento` e deixam as colunas `AWB` vazias até a consolidação da carga.
*   **Sincronização de Notas Fiscais:** As colunas `PDF_1` a `PDF_11` são alimentadas e atualizadas automaticamente por rotinas de script inteligentes baseadas nas Notas Fiscais cadastradas.

### B. Aba: `CADASTRO USUÁRIO` (Controle de Acesso e Segurança)
Armazena a base cadastral de operadores do sistema, seus dados de perfil e níveis de acesso.
*   **Cabeçalhos (Linha 1):**
    `ID` | `USUÁRIO` | `E-MAIL` | `SENHA` | `PAPEL` | `STATUS` | `Permissões de Tela (Módulos)` | `Img` | `Cargo` | `Bio` | `Location` | `Birthday`
*   **Chaves de Controle:**
    *   `PAPEL`: `admin` (acesso total administrativo e edição de cadastros) ou `user` (operador com acessos restritos por tela).
    *   `STATUS`: `ativo` ou `inativo`.
    *   `Permissões de Tela (Módulos)`: Texto simples delimitado por ponto e vírgula contendo os códigos dos módulos permitidos (ex: `Dashboard; Follow-UP; Follow-UP-Pre; Chat; Gmail; Historico; Configuracao`).

### C. Aba: `CHAT` e Abas Dinâmicas de Mensagem Direta (`DM_*` / `Grupo_*`)
*   **Cabeçalhos (Linha 1):**
    `ID` | `USER` | `TEXT` | `IMG` | `TIMESTAMP` | `TYPE`
*   **Fluxo de Mensagens:** O chat grava dados na aba principal `CHAT` para comunicações gerais. Quando duas pessoas iniciam um chat privado (DM), o Apps Script cria automaticamente uma tabela nomeada como `DM_emailA_emailB` (ordenada alfabeticamente) para isolar as conversas e garantir privacidade e persistência segregada.

### D. Aba: `ESPACO` (Canais Colaborativos de Discussão)
*   **Cabeçalhos (Linha 1):**
    `ID` | `NAME` | `MEMBERS` | `CREATED_AT`
*   **Formato de Membros:** Campo `MEMBERS` é serializado em vetor JSON (ex: `["jailson.filho@grupodass.com.br", "operador@grupodass.com.br"]`).

---

## ⚙️ 3. Guia de Implantação do Google Apps Script & Arquivo Backend

Para implantar a API REST de suporte em nuvem, siga os passos abaixo:

1. No Google Sheets corporativo, acesse: **Extensões** > **Apps Script**.
2. Apague todo o conteúdo padrão e cole os códigos presentes nas planilhas do repositório (`BACKEND_APPSCRIPT.gs` ou `BACK_END_APPSCRIPT.gs`).
3. Localize o objeto de configuração `DRIVE_CONFIG` no cabeçalho do script e atualize o ID da sua pasta do Google Drive:
   ```javascript
   const DRIVE_CONFIG = {
     PASTA_DOCUMENTOS: 'INSIRA_AQUI_O_ID_DA_SUA_PASTA_DO_DRIVE', // Copie o ID da URL da pasta no seu navegador
     COLUNA_NOTAS_FISCAIS: 4, // Coluna D (Notas Fiscais)
     COLUNA_DOCUMENTOS: 12,   // Coluna L (Comprovantes Gerais)
     COLUNA_INICIO_PDFS: 14,  // Coluna N (PDF_1)
     NUM_COLUNAS_PDFS: 11     // N até X (11 colunas de PDFs automáticos)
   };
   ```
4. Clique em **Implantar (Deploy)** > **Nova Implantação**.
5. Em "Configuração", selecione **Aplicativo da Web (Web App)**.
6. Ajuste os termos:
   * **Executar como:** `Eu (seu e-mail corporativo)`.
   * **Quem tem acesso:** `Qualquer pessoa` (Este parâmetro é absolutamente crítico para habilitar as conexões de API sem bloqueios de segurança do navegador / CORS).
7. Clique em **Implantar**. Conceda as autorizações recomendadas na tela de segurança do Google clicando em *"Avançado"* > *"Ir para Projeto (Não Seguro)"*.
8. Copie a **URL do Aplicativo Web** gerada (ex: `https://script.google.com/macros/s/.../exec`).
9. No código do Frontend, abra o arquivo `/services/storageService.ts` e cole-a no campo `API_URL`:
   ```typescript
   export const API_URL = "SUA_URL_DO_DEPLOY_AQUI";
   ```

---

## 📧 4. Módulo Central Gmail Corporativo

Este painel completo permite a gestão integrada de comunicações, consultas e follow-ups logísticos de alta prioridade.

### Recursos Disponíveis:
*   **Visualização de Caixa de Entrada Avançada:** Consulta e lê e-mails em tempo real diretamente na interface, com filtros de busca automáticos voltados a termos de logística do Grupo Dass, como `subject:(AWB OR embarque OR Dass OR rastreamento)`.
*   **Leitura de Mensagens Ricas:** Renderização integrada de e-mails corporativos complexos em HTML através de contêineres sandbox seguros (`iframe srcdoc`), além de suporte a e-mails puramente textuais.
*   **Novo Despacho Operacional com Auto-Compilação:** Permite selecionar qualquer entrada ativa das listas de **AWB (Embarque)** ou **PRÉ (Pré-Embarque)** para compilar automaticamente um e-mail de follow-up perfeitamente formatado.
*   **Template HTML Corporativo Responsivo:** Gera um e-mail com visual corporativo premium do **Grupo Dass Logística**, contendo tabelas estruturadas do status das cargas, histórico de observações atualizadas e botões interativos para consulta em tempo real, reforçando a imagem operacional e a clareza das mensagens para parceiros externos.

```
┌────────────────────────────────────────────────────────┐
│               GRUPO DASS • LOGÍSTICA & PCP             │  ◄ Topo Vermelho Corporativo
├────────────────────────────────────────────────────────┤
│ Olá, segue status atualizado do embarque para follow-up│
│                                                        │
│  AWB: 957-124458920         Fornecedor: Exemplo Ltda   │  ◄ Tabela Consolidada de Carga
│  Status: Em Trânsito        Marca: FILA                │
│                                                        │
│  [ CONSULTAR RASTREIO REAL-TIME ] ◄ Botão de Ação      │
└────────────────────────────────────────────────────────┘
```

---

## 💬 5. Módulo Google Chat & Spaces Colaborativos

Integrado ao painel do Chat, este módulo eleva a comunicação interna ao permitir conexões em tempo real com canais operacionais.

### Recursos Disponíveis:
*   **Leitura de Mensagens de Espaços:** Permite obter as discussões de salas de projetos ou fóruns de operação logística (`spaces`).
*   **Envio de Mensagens Focadas:** Envio centralizado de notas operacionais rápidas para os canais do Google Chat relevantes sob os tokens corporativos autorizados do usuário.
*   **Coexistência Híbrida:** O chat permite alternar dinamicamente entre o banco de dados local do Sheets (salas corporativas internas controladas pelo painel) e chats baseados na nuvem do Google Chat.

---

## 🔒 6. Fluxo de Autorização OAuth 2.0 & Resolução de Erros

A integração com o Google Workspace ocorre de duas formas ajustáveis no painel:

### 🌟 Método Conectado (Google OAuth 2.0):
O sistema inicia o fluxo utilizando o identificador de cliente (**Google Client ID**) cadastrado no console do desenvolvedor Google Cloud.
*   **Escopos Solicitados:**
    *   `https://www.googleapis.com/auth/gmail.readonly` - Leitura de e-mails corporativos e buscas operacionais.
    *   `https://www.googleapis.com/auth/gmail.send` - Disparo automatizado de follow-ups e avisos de nota fiscal.
    *   `https://www.googleapis.com/auth/chat.messages` & `https://www.googleapis.com/auth/chat.spaces` - Integração com canais e espaços colaborativos.
    *   `https://www.googleapis.com/auth/userinfo.profile` & `https://www.googleapis.com/auth/userinfo.email` - Exibição de imagem de avatar e e-mail no menu de navegação.

### ⚠️ Resolução de Erros Comuns de Login:

#### Erro `401: invalid_client` (Bloqueio ou Cliente não encontrado)
*   **Significado:** O Google rejeitou a identificação da sua aplicação porque o Google Client ID inserido não existe, está incorreto, ou a política interna de TI do **Grupo Dass** restringe a criação automática de apps OAuth externos por e-mails de funcionários.
*   **Como Resolver (Através de Conta de Desenvolvedor Pessoal):**
    1. Acesse o **Google Cloud Console** (`console.cloud.google.com`) usando uma conta Google pessoal fora do proxy da empresa (`@gmail.com`).
    2. Crie um novo projeto de desenvolvimento.
    3. Em **Tela de Consentimento OAuth**, configure-a como "Externa" e defina o nome do aplicativo. Adicione os escopos do Gmail e do Google Chat desejados indicados acima.
    4. Adicione seu e-mail corporativo (`jailson.filho@grupodass.com.br`) na lista de **Usuários de Teste**.
    5. Vá em **Credenciais** > **Criar Credenciais** > **ID do cliente OAuth**.
    6. Selecione a opção **Aplicativo da Web**.
    7. No campo **URIs de redirecionamento autorizadas**, cole exatamente a URL que o painel Gmail apresenta, por exemplo:
       `https://ais-pre-eyu3b7lg6skb5sz2snnqns-15771800691.us-east1.run.app`
    8. Gere as credenciais, copie o ID do cliente retornado, cole no campo de input do painel de login do Gmail, salve e realize a autenticação.

#### Erro `Falha ao listar mensagens`
*   **Significado:** Tokens gerados via fluxo de OAuth implícito do Google duram exatamente **1 hora** por razões estritas de segurança. Após este período, qualquer tentativa de ler ou disparar e-mails retornará este erro.
*   **Como Resolver:** O sistema detectará automaticamente tokens com erro 401, alertará o operador, fará o logout de segurança e solicitará um novo clique rápido de login para renovar as permissões por mais uma hora.

#### Entrada Manual de Token (Google Playgrounds):
Caso os limites de segurança da infraestrutura de TI estejam ativos na sua máquina, utilize o **Google OAuth 2.0 Playground** (`developers.google.com/oauthplayground`) para selecionar os escopos listados, gerar um access token de teste e inseri-lo manualmente no painel abaixo do input para liberar os serviços instantaneamente.

---

## 🎨 7. Identidade Visual e Estética Premium

O portal destaca-se pela alta fidelidade de design, utilizando recursos que tornam a operação agradável durante longos períodos de monitoramento logístico corporativo.

*   **Tema Claro (Light Mode) "Branco Azulado":** Diferente de telas brancas comuns geradoras de fadiga, a cor de fundo combina um sutil tom azul-gelo hospitalar (`var(--color-bg-main): 240 247 255`). Linhas de divisão de baixa opacidade e sombras com dispersão azul criam profundidade fina e relaxamento visual.
*   **Tema Escuro (Dark Mode) "Industrial":** Combina pretos profundos, cinzas de carbono e destaques cromáticos otimizados para total foco de monitoramento noturno em armazéns de transporte.
*   **Accent Colors (Cores de Destaque):** O usuário pode customizar todo o esquema visual (botões, seleções, gráficos, badges de KPI) selecionando layouts Azuis, Esmeraldas, Ameixas, Magentas ou Laranjas em tempo de execução pelo painel de configurações.

---

## 🛠️ 8. Comandos e Manutenção do Desenvolvedor

Abaixo estão descritos os passos para reinstalação, verificação e builds locais:

1.  **Instalação Limpa de Pacotes:**
    ```bash
    npm install
    ```
2.  **Executar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
3.  **Compilar e Verificar Erros de Tipo Estáticos (TypeScript):**
    ```bash
    npm run lint
    ```
4.  **Gerar Pacote de Produção Minificado:**
    ```bash
    npm run build
    ```
    Este comando realiza a checagem sintática e gera arquivos totalmente otimizados e minificados de HTML, JavaScript e CSS prontos para implantação direta na pasta `/dist`.

---
*Portal de Logística Follow-UP - Grupo Dass. Inteligência integrada em transportes, comunicações e relatórios analíticos.*
