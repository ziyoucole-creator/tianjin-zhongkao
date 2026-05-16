const parquet = require('parquetjs');
const fs = require('fs');
const path = require('path');

async function readParquet(filePath) {
  try {
    // parquetjs might use different API
    console.log('Trying to open:', filePath);
    
    // Method 1: ParquetReader.openFile
    let reader;
    try {
      reader = await parquet.ParquetReader.openFile(filePath);
      console.log('openFile worked');
    } catch(e1) {
      console.log('openFile error:', e1.message);
      // Method 2: ParquetEnvelopeReader
      try {
        reader = await parquet.ParquetEnvelopeReader.openFile(filePath);
        console.log('EnvelopeReader worked');
      } catch(e2) {
        console.log('EnvelopeReader error:', e2.message);
        return [];
      }
    }
    
    if (!reader) return [];
    
    const cursor = reader.getCursor();
    const records = [];
    let record;
    while ((record = await cursor.next())) {
      records.push(record);
    }
    await reader.close();
    console.log('Records:', records.length);
    return records;
  } catch(e) {
    console.log('Overall error:', e.message);
    console.log(e.stack);
    return [];
  }
}

async function main() {
  const dir = 'D:/ClaudeCode/TianjinZhongkao/data/datasets/ceval';
  const filePath = path.join(dir, 'middle_school_mathematics_test-00000-of-00001.parquet');
  
  const records = await readParquet(filePath);
  if (records.length > 0) {
    console.log('\nFirst record keys:', Object.keys(records[0]));
    for (const k of Object.keys(records[0])) {
      console.log(`  ${k}: ${String(records[0][k]).substring(0, 200)}`);
    }
    console.log('\nSecond record:');
    for (const k of Object.keys(records[1] || {})) {
      console.log(`  ${k}: ${String(records[1][k]).substring(0, 200)}`);
    }
  }
}

main().catch(e => console.error('Fatal:', e.message));
