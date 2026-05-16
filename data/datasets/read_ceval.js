const parquet = require('parquetjs');
const fs = require('fs');
const path = require('path');

async function readParquet(filePath) {
  const reader = await parquet.ParquetReader.openFile(filePath);
  const cursor = reader.getCursor();
  let record = null;
  const records = [];
  while ((record = await cursor.next())) {
    records.push(record);
  }
  await reader.close();
  return records;
}

async function main() {
  const dir = 'D:/ClaudeCode/TianjinZhongkao/data/datasets/ceval';
  
  // Read one file from each subject
  const subjects = ['middle_school_mathematics', 'middle_school_physics', 'middle_school_chemistry', 'middle_school_politics'];
  
  for (const subj of subjects) {
    const filePath = path.join(dir, `${subj}_test-00000-of-00001.parquet`);
    if (fs.existsSync(filePath)) {
      try {
        const records = await readParquet(filePath);
        console.log(`\n=== ${subj} (${records.length} records) ===`);
        if (records.length > 0) {
          const r = records[0];
          console.log('Keys:', Object.keys(r));
          console.log('Sample:');
          for (const k of Object.keys(r)) {
            let val = String(r[k]).substring(0, 200);
            console.log(`  ${k}: ${val}`);
          }
        }
      } catch(e) {
        console.log(`${subj} error:`, e.message);
      }
    } else {
      console.log(`${subj}: file not found`);
    }
  }
}

main().catch(console.error);
