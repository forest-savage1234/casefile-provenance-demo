import { stages } from './scenario.js';
import { getSnapshot, exportSnapshot } from './model.js';
import { initializeActualTool, updateEngineStep } from './engine-view.js';

const $ = (id) => document.getElementById(id);
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const statusLabels = { active: 'Open', unverified: 'Origin unestablished', repeated: 'Repeated account', refuted: 'Identification refuted', resolved: 'Resolved', 'review-required': 'Review required', superseded: 'Superseded', completed: 'Completed' };
const shortStages = ['Intake', 'Sighting', 'More tips', 'Shared source', 'Reassessment', 'New direction', 'Found safe'];
const preferredFocus = ['lead-intake', 'lead-red-van', 'lead-north-tip', 'lead-north-tip', 'decision-van-search', 'decision-footbridge-search', 'lead-found-safe'];
const initialParams = new URLSearchParams(location.search);
const initialIndex = Number(initialParams.get('step') || 0);
let index = Number.isInteger(initialIndex) && initialIndex >= 0 && initialIndex < stages.length ? initialIndex : 0;
let selectedId = initialParams.get('focus') || preferredFocus[index];
let snapshot;
let timer;

function labelForStatus(status) { return statusLabels[status] || status || 'Recorded'; }
function badge(status) { return `<span class="status ${esc(status || '')}">${esc(labelForStatus(status))}</span>`; }
function getRecord(id) { return [...snapshot.sources, ...snapshot.leads, ...snapshot.decisions].find(item => item.id === id); }
function recordTitle(record) { return record.title || record.label; }
function shortId(record) {
  if (record.id.startsWith('lead-')) return `R${String(snapshot.leads.findIndex(item => item.id === record.id) + 1).padStart(2, '0')}`;
  if (record.id.startsWith('source-')) return `S${String(snapshot.sources.findIndex(item => item.id === record.id) + 1).padStart(2, '0')}`;
  return `D${String(snapshot.decisions.findIndex(item => item.id === record.id) + 1).padStart(2, '0')}`;
}
function recordLink(id) {
  const record = getRecord(id);
  return record ? `<button class="trace-link" data-select="${esc(id)}">${esc(shortId(record))} · ${esc(recordTitle(record))}</button>` : '';
}
function facts(rows) { return `<dl class="facts">${rows.filter(([, value]) => value).map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}</dl>`; }
function historyMarkup(events) {
  return `<ol class="history">${events.map(event => `<li><span class="event-time">${esc(event.time)} · ${esc(event.kind.replaceAll('-', ' '))}</span><p>${esc(event.summary)}</p><span class="actor">${esc(event.actor)}</span>${event.basedOn?.length ? `<div class="event-links">${event.basedOn.map(recordLink).join('')}</div>` : ''}</li>`).join('')}</ol>`;
}

