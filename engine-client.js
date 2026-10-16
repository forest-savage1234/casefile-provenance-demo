export class ActualToolClient {
  constructor() {
    this.worker = new Worker(new URL('./engine-worker.js', import.meta.url));
    this.pending = new Map();
    this.sequence = 0;
    this.worker.onmessage = ({ data }) => {
      const task = this.pending.get(data.id);
      if (!task) return;
      if (data.type === 'progress') { task.progress(data.message); return; }
      clearTimeout(task.timeout);
      this.pending.delete(data.id);
      if (data.type === 'error') task.reject(new Error(data.message));
      else task.resolve(data);
    };
    this.worker.onerror = () => this.dispose('The browser could not start the Python engine. The recorded engine output remains available.');
  }
  run(stage, mode, progress = () => {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => this.dispose('Python loading timed out. You can retry, or inspect the recorded engine output.'), 90000);
      this.pending.set(id, { resolve, reject, timeout, progress });
      this.worker.postMessage({ id, stage, mode });
    });
  }
  dispose(message = 'Live execution stopped. Recorded engine output is available.') {
    this.worker.terminate();
    for (const task of this.pending.values()) { clearTimeout(task.timeout); task.reject(new Error(message)); }
    this.pending.clear();
  }
}

export function canonicalResult(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalResult).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalResult(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
