/**********************************************************
 * SISTEMA UNIFICADO v4.0 - AUTO-SYNC & BOOTSTRAP
 * BANCO DE DADOS SERVERLESS (CRUD) + CHAT + GMAIL & DRIVER
 * LOGÍSTICA FOLLOW-UP (GRUPO DASS • ITB)
 **********************************************************/

/* ======================= CONFIGURAÇÕES ======================= */
const SHEETS = {
  AWB: "AWB",
  PRE: "PRÉ",
  USERS: "CADASTRO USUÁRIO",
  CHAT: "CHAT",
  GROUPS: "ESPACO"
};

const CHAT_HEADERS = ["ID", "USER", "TEXT", "IMG", "TIMESTAMP", "TYPE"];
const GROUP_HEADERS = ["ID", "NAME", "MEMBERS", "CREATED_AT"];

const DRIVE_CONFIG = {
  PASTA_DOCUMENTOS: "0AOXxdWFOmscbUk9PVA", // Insira o código da pasta de anexos do Drive
  COLUNA_NOTAS_FISCAIS: 4, // Coluna D
  COLUNA_DOCUMENTOS: 12,   // Coluna L
  COLUNA_INICIO_PDFS: 14,  // Coluna N (PDF_1)
  NUM_COLUNAS_PDFS: 11     // N até X (11 colunas reservadas para PDFs)
};

/* ======================= CORE GATEWAY ======================= */

function doGet(e) {
  try {
    const sheetName = e?.parameter?.sheet || SHEETS.AWB;
    return json(getRows(sheetName));
  } catch (err) {
    return json({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, sheet, data } = body;

    switch (action) {
      case "UPLOAD": return uploadToDrive(data);
      case "UPLOAD_PDF": return uploadPDFToDrive(data);
      case "BUSCAR_DOCUMENTOS": return buscarDocumentosPorNotaFiscal();
      case "STATUS_BUSCA": return json({ status: obterStatusBusca() });
      case "CHAT_GET": return json(getChatMessages(sheet));
      case "CHAT_SAVE": return saveChatMessage(sheet, data);
      case "CREATE_CHAT_SHEET": 
        ensureChatSheet(body.sheetName || data.name);
        return json({ success: true });
      case "GROUP_CREATE": return createGroup(data);
      case "GROUP_LIST": return json(getGroups());
      case "DM_OPEN": return json({ sheet: buildDM(data.userA, data.userB) });
      case "GET": return json(getRows(sheet));
      case "SAVE": return saveRow(sheet, data); 
      case "DELETE": return deleteRow(sheet, data.id || data.ID);
      case "TESTAR_EXTRACAO": return testarFuncaoExtracao();
      default: return json({ error: "Ação inválida: " + action });
    }
  } catch (err) {
    return json({ error: err.toString() });
  }
}

/* ======================= HELPERS ======================= */

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Retorna uma aba da Planilha. Caso ela não exista,
 * realiza o auto-bootstrap criando as tabelas com os devidos cabeçalhos estruturados.
 */
function getSheet(name) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    
    // Auto-Bootstrap do Banco de Dados
    if (name === SHEETS.AWB || name === SHEETS.PRE || name === "AWB" || name === "PRÉ") {
      sh.appendRow(["ID", "Fornecedor", "Saída", "NF's", "AWB", "Status", "Chegada", "Marca", "Material", "Observação", "Rastreio", "Documentos", "Previsão Agend.", "Link Agendamento", "PDF_1", "PDF_2", "PDF_3", "PDF_4", "PDF_5", "PDF_6", "PDF_7", "PDF_8", "PDF_9", "PDF_10", "PDF_11"]);
      sh.getRange("A1:Y1").setBackground("#e21b22").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
      sh.setFrozenRows(1);
    } 
    else if (name === SHEETS.USERS || name === "CADASTRO USUÁRIO") {
      sh.appendRow(["ID", "USUÁRIO", "E-MAIL", "SENHA", "PAPEL", "STATUS", "Permissões de Tela (Módulos)", "Img", "Cargo", "Bio", "Location", "Birthday"]);
      sh.getRange("A1:L1").setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
      sh.setFrozenRows(1);
      
      // Seed default: Jailson Filho
      sh.appendRow([
        Utilities.getUuid(),
        "Jailson Filho",
        "jailson.filho@grupodass.com.br",
        "admin",
        "admin",
        "ativo",
        "Dashboard; Follow-UP; Follow-UP-Pre; Chat; Gmail; Historico; Configuracao",
        "",
        "ADMINISTRADOR DE LOGÍSTICA",
        "Desenvolvedor e administrador operacional da plataforma.",
        "Itaberaba - BA",
        "1994-11-20"
      ]);

      // Seed default: Portaldass Demo de Fallback
      sh.appendRow([
        Utilities.getUuid(),
        "Demonstração Dass",
        "portaldass@grupodass.com",
        "123456",
        "admin",
        "ativo",
        "Dashboard; Follow-UP; Follow-UP-Pre; Chat; Gmail; Historico; Configuracao",
        "",
        "Operador Visitante",
        "Conta demonstrativa para novos funcionários de PCP / Logística.",
        "Central",
        ""
      ]);
    } 
    else if (name === SHEETS.GROUPS || name === "ESPACO") {
      sh.appendRow(GROUP_HEADERS);
      sh.getRange("A1:D1").setBackground("#1d4ed8").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
      sh.setFrozenRows(1);
    } 
    else if (name === SHEETS.CHAT || name === "CHAT") {
      sh.appendRow(CHAT_HEADERS);
      sh.getRange("A1:F1").setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
      sh.setFrozenRows(1);
    } 
    else {
      sh.appendRow(["ID"]);
    }
  }
  return sh;
}

