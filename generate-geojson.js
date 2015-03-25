var DATA_FILE = process.env.DATA_FILE
  , DATA = require(DATA_FILE)
  , tcolor = require('tinycolor2')

var out = {
  "type": "FeatureCollection"
, features: []
}

var feature_template = {
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [0, 0]
  },
  "properties": {
    "title": "Foo",
    "marker-size": "small"
  , "marker-color": "#fff"
  }
}

var generateColor = function(val){
  return tcolor("hsl(" + (val*360) + ", 100%, 50%)").toHexString();
}


var MAX_DIST = 0
  , MAX_DIST_LOC
  , MAX_TIME = 0
  , MAX_TIME_LOC

// First pass establishes maximums.
Object.keys(DATA).forEach(function(k){
  var lat = k.split(',')[0]
    , lon = k.split(',')[1]
    , dist = DATA[k].d
    , time = DATA[k].t

  MAX_DIST = Math.max(MAX_DIST, dist)
  if (dist === MAX_DIST)
    MAX_DIST_LOC = k
  MAX_TIME = Math.max(MAX_TIME, time)
  if (time === MAX_TIME)
    MAX_TIME_LOC = k

})

Object.keys(DATA).forEach(function(k){
  var lat = k.split(',')[0]
    , lon = k.split(',')[1]
    , dist = DATA[k].d
    , time = DATA[k].t
    , feature = JSON.parse(JSON.stringify(feature_template))

  feature.geometry.coordinates = [parseFloat(lon),parseFloat(lat)]
  feature.properties.title = time + 's, ' + dist + 'm'
  feature.properties["marker-color"] = generateColor(time/MAX_DIST)

  out.features.push(feature)
})


console.log(JSON.stringify(out))
