import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool: mysql.Pool;
const dataDir = path.resolve(process.cwd(), 'data');

// --- Database Configuration (read lazily inside initDatabases) ---
function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'virtual_labs',
  };
}

export async function initDatabases() {
  const DB_CONFIG = getDbConfig();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Validate that DB_PASSWORD is set (warn if empty)
  if (!DB_CONFIG.password) {
    console.warn('[WARN] DB_PASSWORD is not set. Using empty password for MySQL. Set DB_PASSWORD in your .env file.');
  }

  // Create connection just to create database if it doesn't exist
  const connection = await mysql.createConnection({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });

  await connection.query('CREATE DATABASE IF NOT EXISTS ??', [DB_CONFIG.database]);
  await connection.end();

  // Initialize pool connected to the database
  pool = mysql.createPool({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Performance: keep connections alive and set reasonable timeouts
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000,
  });

  // Create Documents Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      chunkCount INT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Chat Sessions Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create Chat Messages Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(255) PRIMARY KEY,
      sessionId VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      content MEDIUMTEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionId) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )
  `);

  console.log('[DB] MySQL initialized successfully.');
}

export function getMysql(): mysql.Pool {
  if (!pool) {
    throw new Error('MySQL pool not initialized. Call initDatabases() first.');
  }
  return pool;
}

// --- LanceDB (Vector Database) ---
import { connect } from '@lancedb/lancedb';
let lanceDb: any;
export async function getLance() {
  if (!lanceDb) {
    lanceDb = await connect(path.join(dataDir, 'lancedb'));
  }
  return lanceDb;
}
