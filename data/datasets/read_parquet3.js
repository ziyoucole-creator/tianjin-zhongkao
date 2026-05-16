const parquet = require('parquetjs');
const fs = require('fs');
const path = require('path');

async function readParquet2(filePath) {
  // Check what methods the EnvelopeReader has
  const reader = await parquet.ParquetEnvelopeReader.openFile(filePath);
  console.log('Reader methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(reader)));
  
  // Try to read rows
  const cursor = reader.getCursor();
  console.log('Cursor type:', typeof cursor);
  
  // Maybe cursor is not a function but a property?
  let rows = [];
  // Try to iterate differently
  if (typeof reader.readAll === 'function') {
    rows = await reader.readAll();
    console.log('readAll rows:', rows.length);
  } else if (cursor && typeof cursor[Symbol.asyncIterator] === 'function') {
    for await (const row of cursor) {
      rows.push(row);
    }
  } else if (cursor && typeof cursor.next === 'function') {
    let row;
    while ((row = await cursor.next())) {
      rows.push(row);
    }
  } else {
    console.log('Unknown cursor API');
  }
  
  return rows;
}

async function main() {
  const filePath = 'D:/ClaudeCode/TianjinZhongkao/data/datasets/ceval/middle_school_mathematics_test-00000-of-00001.parquet';
  
  // Check file magic bytes
  const buf = Buffer.alloc(100);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, 100, 0);
  fs.closeSync(fd);
  console.log('File header (hex):', buf.toString('hex').substring(0, 100));
  console.log('File header (text):', buf.toString('utf8').substring(0, 100));
  
  try {
    const rows = await readParquet2(filePath);
    console.log('Rows:', rows.length);
    if (rows.length > 0) {
      console.log('Sample:', JSON.stringify(rows[0], null, 2).substring(0, 500));
    }
  } catch(e) {
    console.log('Read error:', e.message);
    console.log(e.stack);
  }
}

main().catch(e => console.error(e));
