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
    },
    
    spawnEnemy: function() {
      this.enemies.push(Crafty.e("Enemy").difficulty(3));
    },
    
    startGame: function() {
      this.spawnEnemy();
      this.spawnEnemy();
      for (var i = 0; i < this.enemies.length; i++) {
        this.targetEnemyIndices.push(i);
      }
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
