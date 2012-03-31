window.onload = function() {
  var WIDTH     = 800,
      HEIGHT    = 600;

  Crafty.init(WIDTH, HEIGHT);
  Crafty.background("grey");

  Crafty.e("2D, Color, DOM, Multiway")
    .attr({x: 50, y: 50, w: 50, h: 50})
    .color("red")
    .fourway(5)
    .multiway({W: -90, S: 90, D: 0, A: 180});
};
