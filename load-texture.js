(function() {
  var textureCanvas = document.createElement("canvas");
  var ctx = textureCanvas.getContext("2d");
  
  function toRGB2D(imgData) {
    var fullSize = imgData.data.length;
    var w = imgData.width;
    var h = imgData.height;
    var rgbData = _.times(h, function(r) {
      var row = new Array(w);
      return _.times(w, function(c) {
        var i = r * (w*4) + (c*4);
        return [imgData.data[i]/255, imgData.data[i+1]/255, imgData.data[i+2]/255];
      });
    });
    
    return rgbData;
  }
  
  // Expose globally
  loadTexture = function(file) {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.src = file;
      img.onload = function() {
        var w = ctx.canvas.width = img.width;
        var h = ctx.canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        var rgbData = toRGB2D(ctx.getImageData(0, 0, w, h));
        
        resolve(new Texture(rgbData));
      };
    });
  }
})();
