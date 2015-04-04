var DATA_FILE = process.env.DATA_FILE
  , DATA = require(DATA_FILE)
  , NUM_INTERVALS = 9
  , SQUARES = 15
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , WIDTH=500
  , HEIGHT=500
  , canvas = new Canvas(WIDTH, HEIGHT)
  , ctx = canvas.getContext('2d')

var sum = function(){
  return Array.prototype.reduce.call(arguments, function(x, y){return x + y}, 0)
}
 
var points = Object.keys(DATA).map(function(x){return x.split(',').map(parseFloat)})
  , subdivisions = {}
  , minLat = Math.min.apply(Math, points.map(function(p){return p[0]}))
  , minLon = Math.min.apply(Math, points.map(function(p){return p[1]}))
  , maxLat = Math.max.apply(Math, points.map(function(p){return p[0]}))
  , maxLon = Math.max.apply(Math, points.map(function(p){return p[1]}))
  , maxDist = 0
  , maxTime = 0

for (var inc = ((maxLat-minLat)/SQUARES), i = minLat + inc; i <= maxLat; i += inc){
  
  subdivisions[i] = {}

  for (var j = minLon; j <= maxLon; j += ((maxLon-minLon)/SQUARES)){
    subdivisions[i][j] = []
  }
}


points.forEach(function(p){
  var gt = Object.keys(subdivisions).filter(function(x){return x > p[0]})
    , mlat = gt[0]
    // TODO - handle exceed better
    if (gt.length == 0) return;
    
  gt = Object.keys(subdivisions[mlat]).filter(function(x){return x > p[1]})
  if (gt.length == 0) return;
  var mlon = gt[0]

  subdivisions[mlat][mlon].push(p)
})


Object.keys(subdivisions).forEach(function(lat){
  Object.keys(subdivisions[lat]).forEach(function(lon){
    var times = subdivisions[lat][lon].map(function(x){
      maxTime = Math.max(DATA[x].t, maxTime)
      maxDist = Math.max(DATA[x].d, maxDist)
      return DATA[x].t
    })
    var avg = (sum.apply(null, times) / subdivisions[lat][lon].length)

    subdivisions[lat][lon] = avg

  })
})

//console.log(subdivisions, maxTime)


var contours = {}

var midway = function(a,b){
  return [(parseFloat(a[0])+parseFloat(b[0])) / 2, (parseFloat(a[1])+parseFloat(b[1]))/2]
}

var getLines = function(bmp, tl, tr, bl, br){
  var ret = ({
    0 : []
  , 1: [[midway(tl, bl), midway(tl, tr)]]// TL is above
  , 2: [[midway(tl, tr), midway(tr, br)]]// TR is above
  , 3: [[midway(tl, bl), midway(tr, br)]]// TL + TR
  , 4: [[midway(tl, bl), midway(bl, br)]]// BL
  , 5: [[midway(tl, tr), midway(bl, br)]]// BL, TL
  , 6: [[midway(tl, bl), midway(bl, br)], [midway(tl, tr), midway(tr, br)]] // BL, TR ==> saddle
  , 7: [[midway(br, tr), midway(br, bl)]]// BL, TR, TL
  , 8: [[midway(br, tr), midway(br, bl)]] // BR (also BL)
  , 9: [[midway(br, tr), midway(br, bl)], [midway(tl, tr), midway(tl,bl)]]// BR, TL ==> saddle
  , 10: [[midway(tr, tl), midway(br, bl)]] // BR, TR
  , 11: [[midway(br, bl), midway(bl, tl)]]// BR, TR, TL ==> BL
  , 12: [[midway(br, tr), midway(bl, tl)]]// BR, BL
  , 13: [[midway(tr, tl), midway(tr, br)]]// BR, BL, TL ==> TR
  , 14: [[midway(tl, tr), midway(tl, bl)]]// BR, BL, TR ==> TL
  , 15: []// BR, BL, TR, TL

  })[bmp] || []
  return ret
}


for (var i = 0; i < 1; i += 1/NUM_INTERVALS){
  var maxInterval = maxTime * i
    , minInterval = Math.max(0, maxTime * (i-1))
    , lats = function(x){ return Object.keys(subdivisions)[x]}
    , lons = function(x, y){return Object.keys(subdivisions[lats(x)])[y]}
    , get = function(x, y){return subdivisions[x][y]}
    , lines = []

  for (var x = 0; x < SQUARES - 1; x++){
    for (var y = 0; y < SQUARES - 1; y++){
      var tlp = [lats(x), lons(x,y)]
        , tl = get.apply(null, tlp)
        , trp = [lats(x+1), lons(x+1, y)]
        , tr = get.apply(null, trp)
        , blp = [lats(x), lons(x, y+1)]
        , bl = get.apply(null, blp)
        , brp = [lats(x+1), lons(x+1, y+1)]
        , br = get.apply(null, brp)
        , bitmap = 0
    
      bitmap |= (tl <= maxInterval && tl > minInterval) ? 1 : 0
      bitmap |= (tr <= maxInterval && tr > minInterval) ? 2 : 0
      bitmap |= (bl <= maxInterval && bl > minInterval) ? 4 : 0
      bitmap |= (br <= maxInterval && br > minInterval) ? 8 : 0

      lines = lines.concat(getLines(bitmap, tlp, trp, blp, brp))
    }
  }
  contours[maxInterval] = lines
}

// -- draw it

var makePoint = function(pt){ 
  return [
      (pt[0]-minLat) / (maxLat-minLat) * WIDTH
    , HEIGHT - ((pt[1]-minLon) / (maxLon-minLon) * HEIGHT)
  ]
}  
var makeColor = function(val, max){ return "hsla(" + (val/max*180) + ", 100%, 50%,0.5)"}

// DEBUG, shade mesh
Object.keys(subdivisions).forEach(function(lat){
  Object.keys(subdivisions[lat]).forEach(function(lon){
    var pt = makePoint([lat, lon])
    ctx.fillStyle = makeColor(subdivisions[lat][lon], maxTime)
    ctx.fillRect(pt[0], pt[1], WIDTH/SQUARES, HEIGHT/SQUARES)
  })
})

Object.keys(contours).forEach(function(c){

  ctx.strokeStyle = makeColor(c, maxTime)
  console.log(c, ctx.strokeStyle, contours[c].length)

  contours[c].forEach(function(pts){
    ctx.beginPath()
    var start = makePoint(pts[0])
    ctx.moveTo(start[0], start[1])

    pts.slice(1).forEach(function(ll){
      var p = makePoint(ll)
      ctx.lineTo(p[0],p[1])
    })
    ctx.stroke();
  })
})

//*/
var HB =[47.377212,8.540046]
  , ENGE= [47.364254, 8.531141]

ctx.fillStyle ="#fff"
ctx.fillRect(makePoint(HB)[0], makePoint(HB)[1], 5, 5)

ctx.fillStyle ="#bbb"
ctx.fillRect(makePoint(ENGE)[0], makePoint(ENGE)[1], 5, 5)
  
var out = require('fs').createWriteStream(__dirname + '/out.png')
  , stream = canvas.createPNGStream();

stream.on('data', function(chunk){
    out.write(chunk);
});
