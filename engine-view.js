import { ActualToolClient, canonicalResult } from './engine-client.js';

const $ = (id) => document.getElementById(id);
let stage = 0;
let mode = 'linked';
let baseline;
let currentResult;
let currentExecution;
let client;
let liveRequested = false;
let generation = 0;
const controlNames = { linked: 'Case story', editorial: 'Note-only control', missing_link: 'Missing-link control' };

function baselineForStep() { return baseline?.runs?.[mode]?.[stage]; }
function renderResult(result, execution) {
  currentResult = result;
  currentExecution = execution;
  const summary = result.summary;
  const live = execution.mode === 'live_python';
  $('engine-execution').textContent = live ? 'Live Python engine' : 'Recorded engine output';
  $('engine-execution').classList.toggle('live', live);
  $('engine-heading-result').textContent = summary.coverageStatus === 'incomplete' ? 'Coverage incomplete: check the missing link' : summary.pendingReviewCount ? 'A decision needs human review' : result.state.human_reviews.length ? 'A human review is recorded' : 'No review request at this step';
  $('engine-explanation').textContent = summary.message;
  $('engine-pending').textContent = summary.pendingReviewCount;
  $('engine-versions').textContent = summary.sourceVersionCount;
  $('engine-decisions').textContent = summary.decisionCount;
  $('engine-fields').textContent = summary.changedFields.length ? summary.changedFields.join(', ') : 'No mapped field change at this step';
  $('engine-coverage').textContent = summary.coverageStatus === 'incomplete' ? 'Incomplete within the recorded dependencies' : 'Complete within the declared records';
  $('engine-integrity').textContent = summary.integrityStatus + ' (stored bytes and extraction only)';
  $('engine-control-note').textContent = mode === 'linked' ? 'Case story: the source link and correction are human-supplied inputs. The tool computes the request for review.' : controlNames[mode] + ': an alternate input experiment. The fictional story stays unchanged.';
  $('engine-baseline').textContent = live ? 'Live result matches the recorded Python baseline.' : 'Captured from the preserved Python engine. Press Run actual tool to execute it here.';
  $('engine-raw').textContent = JSON.stringify({ execution, result }, null, 2);
  $('engine-export').disabled = false;
  const request = result.state.review_requests.at(-1);
  $('engine-path').textContent = request ? request.dependency_path.map(id => {
    const node = result.state.nodes.find(item => item.id === id);
    return node?.kind === 'observation' ? 'Recorded assessment' : node?.kind === 'hypothesis' ? 'Recorded hypothesis' : id;
  }).join(' → ') : 'No request path emitted at this step';
}
function recordedExecution() { return { mode: 'recorded_python', description: 'Native Python execution of the preserved engine and supplied fictional fixture.' }; }
function showRecorded() {
  const result = baselineForStep();
  if (result) renderResult(result, recordedExecution());
}
function setBusy(busy) {
  $('engine-run').disabled = busy || !baseline;
  $('engine-run').textContent = busy ? 'Running actual tool…' : 'Run actual tool';
  $('engine-cancel').hidden = !busy;
}
async function runCurrent() {
  if (!baseline) return;
  const token = ++generation;
  const requestedStage = stage;
  const requestedMode = mode;
  setBusy(true);
  $('engine-progress').textContent = 'Loading the Python engine. Recorded output remains visible until execution finishes.';
  try {
    client ||= new ActualToolClient();
    const response = await client.run(requestedStage, requestedMode, message => { if (token === generation) $('engine-progress').textContent = message; });
    if (token !== generation) return;
    const expected = baseline.runs[requestedMode][requestedStage];
    if (canonicalResult(response.result) !== canonicalResult(expected)) throw new Error('The live result differs from the recorded baseline. It has not been accepted as a matching replay.');
    renderResult(response.result, response.execution);
    $('engine-progress').textContent = 'Executed the original Python engine in this browser. Source hashes and the result match.';
  } catch (error) {
    if (token !== generation) return;
    liveRequested = false;
    client?.dispose();
    client = undefined;
    showRecorded();
    $('engine-progress').textContent = error.message + ' The displayed result is recorded output.';
  } finally {
    if (token === generation) setBusy(false);
  }
}

export function updateEngineStep(index) {
  stage = index;
  mode = 'linked';
  const radio = document.querySelector('input[name="engine-mode"][value="linked"]');
  if (radio) radio.checked = true;
  showRecorded();
  if (liveRequested && baseline) runCurrent();
}

export async function initializeActualTool() {
  $('engine-run').addEventListener('click', () => { liveRequested = true; runCurrent(); });
  $('engine-cancel').addEventListener('click', () => {
    ++generation;
    liveRequested = false;
    client?.dispose();
    client = undefined;
    setBusy(false);
    showRecorded();
    $('engine-progress').textContent = 'Live execution stopped. Showing recorded engine output.';
  });
  document.querySelectorAll('input[name="engine-mode"]').forEach(radio => radio.addEventListener('change', () => {
    mode = radio.value;
    showRecorded();
    if (liveRequested) runCurrent();
  }));
  $('engine-export').addEventListener('click', () => {
    if (!currentResult) return;
    const blob = new Blob([JSON.stringify({ execution: currentExecution, result: currentResult }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `casefile-actual-engine-step-${stage + 1}-${mode}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('engine-progress').textContent = `Exported ${currentExecution.mode === 'live_python' ? 'live' : 'recorded'} engine output for step ${stage + 1}, ${controlNames[mode]}.`;
  });
  try {
    const response = await fetch('./actual_tool/recorded.json');
    if (!response.ok) throw new Error('Recorded engine output could not be loaded.');
    baseline = await response.json();
    showRecorded();
    setBusy(false);
  } catch (error) {
    $('engine-progress').textContent = error.message;
    $('engine-run').disabled = true;
  }
}
