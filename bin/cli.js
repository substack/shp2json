#!/usr/bin/env node
var fs = require('fs');
var toJSON = require('../');

if (process.argv.slice(2).join(' ') === '-h') {
    console.log('Usage: shp2json {infile|-} {outfile|-}');
    process.exit(0);
}

var inFile = process.argv[2] || '-';
var inStream = inFile === '-'
    ? process.stdin
    : fs.createReadStream(inFile)
;

var outFile = process.argv[3] || '-';
var outStream = outFile === '-'
    ? process.stdout
    : fs.createWriteStream(outFile)
;


var converter = toJSON(inStream)

converter.on('error', function(e) {
  console.error('Error:', e)
})

converter.pipe(outStream);
