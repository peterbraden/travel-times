
// Points: iterator of points
// contours: iterator of contours
// dimensions: number of corners per point
module.exports = function(points, contours, dimension, bitmapLookup){
  var minRange = 0

  for (var maxRange in contours){
    var lines = []

    for (var point in points){
      var bmp = 0

      for (var dimension = 0; dimension < dimensions; dimensions ++){
        var corner = point[dimension]
        bmp |= (corner <= maxRange && corner > minRange) ? (1 << dimension) : 0;
      }

      lines = lines.concat(bitmapLookup(bmp, point)) 
    }

    contours[maxRange] = module.exports.joinSegments(lines)
    minRange = maxRange
  }

  return contours
}

var join = function(i, j, lines){
  lines[i] = lines[i].concat(lines[j].slice(1))
  lines.splice(j, 1)  
}

var equal = function(p1, p2){
  var tolerance = 0.00000000000001
  return Math.abs(p1[0] - p2[0]) < tolerance && Math.abs(p1[1] - p2[1]) < tolerance
}

var match = function(lines, x, y, reversed){
  if(reversed)
    lines[y].reverse()

  if (equal(lines[x][0], lines[y][0])){
    lines[y].reverse()
    join(y, x, lines)
    return true
  }
  return false
}

// Given an array of lines (arrays of points), simplify by joining continuous lines
// line = [ [ [x,y], [x2, y2] ], [ [x2, y2], [x3, y3] ] ] =>[ [ [x,y],[x2,y2],[x3,y3] ] ]
module.exports.joinSegments = function(lines) {
  var i = 0;
  while (i < lines.length){
    var changed = false

    for (var j = 0; j < lines.length && i < lines.length; j++){
      if (i == j){
        continue
      }

      if(match(lines, i, j) || match(lines, i, j, true)){
        changed = true
        continue
      }
    }

    if (!changed){
      i++;
    } else {
      i = 0
    }
  }
  return lines
}


// create new iterator of corner points from points[x][y] = value: {: <item>, northwest, northeast, southeast, southwest}
module.exports.squareCornerPointsIterator = function(points){


}

var midway = function(a,b){
  return [(parseFloat(a[0])+parseFloat(b[0])) / 2, (parseFloat(a[1])+parseFloat(b[1]))/2]
}


module.exports.dimensionFourKeypoints = function(bmp, tl, tr, bl, br){
  if (bmp > 15) throw "bitmap is over 4 dimensions"

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

  })[bmp]
  return ret
}

module.exports.dimensionThreeKeypoints = function(bmp, a, b, c){
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