/* ======================= DRIVE & ARQUIVOS ======================= */

function uploadToDrive(data) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_CONFIG.PASTA_DOCUMENTOS);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.base64), data.mimeType || "image/png", data.fileName || "arquivo");
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return json({ success: true, url: file.getUrl(), id: file.getId() });
  } catch (err) {
    return json({ success: false, error: "Erro no upload Drive: " + err.toString() });
  }
}

function uploadPDFToDrive(data) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_CONFIG.PASTA_DOCUMENTOS);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.base64), "application/pdf", data.fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return json({ success: true, url: file.getUrl(), fileName: file.getName() });
  } catch (err) {
    return json({ success: false, error: "Erro no upload PDF: " + err.toString() });
  }
}

/* ======================= BUSCA AUTOMÁTICA DE DOCUMENTOS ======================= */

function buscarDocumentosPorNotaFiscal() {
  try {
    const sheet = getSheet(SHEETS.AWB);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return json({ success: true, message: "Sem registros ativos para busca." });

    let fileLinks = {};
    try {
      fileLinks = carregarDicionarioArquivos(DRIVE_CONFIG.PASTA_DOCUMENTOS);
    } catch (driveErr) {
      console.warn("Aviso: Google Drive inacessível. Operação básica de busca de arquivos ignorada.", driveErr);
      return json({ success: false, error: "Diretório Google Drive configurado de forma incorreta: " + driveErr.toString() });
    }
    
    const rangeBusca = sheet.getRange(2, 1, lastRow - 1, DRIVE_CONFIG.COLUNA_DOCUMENTOS);
    const valoresBusca = rangeBusca.getValues();
    
    const rangeLinksAtuais = sheet.getRange(2, DRIVE_CONFIG.COLUNA_INICIO_PDFS, lastRow - 1, DRIVE_CONFIG.NUM_COLUNAS_PDFS);
    const linksAtuais = rangeLinksAtuais.getValues();
    
    let totalLinksNovos = 0;
    let linhasProcessadas = 0;

    for (let i = 0; i < valoresBusca.length; i++) {
      const nfTexto = String(valoresBusca[i][DRIVE_CONFIG.COLUNA_NOTAS_FISCAIS - 1]);
      const statusDoc = String(valoresBusca[i][DRIVE_CONFIG.COLUNA_DOCUMENTOS - 1]).trim();

      // Somente busca se o campo de documentos de validação inicial estiver vazio
      if (statusDoc === "") {
        const nfs = nfTexto.split(/[\s\/,|-]+/).map(n => n.trim()).filter(n => n.length >= 3);
        const rowLinks = [];

        for (const nf of nfs) {
          for (const [fileName, url] of Object.entries(fileLinks)) {
            if (fileName.includes(nf) && !rowLinks.includes(url)) {
              rowLinks.push(url);
              if (rowLinks.length >= DRIVE_CONFIG.NUM_COLUNAS_PDFS) break;
            }
          }
          if (rowLinks.length >= DRIVE_CONFIG.NUM_COLUNAS_PDFS) break;
        }

        if (rowLinks.length > 0) {
          linhasProcessadas++;
          totalLinksNovos += rowLinks.length;
          for (let j = 0; j < DRIVE_CONFIG.NUM_COLUNAS_PDFS; j++) {
            linksAtuais[i][j] = rowLinks[j] || "";
          }
        }
      }
    }

    rangeLinksAtuais.setValues(linksAtuais);
    rangeLinksAtuais.setFontColor('#1A73E8').setFontWeight('bold').setVerticalAlignment('middle');
    
    return json({ success: true, linksEncontrados: totalLinksNovos, linhasAfetadas: linhasProcessadas });
  } catch (e) {
    return json({ success: false, error: e.toString() });
  }
}

