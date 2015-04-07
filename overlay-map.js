var DATA_FILE = process.env.DATA_FILE
  , DATA = require(DATA_FILE)
  , IMG_LONGSIDE = parseInt(process.env.IMGLONGSIDE) || 500

var req = require('superagent')
  , geoViewport = require('geo-viewport')

var points = Object.keys(DATA).map(function(x){return x.split(',').map(parseFloat)})
  , subdivisions = {}
  , minLat = Math.min.apply(Math, points.map(function(p){return p[0]}))
  , minLon = Math.min.apply(Math, points.map(function(p){return p[1]}))
  , maxLat = Math.max.apply(Math, points.map(function(p){return p[0]}))
  , maxLon = Math.max.apply(Math, points.map(function(p){return p[1]}))
  , BOX = [[minLat, minLon], [maxLat, maxLon]]
  , HEIGHT = (maxLat-minLat) > (maxLon - minLon) ? IMG_LONGSIDE : IMG_LONGSIDE * ((maxLat-minLat)/(maxLon-minLon))
  , WIDTH = (maxLon-minLon) > (maxLat - minLat) ? IMG_LONGSIDE : IMG_LONGSIDE * ((maxLon-minLon)/(maxLat-minLat))
  , BASE_URL = "http://api.tiles.mapbox.com/v4/{mapid}/{lon},{lat},{z}/{width}x{height}.{format}?access_token={accessToken}"
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , canvas = new Canvas(WIDTH, HEIGHT)
  , ctx = canvas.getContext('2d')
 

console.log("WIDTH", WIDTH, "HEIGHT", HEIGHT)
console.log("MIN LAT", minLat, "MIN LON", minLon)
console.log("MAX LAT", maxLat, "MAX LON", maxLon)

var view = geoViewport.viewport([BOX[0][0], BOX[0][1], BOX[1][0], BOX[1][1]], [WIDTH*2, HEIGHT*2])
  , bounds = geoViewport.bounds(view.center, view.zoom, [WIDTH, HEIGHT])
  , url = BASE_URL
            .replace('{mapid}', 'mapbox.light')
            .replace('{lon}', view.center[1])
            .replace('{lat}', view.center[0])
            .replace('{z}', view.zoom)
            .replace('{width}', parseInt(WIDTH))
            .replace('{height}', parseInt(HEIGHT))
            .replace('{format}', 'png')
            .replace('{accessToken}', process.env.MAPBOX_API)


console.log("VIEWPORT", view)
console.log("BOUNDS", bounds)
console.log("URL", url)


var inset = [
              [
                (BOX[0][0] -  bounds[0]) / (bounds[2] - bounds[0]) // minLat
              , (BOX[0][1] -  bounds[1]) / (bounds[3] - bounds[1]) // minLon
              ]
            , [
                (BOX[1][0] -  bounds[0]) / (bounds[2] - bounds[0]) // maxLat
              , (BOX[1][1] -  bounds[1]) / (bounds[3] - bounds[1]) // maxLon
              ]
            ]

console.log("AREA INSET", inset)

var makePoint = function(pt){ 
  return [
      (pt[0]-minLat) / (maxLat-minLat) * WIDTH
    , HEIGHT - ((pt[1]-minLon) / (maxLon-minLon) * HEIGHT)
  ]
}

req.get(url).end(function(err, resp){

  var img = new Image
  img.src = resp.body
  ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);

  // Outline area:
  ctx.strokeStyle = "#f00"
  ctx.strokeRect(inset[0][1] * WIDTH, inset[0][0] * HEIGHT, (inset[1][1]-inset[0][1]) * WIDTH, (inset[1][0]-inset[0][0]) * HEIGHT);
  console.log("RECT", inset[0][1] * WIDTH, inset[0][0] * HEIGHT, (inset[1][1]-inset[0][1]) * WIDTH, (inset[1][0]-inset[0][0]) * HEIGHT);

  ctx.strokeStyle = "#00f"
  var boundsp = makePoint([bounds[0], bounds[1]])
  ctx.strokeRect(boundsp[0], boundsp[1], 5, 5);
  console.log(boundsp)
  


  var out = require('fs').createWriteStream(__dirname + '/out.png')
  , stream = canvas.createPNGStream();

  stream.on('data', function(chunk){
      out.write(chunk);
  });
})
