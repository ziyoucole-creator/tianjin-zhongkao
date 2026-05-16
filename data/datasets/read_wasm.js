const { readParquet } = require('parquet-wasm');
const fs = require('fs');
const path = require('path');

async function main() {
  const filePath = 'D:/ClaudeCode/TianjinZhongkao/data/datasets/ceval/middle_school_mathematics_test-00000-of-00001.parquet';
  
  try {
    const buffer = fs.readFileSync(filePath);
    console.log('Buffer size:', buffer.length);
    
    // Try different API signatures
    const table = readParquet(buffer);
    console.log('Table:', table);
    
    if (table) {
      console.log('Schema:', table.schema?.toString());
      console.log('Rows:', table.numRows);
      
      // Get first few rows
      const rows = [];
      for (let i = 0; i < Math.min(5, table.numRows); i++) {
        const row = {};
        for (const field of table.schema.fields) {
          row[field.name] = table.getChild(field.name)?.get(i);
        }
        rows.push(row);
        console.log(`\nRow ${i}:`, JSON.stringify(row, null, 2).substring(0, 300));
      }
    }
  } catch(e) {
    console.log('Error:', e.message);
    console.log(e.stack?.substring(0, 500));
  }
}

main();
