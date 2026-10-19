const $ = id => document.getElementById(id);
const fragment = new URLSearchParams(location.hash.slice(1));
let token = fragment.get('token') || '';
// Never leave the bearer in the address bar, referrers or browser history.
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
try {
  if (token) sessionStorage.setItem('effortshift-token', token);
  else token = sessionStorage.getItem('effortshift-token') || '';
} catch { /* Memory-only authentication still works with storage disabled. */ }
let state = null;
let pending = false;
let online = false;
let sequence = 0;
let applied = 0;
let lastMessageSignature = '';
const levels = ['low', 'medium', 'high', 'xhigh', 'max'];
const states = { idle: 'Desconectado', connecting: 'Conectando…', ready: 'Codex conectado', running: 'Codex em execução', error: 'Erro de conexão' };
const number = value => value == null ? 'Indisponível' : new Intl.NumberFormat('pt-BR').format(value);
const percent = value => value == null ? 'Indisponível' : `${number(value)}%`;
function text(id, value) { $(id).textContent = value; }
function showError(message) { text('error', message || ''); $('error').hidden = !message; }
function option(value, label) { const el = document.createElement('option'); el.value = value; el.textContent = label; return el; }
function options(select, values, selected) {
  const signature = JSON.stringify(values);
  if (select.dataset.options !== signature) {
    select.replaceChildren(...values.map(([value, label]) => option(value, label)));
    select.dataset.options = signature;
  }
  if (document.activeElement !== select) select.value = selected ?? '';
}
function updateActions() {
  const connected = online && state?.connected;
  const running = state?.status === 'running';
  $('connect').disabled = pending || state?.status === 'connecting' || (connected && running) || !token;
  $('connect').textContent = state?.status === 'connecting' ? 'Conectando…' : connected ? 'Reconectar Codex ↗' : 'Conectar Codex ↗';
  $('send').disabled = pending || !connected || state?.status !== 'ready' || !$('prompt').value.trim();
  $('send').textContent = pending ? 'Aguarde…' : 'Enviar tarefa ↑';
  $('interrupt').hidden = !running;
  $('interrupt').disabled = pending || !online;
  for (const id of ['model', 'profile', 'mode', 'manualEffort']) $(id).disabled = pending || !connected || (id === 'manualEffort' && !supported().length) || (id === 'model' && !state?.models.length);
}
function supported() { return state?.models.find(model => model.id === state.settings.model)?.supportedEfforts || []; }
function render(next) {
  state = next;
  text('connection', states[state.status] || state.status);
  text('activity', state.status === 'running' ? 'RESPONDENDO…' : state.connected ? 'SESSÃO ATIVA' : 'SEM SESSÃO');
  const decision = state.decision;
  text('decision-status', { recommended: 'RECOMENDADO', submitted: 'ENVIADO', confirmed: 'ACEITO PELO SERVIDOR' }[decision?.status] || 'AGUARDANDO');
  $('efforts').replaceChildren(...levels.map(level => {
    const el = document.createElement('span');
    el.className = `gear${decision?.effort === level ? ' selected' : ''}${state.connected && !supported().includes(level) ? ' unsupported' : ''}`;
    el.textContent = level;
    if (decision?.effort === level) el.setAttribute('aria-current', 'true');
    return el;
  }));
  text('reason', decision ? `${decision.effort ? `Esforço ${decision.effort}` : 'Esforço indisponível'} · ${decision.reason}` : state.connected ? 'Envie uma tarefa para ver a decisão de esforço.' : 'Conecte o Codex e envie uma tarefa para ver a decisão.');
  options($('model'), state.models.length ? state.models.map(model => [model.id, model.label]) : [['', 'Conecte para descobrir']], state.settings.model);
  for (const id of ['profile', 'mode']) if (document.activeElement !== $(id)) $(id).value = state.settings[id];
  options($('manualEffort'), supported().length ? supported().map(effort => [effort, effort]) : [['', 'Sem esforço suportado']], state.settings.manualEffort);
  $('manualEffort').hidden = $('manual-label').hidden = state.settings.mode !== 'manual';
  const usage = state.connected ? state.usage : {};
  const limits = state.connected ? state.limits : null;
  text('context', percent(usage.contextPercent));
  for (const [id, key] of [['input','input'], ['cached','cachedInput'], ['output','output']]) text(id, number(usage[key]));
  text('primary', percent(limits?.primary?.usedPercent));
  text('secondary', percent(limits?.secondary?.usedPercent));
  const signature = JSON.stringify(state.messages);
  if (signature !== lastMessageSignature) {
    lastMessageSignature = signature;
    const log = $('messages');
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 64;
    if (state.messages.length) log.replaceChildren(...state.messages.map(message => {
      const article = document.createElement('article'); article.className = `message ${message.role}`;
      const label = document.createElement('div'); label.className = 'message-label'; label.textContent = { user: 'Você', assistant: 'Codex', system: 'Sessão' }[message.role] || 'Sessão';
      const body = document.createElement('p'); body.className = 'message-text'; body.textContent = message.text;
      article.append(label, body); return article;
    }));
    if (atBottom) log.scrollTop = log.scrollHeight;
  }
  renderApprovals();
  $('events').replaceChildren(...(state.events.length ? state.events.slice(-12).reverse().map(event => {
    const li = document.createElement('li'); li.textContent = `${event.type} · ${event.message}`; return li;
  }) : [Object.assign(document.createElement('li'), { textContent: 'Aguardando eventos.' })]));
  // cwd is display text only, never interpreted by a shell here.
  text('claude-command', 'claude --plugin-dir <raiz-do-fork>');
  updateActions();
}
let approvalSignature = '';
function renderApprovals() {
  const signature = JSON.stringify(state.approvals);
  $('approvals').hidden = !state.approvals.length;
  if (signature === approvalSignature) return;
  approvalSignature = signature;
  $('approvals').replaceChildren(...state.approvals.map(approval => {
    const section = document.createElement('div'); section.className = 'approval';
    const title = document.createElement('h3'); title.textContent = `Aprovação necessária · ${approval.kind}`;
    const description = document.createElement('p'); description.textContent = approval.description;
    section.append(title, description);
    for (const [decision, label] of [['decline', 'Recusar'], ['accept', 'Autorizar']]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.addEventListener('click', () => mutate('/api/approval', { id: approval.id, decision }));
      section.append(button);
    }
    return section;
  }));
}
async function request(path, body) {
  const id = ++sequence;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Falha HTTP ${response.status}`);
    if (id >= applied) { applied = id; online = true; render(data); showError(data.error); }
    return data;
  } finally { clearTimeout(timer); }
}
async function mutate(path, body) {
  if (pending) return false;
  pending = true; updateActions();
  try { await request(path, body); return true; }
  catch (error) { showError(error.name === 'AbortError' ? 'O servidor demorou a responder. Confira a sessão e tente novamente.' : error.message); return false; }
  finally { pending = false; updateActions(); }
}
$('connect').addEventListener('click', () => mutate('/api/connect', {}));
for (const id of ['model', 'profile', 'mode', 'manualEffort']) $(id).addEventListener('change', async () => {
  if (!(await mutate('/api/settings', { [id]: $(id).value })) && state) {
    $(id).value = state.settings[id] ?? '';
    render(state);
  }
});
$('interrupt').addEventListener('click', () => mutate('/api/interrupt', {}));
$('prompt').addEventListener('input', updateActions);
$('composer').addEventListener('submit', async event => {
  event.preventDefault(); if ($('send').disabled) return;
  const draft = $('prompt').value;
  if (await mutate('/api/prompt', { prompt: draft })) {
    if ($('prompt').value === draft) $('prompt').value = '';
    updateActions(); $('prompt').focus();
  }
});
$('prompt').addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); $('composer').requestSubmit(); }
});
async function poll() {
  if (!token) { text('connection', 'Autenticação necessária'); showError('Abra o endereço completo com token exibido pelo servidor local.'); return; }
  try { if (!pending) await request('/api/state'); }
  catch (error) {
    online = false; text('connection', 'Servidor indisponível'); text('activity', 'RECONECTANDO…');
    for (const id of ['context', 'input', 'cached', 'output', 'primary', 'secondary']) text(id, 'Indisponível');
    showError(error.name === 'AbortError' ? 'Servidor sem resposta. Tentando reconectar…' : error.message); updateActions();
  }
  setTimeout(poll, 1000);
}
poll();
