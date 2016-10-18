function Triangle(v1, v2, v3, texture, texCoords) {
  this.v1 = v1; 
  this.v2 = v2; 
  this.v3 = v3;
  this.texture = texture;
  this.texCoords = texCoords;
  
  /*
   * Compute the normal of this triangle. Assumes that the
   * vertices are given in counter clockwise order.
   */
  this.normal = vec3.create();
  var e1 = vec3.create();
  var e2 = vec3.create();
  vec3.sub(e1, v2, v1);
  vec3.sub(e2, v3, v1);
  vec3.cross(this.normal, e2, e1);
  vec3.normalize(this.normal, this.normal);
}
