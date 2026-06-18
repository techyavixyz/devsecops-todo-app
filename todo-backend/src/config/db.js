require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_URI = process.env.DB_URI || process.env.DATABASE_URL || '';

function getMaskedUri() {
  if (!DB_URI) {
    const user = process.env.DB_USER || 'root';
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const database = process.env.DB_NAME || 'todo_app';
    return `mysql://${user}:****@${host}:${port}/${database}`;
  }

  const parsed = new URL(DB_URI);
  if (parsed.password) parsed.password = '****';
  return parsed.toString();
}

function getUriWithoutDatabase() {
  const parsed = new URL(DB_URI);
  parsed.pathname = '';
  return parsed.toString();
}

function getDatabaseName() {
  if (!DB_URI) return process.env.DB_NAME || 'todo_app';

  const parsed = new URL(DB_URI);
  return parsed.pathname.replace(/^\//, '') || process.env.DB_NAME || 'todo_app';
}

function getConnectionConfig(includeDatabase = true) {
  const baseConfig = DB_URI
    ? { uri: includeDatabase ? DB_URI : getUriWithoutDatabase() }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'todo_app',
      };

  if (!includeDatabase && !DB_URI) {
    delete baseConfig.database;
  }

  return {
    ...baseConfig,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    dateStrings: true,
  };
}

const dbConfig = {
  ...getConnectionConfig(true),
  database: getDatabaseName(),
};

let pool;

async function ensureDatabase() {
  console.log(`[database] Ensuring database exists: ${dbConfig.database}`);
  const connection = await mysql.createConnection(getConnectionConfig(false));

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`[database] Database ready: ${dbConfig.database}`);
  } finally {
    await connection.end();
  }
}

async function getPool() {
  if (!pool) {
    console.log(`[database] Connecting with URI: ${getMaskedUri()}`);

    if (process.env.DB_AUTO_CREATE !== 'false') {
      await ensureDatabase();
    }

    pool = mysql.createPool(dbConfig);
    await pool.query('SELECT 1');
    console.log('[database] MySQL connection established');
  }

  return pool;
}

async function query(sql, params = []) {
  const connectionPool = await getPool();
  const [rows] = await connectionPool.execute(sql, params);
  return rows;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[database] MySQL connection closed');
  }
}

module.exports = {
  query,
  getPool,
  closePool,
};
