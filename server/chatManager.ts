import { v4 as uuidv4 } from 'uuid';
import { getMysql } from './db.js';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export async function createSession(title: string): Promise<ChatSession> {
  const db = getMysql();
  const id = uuidv4();
  
  // Sanitize title length
  const safeTitle = title.substring(0, 255);
  
  await db.execute(
    'INSERT INTO chat_sessions (id, title) VALUES (?, ?)',
    [id, safeTitle]
  );
  
  const session = await getSession(id);
  if (!session) throw new Error("Failed to create session");
  return session;
}

export async function getSessions(): Promise<ChatSession[]> {
  const db = getMysql();
  const [rows] = await db.query('SELECT * FROM chat_sessions ORDER BY updatedAt DESC');
  return rows as ChatSession[];
}

export async function getSession(id: string): Promise<ChatSession | undefined> {
  const db = getMysql();
  const [rows] = await db.execute('SELECT * FROM chat_sessions WHERE id = ?', [id]);
  const sessions = rows as ChatSession[];
  return sessions.length > 0 ? sessions[0] : undefined;
}

export async function deleteSession(id: string): Promise<void> {
  const db = getMysql();
  await db.execute('DELETE FROM chat_sessions WHERE id = ?', [id]);
}

export async function addMessage(sessionId: string, role: string, content: string): Promise<ChatMessage> {
  const db = getMysql();
  const id = uuidv4();
  
  // Validate role
  const validRoles = ['user', 'assistant', 'system'];
  const safeRole = validRoles.includes(role) ? role : 'user';
  
  await db.execute(
    'INSERT INTO chat_messages (id, sessionId, role, content) VALUES (?, ?, ?, ?)',
    [id, sessionId, safeRole, content]
  );
  
  // Explicitly update session timestamp
  await db.execute(
    'UPDATE chat_sessions SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [sessionId]
  );
  
  const [rows] = await db.execute('SELECT * FROM chat_messages WHERE id = ?', [id]);
  return (rows as ChatMessage[])[0];
}

export async function getSessionMessages(sessionId: string, limit?: number): Promise<ChatMessage[]> {
  const db = getMysql();
  
  // Sanitize limit: must be a positive integer, max 100
  const safeLimit = limit ? Math.min(Math.max(1, Math.floor(Number(limit) || 10)), 100) : undefined;
  
  if (safeLimit) {
    // Use parameterized query — the LIMIT value is safely sanitized above
    const query = `
      SELECT * FROM (
        SELECT * FROM chat_messages WHERE sessionId = ? ORDER BY createdAt DESC LIMIT ${safeLimit}
      ) sub ORDER BY createdAt ASC
    `;
    const [rows] = await db.execute(query, [sessionId]);
    return rows as ChatMessage[];
  } else {
    const [rows] = await db.execute(
      'SELECT * FROM chat_messages WHERE sessionId = ? ORDER BY createdAt ASC',
      [sessionId]
    );
    return rows as ChatMessage[];
  }
}