function renderInspector() {
  const record = getRecord(selectedId) || snapshot.leads[0];
  selectedId = record.id;
  const type = record.id.startsWith('source-') ? 'source' : record.id.startsWith('decision-') ? 'decision' : 'lead';
  $('selected-kind').textContent = { source: 'SOURCE', decision: 'DECISION', lead: 'LEAD REPORT' }[type];
  let main = `<span class="record-id">${esc(shortId(record))} / ${esc(record.id)}</span><h2 id="inspector-title" tabindex="-1">${esc(recordTitle(record))}</h2>`;
  let history = [];
  if (type === 'lead') {
    main += `${badge(record.status)}<h3>Original report</h3><p class="description">${esc(record.summary)}</p>${facts([['Recorded by', record.actor], ['Observed at', record.observedAt], ['Received at', record.receivedAt]])}<h3>Source path known at ${esc(snapshot.stage.time)}</h3>`;
    main += record.sourceChain.map(source => recordLink(source.id)).join('');
    if (record.status === 'unverified') main += '<p class="unknown">The underlying origin is unestablished at this step. A separate report does not establish a separate observation.</p>';
    history = record.history;
  } else if (type === 'source') {
    const originLabel = { unresolved: 'Origin unestablished', linked: 'Linked to earlier source', 'recorded-origin': 'Recorded origin' }[record.originStatus] || record.kind;
    main += `<span class="status">${esc(originLabel)}</span><p class="description">${esc(record.description)}</p>${facts([['Attributed to', record.actor], ['Observed at', record.observedAt], ['Received at', record.receivedAt]])}`;
    main += '<h3>Recorded origin</h3>' + (record.derivedFrom.length ? record.derivedFrom.map(recordLink).join('') : `<p class="description">${record.kind.includes('Unestablished') ? 'Underlying origin unestablished at this step.' : 'No earlier source is recorded for this account at this step.'}</p>`);
    const reports = snapshot.leads.filter(lead => lead.sourceId === record.id);
    if (reports.length) main += `<h3>Recorded in</h3>${reports.map(lead => recordLink(lead.id)).join('')}`;
    history = snapshot.events.filter(event => event.sourceId === record.id || event.parentSourceId === record.id);
  } else {
    main += `${badge(record.status)}<h3>Original decision rationale</h3><p class="description">${esc(record.rationale)}</p>${facts([['Recorded by', record.actor], ['Decision time', record.time], ['Original basis', `${record.basedOn.length} report${record.basedOn.length === 1 ? '' : 's'}`]])}<h3>Reports recorded as the basis</h3>${record.basedOn.map(recordLink).join('')}`;
    history = record.history;
  }
  $('inspection-content').innerHTML = `<div class="detail-main">${main}</div><div class="detail-history"><h3>Preserved history</h3>${historyMarkup(history)}<p class="preservation-note">Original reports stay in the record. Later source links and assessments appear as additional dated entries.</p></div>`;
  document.querySelectorAll('[data-select]').forEach(button => { const selected = button.dataset.select === selectedId; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
}

function nodeMarkup(record, type) {
  const title = recordTitle(record);
  const meta = type === 'source' ? record.receivedAt : record.time || record.receivedAt;
  return `<button class="node ${type} ${esc(record.status || '')} ${record.id === selectedId ? 'selected' : ''}" data-select="${esc(record.id)}" data-node="${esc(record.id)}" aria-label="Inspect ${esc(type)}: ${esc(title)}${record.status ? ', ' + esc(labelForStatus(record.status)) : ''}"><span class="node-id">${esc(shortId(record))}<span>${esc(meta)}</span></span><span class="node-label">${esc(title)}</span>${record.status ? `<span class="node-status">${esc(labelForStatus(record.status))}</span>` : ''}</button>`;
}

function drawConnections() {
  const network = $('network');
  const rect = network.getBoundingClientRect();
  const selected = getRecord(selectedId);
  const relevantIds = new Set([selectedId]);
  if (selected?.sourceChain) selected.sourceChain.forEach(source => relevantIds.add(source.id));
  if (selected?.basedOn) selected.basedOn.forEach(id => relevantIds.add(id));
  const allNodes = new Map([...network.querySelectorAll('[data-node]')].map(el => [el.dataset.node, el]));
  const edges = snapshot.edges.filter(edge => allNodes.has(edge.from) && allNodes.has(edge.to));
  $('connections').setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  $('connections').innerHTML = edges.map(edge => {
    const a = allNodes.get(edge.from).getBoundingClientRect();
    const b = allNodes.get(edge.to).getBoundingClientRect();
    const sameColumn = Math.abs(a.left - b.left) < 5;
    const forward = b.left > a.left;
    const x1 = (sameColumn || forward ? a.right : a.left) - rect.left;
    const x2 = (sameColumn || !forward ? b.right : b.left) - rect.left;
    const y1 = a.top + a.height / 2 - rect.top;
    const y2 = b.top + b.height / 2 - rect.top;
    const bend = sameColumn ? 16 : Math.max(12, Math.abs(x2 - x1) / 2);
    const d = sameColumn ? `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 + bend} ${y2}, ${x2} ${y2}` : `M ${x1} ${y1} C ${x1 + (forward ? bend : -bend)} ${y1}, ${x2 + (forward ? -bend : bend)} ${y2}, ${x2} ${y2}`;
    const target = getRecord(edge.to);
    const review = edge.kind === 'assessment' || (edge.kind === 'decision' && ['review-required', 'superseded'].includes(target?.status));
    const highlight = relevantIds.has(edge.from) && relevantIds.has(edge.to) || edge.from === selectedId || edge.to === selectedId;
    return `<path class="edge ${highlight ? 'highlight' : ''} ${review ? 'needs-review' : ''}" d="${d}"><title>${esc(edge.label)}</title></path>`;
  }).join('');
}

function render() {
  snapshot = getSnapshot(index);
  if (!getRecord(selectedId)) selectedId = preferredFocus[index];
  $('timeline').value = index;
  $('timeline').setAttribute('aria-valuetext', `Step ${index + 1} of ${stages.length}, ${snapshot.stage.time}, ${snapshot.stage.title}`);
  $('step-label').textContent = `${String(index + 1).padStart(2, '0')} / ${String(stages.length).padStart(2, '0')}`;
  $('stage-markers').innerHTML = stages.map((stage, i) => `<button class="${i === index ? 'current' : ''}" data-step="${i}" ${i === index ? 'aria-current="step"' : ''} aria-label="Step ${i + 1}: ${esc(stage.title)}">${esc(shortStages[i])}</button>`).join('');
  $('case-time').textContent = snapshot.stage.time;
  $('chapter-count').textContent = `STEP ${String(index + 1).padStart(2, '0')} / FICTIONAL CASE CLOCK`;
  $('chapter-title').textContent = snapshot.stage.title;
  $('chapter-summary').textContent = snapshot.stage.summary;
  $('lesson-text').textContent = snapshot.stage.lesson;
  $('report-count').textContent = snapshot.stats.preservedReports;
  $('open-count').textContent = snapshot.stats.activeLeads;
  const unresolved = snapshot.stats.unresolvedOrigins || 0;
  const established = snapshot.stats.independentOrigins - unresolved;
  $('origin-count').textContent = unresolved ? `${established} + ?` : snapshot.stats.independentOrigins;
  $('origin-count').setAttribute('aria-label', unresolved ? `${established} recorded origin, ${unresolved} unresolved underlying origins` : `${snapshot.stats.independentOrigins} known origins for open search leads`);
  $('origin-count').title = unresolved ? `${established} recorded origin(s) plus ${unresolved} tips with unestablished underlying origins.` : 'Distinct recorded source roots for open search leads. This is not proof of independence.';
  $('source-nodes').innerHTML = snapshot.sources.map(record => nodeMarkup(record, 'source')).join('');
  $('lead-nodes').innerHTML = snapshot.leads.map(record => nodeMarkup(record, 'lead')).join('');
  $('decision-nodes').innerHTML = snapshot.decisions.length ? snapshot.decisions.map(record => nodeMarkup(record, 'decision')).join('') : '<p class="empty-column">No search decision has been recorded yet.</p>';
  $('lead-register').innerHTML = snapshot.leads.map(record => `<button class="register-row" data-select="${esc(record.id)}" data-register="true" aria-label="Inspect report ${esc(shortId(record))}: ${esc(record.title)}"><span class="register-id">${esc(shortId(record))}</span><span class="register-title">${esc(record.title)}</span><span class="register-time">Received ${esc(record.receivedAt)}</span>${badge(record.status)}<span class="arrow" aria-hidden="true">↗</span></button>`).join('');
  $('back').disabled = index === 0;
  $('next').disabled = index === stages.length - 1;
  renderInspector();
  updateEngineStep(index);
  updateUrl();
  requestAnimationFrame(drawConnections);
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set('step', index);
  url.searchParams.set('focus', selectedId);
  history.replaceState(null, '', url);
}
function pause() {
  clearInterval(timer);
  timer = undefined;
  $('play').innerHTML = '<span aria-hidden="true">▶</span> Play';
  $('play').setAttribute('aria-label', 'Play case replay');
}
function changeStage(value, manual = true) {
  if (manual) pause();
  index = Math.max(0, Math.min(stages.length - 1, value));
  selectedId = preferredFocus[index];
  render();
  if (index === stages.length - 1) pause();
}

$('timeline').addEventListener('input', event => changeStage(Number(event.target.value)));
$('back').addEventListener('click', () => changeStage(index - 1));
$('next').addEventListener('click', () => changeStage(index + 1));
$('reset').addEventListener('click', () => changeStage(0));
$('play').addEventListener('click', () => {
  if (timer) { pause(); return; }
  if (index === stages.length - 1) changeStage(0);
  $('play').innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
  $('play').setAttribute('aria-label', 'Pause case replay');
  timer = setInterval(() => changeStage(index + 1, false), 5500);
});
document.addEventListener('click', event => {
  const step = event.target.closest('[data-step]');
  if (step) { changeStage(Number(step.dataset.step)); document.querySelector(`[data-step="${index}"]`).focus({ preventScroll: true }); return; }
  const selection = event.target.closest('[data-select]');
  if (!selection) return;
  const fromInspector = Boolean(selection.closest('.inspector'));
  pause();
  selectedId = selection.dataset.select;
  renderInspector();
  updateUrl();
  drawConnections();
  if (fromInspector || selection.dataset.register || matchMedia('(max-width: 880px)').matches) $('inspector-title').focus({ preventScroll: true });
  if (selection.dataset.register || matchMedia('(max-width: 880px)').matches) document.querySelector('.inspector').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
});
$('export').addEventListener('click', () => {
  pause();
  const data = JSON.stringify(exportSnapshot(index), null, 2);
  const blob = new Blob([data], { type: 'application/ld+json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `casefile-fictional-step-${index + 1}.jsonld`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('action-status').textContent = `Exported the fictional record through step ${index + 1}, ${snapshot.stage.time}. Later steps are excluded.`;
});
$('about-button').addEventListener('click', () => { pause(); $('about-dialog').showModal(); });
$('close-about').addEventListener('click', () => $('about-dialog').close());
$('about-dialog').addEventListener('click', event => { if (event.target === $('about-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
new ResizeObserver(() => requestAnimationFrame(drawConnections)).observe($('network'));
['engine-run', 'engine-export'].forEach(id => $(id).addEventListener('click', pause));
document.querySelectorAll('input[name="engine-mode"]').forEach(radio => radio.addEventListener('change', pause));
initializeActualTool();
render();
