var test = require('tape');
var toJSON = require('../');
var fs = require('fs');
var Stream = require('stream').Stream;
var assertgeojson = require('geojson-assert');

test('stream zipped shapefile to json', function (t) {
    var inStream = fs.createReadStream(__dirname + '/../data/shape.zip');
    var outStream = new Stream;
    outStream.writable = true;

    var data = '';
    outStream.write = function (buf) {
        data += buf;
    };

    outStream.end = function () {
        var geo = JSON.parse(data);
        t.equal(typeof geo, 'object', 'is object');
        t.equal(geo.features.length, 162, 'got 162 features');
        t.doesNotThrow(function() { assertgeojson(data); }, 'is valid geojson');
        t.end();
    };

    toJSON(inStream).pipe(outStream);
});

test('.shp file on disk to json', function (t) {
    var filename = __dirname + '/../data/from_files/shape.shp';
    var outStream = new Stream;
    outStream.writable = true;

    var data = '';
    outStream.write = function (buf) {
        data += buf;
    };

    outStream.end = function () {
        var geo = JSON.parse(data);
        t.equal(typeof geo, 'object', 'is object');
        t.equal(geo.features.length, 162, 'got 162 features');
        t.doesNotThrow(function() { assertgeojson(data); }, 'is valid geojson');
        t.end();
    };

    toJSON.fromShpFile(filename).pipe(outStream);
});
