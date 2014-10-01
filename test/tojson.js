var test = require('tape');
var toJSON = require('../');
var fs = require('fs');
var Stream = require('stream').Stream;

test('to json', function (t) {
    var inStream = fs.createReadStream(__dirname + '/../data/shape.zip');
    var outStream = new Stream;
    outStream.writable = true;
    
    var data = '';
    outStream.write = function (buf) {
        data += buf;
    };
    
    outStream.end = function () {
      console.log(data)
        var geo = JSON.parse(data);
        t.equal(typeof geo, 'object');
        t.ok(geo.features.length > 100);
        t.end();
    };
    
    toJSON(inStream).pipe(outStream);
});
