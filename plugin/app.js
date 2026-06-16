// ============================================================
// Microsoft Teams Controls Plugin - Main Service (Node.js)
// API: UlanziDeck SDK — usa exec + PowerShell para hotkeys
// ============================================================

import { exec } from 'child_process';
import UlanzideckApi from '../libs/node/ulanzideckApi.js';
import Utils from '../libs/node/utils.js';

const APP_UUID = 'com.ulanzi.ulanzistudio.teams';

// Atalhos padrão em formato WScript.Shell SendKeys
// ^ = Ctrl, + = Shift, % = Alt, {SPACE} = Espaço
const TEAMS_SHORTCUTS = {
  'com.ulanzi.ulanzistudio.teams.mute':       { keys: '^+M',       label: 'Mute/Unmute'       },
  'com.ulanzi.ulanzistudio.teams.camera':     { keys: '^+O',       label: 'Câmera On/Off'     },
  'com.ulanzi.ulanzistudio.teams.share':      { keys: '^+E',       label: 'Compartilhar Tela' },
  'com.ulanzi.ulanzistudio.teams.hand':       { keys: '^+K',       label: 'Levantar Mão'      },
  'com.ulanzi.ulanzistudio.teams.hangup':     { keys: '^+H',       label: 'Encerrar Chamada'  },
  'com.ulanzi.ulanzistudio.teams.pushtotalk': { keys: '^{SPACE}',  label: 'Push-to-Talk'      }
};

// Atalhos customizados por contexto (contexto = uuid___key___actionid)
const customShortcuts = {};

const $UD = new UlanzideckApi();
$UD.connect(APP_UUID);

// ── Conexão estabelecida ─────────────────────────────────────
$UD.onConnected(() => {
  Utils.log('[TeamsPlugin] Conectado ao UlanziDeck:', APP_UUID);
});

// ── Botão adicionado ao deck ──────────────────────────────────
$UD.onAdd((data) => {
  const { context, param } = data;
  if (param && param.customShortcut) {
    customShortcuts[context] = param.customShortcut;
  }
  Utils.log('[TeamsPlugin] Ação adicionada:', context);
});

// ── Configurações enviadas pelo app (refresh) ─────────────────
$UD.onParamFromApp((data) => {
  const { context, param } = data;
  if (param && param.customShortcut !== undefined) {
    customShortcuts[context] = param.customShortcut;
  }
});

// ── Configurações enviadas pelo PropertyInspector ────────────
$UD.onParamFromPlugin((data) => {
  const { context, param } = data;
  if (!param) return;

  // Salvar atalho customizado
  if (param.customShortcut !== undefined) {
    customShortcuts[context] = param.customShortcut;
    Utils.log('[TeamsPlugin] Atalho salvo para', context, ':', param.customShortcut || '(padrão)');
    $UD.toast('Atalho salvo!');
  }

  // Testar atalho (disparado pelo botão "Testar" no PI)
  if (param.action === 'test') {
    const decoded = $UD.decodeContext(context);
    const config = TEAMS_SHORTCUTS[decoded.uuid];
    const keys = customShortcuts[context] || (config && config.keys);
    if (keys) {
      sendHotkey(keys, config ? config.label : 'Teste');
    } else {
      $UD.toast('Nenhum atalho configurado');
    }
  }
});

// ── Botão pressionado ─────────────────────────────────────────
$UD.onRun((data) => {
  const { uuid, context } = data;
  const config = TEAMS_SHORTCUTS[uuid];
  if (!config) {
    Utils.warn('[TeamsPlugin] UUID desconhecido:', uuid);
    return;
  }

  // Atalho customizado tem prioridade; se vazio, usa o padrão
  const customRaw = customShortcuts[context];
  const keys = (customRaw && customRaw.trim()) ? toSendKeys(customRaw) : config.keys;

  sendHotkey(keys, config.label);
});

// ── Ação removida do deck ─────────────────────────────────────
$UD.onClear(({ param = [] }) => {
  for (const { context } of param) {
    delete customShortcuts[context];
  }
});

// ── Erros de socket ───────────────────────────────────────────
$UD.onError((err) => {
  Utils.warn('[TeamsPlugin] Erro de socket:', err);
});

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Converte formato legível "ctrl+shift+m" para WScript.Shell SendKeys.
 * Exemplos:
 *   ctrl+shift+m  →  ^+M
 *   ctrl+space    →  ^{SPACE}
 *   ctrl+alt+del  →  ^%{DELETE}
 */
function toSendKeys(keysStr) {
  const modMap = { ctrl: '^', shift: '+', alt: '%' };
  const specialKeys = {
    space: '{SPACE}', enter: '{ENTER}', tab: '{TAB}',
    esc: '{ESC}', escape: '{ESC}', backspace: '{BS}',
    delete: '{DELETE}', del: '{DELETE}',
    f1: '{F1}', f2: '{F2}', f3: '{F3}', f4: '{F4}',
    f5: '{F5}', f6: '{F6}', f7: '{F7}', f8: '{F8}',
    f9: '{F9}', f10: '{F10}', f11: '{F11}', f12: '{F12}'
  };

  const parts = keysStr.toLowerCase().split('+');
  let mods = '';
  let key = '';

  for (const part of parts) {
    if (modMap[part]) {
      mods += modMap[part];
    } else if (specialKeys[part]) {
      key = specialKeys[part];
    } else {
      key = part.toUpperCase();
    }
  }
  return mods + key;
}

/**
 * Envia um atalho de teclado para o Teams via PowerShell + WScript.Shell.
 * Usa -EncodedCommand para evitar problemas de escape de caracteres.
 *
 * @param {string} sendkeys  Atalho no formato SendKeys (ex: "^+M")
 * @param {string} label     Nome da ação para log
 */
function sendHotkey(sendkeys, label) {
  Utils.log('[TeamsPlugin] Acionando:', label, '→', sendkeys);

  // Script PowerShell:
  // 1. Foca a janela do Microsoft Teams
  // 2. Aguarda 300 ms para o foco ser aplicado
  // 3. Envia o atalho de teclado
  const psScript =
    `$wshell = New-Object -ComObject wscript.shell; ` +
    `$null = $wshell.AppActivate('Microsoft Teams'); ` +
    `Start-Sleep -Milliseconds 300; ` +
    `$wshell.SendKeys('${sendkeys}')`;

  // Codifica em UTF-16LE Base64 para evitar problemas de quoting no cmd.exe
  const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

  exec(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, (err) => {
    if (err) {
      Utils.warn('[TeamsPlugin] Erro ao enviar atalho:', err.message);
      $UD.toast('Erro: Teams não encontrado ou atalho inválido');
    } else {
      Utils.log('[TeamsPlugin] Atalho enviado com sucesso:', label);
    }
  });
}
