/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'buffer-equal-constant-time',
  'index.js'
);

function patchDependency() {
  if (!fs.existsSync(targetFile)) {
    console.log('[postinstall] buffer-equal-constant-time not found, skipping patch');
    return;
  }

  const original = fs.readFileSync(targetFile, 'utf8');
  if (original.includes('var SlowBuffer = require(\'buffer\').SlowBuffer || Buffer;')) {
    console.log('[postinstall] buffer-equal-constant-time already patched');
    return;
  }

  let patched = original.replace(
    "var SlowBuffer = require('buffer').SlowBuffer;",
    "var SlowBuffer = require('buffer').SlowBuffer || Buffer;"
  );

  patched = patched.replace(
    'var origSlowBufEqual = SlowBuffer.prototype.equal;',
    'var origSlowBufEqual = SlowBuffer && SlowBuffer.prototype ? SlowBuffer.prototype.equal : undefined;'
  );

  fs.writeFileSync(targetFile, patched, 'utf8');
  console.log('[postinstall] patched buffer-equal-constant-time for Node 25+');
}

patchDependency();
