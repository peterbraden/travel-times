var DATA_FILE = process.env.DATA_FILE
  , DATA = require(DATA_FILE)
  , NUM_INTERVALS = 10

// First, use a Delauney Trianguulation to partition the map
var triangulate = require("delaunay-fast").triangulate
  , points = Object.keys(DATA).map(function(x){return x.split(',').map(parseFloat)})
  , meshIndices = triangulate(points)
  , mesh = [] // The fast delauny returns indexes into the original array, let's remap back
  , maxDist = 0
  , maxTime = 0
  , minLat = Math.min.apply(Math, points.map(function(p){return p[0]}))
  , minLon = Math.min.apply(Math, points.map(function(p){return p[1]}))
  , maxLat = Math.max.apply(Math, points.map(function(p){return p[0]}))
  , maxLon = Math.max.apply(Math, points.map(function(p){return p[1]}))

var sum = function(){
  return Array.prototype.reduce.call(arguments, function(x, y){return x + y}, 0)
}



for (var i = meshIndices.length; i;){
  var a,b,c, avgTime, avgDist
  -- i
  a = points[meshIndices[i]]
  -- i
  b = points[meshIndices[i]]
  -- i
  c = points[meshIndices[i]]

  avgTime = sum(DATA[a.join(',')].t, DATA[b.join(',')].t, DATA[c.join(',')].t)/3
  avgDist = sum(DATA[a.join(',')].d, DATA[b.join(',')].d, DATA[c.join(',')].d)/3
  maxDist = Math.max(avgDist, maxDist)
  maxTime = Math.max(avgTime, maxTime)
  mesh.push([a,b,c, avgTime, avgDist])
}

// Now use Marching Squares (Meandering Triangles) Algorithm to draw contour lines
var contours = {}

var midway = function(a,b){
  return [sum(a[0], b[0]) / 2, sum(a[1],b[1])/2]
}

var lines = function(a, b, c, bmp){
  switch (bmp){
    case 0: // allbelow contour
    case 7: // all points above
      return []
    case 1:
      // only a is above line =>
      return [midway(a,b), midway(a,c)]

    case 2:
      // only b is above line => contour ac
      return [midway(b,a), midway(b,c)]

    case 3:
      // a,b above line => contour c
      return [midway(a,c), midway(b, c)]

    case 4:
      // c above line => contour ab
      return [midway(a, c), midway(b, c)]

    case 5:
      // c,a => b
      return [midway(c, b), midway(a, b)]

    case 6:
      // c, b => a
      return [midway(a, c), midway(a, b)]
  }
  throw "Out of bounds" 
}

for (var interval = 0; i < 1; i += 1/NUM_INTERVALS){
  var timeInterval = maxTime * i
    , maxInterval = timeInterval
    , minInterval = Math.max(0, maxTime * (i-1))
    , line = mesh.map(function(mp){

        var a = mp[0]
          , ad = DATA[a.join(',')]
          , b = mp[1]
          , bd = DATA[b.join(',')]
          , c = mp[2]
          , cd = DATA[c.join(',')]
          , bitmap = 0

        bitmap |= (ad.t <= maxInterval && ad.t > minInterval)  ? 1 : 0
        bitmap |= (bd.t <= maxInterval && bd.t > minInterval)  ? 2 : 0
        bitmap |= (cd.t <= maxInterval && cd.t > minInterval)  ? 4 : 0 

        return lines(a, b, c, bitmap)
      }).filter(function(x){ return x.length > 0})

  contours[timeInterval] = line
}



// Now render
var Canvas = require('canvas')
  , Image = Canvas.Image
  , WIDTH=500
  , HEIGHT=500
  , canvas = new Canvas(WIDTH, HEIGHT)
  , ctx = canvas.getContext('2d')

var makePoint = function(pt){ 
  return [
      (pt[0]-minLat) / (maxLat-minLat) * WIDTH
    , (pt[1]-minLon) / (maxLon-minLon) * HEIGHT
  ]
}

var makeColor = function(val, max){ return "hsl(" + (val/max*360) + ", 100%, 50%)"}
mesh.forEach(function(p){
  var a = makePoint(p[0])
    , b = makePoint(p[1])
    , c = makePoint(p[2])
    , color = makeColor(p[3], maxTime)

  ctx.fillStyle= color || '#555'
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0],b[1])
  ctx.lineTo(c[0],c[1])
  ctx.lineTo(a[0],a[1])
  ctx.closePath();
  ctx.fill()
  //ctx.fillRect(pt[0], pt[1], 1, 1)
})
/*
ctx.fillStyle = 'rgba(0, 0, 0, 0)'

Object.keys(contours).forEach(function(c){

  ctx.strokeStyle = makeColor(c, maxTime)
  console.log(c, ctx.strokeStyle, contours[c].length)

  contours[c].slice(0,1009).forEach(function(pts){
    var start = makePoint(pts[0])
    ctx.moveTo(start[0], start[1])

    pts.slice(1).forEach(function(ll){
      var p = makePoint(ll)
      ctx.lineTo(p[0],p[1])
    })
    ctx.stroke();
  })

})
*/

var out = require('fs').createWriteStream(__dirname + '/out.png')
  , stream = canvas.createPNGStream();

stream.on('data', function(chunk){
    out.write(chunk);
});
