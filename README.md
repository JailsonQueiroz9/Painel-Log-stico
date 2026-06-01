# Portal de Logística Follow-UP (Cloud Sync Enterprise 4.0)

Bem-vindo ao **Portal de Logística Follow-UP**. Este sistema corporativo foi desenvolvido para gerenciar, monitorar e rastrear fluxos integrados de logística, divididos em **Pré-Embarque** (Controle de Notas Fiscais, previsões e agendamentos) e **Embarque** (Rastreamento logístico internacional e nacional via AWB - Air Waybill).

---

## 📖 Documentação Completa e Detalhada

Para conferir o guia de implantação técnica passo a passo, a arquitetura detalhada do banco de dados (Google Sheets), as automações inteligentes de varredura de PDFs (Google Drive), disparo automatizado de e-mails customizados com anexos, e especificações operacionais do sistema, acesse:

👉 **[DOCUMENTACAO.md](./DOCUMENTACAO.md)** 👈

---

## ✨ Recursos de Destaque

*   **Painel Geral Interativo (KPIs & BI):** Dashboards e relatórios analíticos em tempo real construídos com a biblioteca `Recharts`, indicando cargas em trânsito, entregas e alertas de atraso.
*   **Modos de Tela Avançados:** Modo Escuro (Dark Mode) de alto contraste e Modo Claro (Light Mode) sofisticado baseado no tema **Branco Azulado** para reduzir a fadiga ocular.
*   **Temas de Cores:** Ajuste dinâmico de cores de destaques (Azul, Esmeralda, Violeta, Rosa ou Laranja).
*   **Chat Colaborativo Integrado:** Canal público para comunicados rápidos, salas/espaços gerados dinamicamente e Mensagens Diretas (DMs) privadas para conversas pontuais.
*   **Automação Google Workspace:**
    *   **Automated Scan:** Associação automática de arquivos PDFs do Google Drive a registros de Notas Fiscais correspondentes.
    *   **E-mail Trigger:** Disparo automatizado de e-mails em HTML corporativo responsivo com PDFs e imagens anexadas de forma automática direto do Drive.
*   **Gestão de Usuários (Admin Panel):** Interface administrativa dedicada ao controle de papéis (`admin`/`user`), ativação de status e restrições de visibilidade por módulo.
*   **Histórico e Auditoria:** Rastreamento total de atividades críticas executadas por usuários no portal ( logins, cadastros, alterações de cargas e exclusões).

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - React 19 (Hooks, Functional Components)
  - TypeScript (Tipagem estática)
  - Tailwind CSS (Estilização utilitária)
  - Lucide React (Ícones)
  - Recharts (Visualização de dados)
  - Vite (Build tool e dev server)
- **Backend / Banco de Dados**:
  - Google Apps Script (API REST)
  - Google Sheets (Armazenamento de dados nas abas: `AWB`, `PRE`, `USERS`, `HISTORY`, `CHATS`)

## 📂 Estrutura de Diretórios

```text
/
├── index.html              # Ponto de entrada HTML
├── package.json            # Dependências e scripts do projeto
├── tsconfig.json           # Configurações do TypeScript
├── vite.config.ts          # Configurações do Vite
├── src/
│   ├── index.tsx           # Ponto de entrada do React
│   ├── App.tsx             # Componente raiz e roteamento interno
│   ├── style.css           # Estilos globais e configurações do Tailwind
│   ├── types.ts            # Interfaces e Tipos do TypeScript
│   ├── components/         # Componentes da interface
│   │   ├── Dashboard.tsx   # Tela inicial e gráficos
│   │   ├── FollowUp.tsx    # Tela de listagem de Pré-Embarque e AWB
│   │   ├── AWBModal.tsx    # Formulário de criação/edição de registros
│   │   ├── Sidebar.tsx     # Menu de navegação lateral
│   │   ├── UserManagement.tsx # Tela de gestão de usuários
│   │   ├── History.tsx     # Tela de logs e auditoria
│   │   ├── ThemeSettings.tsx # Painel de personalização de aparência
│   │   └── ...
│   └── services/
│       └── storageService.ts # Integração com a API do Google Apps Script
```

## ⚙️ Como Executar o Projeto Localmente

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:3000` (ou na porta configurada pelo Vite).

3. **Geração de Build para Produção**:
   ```bash
   npm run build
   ```
   Os arquivos otimizados serão gerados na pasta `dist/`.

## 🔗 Integração com Google Sheets (API)

O arquivo `src/services/storageService.ts` contém a URL da API do Google Apps Script (`API_URL`). 
A API espera requisições `POST` com um payload JSON contendo a ação (`action`), a aba (`sheet`) e os dados (`data`).

**Ações suportadas pela API:**
- `read`: Lê todos os dados de uma aba.
- `create`: Insere uma nova linha.
- `update`: Atualiza uma linha existente baseada no `ID`.
- `delete`: Remove uma linha baseada no `ID`.
- `upload`: Faz o upload de arquivos em Base64 para o Google Drive e retorna a URL pública.

---
*Desenvolvido para otimização e controle de fluxos logísticos.*
