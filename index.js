var spawn = require('child_process').spawn;
var gdal = require('gdal');
var fs = require('fs');
var path = require('path');
var seq = require('seq');
var findit = require('findit');
var through = require('through2');

module.exports = function (inStream) {
    var id = Math.floor(Math.random() * (1<<30)).toString(16);
    var tmpDir = path.join('/tmp', id);
    var zipFile = path.join('/tmp', id + '.zip');
    
    var outStream = through.obj();
    
    var zipStream = fs.createWriteStream(zipFile);
    inStream.pipe(zipStream);
    zipStream.on('error', outStream.destroy);
    
    seq()
        .par(function () { fs.mkdir(tmpDir, 0700, this) })
        .par(function () {
            if (zipStream.closed) this()
            else zipStream.on('close', this.ok)
        })
        .seq_(function (next) {
            var ps = spawn('unzip', [ '-d', tmpDir, zipFile ]);
            ps.on('exit', function (code) {
                next(code < 3 ? null : 'error in unzip: code ' + code)
            });
        })
        .seq_(function (next) {
            var s = findit(tmpDir);
            var files = [];
            s.on('file', function (file) {
                if (file.match(/__MACOSX/)) return;
                if (file.match(/\.shp$|\.kml$/i)) files.push(file);
            });
            s.on('end', next.ok.bind(null, files));
        })
        .seq(function (files) {
            if (files.length === 0) {
                this('no .shp files found in the archive');
            }
            else if (files.length > 1) {
                this('multiple .shp files found in the archive,'
                    + ' expecting a single file')
            }
            else {
                var shp = gdal.open(files[0]);
                var layers = shp.layers.count();
                
                var before = '{"type": "FeatureCollection","features": [\n'
                var after = '\n]}\n'
                var started = false
                outStream.push(before)
                
                var to = gdal.SpatialReference.fromEPSG(4326);
                
                for (var i = 0; i < layers; i++) {
                  var layer = shp.layers.get(i)
                  var ct = new gdal.CoordinateTransformation(layer.srs, to);
                  var features = layer.features.count();
                  for (var j = 0; j < features; j++) {
                    var feature = layer.features.get(j);
                    var geom = feature.getGeometry();
                    geom.transform(ct);
                    var geojson = geom.toJSON();
          					var fields = feature.fields.toJSON();
                    var featStr = '{"type": "Feature", "properties": ' + JSON.stringify(fields) + ',"geometry": ' + geojson + '}';
                    if (started) featStr = ',\n' + featStr;
                    started = true;
                    outStream.push(featStr);
                  }
                }

                outStream.end(after)
            }
        })
        .catch(function (err) {
            outStream.destroy(err);
        })
    ;
    
    return outStream;
};
