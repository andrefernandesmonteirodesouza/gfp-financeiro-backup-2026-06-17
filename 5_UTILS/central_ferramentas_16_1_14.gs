/**
 * 📂 ARQUIVO: 5_UTILS/central_ferramentas_16_1_14.gs
 * 🧰 MÓDULO: CENTRAL DE FERRAMENTAS SEGURA — CANIVETE SUÍÇO
 * 🔢 VERSÃO: 16.1.14
 *
 * Lista controlada de funções acessórias.
 * Não executa funções arbitrárias.
 * Não lista funções internas perigosas.
 */


const GFP_CENTRAL_FERRAMENTAS_PATCH_16_1_14 = "16.1.14";


/**
 * Abre a central visual.
 */
function GFP_CENTRAL_FERRAMENTAS_OPEN_16_1_14() {
  const tools = GFP_CENTRAL_FERRAMENTAS_REGISTRY_16_1_14_()
    .sort(function(a, b) {
      return String(a.title || "").localeCompare(String(b.title || ""), "pt-BR");
    });

  const toolsJson = JSON.stringify(tools)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          :root {
            --navy: #0b2d4d;
            --navy2: #123d63;
            --bg: #f8fafc;
            --line: #e2e8f0;
            --text: #0f172a;
            --muted: #64748b;
            --green-bg: #dcfce7;
            --green: #166534;
            --yellow-bg: #fef9c3;
            --yellow: #92400e;
            --red-bg: #fee2e2;
            --red: #991b1b;
            --blue-bg: #e0f2fe;
            --blue: #075985;
          }

          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
          }

          .top {
            background: var(--navy);
            color: #fff;
            padding: 18px 22px;
          }

          .top h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
          }

          .top p {
            margin: 6px 0 0;
            font-size: 12px;
            opacity: .9;
          }

          .wrap {
            padding: 18px 22px 22px;
          }

          .bar {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 10px;
            align-items: center;
            margin-bottom: 14px;
          }

          input[type="text"] {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 11px 12px;
            font-size: 13px;
            outline: none;
            background: #fff;
          }

          select {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 13px;
            background: #fff;
          }

          .backupOpt {
            display: flex;
            gap: 7px;
            align-items: center;
            background: #fff;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 9px 11px;
            font-size: 12px;
            color: #334155;
            white-space: nowrap;
          }

          .legend {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 14px;
          }

          .pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
          }

          .pill.green { background: var(--green-bg); color: var(--green); }
          .pill.yellow { background: var(--yellow-bg); color: var(--yellow); }
          .pill.red { background: var(--red-bg); color: var(--red); }
          .pill.blue { background: var(--blue-bg); color: var(--blue); }

          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .card {
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(15, 23, 42, .04);
          }

          .cardHead {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            padding: 13px 14px 9px;
            border-bottom: 1px solid #eef2f7;
          }

          .title {
            font-weight: 800;
            font-size: 14px;
            color: #0f172a;
            margin-bottom: 4px;
          }

          .fn {
            font-family: Consolas, monospace;
            font-size: 10px;
            color: #64748b;
            word-break: break-all;
          }

          .risk {
            white-space: nowrap;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 999px;
          }

          .risk.GREEN { background: var(--green-bg); color: var(--green); }
          .risk.YELLOW { background: var(--yellow-bg); color: var(--yellow); }
          .risk.RED { background: var(--red-bg); color: var(--red); }

          .cardBody {
            padding: 10px 14px 13px;
          }

          .desc {
            font-size: 12px;
            color: #334155;
            line-height: 1.45;
            min-height: 38px;
          }

          .meta {
            margin-top: 10px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .tag {
            font-size: 10px;
            font-weight: 700;
            color: #475569;
            background: #f1f5f9;
            padding: 4px 7px;
            border-radius: 999px;
          }

          .actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 12px;
          }

          button {
            border: 0;
            border-radius: 9px;
            padding: 9px 13px;
            font-weight: 800;
            cursor: pointer;
            font-size: 12px;
          }

          .btnRun {
            background: var(--navy);
            color: #fff;
          }

          .btnRun:hover {
            background: var(--navy2);
          }

          .btnDisabled {
            background: #f1f5f9;
            color: #94a3b8;
            cursor: not-allowed;
          }

          .footer {
            margin-top: 14px;
            padding: 12px 14px;
            border-radius: 12px;
            background: #fff;
            border: 1px solid #e2e8f0;
            font-size: 12px;
            color: #475569;
            line-height: 1.45;
          }

          #result {
            display: none;
            margin-bottom: 14px;
            padding: 12px 14px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.4;
          }

          #result.ok {
            display: block;
            background: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
          }

          #result.warn {
            display: block;
            background: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
          }

          @media (max-width: 900px) {
            .grid { grid-template-columns: 1fr; }
            .bar { grid-template-columns: 1fr; }
          }
        </style>
      </head>

      <body>
        <div class="top">
          <h1>🧰 GFP — Central de Ferramentas</h1>
          <p>Canivete suíço seguro: auditorias, reparos leves e comandos acessórios aprovados.</p>
        </div>

        <div class="wrap">
          <div class="bar">
            <input id="search" type="text" placeholder="Buscar por nome, função, área ou descrição..." oninput="renderTools()">

            <select id="riskFilter" onchange="renderTools()">
              <option value="">Todos os níveis</option>
              <option value="GREEN">Verde — diagnóstico</option>
              <option value="YELLOW">Amarelo — altera algo</option>
              <option value="RED">Vermelho — bloqueado</option>
            </select>

            <label class="backupOpt">
              <input id="backupBefore" type="checkbox" checked>
              Backup antes de ações amarelas
            </label>
          </div>

          <div class="legend">
            <span class="pill green">Verde: diagnóstico / seguro</span>
            <span class="pill yellow">Amarelo: altera algo / revisar antes</span>
            <span class="pill red">Vermelho: bloqueado na Central</span>
            <span class="pill blue">Lista controlada, não automática</span>
          </div>

          <div id="result"></div>
          <div id="tools" class="grid"></div>

          <div class="footer">
            Esta Central não lista todas as funções do Apps Script. Ela mostra apenas funções aprovadas.
            Funções sensíveis como reset, importação, Gemini/recalibração pesada e arquivamento global não são executáveis aqui.
          </div>
        </div>

        <script>
          const TOOLS = ${toolsJson};

          function riskLabel(risk) {
            if (risk === 'GREEN') return 'VERDE';
            if (risk === 'YELLOW') return 'AMARELO';
            if (risk === 'RED') return 'BLOQUEADO';
            return risk || '';
          }

          function escapeHtml(v) {
            return String(v == null ? '' : v)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          }

          function normalize(v) {
            return String(v || '').toLowerCase()
              .normalize('NFD')
              .replace(/[\\u0300-\\u036f]/g, '');
          }

          function renderTools() {
            const box = document.getElementById('tools');
            const q = normalize(document.getElementById('search').value);
            const risk = document.getElementById('riskFilter').value;

            const filtered = TOOLS.filter(t => {
              if (risk && t.risk !== risk) return false;

              const hay = normalize([
                t.title,
                t.fn,
                t.group,
                t.description,
                (t.tags || []).join(' ')
              ].join(' '));

              return !q || hay.includes(q);
            });

            box.innerHTML = filtered.map(t => {
              const tags = (t.tags || []).map(x => '<span class="tag">' + escapeHtml(x) + '</span>').join('');

              const action = t.blocked
                ? '<button class="btnDisabled" disabled>Bloqueado</button>'
                : '<button class="btnRun" onclick="runTool(\\'' + escapeHtml(t.id) + '\\')">Executar</button>';

              return ''
                + '<div class="card">'
                +   '<div class="cardHead">'
                +     '<div>'
                +       '<div class="title">' + escapeHtml(t.title) + '</div>'
                +       '<div class="fn">' + escapeHtml(t.fn || 'sem função executável') + '</div>'
                +     '</div>'
                +     '<span class="risk ' + escapeHtml(t.risk) + '">' + escapeHtml(riskLabel(t.risk)) + '</span>'
                +   '</div>'
                +   '<div class="cardBody">'
                +     '<div class="desc">' + escapeHtml(t.description) + '</div>'
                +     '<div class="meta">'
                +       '<span class="tag">' + escapeHtml(t.group || 'Geral') + '</span>'
                +       tags
                +     '</div>'
                +     '<div class="actions">'
                +       action
                +     '</div>'
                +   '</div>'
                + '</div>';
            }).join('');
          }

          function showResult(ok, msg) {
            const el = document.getElementById('result');
            el.className = ok ? 'ok' : 'warn';
            el.innerHTML = msg;
          }

          function runTool(id) {
            const tool = TOOLS.find(t => t.id === id);
            if (!tool) {
              showResult(false, '<strong>Ferramenta não encontrada.</strong>');
              return;
            }

            if (tool.blocked) {
              showResult(false, '<strong>Bloqueado:</strong> esta função não pode ser executada pela Central.');
              return;
            }

            const backupBefore = document.getElementById('backupBefore').checked;

            showResult(true, '<strong>Executando:</strong> ' + escapeHtml(tool.title) + '...');

            google.script.run
              .withSuccessHandler(function(res) {
                const ok = !res || res.ok !== false;
                const details = res && typeof res === 'object'
                  ? '<pre style="white-space:pre-wrap;font-size:11px;margin:8px 0 0">' + escapeHtml(JSON.stringify(res, null, 2).slice(0, 2400)) + '</pre>'
                  : '';

                showResult(
                  ok,
                  '<strong>' + (ok ? 'Concluído:' : 'Concluído com alerta:') + '</strong> ' +
                  escapeHtml(tool.title) +
                  details
                );
              })
              .withFailureHandler(function(err) {
                showResult(
                  false,
                  '<strong>Erro ao executar:</strong> ' +
                  escapeHtml(tool.title) +
                  '<br>' +
                  escapeHtml(err && err.message ? err.message : err)
                );
              })
              .GFP_CENTRAL_FERRAMENTAS_EXECUTE_16_1_14(id, {
                backupBefore: backupBefore
              });
          }

          renderTools();
        </script>
      </body>
    </html>
  `;

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(1280).setHeight(760),
    "GFP — Central de Ferramentas"
  );
}


/**
 * Registro controlado de ferramentas autorizadas.
 *
 * GREEN  = diagnóstico / geralmente não altera dados.
 * YELLOW = altera algo ou abre rotina de alteração assistida.
 * RED    = bloqueado na Central.
 */
function GFP_CENTRAL_FERRAMENTAS_REGISTRY_16_1_14_() {
  return [
    {
      id: "auditar_as",
      title: "Auditar A:S / Metadados",
      fn: "GFP_AUDITAR_ALINHAMENTO_METADADOS_DB_MODAL_16_1_12_1",
      risk: "GREEN",
      group: "Auditoria",
      description: "Verifica possíveis desalinhamentos entre dados principais e metadados. Não altera dados.",
      tags: ["A:S", "metadados", "diagnóstico"]
    },
    {
      id: "auditar_categorias",
      title: "Auditar categorias inválidas",
      fn: "GFP_AUDITAR_CATEGORIAS_INVALIDAS_16_1_13",
      risk: "GREEN",
      group: "Auditoria",
      description: "Confere se as categorias em DB_TRANSACOES e DB_TRANSACOES_HIST existem na CFG_Categorias.",
      tags: ["categorias", "diagnóstico"]
    },
    {
      id: "backup_excel",
      title: "Fazer backup de segurança",
      fn: "GFP_BACKUP_SEGURANCA_EXCEL_16_1_2",
      risk: "GREEN",
      group: "Backup",
      description: "Cria um backup Excel da planilha. Não altera a base financeira.",
      tags: ["backup", "segurança"]
    },
    {
      id: "conferir_totais_fatura",
      title: "Conferir totais de fatura",
      fn: "runInvoiceSummaryCheck",
      risk: "GREEN",
      group: "Conferência",
      description: "Roda a conferência de totais de fatura já existente no sistema.",
      tags: ["fatura", "conferência"]
    },
    {
      id: "simular_migracao_categorias",
      title: "Simular migração de categorias legadas",
      fn: "GFP_MIGRAR_CATEGORIAS_LEGADAS_16_1_13",
      args: [true],
      risk: "GREEN",
      group: "Categorias",
      description: "Simula a troca de categorias antigas por novas. Não altera dados.",
      tags: ["categorias", "simulação"]
    },

    {
      id: "aplicar_migracao_categorias",
      title: "Aplicar migração de categorias legadas",
      fn: "GFP_APLICAR_MIGRACAO_CATEGORIAS_LEGADAS_16_1_13",
      risk: "YELLOW",
      group: "Categorias",
      backup: true,
      description: "Substitui categorias antigas pelas novas em DB_TRANSACOES e DB_TRANSACOES_HIST. Use apenas quando necessário.",
      tags: ["categorias", "altera dados"]
    },
    {
      id: "estornos_cancelamentos",
      title: "Estornos / Cancelamentos",
      fn: "GFP_ESTORNOS_MARCAR_SELECIONADOS_16_1_11",
      risk: "YELLOW",
      group: "Reparos",
      backup: true,
      description: "Abre a central de estornos/cancelamentos para as linhas selecionadas na DB_TRANSACOES.",
      tags: ["estornos", "cancelamentos", "seleção"]
    },
    {
      id: "ordenar_as_defensivo",
      title: "Ordenar DB_TRANSACOES com blindagem A:S",
      fn: "GFP_SORT_DB_TRANSACOES_DEFENSIVO_16_1_13",
      risk: "YELLOW",
      group: "Organização",
      backup: true,
      description: "Ordena a DB_TRANSACOES tratando A:S como linha indivisível e sem travar por categoria inválida.",
      tags: ["ordenação", "A:S", "altera ordem"]
    },
    {
      id: "reparar_metadados_selecao",
      title: "Reparar metadados das linhas selecionadas",
      fn: "GFP_REPARAR_METADADOS_DESALINHADOS_PREVIEW_16_1_12_2",
      risk: "YELLOW",
      group: "Reparos",
      backup: true,
      description: "Abre reparo assistido para corrigir somente a coluna METADADOS das linhas selecionadas.",
      tags: ["metadados", "reparo", "seleção"]
    },

    {
      id: "bloqueado_importacao",
      title: "Importar Extratos",
      fn: "pipelineExecute",
      risk: "RED",
      group: "Bloqueado",
      blocked: true,
      description: "Função sensível. Deve continuar sendo usada pelo menu principal, não pela Central.",
      tags: ["importação", "bloqueado"]
    },
    {
      id: "bloqueado_arquivar_ok",
      title: "Arquivar Linhas OK",
      fn: "GFP_ARQUIVAR_LINHAS_OK_15_2",
      risk: "RED",
      group: "Bloqueado",
      blocked: true,
      description: "Arquivamento global. Deve continuar no menu principal, com consciência de que move todas as linhas OK.",
      tags: ["arquivamento", "bloqueado"]
    },
    {
      id: "bloqueado_gemini",
      title: "Gemini / Recalibração manual",
      fn: "várias funções",
      risk: "RED",
      group: "Bloqueado",
      blocked: true,
      description: "Não expor por enquanto. Gemini/recalibração pesada ficam fora da Central até decisão específica.",
      tags: ["gemini", "recalibração", "bloqueado"]
    },
    {
      id: "bloqueado_reset",
      title: "Reset / Limpeza de base",
      fn: "funções de reset",
      risk: "RED",
      group: "Bloqueado",
      blocked: true,
      description: "Funções de reset ou limpeza ampla não entram na Central para evitar execução acidental.",
      tags: ["reset", "bloqueado"]
    }
  ];
}


/**
 * Executor seguro: só executa ferramentas registradas.
 */
function GFP_CENTRAL_FERRAMENTAS_EXECUTE_16_1_14(id, options) {
  const opt = options || {};
  const registry = GFP_CENTRAL_FERRAMENTAS_REGISTRY_16_1_14_();
  const tool = registry.find(function(t) { return t.id === id; });

  if (!tool) {
    return {
      ok: false,
      error: "Ferramenta não encontrada na whitelist.",
      id: id
    };
  }

  if (tool.blocked || tool.risk === "RED") {
    return {
      ok: false,
      blocked: true,
      error: "Ferramenta bloqueada na Central.",
      title: tool.title,
      fn: tool.fn
    };
  }

  const fn = GFP_CENTRAL_FERRAMENTAS_GET_FN_16_1_14_(tool.fn);

  if (!fn) {
    return {
      ok: false,
      error: "Função não encontrada no projeto.",
      title: tool.title,
      fn: tool.fn
    };
  }

  const out = {
    ok: true,
    patch: GFP_CENTRAL_FERRAMENTAS_PATCH_16_1_14,
    id: id,
    title: tool.title,
    fn: tool.fn,
    risk: tool.risk,
    backup: null,
    result: null,
    startedAt: new Date().toISOString(),
    finishedAt: null
  };

  try {
    if (tool.risk === "YELLOW" && tool.backup && opt.backupBefore !== false) {
      const backupFn = GFP_CENTRAL_FERRAMENTAS_GET_FN_16_1_14_("GFP_BACKUP_SEGURANCA_EXCEL_16_1_2");

      if (!backupFn) {
        return {
          ok: false,
          error: "Backup obrigatório não disponível. A ação foi bloqueada por segurança.",
          title: tool.title
        };
      }

      out.backup = backupFn();
    }

    out.result = fn.apply(null, Array.isArray(tool.args) ? tool.args : []);

  } catch (e) {
    out.ok = false;
    out.error = e.message;
  }

  out.finishedAt = new Date().toISOString();

  GFP_CENTRAL_FERRAMENTAS_LOG_16_1_14_(out);

  return out;
}


function GFP_CENTRAL_FERRAMENTAS_GET_FN_16_1_14_(name) {
  try {
    const root = typeof globalThis !== "undefined" ? globalThis : this;
    return root && typeof root[name] === "function" ? root[name] : null;
  } catch (e) {
    return null;
  }
}


function GFP_CENTRAL_FERRAMENTAS_LOG_16_1_14_(out) {
  try {
    if (typeof Logger === "function" && Logger.log !== console.log) {
      Logger.log(
        "Central de Ferramentas: " + (out.title || out.id) + " executada.",
        "Central de Ferramentas",
        null,
        out.ok ? "OK" : "WARN"
      );
      return;
    }
  } catch (e) {}

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("SYS_LOGS");

    if (!sh) return;

    sh.insertRowBefore(2);
    sh.getRange(2, 1, 1, 5).setValues([[
      Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss"),
      out.ok ? "OK" : "WARN",
      "Central de Ferramentas",
      "Central de Ferramentas: " + (out.title || out.id),
      out.ok ? "" : (out.error || "")
    ]]);
  } catch (e2) {}
}
