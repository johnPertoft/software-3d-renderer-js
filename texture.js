(function() {
  
  Texture = function(texture) {
    this.texture = texture;
    this.h = texture.length;
    this.w = texture[0].length;
  };

  Texture.prototype.getColor = function(u, v) {
    return this.texture[v][u];
  };

  ColorTexture = function(color) {
    this.color = color;
  };

  ColorTexture.prototype.getColor = function() {
    return this.color;
  };
})();
