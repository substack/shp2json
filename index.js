var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var shp = require('shapefile');
var fs = require('fs');
var path = require('path');
var seq = require('seq');
var findit = require('findit');
var duplex = require('duplexify')
var from = require('from2');
var xList = null;
var shpFileFromArchive = null;

var _parseOptions = function(opts) {
    if (opts && typeof(opts) === 'object') {
        if (opts.hasOwnProperty('shpFileFromArchive') && typeof(opts.shpFileFromArchive) === 'string')
            shpFileFromArchive = opts.shpFileFromArchive;
        if (opts.hasOwnProperty('xList')) {
            if (typeof(opts.xList) === 'string')
                xList = opts.xList.replace(/,/g);
            if (Array.isArray(opts.xList))
                xList = opts.xList.join(' ');
        }
    }
};

module.exports = function(inStream, opts) {
    var id = Math.floor(Math.random() * (1 << 30)).toString(16);
    var tmpDir = path.join('/tmp', id);
    var zipFile = path.join('/tmp', id + '.zip');
    _parseOptions(opts);
    if (shpFileFromArchive)
        shpFileFromArchive = tmpDir + '/' + shpFileFromArchive;

    var outStream = duplex.obj();

    var zipStream = fs.createWriteStream(zipFile);
    inStream.pipe(zipStream);
    zipStream.on('error', outStream.destroy);

    seq()
        .par(function() {
            fs.mkdir(tmpDir, 0700, this)
        })
        .par(function() {
            if (zipStream.closed) this()
            else zipStream.on('close', this.ok)
        })
        .seq_(function(next) {
            // console.log(xList);
            var ps = null;
            if (!xList) {
                ps = spawn('unzip', ['-d', tmpDir, zipFile]);
            } else {
                var toRun = 'unzip ' + zipFile + ' -d ' + tmpDir + ' -x ' + xList;
                ps = exec(toRun);
            }

            ps.on('exit', function(code) {
                next(code < 3 ? null : 'error in unzip: code ' + code)
            });
        })
        .seq_(function(next) {
            var s = findit(tmpDir);
            var files = [];
            s.on('file', function(file) {
                if (file.match(/__MACOSX/)) return;
                if (file.match(/\.shp$|\.kml$/i)) files.push(file);
            });
            s.on('end', next.ok.bind(null, files));
        })
        .seq(function(files) {
            // console.log(files);
            if (files.length === 0) {
                this('no .shp files found in the archive');
            } else if (files.length > 2 && !shpFileFromArchive) { //2 to account for .dbf
                this('multiple .shp files found in the archive,' + ' expecting a single file');
            } else if (shpFileFromArchive && files.indexOf(shpFileFromArchive) === -1) {
                this('shpFileFromArchive: ' + shpFileFromArchive + 'does not exist in archive.');
            } else {
                if (shpFileFromArchive)
                    files = [shpFileFromArchive];
                // console.log("importing file: " + files[0]);
                var reader = shp.reader(files[0],{'ignore-properties':true});

                var before = '{"type": "FeatureCollection","features": [\n';
                var after = '\n]}\n';
                var started = false;
                var currentLayer, currentFeature, currentTransformation;
                var firstTime = true;
                var layerStream = from(function(size, next) {
                    var out = '';
                    writeNextFeature();

                    function writeNextFeature() {
                        function readRecord() {
                            reader.readRecord(function(error, feature) {
                                if (feature == shp.end) {
                                    // end stream
                                    console.log(before+out+after);
                                    // push remaining output and end
                                    layerStream.push(out);
                                    layerStream.push(after);
                                    return layerStream.push(null);
                                    shp.close()
                                }
                                if (!feature) return writeNextFeature();
                                // console.log(feature);
                                var featStr = JSON.stringify(feature);

                                if (started) {
                                    featStr = ',\n' + featStr;
                                } else {
                                    featStr = before + featStr;
                                }

                                started = true;
                                out += featStr;

                                if (out.length >= size) {
                                    next(null, out);
                                } else {
                                    writeNextFeature();
                                }
                            });
                        };
                        if (firstTime) {
                            firstTime = false;
                            reader.readHeader(function() {
                                readRecord();
                            });
                        }
                        else readRecord();
                    }
                });

                outStream.setReadable(layerStream);
                outStream.end(after);

            }
        })
        .catch(function(err) {
            outStream.destroy(err);
        });

    return outStream;
};
