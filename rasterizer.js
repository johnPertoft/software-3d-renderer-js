var Rasterizer = function(ctx, width, height) {

  // TODO: These should be parameters
  var PIXEL_SIZE = 5;
  var MAX_WIDTH = Math.floor(width / PIXEL_SIZE);
  var MAX_HEIGHT = Math.floor(height / PIXEL_SIZE);
  
  // Create a depth buffer
  var depthBuffer = _.times(MAX_HEIGHT, function() {
    var rowDB = new Array(MAX_WIDTH);
    return _.fill(rowDB, -1.0); 
  });

  function pixelShader(p, normal, lightInfo, texture) {
    var color = texture.getColor(p.u, p.v);

    // Return if pixel is outside screeen
    if (p.x < 0 || p.x >= MAX_WIDTH || p.y < 0 || p.y >= MAX_HEIGHT) return; 
    
    // TODO: is this z-fighting?
    if (p.zinv - depthBuffer[p.y][p.x] > 0.05) {// TODO: this produces "prettier" lines
    //if (p.zinv > depthBuffer[p.y][p.x]) {
      depthBuffer[p.y][p.x] = p.zinv;
     
      // Lighting
      var rvec = vec3.create();
      vec3.sub(rvec, lightInfo.lightPosition, p.pos3d);
      var r = vec3.length(rvec);
      vec3.normalize(rvec, rvec);
      var dot = Math.max(vec3.dot(rvec, normal), 0);
      var illuminatedColor = vec3.clone(color);
      var distanceFactor = 1.0 / (r * r * 4 * Math.PI);
      var D = vec3.create();
      vec3.scale(D, lightInfo.lightPower, dot * distanceFactor);
      vec3.add(D, D, lightInfo.indirectLightPower);
      vec3.mul(illuminatedColor, color, D);
     
      _putPixel(p.x, p.y, illuminatedColor);
    }
  }

  /**
   * Converts a vec3 to a form that canvas context
   * accepts.
   */
  function vec3ToCanvasColor(color) {
    var c = vec3.create();
    vec3.scale(c, color, 255);
    return "rgb(" + 
      Math.round(c[0]) + "," + 
      Math.round(c[1]) + "," + 
      Math.round(c[2]) + ")";
  }

  /**
   * Sets the pixel at (x, y) to the given color.
   *
   * This is the "lowest level" in this software renderer.
   * Should only be called through the pixelshader.
   */
  function _putPixel(x, y, color) {
    ctxX = x * PIXEL_SIZE;
    ctxY = y * PIXEL_SIZE;
    ctx.fillStyle = vec3ToCanvasColor(color); 
    ctx.fillRect(Math.round(ctxX)+1, Math.round(ctxY)+1, 
        PIXEL_SIZE-1, PIXEL_SIZE-1);  
  }
  
  // TODO: refactor solution for interpolating all this stuff
  // Might want different interpolation methods for different things
  /**
   * Linearly interpolates all values for two pixels
   * and returns a list of the new pixels in between.
   */
  function interpolateLine(p1, p2) {
    var numPixels = Math.max(Math.abs(p1.x-p2.x), Math.abs(p1.y-p2.y)) + 1;
    var pixels = new Array(numPixels);

    var divisor = Math.max(numPixels - 1, 1);
    var xStep = (p2.x - p1.x) / divisor;
    var yStep = (p2.y - p1.y) / divisor;
    var zinvStep = (p2.zinv - p1.zinv) / divisor;
    var pos3dStep = vec3.create();
    vec3.sub(pos3dStep, p2.pos3d, p1.pos3d);
    vec3.scale(pos3dStep, pos3dStep, 1 / divisor);
    var uStep = (p2.u - p1.u) / divisor;
    var vStep = (p2.v - p1.v) / divisor;

    var xCurrent = p1.x;
    var yCurrent = p1.y;
    var zinvCurrent = p1.zinv;
    var pos3dCurrent = vec3.clone(p1.pos3d);
    var uCurrent = p1.u;
    var vCurrent = p1.v;
    for (var i = 0; i < numPixels; i++) {
      pixels[i] = new Pixel(
          Math.round(xCurrent), 
          Math.round(yCurrent), 
          zinvCurrent,
          vec3.clone(pos3dCurrent),
          Math.round(uCurrent),
          Math.round(vCurrent));

      xCurrent += xStep;
      yCurrent += yStep;
      zinvCurrent += zinvStep;
      vec3.add(pos3dCurrent, pos3dCurrent, pos3dStep);
      uCurrent += uStep;
      vCurrent += vStep;
    }
    
    return pixels;
  }
 
  /**
   * Draws a line between two pixels.
   */
  function _drawLine(p1, p2, normal, lightInfo, texture) {
    pixels = interpolateLine(p1, p2)
    _.forEach(pixels, function(p) {
      pixelShader(p, normal, lightInfo, texture); 
    });
  }
  
  /**
   * Draws the edges of a triangle defined by the three pixels given.
   */
  function _drawTriangle(p1, p2, p3, normal, lightInfo, texture) {
    _drawLine(p1, p2, normal, lightInfo, texture);
    _drawLine(p2, p3, normal, lightInfo, texture);
    _drawLine(p3, p1, normal, lightInfo, texture);
  }
  
  /**
   * Draws a filled triangle defined by the three pixels given.
   */
  function _fillTriangle(p1, p2, p3, normal, lightInfo, texture) {
    // TODO: rewrite with Barycentric coordinates technique instead
    // TODO: maybe handle some degenerate cases beforehand?
    
    // Order p1, p2, p3 in increasing order 
    // on y coordinate (by swapping)
    if (p1.y > p2.y) { t = p1, p1 = p2, p2 = t; }
    if (p1.y > p3.y) { t = p1, p1 = p3, p3 = t; }
    if (p2.y > p3.y) { t = p2, p2 = p3, p3 = t; }
  
    var p1p2 = interpolateLine(p1, p2);
    var p1p3 = interpolateLine(p1, p3);
    var p2p3 = interpolateLine(p2, p3);
    
    var rows = p3.y - p1.y + 1;
    var leftPixels = new Array(rows);
    var rightPixels = new Array(rows);

    // Initialize x-coordinates of left- and rightPixels
    for (var i = 0; i < rows; i++) {
      // TODO: Ok to leave zinv and pos3d undefined here?
      // Will probably be a problem at the edges of the screen.
      leftPixels[i] = new Pixel(MAX_WIDTH, p1.y + i);
      rightPixels[i] = new Pixel(0, p1.y + i);  
    }

    // TODO: I think we can make this faster by seeing that leftPixels are
    // p1p3 if p2.x > p3.x and rightPixels are p1p2 and p2p3 (vice versa if 
    // p3.x > p2.x

    // For each edge find the left- and rightmost pixels
    _.forEach([p1p2, p1p3, p2p3], function(edge) {
      _.forEach(edge, function(p) {
        var i = p.y - p1.y;

        if (p.x > rightPixels[i].x) {
          rightPixels[i].x = p.x;
          rightPixels[i].zinv = p.zinv;
          rightPixels[i].pos3d = p.pos3d;
          rightPixels[i].u = p.u;
          rightPixels[i].v = p.v;
        }

        if (p.x < leftPixels[i].x) {
          leftPixels[i].x = p.x;
          leftPixels[i].zinv = p.zinv;
          leftPixels[i].pos3d = p.pos3d;
          leftPixels[i].u = p.u;
          leftPixels[i].v = p.v;
        }
      });
    });

    for (var i = 0; i < rows; i++) {
      var rowPixels = interpolateLine(leftPixels[i], rightPixels[i]);
      _.forEach(rowPixels, function(p) { 
        pixelShader(p, normal, lightInfo, texture); 
      });
    }
  }

  function _flush() {
    // draw everything in the frame buffer
    // and reset it
  }

  return {
    drawTriangle: _drawTriangle,
    fillTriangle: _fillTriangle,
    flush: _flush
  };
};
