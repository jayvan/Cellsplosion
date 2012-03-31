window.onload = function() {
  var WIDTH           = 800,
      HEIGHT          = 600,
      PLAYER_SPEED    = 3;

  Crafty.init(WIDTH, HEIGHT);
  Crafty.background("grey");

  var player = Crafty.e("2D, Color, DOM, Multiway")
    .attr({x: 50, y: 50, w: 50, h: 50})
    .color("red")
    .speed(PLAYER_SPEED)
    .multiway(3, {W: -90, S: 90, D: 0, A: 180});
};
