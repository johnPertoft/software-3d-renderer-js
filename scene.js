var Scene = function(controls, texture) {
  /**
   * The world coordinate system is defined as follows:
   * x increases to the right,
   * y increases upwards,
   * z increases into the screen
   *
   * Vertices in a triangle should be specified in
   * counter clockwise order in order to define the face
   * that should be visible.
   */
 
  // Register controls for this scene.
  var orgX = undefined;
  var rotation = 0; // radians
  controls.addMouseDownEvent(function(e) {
    orgX = e.x; 
  });
  controls.addMouseUpEvent(function(e) {
    orgX = undefined; 
  });
  controls.addMouseDragEvent(function(e) {
    var offset = e.x - orgX;
    rotation = Math.PI * offset / 200;
  });

  function _cameraPosition() {
    return vec3.fromValues(0, 2.5, -4);
  }
  
  function _lightInformation() {
    return {
      lightPosition: vec3.fromValues(-4, 4, -4),
      lightPower: vec3.fromValues(500, 500, 500),
      indirectLightPower: vec3.fromValues(0.1, 0.1, 0.1)
    }
  }
  
  function _transformationMatrix() {
    var R = mat4.create();
    return mat4.rotateY(R, R, rotation);
  }

  // Right now, for simplicity, we only use world coordinates
  function _triangles() {
    
    // Cube is positioned on the origin
    var leftX = -1.5;
    var rightX = 1.5;
    var downY = -1.5;
    var upY = 1.5;
    var frontZ = -1.5;
    var backZ = 1.5;

    var a = vec3.fromValues(leftX, upY, frontZ);
    var b = vec3.fromValues(leftX, downY, frontZ);
    var c = vec3.fromValues(rightX, downY, frontZ);
    var d = vec3.fromValues(rightX, upY, frontZ);
    var e = vec3.fromValues(leftX, upY, backZ);
    var f = vec3.fromValues(leftX, downY, backZ);
    var g = vec3.fromValues(rightX, downY, backZ);
    var h = vec3.fromValues(rightX, upY, backZ);

    var lightgreen = vec3.fromValues(77/255, 204/255, 157/255);
    var lightpink = vec3.fromValues(194/255, 86/255, 146/255);

    var colorTexture1 = new ColorTexture(lightgreen);
    var colorTexture2 = new ColorTexture(lightpink);
    
    var th = texture.h - 1;
    var tw = texture.w - 1;
    
    // TODO: must define some order that these should be given in.
    // TODO: and also handle case where pixels are flipped in rasterizer I think
    var upperTextureCoords = [[tw, th], [tw, 0], [0, 0]];
    var lowerTextureCoords = [[0, th], [tw, th], [0, 0]];

    // A cube
    return [
      // front
      new Triangle(b, c, a, texture, lowerTextureCoords),
      new Triangle(c, d, a, texture, upperTextureCoords),

      // left
      new Triangle(a, f, b, colorTexture2),
      new Triangle(a, e, f, colorTexture1),

      // right
      new Triangle(c, g, d, colorTexture1),
      new Triangle(g, h, d, colorTexture2),

      // bottom
      new Triangle(c, b, f, colorTexture1),
      new Triangle(c, f, g, colorTexture1),

      // top
      new Triangle(a, h, e, colorTexture1),
      new Triangle(a, d, h, colorTexture2),

      // back
      new Triangle(e, h, f, colorTexture2),
      new Triangle(h, g, f, colorTexture2)
    ];
  }
 
  return {
    transformationMatrix: _transformationMatrix,
    cameraPosition: _cameraPosition,
    lightInformation: _lightInformation,
    triangles: _triangles
  };
};
