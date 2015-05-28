shp2jsonx
========


This project is a fork of substack's [shp2json](https://github.com/substack/shp2json) and combines ideas and code from mbostock [shapefile](https://github.com/mbostock/shapefile) and calvinmetcalf's [shapefile-js](https://github.com/calvinmetcalf/shapefile-js).

Convert shapefile zip archives to streaming GeoJSON using
[shapefile](https://github.com/mbostock/shapefile).


[![build status](https://secure.travis-ci.org/realtymaps/shp2jsonx.png)](http://travis-ci.org/realtymaps/shp2jsonx)

example
=======

shp2jsonx.js
------------

```js
var toJSON = require('shp2jsonx');
toJSON(process.stdin).pipe(process.stdout);
process.stdin.resume();
```

shp2jsonx command
----------------

```
$ shp2jsonx ~/citylots.zip 2>/dev/null | head -n5
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

var toJSON = require('shp2jsonx')

var outStream = toJSON(inStream)
--------------------------------

Create a streaming json output stream `outStream` from the streaming shapefile
zip archive `inStream`.

command-line usage
==================

**Basic**: Archive w/ one or many shapefiles will yield a json object or json array.

```
shp2jsonx {infile|-} {outfile|-}
```

**Specific File -a**: (default all)

```
shp2jsonx {infile|-} -a whiteFile {outfile|-}
```

**Black List -x**: (default none)

```
shp2jsonx {infile|-} -x "file1 file2" {outfile|-}
```

**Include Properties -i**: (defaults to true)

```
shp2jsonx {infile|-} -i false {outfile|-}
```

**Encoding -e**: (see [mbostock](https://github.com/mbostock/shapefile))

```
shp2jsonx {infile|-} -e "utf-8" {outfile|-}
```
install
=======

Make sure you have the `unzip` command in your PATH. If you are in heroku you will need
a build pack.

To install the library, with [npm](http://npmjs.org) do:

    npm install shp2jsonx

and to install the command do:

    npm install -g shp2jsonx

Possible Future Changes:
========================
- remove the use of linux unzip to be pure js/node.
  - caveats (consider memory):
    - [yazl](https://github.com/thejoshwolfe/yauzl/issues/14)
    - or possibly buffer single files like shapefile-js

license
=======

MIT/X11