function carregarDicionarioArquivos(folderId) {
  const dict = {};
  const files = DriveApp.getFolderById(folderId).getFilesByType(MimeType.PDF);
  while (files.hasNext()) {
    const f = files.next();
    dict[f.getName()] = f.getUrl();
  }
  return dict;
}

/* ======================= ENTRADAS & CRUD (DATABASE SHADOW) ======================= */

function getRows(sheetName) {
  const sh = getSheet(sheetName);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function saveRow(sheetName, payload) {
  const sh = getSheet(sheetName);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const id = payload.ID || payload.id || Utilities.getUuid();
  payload.ID = id;

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) { rowIndex = i + 1; break; }
  }

  // Extração isolada dos e-mails de despacho antes de persistir
  const cleanPayload = { ...payload };
  const sendEmail = cleanPayload.send_email;
  const emailTo = cleanPayload.email_to;
  const emailCc = cleanPayload.email_cc;
  const emailBcc = cleanPayload.email_bcc;
  const emailBody = cleanPayload.email_body;

  // Remoção de chaves temporárias do objeto final a ser inserido na tabela da planilha
  delete cleanPayload.send_email;
  delete cleanPayload.email_to;
  delete cleanPayload.email_cc;
  delete cleanPayload.email_bcc;
  delete cleanPayload.email_body;

  const rowData = headers.map(h => cleanPayload[h] !== undefined ? cleanPayload[h] : "");
  if (rowIndex > 0) {
    sh.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    sh.appendRow(rowData);
  }

  if (sheetName === SHEETS.AWB) {
    buscarDocumentosPorNotaFiscal();
    if (sendEmail && emailTo) {
      enviarEmailPersonalizado(payload, emailTo, emailCc, emailBcc, emailBody);
    }
  }

  return json({ success: true, id: id, autoScan: (sheetName === SHEETS.AWB) });
}

function deleteRow(sheetName, id) {
  const sh = getSheet(sheetName);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sh.deleteRow(i + 1);
      return json({ success: true });
    }
  }
  return json({ success: false, error: "Registro de ID " + id + " não encontrado." });
}

/* ======================= GMAIL DESPACHADOR HTML ======================= */

