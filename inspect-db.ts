import { connect } from '@lancedb/lancedb';
import mysql from 'mysql2/promise';
import path from 'path';

async function inspectDatabases() {
  const dataDir = path.resolve(process.cwd(), 'data');
  
  console.log('====================================');
  console.log('         MYSQL INSPECTION          ');
  console.log('====================================');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '708795',
      database: 'virtual_labs'
    });
    
    const [docs] = await connection.query('SELECT id, filename, subject, chunkCount FROM documents');
    console.log(`\nDocuments Table (${(docs as any[]).length} rows):`);
    console.table(docs);

    const [sessions] = await connection.query('SELECT id, title, createdAt FROM chat_sessions');
    console.log(`\nChat Sessions Table (${(sessions as any[]).length} rows):`);
    console.table(sessions);
    
    const [messages] = await connection.query('SELECT id, sessionId, role, SUBSTRING(content, 1, 50) as content FROM chat_messages');
    console.log(`\nChat Messages Table (${(messages as any[]).length} rows):`);
    console.table(messages);
    
    await connection.end();
  } catch (err: any) {
    console.log('Error reading MySQL:', err.message);
  }

  console.log('\n====================================');
  console.log('         LANCEDB INSPECTION         ');
  console.log('====================================');
  
  try {
    const db = await connect(path.join(dataDir, 'lancedb'));
    const tableNames = await db.tableNames();
    console.log('\nLanceDB Tables found:', tableNames);

    for (const tableName of tableNames) {
      const table = await db.openTable(tableName);
      const count = await table.countRows();
      console.log(`\n--- Table: ${tableName} (${count} rows) ---`);
      
      const sample = await table.query().limit(2).toArray();
      
      const cleanSample = sample.map((row: any) => {
          const { vector, ...rest } = row;
          return { ...rest, vector: vector ? `[Vector array of size ${vector.length}]` : 'None' };
      });
      
      console.log(cleanSample);
    }
  } catch (err: any) {
    console.log('Error reading LanceDB:', err.message);
  }
}

inspectDatabases();
