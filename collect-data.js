var req = require('superagent')
  , fs = require('fs')
  , maxRequests = 1000



var BASE_URL= "https://maps.googleapis.com/maps/api/distancematrix/json?"
  , API_KEY= process.env.API_KEY
  , CENTER = JSON.parse(process.env.CENTER)
  , OUTFILE = process.env.DATA_FILE
  , BOUNDING_BOX = JSON.parse(process.env.BOUNDS)
  , OUT = require(OUTFILE)
  , misses = 0

console.log("Collecting data center:", CENTER, "bounds:", BOUNDING_BOX, " >", OUTFILE)

var getPoints = function(dests, cb){
  var query = "origins=" + CENTER.join(',')
  query += "&destinations=" + dests.map(function(c){return c.join(',')}).join('|')
  query += "&mode=transit"
  query += "&key=" + API_KEY
  console.log("get", dests.length)

  req.get(BASE_URL+query)
     .end(function(err, resp){
        if (err){
          console.log("API ERROR:", err)
        }
        handleResponse(dests, resp, cb)
      })
}

var handleResponse = function(req, resp, cb){
  var json = JSON.parse(resp.text)
    , out = {}
    , i = 0

  json.rows.forEach(function(r){
    r.elements.forEach(function(el){
      if (el.status && el.status == "ZERO_RESULTS"){
        misses ++
        i ++
        return
      }

      var dest = req[i]
        , dist = el.distance.value
        , duration = el.duration.value
      out[dest.join(',')] = {d: dist, t: duration}
      i++
    })
  })
  cb(null, out)
}

var randomPoint = function(bounding){
  var minLat = Math.min(bounding[0][0], bounding[1][0])
    , maxLat = Math.max(bounding[0][0], bounding[1][0])
    , latScale = maxLat - minLat
    , minLon = Math.min(bounding[0][1], bounding[1][1])
    , maxLon = Math.max(bounding[0][1], bounding[1][1])
    , lonScale = maxLon - minLon

  return [ (minLat + Math.random() * latScale)
         , (minLon + Math.random() * lonScale)]
}

var storeResults = function(err, res){
  if (err)
    throw err

  Object.keys(res).forEach(function(k){
    OUT[k] = res[k]
  })

  fs.writeFileSync(OUTFILE, JSON.stringify(OUT), 'utf8')
}


var sent = 0

var rateLimitGet = function(coordGen){

  var ratePerReq = 30 //99
    , timeout = 60*1000*10 // 10 min for now
    , dests = []

  if (sent > maxRequests){
    console.log("Exceeded rate limit, sleep for Day :", sent)
    maxRequests += sent
    return setTimeout(rateLimitGet.bind(null, coordGen), 1000*60*60*24)
    //process.exit(0)
  }

  for (var i=0; i<ratePerReq; i++){
    dests.push(coordGen(BOUNDING_BOX))
  }

  getPoints(dests, function(err, res){
    sent += Object.keys(res).length
    storeResults.apply(this, arguments)
    console.log("CB:", sent, Object.keys(OUT).length, misses)

    setTimeout(rateLimitGet.bind(null, coordGen), timeout)
  })
}


rateLimitGet(randomPoint)


