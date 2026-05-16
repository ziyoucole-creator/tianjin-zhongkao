// Try with @dsnp/parquetjs first
try {
  const parquet = require('@dsnp/parquetjs');
  console.log('Loaded @dsnp/parquetjs');
} catch(e) {
  console.log('@dsnp/parquetjs not available');
}

// Try with parquetjs-lite
try {
  const pq = require('parquetjs-lite');
  console.log('Loaded parquetjs-lite');
} catch(e) {
  console.log('parquetjs-lite not available');
}

// List what parquet packages are installed globally
const { execSync } = require('child_process');
try {
  const list = execSync('npm list -g --depth=0 2>&1').toString();
  console.log('\nGlobal packages:');
  console.log(list);
} catch(e) {
  console.log('List error:', e.message);
}

// Try reading parquet with the installed library
const path = 'D:/ClaudeCode/TianjinZhongkao/data/datasets/ceval/middle_school_mathematics_test-00000-of-00001.parquet';
const fs = require('fs');
console.log('\nFile exists:', fs.existsSync(path));
console.log('File size:', fs.statSync(path).size);

// Check which parquet module was actually installed
try {
  const pkgJson = require('C:/Program Files/nodejs/node_global/node_modules/parquetjs/package.json');
  console.log('\nparquetjs version:', pkgJson.version);
  console.log('main:', pkgJson.main);
} catch(e) {
  console.log('Cannot read parquetjs package:', e.message);
}
