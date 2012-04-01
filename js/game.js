window.onload = function() {
  var VIEWPORT_WIDTH            = 800,
      VIEWPORT_HEIGHT           = 600,
      HALF_VIEWPORT_WIDTH       = VIEWPORT_WIDTH / 2,
      HALF_VIEWPORT_HEIGHT      = VIEWPORT_HEIGHT / 2,
      PLAYER_SPEED              = 5,
      ENEMY_SPEED               = 1,
      ENEMY_WIDTH               = 100,
      ENEMY_HEIGHT              = 77,
      NUMBER_FONT_SIZE          = 20,
      WORLD_WIDTH               = VIEWPORT_WIDTH * 3,
      WORLD_HEIGHT              = VIEWPORT_HEIGHT * 3,
      WALL_SIZE                 = 50,
      PLAYER_WIDTH              = 100,
      PLAYER_HEIGHT             = 70,
      INITIAL_ENEMY_COUNT       = 25,
      FLOOR_IMAGE               = 'img/ground.gif',
      WALL_HORIZONTAL_IMAGE     = 'img/wall_horizontal.gif',
      WALL_VERTICAL_IMAGE       = 'img/wall_vertical.gif',
      PARKING_IMAGE             = 'img/parking_lines.png';

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
      this.addToScore(0);

      this.player = Crafty.e("Player");
      
      this.enemies = [];
      this.targetEnemyIndices = [];
      this.typedNumber = "";

      Crafty.audio.settings("gameMusic", {muted: false});

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
       .attr({w: WORLD_WIDTH, h: WORLD_HEIGHT, z: -5})
       .image(FLOOR_IMAGE, "repeat");

      Crafty.e("2D, DOM, Image")
        .attr({w: WORLD_WIDTH, h: WORLD_HEIGHT, z: -4})
        .image(PARKING_IMAGE, "repeat");

      // Create the walls
      // Left
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WORLD_HEIGHT, x: 0, y: 0, z: -3})
        .image(WALL_VERTICAL_IMAGE, "repeat")
      // Right
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WORLD_HEIGHT, x: WORLD_WIDTH - WALL_SIZE, y: 0, z: -3})
        .image(WALL_VERTICAL_IMAGE, "repeat")
        .flip("X")
      // Bottom
      Crafty.e("2D, DOM, Image")
        .attr({w: WORLD_WIDTH, h: WALL_SIZE, x: 0, y: WORLD_HEIGHT - WALL_SIZE, z: -3})
        .image(WALL_HORIZONTAL_IMAGE, "repeat")
        .flip("Y")
      // Top
      Crafty.e("2D, DOM, Image")
        .attr({w: WORLD_WIDTH, h: WALL_SIZE, x: 0, y: 0, z: -3})
        .image(WALL_HORIZONTAL_IMAGE, "repeat");
    },

    resetTypedNumber: function() {
      this.typedNumber = "";
      $('#currentNumber .num').text(this.typedNumber);
    },

    appendToTypedNumber: function(digit) {
      this.typedNumber += digit.toString();
      $('#currentNumber .num').text(this.typedNumber);
    },

    addToScore: function(pointsToAdd) {
      score += pointsToAdd;
      $("#score-box .number").text(score);
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
      this.addComponent("2D, DOM, Multiway, Collision, SpriteAnimation, PlayerSprite")
        .attr({x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, w: PLAYER_WIDTH, h: PLAYER_HEIGHT, z: 5})
        .origin(PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2)
        .multiway(PLAYER_SPEED, {W: -90, S: 90, D: 0, A: 180})
        .animate('PlayerWalk', 0, 0, 3)
        .collision().onHit("Enemy", this.die)
        .bind("NewDirection", function(direction) {
          if (direction.x == 0 && direction.y == 0) {
            this.stop();
          } else if (!this.isPlaying('PlayerWalk')) {
            this.animate('PlayerWalk', 30, -1);
          }

          if (direction.x > 0 && direction.y > 0) {
            this.rotation = 135;
          } else if (direction.x == 0 && direction.y > 0) {
            this.rotation = 180;
          } else if (direction.x < 0 && direction.y > 0) {
            this.rotation = 225;
          } else if (direction.x < 0 && direction.y == 0) {
            this.rotation = 270;
          } else if (direction.x < 0 && direction.y < 0) {
            this.rotation = 315;
          } else if (direction.x == 0 && direction.y < 0) {
            this.rotation = 0;
          } else if (direction.x > 0 && direction.y < 0) {
            this.rotation = 45;
          } else if (direction.x > 0 && direction.y == 0) {
            this.rotation = 90;
          }
        });
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
      this.addComponent("2D, DOM, Collision, SpriteAnimation, EnemySprite")
        .animate('EnemyWalk', 0, 0, 3)
        .animate('EnemyWalk', 30, -1)
        .attr({w: ENEMY_WIDTH, h: ENEMY_HEIGHT})
        .origin(ENEMY_WIDTH / 2, ENEMY_HEIGHT / 2);

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

      direction = {
        x: player.x - this.x,
        y: player.y - this.y
      }
      this.rotation = Math.atan2(direction.y, direction.x) * 180 / Math.PI + 90;
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
      this.addComponent("2D, Color, DOM, Text, HTML")
      .attr({z: 10});
    }
  });

  Crafty.scene("main", function() {
    Crafty.e("World");
  });

  Crafty.scene("gameOver", function() {
    Crafty.audio.settings("gameMusic", {muted: true});
    Crafty.audio.play("gameOver", 0);

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
      .text("Score: " + score + ". High score: " + highScore + ". " + gameOverText + " Press ENTER to Continue.")
      .bind("MouseDown", function(e) {
        Crafty.scene("main");
      })
      .bind("KeyDown", function(e) {
        if (e.key == Crafty.keys['ENTER']) {
          Crafty.scene("main");
        }
      });
  });

  Crafty.scene("loading", function() {
    Crafty.sprite(100, 70, "img/hero.png", {PlayerSprite: [0, 0]});
    Crafty.sprite(100, 77, "img/enemy1.png", {EnemySprite: [0, 0]});
    Crafty.audio.add("gameMusic", "audio/gameMusic.mp3");
    Crafty.audio.play("gameMusic", -1);
    Crafty.audio.settings("gameMusic", {muted: true});

    Crafty.audio.add("gameOver", "audio/gameOver.mp3");

    Crafty.e("2D, Color, DOM, Text, Mouse")
      .attr({w: 300, h: 100, x: HALF_VIEWPORT_HEIGHT, y: HALF_VIEWPORT_HEIGHT})
      .color("green")
      .text("Welcome to Cellsplosion!  Left hand on WASD.  Right hand on NumPad.  Press ENTER to Start.")
      .bind("MouseDown", function(e) {
        Crafty.scene("main");
      })
      .bind("KeyDown", function(e) {
        if (e.key == Crafty.keys['ENTER']) {
          Crafty.scene("main");
        }
      });
  });
  
  Crafty.scene("loading");
  
};
