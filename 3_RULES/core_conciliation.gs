/**
 * 📂 ARQUIVO: 3_RULES/core_conciliation.gs
 * 🤝 MÓDULO: MOTOR DE CONCILIAÇÃO (AUTO-BAIXA)
 * 🔢 VERSÃO: 7.9.2 (NANO PATCH DB_MEMORIA STRICT MATCH + DATE WINDOW)
 * 📅 DATA: 18/06/2026
 * -----------------------------------------------------------------------------
 * 🔄 HISTÓRICO DE VERSÕES:
 * - V1.1: Introdução do algoritmo de Fuzzy Match.
 * - V1.2: Adicionado Auto-Setup para criar a aba DB_MEMORIA.
 * - V1.3: Ajuste de colunas.
 * - V1.4 (DIAMOND STANDARD):
 * > SINCRONIZAÇÃO DE COLUNAS: Atualizado para garantir que o Auto-Setup crie
 * a aba 'DB_MEMORIA' com as exatas 10 colunas esperadas pelos módulos de entrada.
 * > ESTRUTURA: [ID, DATA, DESCRICAO, VALOR, CONTA, CATEGORIA, NOTA, STATUS, QUEM, METADADOS].
 * > LÓGICA DE MATCH: Refinada para tolerância de 4 dias e 5 centavos.
 * - V7.9: Além de trazer a categoria para a transação oficial, atualiza a linha
 * correspondente na DB_MEMORIA de "PENDENTE" para "CONCILIADO".
 * 🩹 NANO PATCH 7.9.1 / 16.1.18.6:
 * > DB_MEMORIA continua sendo apenas rascunho/memória, nunca origem de transação.
 * > Impede match contra linhas vazias/incompletas da DB_TRANSACOES.
 * > Exige match estrito: mesma conta, mesmo valor em centavos e
 * descrições minimamente parecidas.
 * 🩹 NANO PATCH 7.9.2 / 16.1.18.6B:
 * > Relativiza apenas a data: DB_TRANSACOES pode cair de 0 a 3 dias
 * depois da data lançada na DB_MEMORIA. As demais travas seguem rígidas.
 * -----------------------------------------------------------------------------
 */

const GFP_CONCILIATION_MEMORIA_MAX_DAYS_AFTER_16_1_18_6B_ = 3;

function runConciliationMatch(payload) {
  const functionName = "runConciliationMatch";
  Logger.log(`[${functionName}] 🏁 Iniciando rodada de conciliação...`);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetTransacoes = ss.getSheetByName("DB_TRANSACOES");
  const sheetMemoria = ss.getSheetByName("DB_MEMORIA");

  if (!sheetTransacoes || !sheetMemoria) {
    Logger.warn("Abas de dados não encontradas. Conciliação abortada.");
    return;
  }

  // 1. Carrega Dados da Memória (Só os PENDENTES)
  const lastRowMem = sheetMemoria.getLastRow();
  if (lastRowMem < 2) return;
  const dataMem = sheetMemoria.getRange(2, 1, lastRowMem - 1, 10).getValues();
  
  // Filtra candidatos válidos (Status = PENDENTE)
  const memoryCandidates = [];
  dataMem.forEach((row, index) => {
    if (row[7] === "PENDENTE") { // Coluna H (Index 7)
      const memDateKey = GFP_CONCILIATION_DATE_KEY_16_1_18_6_(row[1]);
      const memAmountCents = GFP_CONCILIATION_AMOUNT_CENTS_16_1_18_6_(row[3]);
      const memAccount = String(row[4] || "").trim();
      const memDesc = String(row[2] || "").trim();

      // DB_MEMORIA é rascunho: só pode participar se estiver completa e segura.
      if (!memDateKey || memAmountCents === null || !memAccount || !memDesc) return;

      memoryCandidates.push({
        rowIndex: index + 2, // Base 1 + Cabeçalho
        date: row[1],
        dateKey: memDateKey,
        dateSerial: GFP_CONCILIATION_DATE_SERIAL_16_1_18_6B_(memDateKey),
        desc: memDesc,
        descKey: GFP_CONCILIATION_TEXT_KEY_16_1_18_6_(memDesc),
        val: row[3],
        amountCents: memAmountCents,
        account: memAccount,
        accountKey: GFP_CONCILIATION_TEXT_KEY_16_1_18_6_(memAccount),
        category: row[5]
      });
    }
  });

  Logger.log(`[${functionName}] 🧠 Candidatos na Memória: ${memoryCandidates.length}`);
  if (memoryCandidates.length === 0) return;

  // 2. Carrega Transações Recentes (Para otimizar, pega as últimas 200)
  const lastRowTrans = sheetTransacoes.getLastRow();
  if (lastRowTrans < 2) return;
  
  // Pega tudo para garantir (ou ajuste range se ficar lento)
  const dataTrans = sheetTransacoes.getDataRange().getValues();
  
  let matchCount = 0;

  // 3. O Loop do Cupido (Match Maker)
  // Varre de baixo para cima (mais recentes)
  for (let i = dataTrans.length - 1; i >= 1; i--) {
    const tRow = dataTrans[i];
    
    // Pula se já estiver categorizado/conciliado
    if (tRow[5] && tRow[5] !== "" && tRow[8] === "OK") continue;

    const tDateKey = GFP_CONCILIATION_DATE_KEY_16_1_18_6_(tRow[0]); // Col A
    const tDesc = String(tRow[1] || "").trim();                    // Col B
    const tAmountCents = GFP_CONCILIATION_AMOUNT_CENTS_16_1_18_6_(tRow[2]); // Col C
    const tAccount = String(tRow[4] || "").trim();                 // Col E

    // Trava central do nano patch:
    // DB_MEMORIA nunca pode "criar" transação preenchendo linha vazia/incompleta.
    if (!tDateKey || !tDesc || tAmountCents === null || !tAccount) continue;

    const tDescKey = GFP_CONCILIATION_TEXT_KEY_16_1_18_6_(tDesc);
    const tAccountKey = GFP_CONCILIATION_TEXT_KEY_16_1_18_6_(tAccount);
    const tDateSerial = GFP_CONCILIATION_DATE_SERIAL_16_1_18_6B_(tDateKey);
    if (tDateSerial === null) continue;

    // Busca par na memória
    for (let m = 0; m < memoryCandidates.length; m++) {
      const mem = memoryCandidates[m];
      
      // CRITÉRIOS DE CONCILIAÇÃO ESTRITA
      
      // A. CONTA
      if (!GFP_CONCILIATION_ACCOUNT_MATCH_16_1_18_6_(tAccountKey, mem.accountKey)) continue;

      // B. VALOR: mesmo valor em centavos, usando absoluto porque despesa vem negativa.
      if (Math.abs(tAmountCents) !== Math.abs(mem.amountCents)) continue;

      // C. DATA: tolerância curta e direcional.
      // A transação oficial pode aparecer no mesmo dia ou até 3 dias depois da memória.
      // Não aceita data anterior à memória para evitar baixar rascunho contra compra antiga.
      const diffDays = tDateSerial - mem.dateSerial;
      if (diffDays < 0 || diffDays > GFP_CONCILIATION_MEMORIA_MAX_DAYS_AFTER_16_1_18_6B_) continue;

      // D. DESCRIÇÃO: deve haver semelhança mínima entre a transação real e o rascunho.
      if (!GFP_CONCILIATION_DESC_MATCH_16_1_18_6_(tDescKey, mem.descKey)) continue;

      // E. MATCH CONFIRMADO: apenas complementa a transação oficial existente.
      sheetTransacoes.getRange(i + 1, 6).setValue(mem.category); // Col F: Categoria
      sheetTransacoes.getRange(i + 1, 9).setValue("OK");         // Col I: Status
      sheetTransacoes.getRange(i + 1, 10).setValue(mem.desc);    // Col J: Notas (Traz a desc original da memória)

      // Ação 2: Baixa na Memória
      sheetMemoria.getRange(mem.rowIndex, 8).setValue("CONCILIADO"); // Col H: Status
      
      Logger.log(`[MATCH] Transação: "${tRow[1]}" conciliada com Memória: "${mem.desc}"`);
      
      // Remove do array de candidatos para não usar 2x
      memoryCandidates.splice(m, 1);
      matchCount++;
      break; 
    }
  }
  
  Logger.log(`[${functionName}] 🎉 Total de Matches: ${matchCount}`);
}

