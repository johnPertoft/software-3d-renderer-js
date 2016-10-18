function Pixel(x, y, zinv, pos3d, u, v) {
  this.x = x;
  this.y = y;
  this.zinv = zinv;
  this.pos3d = pos3d;
  if (_.isUndefined(v)) {
    this.u = 0;
    this.v = 0;
  } else {
    this.u = u;
    this.v = v;
  }
}
