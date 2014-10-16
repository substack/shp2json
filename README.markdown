shp2json
========

Convert shapefile zip archives to streaming GeoJSON using
[gdal](http://gdal.org) and
[JSONStream](https://github.com/dominictarr/JSONStream).

Uses the [gdal native addon](https://www.npmjs.org/package/gdal) for node.js. No compilation required on most platforms as pre-compiled binaries will be downloaded automatically when you run `npm install shp2json`. 

[![build status](https://secure.travis-ci.org/substack/shp2json.png)](http://travis-ci.org/substack/shp2json)

example
=======

shp2json.js
------------

```js
var toJSON = require('shp2json');
toJSON(process.stdin).pipe(process.stdout);
process.stdin.resume();
```

shp2json command
----------------

```
$ shp2json ~/citylots.zip 2>/dev/null | head -n5
{
"type": "FeatureCollection",
"features": [
{ "type": "Feature", "properties": { "MAPBLKLOT": "0001001", "BLKLOT": 
"0001001", "BLOCK_NUM": "0001", "LOT_NUM": "001", "FROM_ST": "", "TO_ST": "",
 "STREET": "", "ST_TYPE": "", "ODD_EVEN": "" }, "geometry": { "type": "Polygon",
 "coordinates": [ [ [ -122.422004, 37.808480 ], [ -122.422076, 37.808835 ], 
[ -122.421102, 37.808804 ], [ -122.421063, 37.808601 ], [ -122.422004, 37.808480 ] ] ] } }
,

```

methods
=======

var toJSON = require('shp2json')

var outStream = toJSON(inStream)
--------------------------------

Create a streaming json output stream `outStream` from the streaming shapefile
zip archive `inStream`.

command-line usage
==================

```
Usage: shp2json {infile|-} {outfile|-}
```

install
=======

Make sure you have the `unzip` command in your PATH.

To install the library, with [npm](http://npmjs.org) do:

    npm install shp2json

and to install the command do:

    npm install -g shp2json

license
=======

MIT/X11
