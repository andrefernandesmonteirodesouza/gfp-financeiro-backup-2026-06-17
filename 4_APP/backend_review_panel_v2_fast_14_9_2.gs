/**
 * 📂 ARQUIVO: 4_APP/backend_review_panel_v2_fast_14_9_2.gs
 * ⚡ MÓDULO: PAINEL DE REVISÃO 2.0 — MODO TURBO
 * 🔢 VERSÃO: 14.9.3
 * 📅 DATA: 10/06/2026
 * 👤 AUTOR OPERACIONAL: André Fernandes
 * -----------------------------------------------------------------------------
 * OBJETIVO:
 * Aprovação rápida sem travar o painel.
 * O pós-processamento pesado é feito no botão "Finalizar revisão".
 * -----------------------------------------------------------------------------
 */

const GFP_PANEL_V2_FAST_PATCH_14_9_2 = "14.9.3";
const GFP_PANEL_V2_FAST_DB_14_9_2 = "DB_TRANSACOES";

/**
 * Aprovação rápida.
 */
function apiReviewPanelV2ApproveFast(payload) {
  return GFP_PANEL_V2_FAST_saveDecision_14_9_2_("APPROVE", payload || {});
}

/**
 * Correção rápida.
 */
function apiReviewPanelV2CorrectFast(payload) {
  return GFP_PANEL_V2_FAST_saveDecision_14_9_2_("CORRECT", payload || {});
}

/**
 * Revisão manual rápida.
 */
function apiReviewPanelV2MarkManualFast(payload) {
  return GFP_PANEL_V2_FAST_saveDecision_14_9_2_("MANUAL", payload || {});
}

/**
 * Aprovação em lote rápida.
 */
function apiReviewPanelV2BatchApproveFast(payload) {
  const p = payload || {};
  const rows = Array.isArray(p.rows) ? p.rows.map(Number).filter(n => n >= 2) : [];

  const out = {
    patch: GFP_PANEL_V2_FAST_PATCH_14_9_2,
    requested: rows.length,
    approved: 0,
    skipped: 0,
    errors: []
  };

  rows.forEach(row => {
    try {
      const r = GFP_PANEL_V2_FAST_saveDecision_14_9_2_("APPROVE", {
        row: row,
        batch: true
      });

      if (r && r.ok) out.approved++;
      else out.skipped++;

    } catch (e) {
      out.errors.push({
        row: row,
        error: e.message
      });
      out.skipped++;
    }
  });

  return out;
}

/**
 * Botão do painel: finaliza a sessão rápida.
 */
function apiReviewPanelV2FinalizeFastSession(payload) {
  const p = payload || {};
  const limit = Number(p.limit || 300);

  return GFP_PANEL_V2_PROCESSAR_PENDENCIAS_FAST_14_9_2(limit);
}

/**
 * Processa pendências do modo turbo:
 * - trainMemory;
 * - feedback 14.2;
 * - recalibrador uma vez;
 * - saneamento visual uma vez.
 */