function GFP_CONCILIATION_DATE_KEY_16_1_18_6_(value) {
  if (!value) return "";

  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  const raw = String(value || "").trim();
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(raw);
  if (d instanceof Date && !isNaN(d.getTime())) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return "";
}

function GFP_CONCILIATION_DATE_SERIAL_16_1_18_6B_(dateKey) {
  if (!dateKey) return null;
  const m = String(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  const utc = Date.UTC(yyyy, mm - 1, dd);
  if (!isFinite(utc)) return null;

  return Math.floor(utc / 86400000);
}

function GFP_CONCILIATION_AMOUNT_CENTS_16_1_18_6_(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && isFinite(value)) {
    return Math.round(value * 100);
  }

  let raw = String(value || "").trim();
  if (!raw) return null;

  raw = raw.replace(/R\$/gi, "").replace(/\s/g, "");

  if (raw.indexOf(",") >= 0) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  }

  const n = Number(raw);
  if (!isFinite(n)) return null;

  return Math.round(n * 100);
}

function GFP_CONCILIATION_TEXT_KEY_16_1_18_6_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function GFP_CONCILIATION_ACCOUNT_MATCH_16_1_18_6_(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return (a.length >= 5 && b.indexOf(a) >= 0) || (b.length >= 5 && a.indexOf(b) >= 0);
}

function GFP_CONCILIATION_DESC_MATCH_16_1_18_6_(officialDescKey, memoryDescKey) {
  if (!officialDescKey || !memoryDescKey) return false;

  const officialCompact = officialDescKey.replace(/\s+/g, "");
  const memoryCompact = memoryDescKey.replace(/\s+/g, "");

  if (officialCompact.length >= 6 && memoryCompact.length >= 6) {
    if (officialCompact.indexOf(memoryCompact) >= 0 || memoryCompact.indexOf(officialCompact) >= 0) return true;
  }

  const stop = {
    "PIX": true,
    "PAGAMENTO": true,
    "REALIZADO": true,
    "ENVIADO": true,
    "RECEBIDO": true,
    "COM": true,
    "SALDO": true,
    "CARTAO": true,
    "CARD": true,
    "FATURA": true,
    "REAIS": true,
    "REAL": true,
    "DE": true,
    "DA": true,
    "DO": true,
    "DAS": true,
    "DOS": true,
    "E": true,
    "A": true,
    "O": true
  };

  const officialTokens = officialDescKey.split(/\s+/).filter(t => t.length >= 3 && !stop[t]);
  const memoryTokens = memoryDescKey.split(/\s+/).filter(t => t.length >= 3 && !stop[t]);

  if (officialTokens.length === 0 || memoryTokens.length === 0) return false;

  let hits = 0;
  memoryTokens.forEach(token => {
    if (officialTokens.indexOf(token) >= 0 || officialCompact.indexOf(token) >= 0) hits++;
  });

  return hits >= 1;
}
