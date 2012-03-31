window.onload = function() {
  var VIEWPORT_WIDTH            = 800,
      VIEWPORT_HEIGHT           = 600,
      HALF_VIEWPORT_WIDTH       = VIEWPORT_WIDTH / 2,
      HALF_VIEWPORT_HEIGHT      = VIEWPORT_HEIGHT / 2,
      PLAYER_SPEED              = 25,
      ENEMY_WIDTH               = 50,
      ENEMY_HEIGHT              = 50,
      NUMBER_FONT_SIZE          = 20,
      WORLD_WIDTH               = VIEWPORT_WIDTH * 3,
      WORLD_HEIGHT              = VIEWPORT_HEIGHT * 3,
      WALL_SIZE                 = 100,
      PLAYER_WIDTH              = 50,
      PLAYER_HEIGHT             = 50,
      INITIAL_ENEMY_COUNT       = 5,
      FLOOR_IMAGE               = 'img/floor.jpg';

  Crafty.init(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  Crafty.background("grey");
  
  Crafty.c("World", {
    init: function() {

      this.player = Crafty.e("2D, Color, DOM, Multiway")
        .attr({x: 400, y: 300, w: PLAYER_WIDTH, h: PLAYER_HEIGHT, z: 5})
        .color("white")
        .multiway(PLAYER_SPEED, {W: -90, S: 90, D: 0, A: 180});
      
      this.enemies = [];
      this.targetEnemyIndices = [];
      this.typedNumber = "";

      this.bind("KeyDown", function(e) {
        if (e.key >= Crafty.keys['NUMPAD_0'] && e.key <= Crafty.keys['NUMPAD_9']) {
          var number = e.key - Crafty.keys['NUMPAD_0'];
          var validEnemyIndices = [];
          var invalidEnemyIndices = [];
          
          // Go through and see if any of the targets are valid.
          for (var i = this.targetEnemyIndices.length - 1; i >= 0; i--) {
            if (this.enemies[this.targetEnemyIndices[i]].tryDigit(number)) {
              validEnemyIndices.push(this.targetEnemyIndices[i]);
            } else {
              invalidEnemyIndices.push(this.targetEnemyIndices[i]);
            }
          }
          // Go through and delete all of the targets that were not valid IF there is one or more valid targets
          if (validEnemyIndices.length >= 1) {
            this.typedNumber += number;
            for (var i = invalidEnemyIndices.length - 1; i >= 0; i--) {
              this.enemies[invalidEnemyIndices[i]].resetCurDigitIndex();
              this.targetEnemyIndices.splice(this.targetEnemyIndices.indexOf(invalidEnemyIndices[i]), 1);
            }
          }
        }
        else if (e.key == Crafty.keys['ENTER']) {
          this.typedNumber = "";
          for (var i = this.targetEnemyIndices.length - 1; i >= 0; i--) {
            if (this.enemies[this.targetEnemyIndices[i]].checkIfNumberComplete()) {
              this.enemies[this.targetEnemyIndices[i]].destroyEnemy();
              this.enemies.splice(this.targetEnemyIndices[i], 1);
            }
            else {
              this.enemies[this.targetEnemyIndices[i]].resetCurDigitIndex();
            }
          }
          
          this.targetEnemyIndices = [];
          for (var i = 0; i < this.enemies.length; i++) {
            this.targetEnemyIndices.push(i);
          }
        }
      });

      this.bind("EnterFrame", function() {
        if(!this.player) return;
        
        // position of the viewport
        var vpx = (this.player._x - HALF_VIEWPORT_WIDTH),
            vpy = (this.player._y - HALF_VIEWPORT_HEIGHT);
        
        // Max x in map * 32 - Crafty.viewport.width = 1164
        if(vpx > 0 && vpx < WORLD_WIDTH - VIEWPORT_WIDTH) {
          Crafty.viewport.x = -vpx;
        }
        
        if(vpy > 0 && vpy < WORLD_HEIGHT - VIEWPORT_HEIGHT) {
          Crafty.viewport.y = -vpy;
        }

        // Bounds check the player
        if (this.player.x < WALL_SIZE) {
          this.player._x = WALL_SIZE;
        } else if (this.player.x > WORLD_WIDTH - WALL_SIZE - PLAYER_WIDTH) {
          this.player._x = WORLD_WIDTH - WALL_SIZE - PLAYER_WIDTH;
        }
        
        if (this.player.y < WALL_SIZE) {
          this.player._y = WALL_SIZE;
        } else if (this.player.y > WORLD_HEIGHT - WALL_SIZE - PLAYER_HEIGHT) {
          this.player._y = WORLD_HEIGHT - WALL_SIZE - PLAYER_HEIGHT;
        }
      });
    },
    
    spawnEnemy: function() {
      var x = 0,
          y = 0;

      do {
        x = Crafty.math.randomInt(WALL_SIZE, WORLD_WIDTH - WALL_SIZE - ENEMY_WIDTH);
        y = Crafty.math.randomInt(WALL_SIZE, WORLD_HEIGHT - WALL_SIZE - ENEMY_HEIGHT);
      } while ( x >= Crafty.viewport.x - ENEMY_WIDTH &&
                x <= Crafty.viewport.x + VIEWPORT_WIDTH &&
                y >= Crafty.viewport.y - ENEMY_HEIGHT &&
                y <= Crafty.viewport.y + VIEWPORT_HEIGHT );

      this.enemies.push(Crafty.e("Enemy").difficulty(3).attr({x: x, y: y}));
    },
    
    startGame: function() {
      for (var i = 0; i < INITIAL_ENEMY_COUNT; i++) {
        this.spawnEnemy();
      }
      for (var i = 0; i < this.enemies.length; i++) {
        this.targetEnemyIndices.push(i);
      }

      // Create the floor
      Crafty.e("2D, DOM, Image")
       .attr({w: WORLD_WIDTH, h: WORLD_HEIGHT, z: -1})
       .image(FLOOR_IMAGE, "repeat");
    },

    debug: function() {
      console.log("Current Number:", this.typedNumber);
      console.log("Enemies");
      for (var i = 0; i < this.enemies.length; i++) {
        console.log(this.enemies[i].number);
      }
      console.log("Target Enemies");
      for (var i = 0; i < this.targetEnemyIndices.length; i++) {
        console.log(this.enemies[this.targetEnemyIndices[i]].number);
      }
    }
  });
  
  Crafty.c("Enemy", {
    
    init: function() {
      this.addComponent("2D, Color, DOM");
      this.w = ENEMY_WIDTH;
      this.h = ENEMY_HEIGHT;
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
      this.attach(this.numberRef);
          
      return this;
    },
    
    tryDigit: function(digit) {
      if (this.number[this.curDigitIndex] == digit) {
        this.curDigitIndex += 1;
        this.numberRef.replace("<span class='typed'>" + this.number.slice(0,this.curDigitIndex) + "</span>" + this.number.slice(this.curDigitIndex));
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
      this.numberRef.replace(this.number);
      this.curDigitIndex = 0;
    },
    
    destroyEnemy: function() {
      this.numberRef.destroy();
      this.destroy();
    }
  });
  
  Crafty.c("Number", {
    init: function() {
      this.addComponent("2D, Color, DOM, Text, HTML");
    }
  });
  
  Crafty.e("World").startGame();
};
