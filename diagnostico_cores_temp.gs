/**
 * 📂 ARQUIVO: diagnostico_cores_temp.gs (TEMPORÁRIO — só para diagnóstico)
 * 🔢 VERSÃO: 1.0
 * 📅 DATA: 2026-06-18
 * 📝 OBJETIVO:
 * Função 100% somente-leitura (não grava nada na planilha). Serve só para
 * descobrir por que as cores de confiança não estão aparecendo mesmo depois
 * de reaplicar a função de regras. Mostra:
 * 1. O valor REAL da célula STATUS (coluna I) de algumas linhas suspeitas.
 * 2. Todas as regras de formatação condicional atualmente instaladas na
 *    DB_TRANSACOES, na ORDEM em que estão (a primeira que bater "ganha").
 *
 * COMO USAR: cole este arquivo no projeto (pode ser temporário), selecione
 * GFP_DIAGNOSTICO_CORES_TEMP no seletor de função, execute, e copie o
 * resultado do Logger (Ver → Registros de execução) ou do alerta que aparece.
 */
function GFP_DIAGNOSTICO_CORES_TEMP() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("DB_TRANSACOES");
  if (!sh) throw new Error("Aba DB_TRANSACOES não encontrada.");

  const linhas = "1. STATUS REAL POR LINHA (colunas I e J, linhas 2 a 11):\n";
  const valores = sh.getRange(2, 9, 10, 2).getValues(); // I:J, linhas 2-11

  let saida = linhas;
  valores.forEach(function(row, idx) {
    const linha = idx + 2;
    const statusReal = row[0];
    const nota = row[1];
    saida += `Linha ${linha}: STATUS=[${JSON.stringify(statusReal)}] (tipo: ${typeof statusReal}) | NOTA="${nota}"\n`;
  });

  saida += "\n2. REGRAS DE FORMATAÇÃO CONDICIONAL NA DB_TRANSACOES (ordem = prioridade, primeira que bater ganha):\n";

  const rules = sh.getConditionalFormatRules();
  saida += `Total de regras instaladas: ${rules.length}\n\n`;

  rules.forEach(function(rule, idx) {
    const ranges = rule.getRanges().map(function(r) { return r.getA1Notation(); }).join(", ");
    let formula = "(não é regra de fórmula)";
    let bg = "(sem cor de fundo definida na regra)";

    try {
      const bc = rule.getBooleanCondition();
      if (bc) {
        const vals = bc.getCriteriaValues();
        formula = vals && vals[0] ? String(vals[0]) : "(vazio)";
        const effect = bc.getBackground ? bc.getBackground() : null;
      }
    } catch (e) {
      formula = "(erro ao ler: " + e.message + ")";
    }

    saida += `Regra #${idx + 1} | Ranges: ${ranges} | Fórmula: ${formula}\n`;
  });

  Logger.log(saida);
  SpreadsheetApp.getUi().alert("Diagnóstico de Cores", saida, SpreadsheetApp.getUi().ButtonSet.OK);

  return saida;
}