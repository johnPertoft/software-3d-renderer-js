window.onload = function() {
  var ctx = document.getElementById("canvas").getContext("2d");
  var WIDTH = ctx.canvas.width = window.innerWidth;
  var HEIGHT = ctx.canvas.height = window.innerHeight;

  loadTexture("cat.jpg")
    .then(function(texture) {
     
      var controls = Controls(ctx);
      var renderer = Renderer(ctx, WIDTH, HEIGHT);
      var scene = Scene(controls, texture);
      
      function draw() {
        renderer.drawBackground(); 
        renderer.drawScene(scene);
        // TODO: why is the background always covering the scene?
        //requestAnimationFrame(draw);
      }
    
      window.onresize = function() {
        WIDTH = ctx.canvas.width = window.innerWidth;
        HEIGHT = ctx.canvas.height = window.innerHeight;
      
        renderer = Renderer(ctx, WIDTH, HEIGHT);
        draw();
      }
      
      requestAnimationFrame(draw)
    });
}
