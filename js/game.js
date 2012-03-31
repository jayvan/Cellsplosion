window.onload = function() {
  var VIEWPORT_WIDTH            = 800,
      VIEWPORT_HEIGHT           = 600,
      HALF_VIEWPORT_WIDTH       = VIEWPORT_WIDTH / 2,
      HALF_VIEWPORT_HEIGHT      = VIEWPORT_HEIGHT / 2,
      PLAYER_SPEED              = 10,
      ENEMY_SPEED               = 1,
      ENEMY_WIDTH               = 50,
      ENEMY_HEIGHT              = 50,
      NUMBER_FONT_SIZE          = 20,
      WORLD_WIDTH               = VIEWPORT_WIDTH * 3,
      WORLD_HEIGHT              = VIEWPORT_HEIGHT * 3,
      WALL_SIZE                 = 100,
      PLAYER_WIDTH              = 100,
      PLAYER_HEIGHT             = 100,
      INITIAL_ENEMY_COUNT       = 25,
      FLOOR_IMAGE               = 'img/ground.gif';

  Crafty.init(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  Crafty.background("grey");
  
  var score;
  // Load high score
  var highScore = localStorage.getItem("highScore");

  if (highScore == null) {
    highScore = 0;
  }

  Crafty.c("World", {
    init: function() {
      score = 0;

      this.player = Crafty.e("Player");
      
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
            this.appendToTypedNumber(number);
            for (var i = invalidEnemyIndices.length - 1; i >= 0; i--) {
              this.enemies[invalidEnemyIndices[i]].resetCurDigitIndex();
              this.targetEnemyIndices.splice(this.targetEnemyIndices.indexOf(invalidEnemyIndices[i]), 1);
            }
          }
        }
        else if (e.key == Crafty.keys['ENTER']) {
          this.resetTypedNumber();
          for (var i = this.targetEnemyIndices.length - 1; i >= 0; i--) {
            if (this.enemies[this.targetEnemyIndices[i]].checkIfNumberComplete()) {
              // TODO: Change hardcoded enemy kill score
              this.addToScore(10);
              this.enemies[this.targetEnemyIndices[i]].destroyEnemy();
              this.enemies.splice(this.targetEnemyIndices[i], 1);
              this.spawnEnemy();
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
        // Update all of the enemies
        for (var i = 0; i < this.enemies.length; i++) {
          this.enemies[i].update(this.player);
        }

        // Bounds check the player
        if (this.player.x < WALL_SIZE) {
          this.player.x = WALL_SIZE;
        } else if (this.player.x > WORLD_WIDTH - WALL_SIZE - PLAYER_WIDTH) {
          this.player.x = WORLD_WIDTH - WALL_SIZE - PLAYER_WIDTH;
        }
        
        if (this.player.y < WALL_SIZE) {
          this.player.y = WALL_SIZE;
        } else if (this.player.y > WORLD_HEIGHT - WALL_SIZE - PLAYER_HEIGHT) {
          this.player.y = WORLD_HEIGHT - WALL_SIZE - PLAYER_HEIGHT;
        }
      });

      this.startGame();
    },

    setViewport: function() {
      Crafty.viewport.follow(this.player, 0, 0);
    },
    
    spawnEnemy: function() {
      var x = 0,
          y = 0;

      do {
        x = Crafty.math.randomInt(WALL_SIZE, WORLD_WIDTH - WALL_SIZE - ENEMY_WIDTH);
        y = Crafty.math.randomInt(WALL_SIZE, WORLD_HEIGHT - WALL_SIZE - ENEMY_HEIGHT);
      } while ( x >= -Crafty.viewport.x - ENEMY_WIDTH &&
                x <= -Crafty.viewport.x + VIEWPORT_WIDTH &&
                y >= -Crafty.viewport.y - ENEMY_HEIGHT &&
                y <= -Crafty.viewport.y + VIEWPORT_HEIGHT );

      this.enemies.push(Crafty.e("Enemy").difficulty(3).attr({x: x, y: y}));
    },
    
    startGame: function() {
      this.setViewport();

      for (var i = 0; i < INITIAL_ENEMY_COUNT; i++) {
        this.spawnEnemy();
        this.targetEnemyIndices.push(i);
      }

      // Create the floor
      Crafty.e("2D, DOM, Image")
       .attr({w: WORLD_WIDTH, h: WORLD_HEIGHT, z: -1})
       .image(FLOOR_IMAGE, "repeat");
    },

    resetTypedNumber: function() {
      this.typedNumber = "";
      $('#currentNumber .num').text(this.typedNumber);
    },

    appendToTypedNumber: function(digit) {
      this.typedNumber += digit;
      $('#currentNumber .num').text(this.typedNumber);
    },

    addToScore: function(pointsToAdd) {
      score += pointsToAdd;
      $("#score .num").text(score);
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

  Crafty.c("Player", {
    init: function() {
      this.addComponent("2D, Color, DOM, Multiway, Collision, SpriteAnimation, PlayerSprite")
        .attr({x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, w: PLAYER_WIDTH, h: PLAYER_HEIGHT, z: 5})
        .color("white")
        .multiway(PLAYER_SPEED, {W: -90, S: 90, D: 0, A: 180})
        .animate('PlayerWalk', 0, 0, 3)
        .animate('PlayerWalk', 30, -1)
        .collision().onHit("Enemy", this.die);
    },

    die: function() {
      highScore = Math.max(highScore, score);
      if (score == highScore) {
        localStorage.setItem("highScore", highScore);
      }
      Crafty.scene("gameOver");
    }
  });
  
  Crafty.c("Enemy", {
    
    init: function() {
      this.addComponent("2D, Color, DOM, Collision");
      this.w = ENEMY_WIDTH;
      this.h = ENEMY_HEIGHT;
      this.color("red");
      this.curDigitIndex = 0;
    },

    update: function(player) {
      if (this.x > player.x) {
        this.x -= ENEMY_SPEED;
      } else if (this.x < player.x) {
        this.x += ENEMY_SPEED;
      }

      if (this.y > player.y) {
        this.y -= ENEMY_SPEED;
      } else if (this.y < player.y) {
        this.y += ENEMY_SPEED;
      }
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
        this.numberRef.text("<span class='typed'>" + this.number.slice(0,this.curDigitIndex) + "</span>" + this.number.slice(this.curDigitIndex));
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
      this.numberRef.text(this.number);
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

  Crafty.scene("main", function() {
    Crafty.e("World");
  });

  Crafty.scene("gameOver", function() {
    Crafty.viewport.x = 0;
    Crafty.viewport.y = 0;
    var gameOverText = "";

    if (score == 0 && highScore == 0) {
      gameOverText = "Wow, I'm so impressed. You couldn't even beat your massive high score of ZERO. Loser."
    } else if (score == highScore) {
      gameOverText = "Hey, you beat your high score. Now why don't you do something meaningful."
    } else if (score < highScore) {
      gameOverText = "Gosh, you did pretty well for a person who sucks at games."
    }

    Crafty.e("2D, Color, DOM, Text, Mouse")
      .attr({w: 300, h: 100, x: HALF_VIEWPORT_HEIGHT, y: HALF_VIEWPORT_HEIGHT})
      .color("red")
      .text("Score: " + score + ". High score: " + highScore + ". " + gameOverText)
      .bind("MouseDown", function(e) {
        console.log("CLICKED");
        Crafty.scene("main");
      });
  });

  Crafty.scene("loading", function() {
    Crafty.sprite(100, "img/hero.png", {PlayerSprite: [0, 0]});

    Crafty.e("2D, Color, DOM, Text, Mouse")
      .attr({w: 300, h: 100, x: HALF_VIEWPORT_HEIGHT, y: HALF_VIEWPORT_HEIGHT})
      .color("green")
      .text("Start")
      .bind("MouseDown", function(e) {
        Crafty.scene("main");
      });
  });
  
  Crafty.scene("loading");
  
};
