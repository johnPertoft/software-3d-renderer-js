var Controls = function(ctx) {
 
  var mouseDownEvents = [];
  var mouseUpEvents = [];
  var mouseDragEvents = [];

  var mouseDown = false;
  
  ctx.canvas.onmousedown = function(e) {
    mouseDown = true;
    _.forEach(mouseDownEvents, function(f) { f(e); }); 
  };

  ctx.canvas.onmouseup = function(e) {
    mouseDown = false;
    _.forEach(mouseUpEvents, function(f) { f(e); }); 
  };

  ctx.canvas.onmousemove = function(e) {
    if (mouseDown) {
      _.forEach(mouseDragEvents, function(f) { f(e); });
    }
  };

  function _addMouseDownEvent(func) {
    mouseDownEvents.push(func);
  }

  function _addMouseUpEvent(func) {
    mouseUpEvents.push(func);
  }

  function _addMouseDragEvent(func) {
    mouseDragEvents.push(func);
  }

  return {
    addMouseDownEvent: _addMouseDownEvent,
    addMouseUpEvent: _addMouseUpEvent,
    addMouseDragEvent: _addMouseDragEvent
  };
};
