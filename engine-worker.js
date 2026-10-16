/* The preserved Python engine runs in this worker, never on a server. */
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.29.4/full/';
let ready;
let queue = Promise.resolve();

const sha256 = async (bytes) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');

async function initialize(id) {
  self.postMessage({ id, type: 'progress', message: 'Loading Python and SQLite. The first run needs an internet connection.' });
  importScripts(PYODIDE_URL + 'pyodide.js');
  const pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  await pyodide.loadPackage('sqlite3');
  const manifestResponse = await fetch('./actual_tool/SOURCE_MANIFEST.json');
  if (!manifestResponse.ok) throw new Error('The engine source manifest could not be loaded.');
  const manifestBytes = await manifestResponse.arrayBuffer();
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  const manifestSha256 = await sha256(manifestBytes);
  pyodide.FS.mkdirTree('/home/pyodide/actual_tool');
  for (const file of manifest.files) {
    if (!/^[a-zA-Z0-9_.\/-]+$/.test(file.path) || file.path.split('/').includes('..') || file.path.startsWith('/')) throw new Error('Invalid source path in the engine manifest.');
    const response = await fetch('./actual_tool/' + file.path);
    if (!response.ok) throw new Error('A preserved engine file could not be loaded: ' + file.path);
    const bytes = await response.arrayBuffer();
    if (await sha256(bytes) !== file.sha256) throw new Error('Engine source hash mismatch: ' + file.path);
    const target = '/home/pyodide/actual_tool/' + file.path;
    pyodide.FS.mkdirTree(target.slice(0, target.lastIndexOf('/')));
    pyodide.FS.writeFile(target, new Uint8Array(bytes));
  }
  await pyodide.runPythonAsync("import sys, json\nsys.path.insert(0, '/home/pyodide/actual_tool')\nfrom casefile_adapter import run_casefile");
  self.postMessage({ id, type: 'progress', message: 'Original engine files verified. Running the selected case step.' });
  return { pyodide, manifestSha256, verifiedFiles: manifest.files.length };
}

self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    const { id, stage, mode } = data;
    try {
      if (!Number.isInteger(stage) || stage < 0 || stage > 6 || !['linked', 'editorial', 'missing_link'].includes(mode)) throw new Error('Choose a supported case step and experiment.');
      ready ||= initialize(id);
      const { pyodide, manifestSha256, verifiedFiles } = await ready;
      pyodide.globals.set('_casefile_stage', stage);
      pyodide.globals.set('_casefile_mode', mode);
      const serialized = await pyodide.runPythonAsync('json.dumps(run_casefile(_casefile_stage, _casefile_mode), ensure_ascii=False, sort_keys=True, separators=(\",\", \":\"))');
      self.postMessage({ id, type: 'result', result: JSON.parse(serialized), execution: { mode: 'live_python', runtime: 'Pyodide 0.29.4', manifestSha256, verifiedFiles } });
    } catch (error) {
      self.postMessage({ id, type: 'error', message: String(error.message || error) });
    }
  });
};
