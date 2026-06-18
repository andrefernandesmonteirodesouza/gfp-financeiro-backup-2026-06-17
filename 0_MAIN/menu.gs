/**
 * 📂 ARQUIVO: 0_MAIN/menu.gs
 * 🖥️ MÓDULO: MENU SUPERIOR — GFP
 * 🔢 VERSÃO: 16.1.2
 *
 * Menu mínimo para uso pessoal/familiar.
 * Sem auditorias, sem saúde técnica, sem relatórios e sem comandos de manutenção expostos.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🚀 GFP')
    .addItem('📥 Importar Extratos', 'importarExtratosWrapper')
    .addSeparator()
    .addItem('🧠 Painel de Revisão', 'abrirPainelRevisaoV2Wrapper')
    .addItem('📊 Dashboard', 'abrirDashboardV2Wrapper')
    .addSeparator()
    .addItem('✂️ Dividir Lançamento', 'manualSplitWrapper')
    .addItem('📦 Arquivar Linhas OK', 'archiveOkRowsWrapper')
    .addItem('🗃️ Histórico Arquivado / Desarquivar', 'openHistoricoArquivadoWrapper')
    .addItem('↩️ Estornos / Cancelamentos', 'GFP_MENU_ESTORNOS_CANCELAMENTOS_16_1_11')
    .addSeparator()
    .addItem('🧾 Conferir Totais de Fatura', 'conferirTotaisFaturaWrapper')
    .addItem('💾 Fazer backup de segurança', 'fazerBackupSegurancaWrapper')
    .addItem('🧰 Central de Ferramentas', 'GFP_MENU_CENTRAL_FERRAMENTAS_16_1_14')
    .addToUi();
}


// =============================================================================
// HELPERS DO MENU
// =============================================================================

function GFP_MENU_16_1_2_GET_FN_(name) {
  try {
    const root = typeof globalThis !== 'undefined' ? globalThis : this;
    return root && typeof root[name] === 'function' ? root[name] : null;
  } catch (e) {
    return null;
  }
}

function GFP_MENU_16_1_2_CALL_(name, args, label) {
  const fn = GFP_MENU_16_1_2_GET_FN_(name);

  if (fn) {
    return fn.apply(null, args || []);
  }

  SpreadsheetApp.getActive().toast(
    "Função " + name + " não encontrada.",
    label || "GFMB"
  );

  return null;
}

function GFP_MENU_16_1_2_AFTER_ACTION_() {
  const logFn = GFP_MENU_16_1_2_GET_FN_('GFP_SYS_LOGS_RESTAURAR_PADRAO_ANTIGO_16_1_2');
  if (logFn) {
    try { logFn(); } catch (e) {}
  }

  const visoesFn = GFP_MENU_16_1_2_GET_FN_('GFP_DRE_VISAO_RECONSTRUIR_16_1_5');
  if (visoesFn) {
    try { visoesFn(); } catch (e2) {}
  }
}



// =============================================================================
// WRAPPERS — USO DIÁRIO
// =============================================================================

function importarExtratosWrapper() {
  const r = GFP_MENU_16_1_2_CALL_('pipelineExecute', [], 'GFMB');
  GFP_MENU_16_1_2_AFTER_ACTION_();
  return r;
}

function abrirPainelRevisaoV2Wrapper() {
  return GFP_MENU_16_1_2_CALL_('openReviewPanelV2', [], 'GFMB');
}

function abrirDashboardV2Wrapper() {
  const visoesFn = GFP_MENU_16_1_2_GET_FN_('GFP_DRE_VISAO_RECONSTRUIR_16_1_5');
  if (visoesFn) {
    try { visoesFn(); } catch (e) {}
  }

  return GFP_MENU_16_1_2_CALL_('openDashboardV2', [], 'GFMB');
}


function manualSplitWrapper() {
  return GFP_MENU_16_1_2_CALL_('PRO_SPLIT_openModal', [], 'GFMB');
}

function archiveOkRowsWrapper() {
  const r = GFP_MENU_16_1_2_CALL_(
    'GFP_ARQUIVAR_LINHAS_OK_15_2',
    [{ source: "MENU_ARQUIVAR_LINHAS_OK" }],
    'GFMB'
  );

  GFP_MENU_16_1_2_AFTER_ACTION_();
  return r;
}

function openHistoricoArquivadoWrapper() {
  return GFP_MENU_16_1_2_CALL_('GFP_ABRIR_HISTORICO_ARQUIVADO_15_2_4', [], 'GFMB');
}

function conferirTotaisFaturaWrapper() {
  return GFP_MENU_16_1_2_CALL_('runInvoiceSummaryCheck', [], 'GFMB');
}

function fazerBackupSegurancaWrapper() {
  return GFP_MENU_16_1_2_CALL_('GFP_BACKUP_SEGURANCA_EXCEL_16_1_2', [], 'GFMB');
}

function GFP_MENU_ESTORNOS_CANCELAMENTOS_16_1_11() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getActiveSheet();

  if (!sh || sh.getName() !== 'DB_TRANSACOES') {
    ss.toast(
      'Abra a aba DB_TRANSACOES e selecione a(s) linha(s) de estorno/cancelamento antes de usar este comando.',
      'GFP — Estornos e Cancelamentos',
      8
    );
    return;
  }

  return GFP_ESTORNOS_MARCAR_SELECIONADOS_16_1_11();
}

function GFP_MENU_CENTRAL_FERRAMENTAS_16_1_14() {
  return GFP_CENTRAL_FERRAMENTAS_OPEN_16_1_14();
}