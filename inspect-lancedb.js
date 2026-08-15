import { connect } from '@lancedb/lancedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'data', 'lancedb');

async function inspectLanceDB() {
  console.log(`\n🔍 Inspecting LanceDB at: ${dbPath}`);
  
  try {
    const db = await connect(dbPath);
    const tableNames = await db.tableNames();
    
    if (tableNames.length === 0) {
      console.log('No tables found in the database.');
      return;
    }
    
    console.log(`Found ${tableNames.length} tables:`, tableNames);
    
    for (const tableName of tableNames) {
      console.log(`\n===========================================`);
      console.log(`📊 TABLE: ${tableName}`);
      console.log(`===========================================`);
      
      const table = await db.openTable(tableName);
      
      // We only fetch the first 3 rows to preview
      const rows = await table.query().limit(3).toArray();
      
      console.log(`Total rows previewed: ${rows.length}`);
      
      rows.forEach((row, index) => {
        console.log(`\n--- Row ${index + 1} ---`);
        
        // We omit the massive 'vector' array from the console output so it doesn't flood the terminal
        const { vector, ...metadata } = row;
        console.log(metadata);
        
        if (vector) {
          console.log(`[Vector field exists with ${vector.length} dimensions]`);
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to read LanceDB:', error);
  }
}

inspectLanceDB();