function enviarEmailPersonalizado(awb, to, cc, bcc, customBody) {
  const subject = `Follow-Up de Embarque Dass • AWB: ${awb.AWB || awb.awbNumber || "N/A"}`;
  const bodyText = customBody || awb.Observação || awb.observacao || "Sem observações adicionais.";

  // Template corporativo Premium estilizado em cores institucionais do Grupo Dass
  let htmlBody = `
    <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="background-color: #e21b22; padding: 32px; color: white;">
        <h2 style="margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Relatório Dass Follow-Up</h2>
        <p style="margin: 6px 0 0 0; font-size: 11px; opacity: 0.8; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">PCP Cloud Synchronization - Logística & Tracking 4.0</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Código AWB</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 800; color: #e21b22; font-family: monospace; font-size: 16px;">${awb.AWB || awb.awbNumber || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Fornecedor</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${awb.Fornecedor || awb.fornecedor || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Marca</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; text-transform: uppercase; font-weight: 600;">${awb.Marca || awb.marca || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Status do Embarque</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 800; color: #10b981;">${awb.Status || awb.status || "Pendente"}</td>
          </tr>
        </table>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 12px 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Histórico e Notas Operacionais</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${bodyText}</p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="https://ais-pre-eyu3b7lg6skb5sz2snnqns-15771800691.us-east1.run.app" style="display: inline-block; background-color: #e21b22; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Acompanhar Carga em Tempo Real</a>
        </div>
      </div>
      <div style="padding: 20px 32px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Notificação Corporativa Logística Integrada • Grupo Dass</p>
      </div>
    </div>
  `;

  const attachments = [];
  const docLinks = [];
  
  // Coleta de links
  const rawDocs = awb.Documentos || awb.documentos;
  if (rawDocs) {
    String(rawDocs).split('|').forEach(l => {
      const trimmed = l.trim();
      if (trimmed.startsWith("http")) docLinks.push(trimmed);
    });
  }
  
  for (let i = 1; i <= 11; i++) {
    const pdfKey = "PDF_" + i;
    if (awb[pdfKey]) {
      const trimmed = String(awb[pdfKey]).trim();
      if (trimmed.startsWith("http")) docLinks.push(trimmed);
    }
  }

  const uniqueDocLinks = Array.from(new Set(docLinks));

  uniqueDocLinks.forEach(link => {
    try {
      let fileId = "";
      if (link.includes("/d/")) fileId = link.split("/d/")[1].split("/")[0];
      else if (link.includes("id=")) fileId = link.split("id=")[1].split("&")[0];
      
      if (fileId) {
        const file = DriveApp.getFileById(fileId);
        attachments.push(file.getBlob());
      }
    } catch (e) {
      console.error("Erro ao anexar arquivo de link (" + link + ") ao e-mail:", e);
    }
  });

  MailApp.sendEmail({
    to: to,
    cc: cc || "",
    bcc: bcc || "",
    subject: subject,
    htmlBody: htmlBody,
    attachments: attachments
  });
}

/* ======================= CHAT SYSTEM & CHANNELS ======================= */

function ensureChatSheet(name) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(CHAT_HEADERS);
    sh.getRange("A1:F1").setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sh.setFrozenRows(1);
  }
  return sh;
}

function getChatMessages(name) {
  const sh = ensureChatSheet(name);
  const data = sh.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ 
    id: r[0], 
    user: r[1], 
    text: r[2], 
    img: r[3], 
    timestamp: r[4], 
    type: r[5] 
  }));
}

function saveChatMessage(name, p) {
  ensureChatSheet(name).appendRow([
    Utilities.getUuid(), 
    p.user, 
    p.text || "", 
    p.img || "", 
    p.timestamp || new Date().toISOString(), 
    p.type || "text"
  ]);
  return json({ success: true });
}

function createGroup(data) {
  const sh = getSheet(SHEETS.GROUPS);
  const id = Utilities.getUuid();
  sh.appendRow([id, data.name, JSON.stringify(data.members || []), new Date().toISOString()]);
  ensureChatSheet(data.name);
  return json({ success: true, id });
}

function getGroups() {
  const data = getSheet(SHEETS.GROUPS).getDataRange().getValues();
  data.shift();
  return data.map(r => ({ id: r[0], name: r[1], members: JSON.parse(r[2] || "[]"), createdAt: r[3] }));
}

/**
 * Normaliza os nomes de canais de chat privado (DMs) de modo idêntico ao React Client,
 * evitando discrepâncias de maiúsculas/minúsculas ou espaços em abas da planilha.
 */
function buildDM(uA, uB) {
  const sorted = [uA, uB].sort();
  return "DM_" + sorted.join("_").replace(/\s+/g, '_').toLowerCase();
}

/* ======================= CONTROLE / ANALÍTICAS ======================= */

function obterStatusBusca() {
  try { return getSheet(SHEETS.AWB).getRange(1, DRIVE_CONFIG.COLUNA_INICIO_PDFS).getValue(); } 
  catch (e) { return "Sem status"; }
}

function testarFuncaoExtracao() {
  return json({ success: true, message: "A API Unificada de Back-end do Portal de Logística está ativa e operacional." });
}
