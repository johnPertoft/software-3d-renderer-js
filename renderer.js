var Renderer = function(ctx, width, height) {
  var rasterizer = Rasterizer(ctx, width, height);
  
  // TODO: keep these somewhere else
  var PIXEL_SIZE = 5;
  var MAX_WIDTH = Math.floor(width / PIXEL_SIZE);
  var MAX_HEIGHT = Math.floor(height / PIXEL_SIZE);
  var BACKGROUND_COLOR = "#000";
  var GRID_COLOR = "#333";
  
  // Renderer settings
  var focalLength = MAX_WIDTH / 1.5; 
  var fovY = Math.PI * 0.5;
  var up = vec3.fromValues(0, 1, 0);
  var center = vec3.fromValues(0, 0, 0);
  var aspect = MAX_WIDTH / MAX_HEIGHT;
  var nearPlane = 1;
  var farPlane = 100;
  
  /**
   * Draws the background and the lines of the pseudo pixel grid.
   */
  function _drawBackground() {
    // Draw the background
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);
    
    // Draw the lines of the pseudo pixel grid
    rows = _.range(0.5, height, PIXEL_SIZE);
    cols = _.range(0.5, width, PIXEL_SIZE);
    _.forEach(rows, function(row) {
      ctx.moveTo(0, row);
      ctx.lineTo(width, row);
    });
    _.forEach(cols, function(col) {
      ctx.moveTo(col, 0);
      ctx.lineTo(col, height);
    });
    ctx.lineWidth = 1;
    ctx.strokeStyle = GRID_COLOR;
    ctx.stroke();
  }
  
  /**
   * Rotates, translates, and projects a 3d vertex to a pixel coordinate.
   *
   * v is assumed to be in world space coordinates. First rotation/translation
   * is applied. Then modelView matrix into viewspace, then the projection
   * matrix into clipspace, and then finally into screen coordinates.
   */
  function vertexShader(v, matrices) {
    var Q = vec4.create();
    var V = vec4.fromValues(v[0], v[1], v[2], 1)
    
    // First any possible transformation in worldspace
    vec4.transformMat4(V, V, matrices.transformation);
    
    // Save the transformed 3d position
    var pos3d = vec3.fromValues(V[0], V[1], V[2]);
    
    // ModelView and projection transformations
    vec4.transformMat4(Q, V, matrices.modelView);
    vec4.transformMat4(Q, Q, matrices.projection);
    var z = (Q[2] + 1) / 2; // TODO: something is still wrong with the depth test
    vec4.scale(Q, Q, 1 / Q[3]);

    // TODO: should clip ndc-space coords outside [-1, 1]

    var px = Math.round((Q[0] + 1) / 2 * MAX_WIDTH);
    var py = Math.round((Q[1] + 1) / 2 * MAX_HEIGHT);
    var pzinv = 1 / z;
    
    // Finally flip y-coordinate since in the screen coordinates
    // y increases downward
    py = MAX_HEIGHT - py;
   
    return new Pixel(px, py, pzinv, pos3d);
  }
  
  /**
   * Renders a triangle if its normal is not perpendicular or 
   * directed away from the camera.
   */
  // TODO: color is temp parameter
  function renderTriangle(t, matrices, cameraPosition, lightInformation) {
    // Run vertex shader on each vertex in the triangle
    p1 = vertexShader(t.v1, matrices);
    p2 = vertexShader(t.v2, matrices);
    p3 = vertexShader(t.v3, matrices);
    
    // TODO: This is probably going to fuck up
    // when pixel order is flipped in rasterizer when
    // drawing the triangle
    if (!_.isUndefined(t.texCoords)) {
      var tc = t.texCoords;
      p1.u = tc[0][0]; p1.v = tc[0][1]; 
      p2.u = tc[1][0]; p2.v = tc[1][1]; 
      p3.u = tc[2][0]; p3.v = tc[2][1]; 
    }
    
    // If this triangle is perpendicular or turned away from camera
    // don't draw it.
    var tx = (p1.pos3d[0] + p2.pos3d[0] + p3.pos3d[0]) / 3;
    var ty = (p1.pos3d[1] + p2.pos3d[1] + p3.pos3d[1]) / 3;
    var tz = (p1.pos3d[2] + p2.pos3d[2] + p3.pos3d[2]) / 3;
    var triangleMid = vec3.fromValues(tx, ty, tz);
    var triangleToCamera = vec3.create();
    vec3.sub(triangleToCamera, cameraPosition, triangleMid);
    var N = vec3.clone(t.normal);
    vec3.transformMat4(N, N, matrices.transformation);
    if (vec3.dot(triangleToCamera, N) <= 0) return;

    // Then raster the resulting 2d triangle
    rasterizer.fillTriangle(p1, p2, p3, t.normal, lightInformation, t.texture);
    //rasterizer.drawTriangle(p1, p2, p3, t.normal, lightInformation, t.texture);
  }
  
  /**
   * Generates the modelView and projection matrices.
   */
  function generateMatrices(scene) {
    var modelView = mat4.create();
    var projection = mat4.create();
    mat4.lookAt(modelView, scene.cameraPosition(), center, up);
    mat4.perspective(projection, fovY, aspect, nearPlane, farPlane); 
    
    return {
      transformation: scene.transformationMatrix(),
      modelView: modelView,
      projection: projection
    }
  }

  /**
   * Draws the given scene.
   */
  function _drawScene(scene) {
    var matrices = generateMatrices(scene);

    _.forEach(scene.triangles(), function(t) {
      renderTriangle(t, matrices, scene.cameraPosition(), scene.lightInformation()); 
    });
  }

  return {
    drawBackground: _drawBackground,
    drawScene: _drawScene
  };
};