function GFP_PANEL_V2_PROCESSAR_PENDENCIAS_FAST_14_9_2(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(GFP_PANEL_V2_FAST_DB_14_9_2);

  if (!sh) throw new Error("Aba DB_TRANSACOES não encontrada.");

  const safeLimit = Math.max(1, Math.min(Number(limit || 300), 1000));
  const lastRow = sh.getLastRow();

  if (lastRow < 2) {
    return {
      patch: GFP_PANEL_V2_FAST_PATCH_14_9_2,
      scanned: 0,
      processed: 0
    };
  }

  const values = sh.getRange(2, 1, lastRow - 1, 14).getValues();

  let processed = 0;
  let trained = 0;
  let feedback = 0;
  let errors = [];

  for (let i = 0; i < values.length; i++) {
    if (processed >= safeLimit) break;

    const rowNumber = i + 2;
    const row = values[i];

    const descricao = String(row[1] || "").trim();
    const categoria = String(row[5] || "").trim();
    const status = String(row[8] || "").trim().toUpperCase();
    const meta = GFP_PANEL_V2_FAST_parseJson_14_9_2_(row[13]);

    const pending =
      meta &&
      meta.reviewPanelV2Fast &&
      meta.reviewPanelV2Fast.pendingPostProcess === true;

    if (!pending) continue;

    try {
      if (status === "OK" && categoria && GFP_PANEL_V2_FAST_isCategory_14_9_2_(categoria)) {
        try {
          if (typeof trainMemory === "function") {
            trainMemory(descricao, categoria, "PAINEL_REVISAO_V2_FAST");
            trained++;
          }
        } catch (eTrain) {
          errors.push({
            row: rowNumber,
            stage: "trainMemory",
            error: eTrain.message
          });
        }

        try {
          if (typeof GFP_MODELO_FEEDBACK_PROCESSAR_LINHA_APPLY_14_2 === "function") {
            GFP_MODELO_FEEDBACK_PROCESSAR_LINHA_APPLY_14_2(rowNumber);
            feedback++;
          }
        } catch (eFb) {
          errors.push({
            row: rowNumber,
            stage: "feedback14_2",
            error: eFb.message
          });
        }
      }

      meta.reviewPanelV2Fast.pendingPostProcess = false;
      meta.reviewPanelV2Fast.postProcessedAt = new Date().toISOString();
      meta.reviewPanelV2Fast.postProcessPatch = GFP_PANEL_V2_FAST_PATCH_14_9_2;

      if (!meta.classificationParams) meta.classificationParams = {};
      meta.classificationParams.fastPostProcessPending = false;
      meta.classificationParams.fastPostProcessedAt = new Date().toISOString();

      sh.getRange(rowNumber, 14).setValue(JSON.stringify(meta));

      processed++;

    } catch (e) {
      errors.push({
        row: rowNumber,
        stage: "postProcess",
        error: e.message
      });
    }
  }

  let recalibrator = null;
  let visual = null;

  try {
    if (typeof GFP_RECALIBRAR_MAYBE_AUTO_POS_FEEDBACK_14_4_1 === "function") {
      recalibrator = GFP_RECALIBRAR_MAYBE_AUTO_POS_FEEDBACK_14_4_1(300, "PAINEL_REVISAO_V2_FAST_FINALIZE");
    } else if (typeof GFP_RECALIBRAR_SUGESTOES_PENDENTES_APPLY_14_4 === "function") {
      recalibrator = GFP_RECALIBRAR_SUGESTOES_PENDENTES_APPLY_14_4(300);
    }
  } catch (eRec) {
    errors.push({
      stage: "recalibrator",
      error: eRec.message
    });
  }

  try {
    if (typeof GFP_SANEAR_VISUAL_DB_TRANSACOES_14_5_1 === "function") {
      visual = GFP_SANEAR_VISUAL_DB_TRANSACOES_14_5_1();
    }
  } catch (eVisual) {
    errors.push({
      stage: "visual",
      error: eVisual.message
    });
  }

  const result = {
    patch: GFP_PANEL_V2_FAST_PATCH_14_9_2,
    scanned: values.length,
    processed: processed,
    trained: trained,
    feedback: feedback,
    recalibrator: recalibrator,
    visual: visual,
    errors: errors
  };

  Logger.log("[GFP_PANEL_V2_PROCESSAR_PENDENCIAS_FAST_14_9_2] " + JSON.stringify(result));

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Finalização Painel V2: ${processed} pós-processada(s), ${trained} treino(s), ${feedback} feedback(s).`,
    "GFP 14.9.3"
  );

  return result;
}

/**
 * Grava uma linha rapidamente.
 */
function GFP_PANEL_V2_FAST_saveDecision_14_9_2_(action, payload) {
  const p = payload || {};
  const rowNumber = Number(p.row || 0);

  if (!rowNumber || rowNumber < 2) {
    throw new Error("Linha inválida.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(GFP_PANEL_V2_FAST_DB_14_9_2);

  if (!sh) throw new Error("Aba DB_TRANSACOES não encontrada.");

  const range = sh.getRange(rowNumber, 1, 1, 14);
  const row = range.getValues()[0];

  const oldTipo = String(row[3] || "").trim().toUpperCase();
  const oldCategory = String(row[5] || "").trim();
  const oldStatus = String(row[8] || "").trim();
  const oldStatusUpper = oldStatus.toUpperCase();

  if (GFP_PANEL_V2_FAST_isResolvedStatus_14_9_2_(oldStatusUpper) && action !== "MANUAL") {
    return {
      ok: false,
      skipped: true,
      row: rowNumber,
      reason: "Linha já resolvida."
    };
  }

  const meta = GFP_PANEL_V2_FAST_parseJson_14_9_2_(row[13]);
  if (!meta.reviewPanelV2Fast) meta.reviewPanelV2Fast = {};
  if (!meta.classificationParams) meta.classificationParams = {};

  const cp = meta.classificationParams;
  const currentSuggested = String(cp.suggestedCategory || cp.finalCategory || oldCategory || "").trim();
  const categoryFromPayload = String(p.category || "").trim();

  // Se o usuário limpou o campo sem escolher nova categoria e clicou APROVAR,
  // mantemos a categoria original/sugerida para não punir o clique acidental no campo.
  const finalCategory = categoryFromPayload || oldCategory || currentSuggested;

  let statusToWrite = "OK";
  let categoryToWrite = finalCategory;
  let visibleNote = "";
  let fullNote = "";

  if (action === "MANUAL") {
    statusToWrite = "REVISAR";
    categoryToWrite = oldCategory;
    visibleNote = "Revisão manual — Painel V2";
    fullNote = GFP_PANEL_V2_FAST_buildNote_14_9_2_(action, rowNumber, row, oldStatus, oldCategory, categoryToWrite, p.comment || "");
  } else {
    if (!GFP_PANEL_V2_FAST_isCategory_14_9_2_(categoryToWrite)) {
      throw new Error("Categoria inválida ou vazia. Selecione uma categoria válida.");
    }

    statusToWrite = "OK";
    visibleNote = action === "CORRECT" ? "Corrigido Painel V2 — pós pendente" : "Aprovado Painel V2 — pós pendente";
    fullNote = GFP_PANEL_V2_FAST_buildNote_14_9_2_(action, rowNumber, row, oldStatus, oldCategory, categoryToWrite, p.comment || "");
  }

  const now = new Date();

  meta.reviewPanelV2Fast = {
    pendingPostProcess: action !== "MANUAL",
    action: action,
    row: rowNumber,
    oldStatus: oldStatus,
    oldCategory: oldCategory,
    newStatus: statusToWrite,
    newCategory: categoryToWrite,
    decidedAt: now.toISOString(),
    patch: GFP_PANEL_V2_FAST_PATCH_14_9_2,
    comment: String(p.comment || "")
  };

  cp.reviewedByPanelV2FastAt = now.toISOString();
  cp.reviewedByPanelV2FastAction = action;
  cp.finalCategory = categoryToWrite;
  cp.fastPostProcessPending = action !== "MANUAL";

  // Escreve apenas o necessário.
  if (action !== "MANUAL") {
    sh.getRange(rowNumber, 6).setValue(categoryToWrite);
  }

  const statusCell = sh.getRange(rowNumber, 9);
  statusCell.clearDataValidations();
  statusCell.setValue(statusToWrite);

  sh.getRange(rowNumber, 10)
    .setValue(visibleNote)
    .setNote(fullNote);

  sh.getRange(rowNumber, 14).setValue(JSON.stringify(meta));

  // Normaliza TIPO, pois isso é contábil e precisa ser imediato.
  try {
    if (action !== "MANUAL" && typeof applyTypeLogic_ServerSide === "function") {
      applyTypeLogic_ServerSide(sh, rowNumber, categoryToWrite);
    } else if (action !== "MANUAL" && typeof GFP_NORMALIZAR_TIPO_APROVACAO_14_3_2 === "function") {
      GFP_NORMALIZAR_TIPO_APROVACAO_14_3_2(sh, rowNumber, categoryToWrite);
    }
  } catch (eTipo) {
    Logger.warn("[Painel V2 Fast] Falha ao normalizar TIPO: " + eTipo.message);
  }

  return {
    ok: true,
    patch: GFP_PANEL_V2_FAST_PATCH_14_9_2,
    row: rowNumber,
    action: action,
    oldStatus: oldStatus,
    newStatus: statusToWrite,
    oldCategory: oldCategory,
    newCategory: categoryToWrite,
    pendingPostProcess: action !== "MANUAL",
    oldTipo: oldTipo
  };
}

function GFP_PANEL_V2_FAST_buildNote_14_9_2_(action, rowNumber, row, oldStatus, oldCategory, newCategory, comment) {
  const descricao = String(row[1] || "").trim();
  const valor = Number(row[2] || 0);
  const conta = String(row[4] || "").trim();

  return [
    "GFP — Painel de Revisão 2.0 Turbo",
    "",
    `Ação: ${action}`,
    `Linha: ${rowNumber}`,
    `Data: ${new Date().toISOString()}`,
    "",
    `Descrição: ${descricao}`,
    `Valor: ${valor}`,
    `Conta: ${conta}`,
    "",
    `Status anterior: ${oldStatus || "(vazio)"}`,
    `Categoria anterior: ${oldCategory || "(vazia)"}`,
    `Categoria final: ${newCategory || "(vazia)"}`,
    "",
    "Pós-processamento:",
    action === "MANUAL"
      ? "Não aplicável para revisão manual."
      : "Pendente. Será executado ao clicar em Finalizar revisão.",
    "",
    `Comentário: ${comment || "(sem comentário)"}`
  ].join("\n");
}

function GFP_PANEL_V2_FAST_isResolvedStatus_14_9_2_(status) {
  const s = String(status || "").trim().toUpperCase();
  return s === "OK" || s === "CONCILIADO" || s === "SPLIT" || s === "CONSOLIDADO" || s === "APROVADO";
}

function GFP_PANEL_V2_FAST_isCategory_14_9_2_(value) {
  return /^\d{2}\.\d{2}\s+—\s+/.test(String(value || "").trim());
}

function GFP_PANEL_V2_FAST_parseJson_14_9_2_(value) {
  if (!value) return {};
  if (typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch (e) {
    return {};
  }
}
