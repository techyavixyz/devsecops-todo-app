const fs = require('fs');
const path = require('path');

/**
 * Minimal JSON-file-backed storage. Reads/writes are synchronous, which
 * keeps the implementation free of race conditions (Node's single-threaded
 * execution means a sync read-modify-write is atomic from JS's point of
 * view) and is more than fast enough for a small todo list.
 *
 * Swap this class out for a real database driver later without changing
 * any controller code, as long as the new module exposes read()/write().
 */
class FileDB {
  constructor(filePath, defaultData = {}) {
    this.filePath = filePath;
    this.defaultData = defaultData;
    this._ensureFile();
  }

  _ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      this._writeSync(this.defaultData);
    }
  }

  _writeSync(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return raw ? JSON.parse(raw) : this.defaultData;
    } catch {
      return this.defaultData;
    }
  }

  write(data) {
    this._writeSync(data);
    return data;
  }
}

module.exports = FileDB;
