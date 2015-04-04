var req = require('superagent')
  , ZRH_HB = [47.377212, 8.540046]
  , BOUNDING_BOX = [[47.391144, 8.486938],[47.337659, 8.587189]]
  , WIDTH=500
  , HEIGHT=500

var centerpoint = [(BOUNDING_BOX[0][0] + BOUNDING_BOX[1][0])/2, (BOUNDING_BOX[0][1] + BOUNDING_BOX[1][1])/2] 
  , zoom=10


var gm = require('googlemaps');


console.log(
    gm.staticMap(centerpoint.join(','), zoom, [WIDTH,HEIGHT].join('x'))
    )
