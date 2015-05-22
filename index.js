var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var gdal = require('gdal');
var fs = require('fs');
var path = require('path');
var seq = require('seq');
var findit = require('findit');
var duplex = require('duplexify')
var from = require('from2');
var xList = null;
var shpFileFromArchive = null;

var _parseOptions = function(opts){
    if(opts && typeof(opts) === 'object'){
        if(opts.hasOwnProperty('shpFileFromArchive') && typeof(opts.shpFileFromArchive) === 'string')
            shpFileFromArchive = opts.shpFileFromArchive;
        if(opts.hasOwnProperty('xList')){
            if(typeof(opts.xList) === 'string')
                xList = opts.xList.replace(/,/g);
            if(Array.isArray(opts.xList))
                xList = opts.xList.join(' ');
        }
    }
};

module.exports = function (inStream, opts) {
    var id = Math.floor(Math.random() * (1<<30)).toString(16);
    var tmpDir = path.join('/tmp', id);
    var zipFile = path.join('/tmp', id + '.zip');
    _parseOptions(opts);
    if(shpFileFromArchive)
        shpFileFromArchive = tmpDir + '/' + shpFileFromArchive;

    var outStream = duplex.obj();

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
            console.log(xList);
            var ps = null;
            if(!xList){
                console.log('spqwn');
                ps =  spawn('unzip', [ '-d', tmpDir, zipFile ]);
            }
            else{
                console.log('exec');
                var toRun = 'unzip '+ zipFile + ' -d ' + tmpDir + ' -x ' + xList;
                console.log(toRun);
              ps = exec(toRun);
          }

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
            console.log(files);
            if (files.length === 0) {
                this('no .shp files found in the archive');
            }
            else if (files.length > 1 && !shpFileFromArchive) {
                this('multiple .shp files found in the archive,' + ' expecting a single file');
            }
            else if (shpFileFromArchive && files.indexOf(shpFileFromArchive) === -1) {
                this('shpFileFromArchive: ' + shpFileFromArchive + 'does not exist in archive.');
            }
            else {
                if (shpFileFromArchive)
                    files = [shpFileFromArchive];
                // console.log("importing file: " + files[0]);
                var shp = gdal.open(files[0]);
                var layerCount = shp.layers.count();
                console.log("layerCount: " + layerCount);

                var before = '{"type": "FeatureCollection","features": [\n';
                var after = '\n]}\n';
                var started = false;
                var currentLayer, currentFeature, currentTransformation;
                var nextLayer = 0;

                var to = gdal.SpatialReference.fromEPSG(4326);
                console.log('post spatial');
                function getNextLayer() {
                    console.log('getNextLayer');
                    currentLayer = shp.layers.get(nextLayer++);
                    var srs = currentLayer.srs || gdal.SpatialReference.fromEPSG(4326);
                    currentTransformation = new gdal.CoordinateTransformation(srs, to);
                }

                getNextLayer();

                var layerStream = from(function(size, next) {
                  var out = '';
                  writeNextFeature();

                  function writeNextFeature() {

                      var feature = currentLayer.features.next();
                      if (!feature) {
                           console.log('no feature');
                          // end stream
                          if (nextLayer === layerCount) {
                              console.log('at end');
                              // push remaining output and end
                              layerStream.push(out);
                              layerStream.push(after);
                              return layerStream.push(null);
                          }
                          getNextLayer();
                          feature = currentLayer.features.next();
                      }

                      try {
                          var geom = feature.getGeometry();
                        //   console.log(geom);
                      } catch (e) {
                          console.error('geom error');
                          return writeNextFeature();
                      }

                      geom.transform(currentTransformation);
                      var geojson = geom.toJSON();
                      var fields = feature.fields.toJSON();
                    //   console.log(geojson);
                      var featStr = '{"type": "Feature", "properties": ' + fields + ',"geometry": ' + geojson + '}';

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
                  }

                })

                outStream.setReadable(layerStream);
                outStream.end(after);

            }
        })
        .catch(function (err) {
            outStream.destroy(err);
        })
    ;

    return outStream;
};
