window.onload = function() {
  var WIDTH             = 800,
      HEIGHT            = 600,
      PLAYER_SPEED      = 3,
      ENEMY_WIDTH       = 50,
      ENEMY_HEIGHT      = 50,
      NUMBER_FONT_SIZE  = 20;

  Crafty.init(WIDTH, HEIGHT);
  Crafty.background("grey");
  
  Crafty.c("Enemy", {
    
    init: function() {
      this.addComponent("2D, Color, DOM");
      this.w = ENEMY_WIDTH;
      this.h = ENEMY_HEIGHT;
      this.x = Math.random() * 700;
      this.y = Math.random() * 500;
      this.color("red");
    },
    
    difficulty: function(length) {
      this.number = "";
      for (var i = 0; i < length; i++) {
        this.number += Crafty.math.randomInt(0, 9);
      }
      this.numberRef = Crafty.e("Number")
        .text(this.number)
        .attr({
          x: this.x - NUMBER_FONT_SIZE * this.number.length / 2 + this.w / 2,
          y: this.y - NUMBER_FONT_SIZE + 3,
          w: NUMBER_FONT_SIZE * this.number.length,
          h: NUMBER_FONT_SIZE });
    }
  });
  
  Crafty.c("Number", {
    init: function() {
      this.addComponent("2D, Color, DOM, Text");
    }
  });
  
  Crafty.e("Enemy").difficulty(5);
  Crafty.e("Enemy").difficulty(10);

  var player = Crafty.e("2D, Color, DOM, Multiway")
    .attr({x: 400, y: 300, w: 50, h: 50})
    .color("white")
    .multiway(PLAYER_SPEED, {W: -90, S: 90, D: 0, A: 180});
};
