window.onload = function() {
  var WIDTH             = 800,
      HEIGHT            = 600,
      PLAYER_SPEED      = 3,
      ENEMY_WIDTH       = 50,
      ENEMY_HEIGHT      = 50,
      NUMBER_FONT_SIZE  = 20;

  Crafty.init(WIDTH, HEIGHT);
  Crafty.background("grey");
  
  Crafty.c("World", {
    init: function() {
      this.player = Crafty.e("2D, Color, DOM, Multiway")
        .attr({x: 400, y: 300, w: 50, h: 50})
        .color("white")
        .multiway(PLAYER_SPEED, {W: -90, S: 90, D: 0, A: 180});
        
      this.enemies = [];
      this.targetEnemies = [];
      
      this.bind("KeyDown", function(e) {
        if (e.key >= Crafty.keys['NUMPAD_0'] && e.key <= Crafty.keys['NUMPAD_9']) {
          var number = e.key - Crafty.keys['NUMPAD_0'];
          var valid_enemy_indices = [];
          var invalid_enemy_indices = [];
          
          // Go through and see if any of the targets are valid.
          for (var i = this.targetEnemies.length - 1; i >= 0; i--) {
            if (this.targetEnemies[i].tryDigit(number)) {
              valid_enemy_indices.push(i);
            } else {
              invalid_enemy_indices.push(i);
            }
          }
          
          // Go through and delete all of the targets that were not valid IF there is one or more valid targets
          if (valid_enemy_indices.length >= 1) {
            for (var i = invalid_enemy_indices.length - 1; i >= 0; i--) {
              this.targetEnemies.splice(invalid_enemy_indices[i], 1);
            }
          }
        }
        else if (e.key == Crafty.keys['ENTER']) {
          for (var i = this.targetEnemies.length - 1; i >= 0; i--) {
            if (this.targetEnemies[i].checkIfNumberComplete()) {
              for (var j = 0; j < this.enemies.length; j++) {
                if (this.enemies[j] == this.targetEnemies[i]) {
                  this.enemies.splice(j, 1);
                }
              }
              this.targetEnemies[i].destroyEnemy();
            }
            else {
              this.targetEnemies[i].resetCurDigitIndex();
            }
          }
          
          this.targetEnemies.length = 0;
          for (var i = 0; i < this.enemies.length; i++) {
            this.targetEnemies.push(this.enemies[i]);
          }
        }
      });
    },
    
    spawnEnemy: function() {
      this.enemies.push(Crafty.e("Enemy").difficulty(10));
    },
    
    startGame: function() {
      this.spawnEnemy();
      this.spawnEnemy();
      this.targetEnemies.length = 0;
      for (var i = 0; i < this.enemies.length; i++) {
        this.targetEnemies.push(this.enemies[i]);
      }
    }
  });
  
  Crafty.c("Enemy", {
    
    init: function() {
      this.addComponent("2D, Color, DOM");
      this.w = ENEMY_WIDTH;
      this.h = ENEMY_HEIGHT;
      this.x = Math.random() * 700;
      this.y = Math.random() * 500;
      this.color("red");
      this.curDigitIndex = 0;
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
          
      return this;
    },
    
    tryDigit: function(digit) {
      if (this.number[this.curDigitIndex] == digit) {
        this.curDigitIndex += 1;
        return true;
      }
      return false;
    },
    
    checkIfNumberComplete: function() {
      if (this.curDigitIndex == this.number.length) {
        return true;
      }
      return false;
    },
    
    resetCurDigitIndex: function() {
      this.curDigitIndex = 0;
    },
    
    destroyEnemy: function() {
      this.numberRef.destroy();
      this.destroy();
    }
  });
  
  Crafty.c("Number", {
    init: function() {
      this.addComponent("2D, Color, DOM, Text");
    }
  });
  
  Crafty.e("World").startGame();
};