#!/usr/bin/env node
var fs = require('fs');
var toJSON = require('../');
var opts = null;

optsToShift = [
  {cli:'-x', option:'xList'},
  {cli:'-a', option:'shpFileFromArchive'}
];

//remove options to keep same exsiting cli format
optsToShift.forEach(function(o){
    index = process.argv.indexOf(o.cli);
    if(index < 0) return;
    indexOfVal = index + 1;
    //protect against no value and options next to options (-a -x)
    // console.log("indexOfVal: " + indexOfVal);
    // console.log("process.argv.length: " + process.argv.length);
    // console.log("process.argv[indexOfVal]: " + process.argv[indexOfVal]);

    if(indexOfVal >= process.argv.length || process.argv[indexOfVal].indexOf('-') > -1){
        console.error('Error: invalid option value.');
        process.exit(1);
    }
    if(index > 0){
        if(!opts)
            opts = {};
        opts[o.option] = process.argv[indexOfVal];
        [index, indexOfVal].forEach(function(remove,i){
            process.argv.splice(remove-i,1);
        });
    }
});

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

// console.log(opts);
var converter = toJSON(inStream, opts)

converter.on('error', function(e) {
  console.error('Error:', e)
})

converter.pipe(outStream);
