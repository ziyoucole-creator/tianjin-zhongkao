const { readFileSync } = require('fs');

async function main() {
  const { readParquet } = await import('parquet-wasm');
  
  const filePath = 'D:/ClaudeCode/TianjinZhongkao/data/datasets/ceval/middle_school_mathematics_test-00000-of-00001.parquet';
  const buffer = readFileSync(filePath);
  console.log('Buffer size:', buffer.length);
  
  const table = readParquet(buffer);
  console.log('Num rows:', table.numRows);
  console.log('Num cols:', table.numCols);
  console.log('Schema:', table.schema.toString());
  
  for (let i = 0; i < Math.min(3, table.numRows); i++) {
    console.log(`\n--- Row ${i} ---`);
    for (const field of table.schema.fields) {
      const col = table.getChild(field.name);
      const val = col?.get(i);
      console.log(`${field.name}: ${String(val).substring(0, 200)}`);
    }
  }
}

main().catch(e => {
  console.log('Error:', e.message);
  console.log(e.stack?.substring(0, 500));
});
