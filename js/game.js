
// Prevent the spacebar from scrolling the page
window.onkeydown=function(e){
  if(e.keyCode==32){
   return false;
  }
};

window.onload = function() {
  var VIEWPORT_WIDTH            = 800,
      VIEWPORT_HEIGHT           = 600,
      HALF_VIEWPORT_WIDTH       = VIEWPORT_WIDTH / 2,
      HALF_VIEWPORT_HEIGHT      = VIEWPORT_HEIGHT / 2,
      PLAYER_SPEED              = 5,
      ENEMY_WIDTH               = 100,
      EASY_ENEMY_MAX_SPEED      = 2,
      EASY_ENEMY_MAX_DIFFICULTY = 4,
      ENEMY_HEIGHT              = 77,
      NUMBER_FONT_SIZE          = 20,
      WORLD_WIDTH               = VIEWPORT_WIDTH * 3,
      WORLD_HEIGHT              = VIEWPORT_HEIGHT * 3,
      WALL_SIZE                 = 50,
      PLAYER_WIDTH              = 100,
      PLAYER_HEIGHT             = 70,
      INITIAL_ENEMY_COUNT       = 10,
      FLOOR_IMAGE               = 'img/ground.gif',
      WALL_HORIZONTAL_IMAGE     = 'img/wall_horizontal.gif',
      WALL_VERTICAL_IMAGE       = 'img/wall_vertical.gif',
      WALL_CORNER_IMAGE         = 'img/wall_corner.png',
      PARKING_IMAGE             = 'img/parking_lines.png',
      INTRO_IMAGE               = 'img/intro_screen.png',
      GAME_OVER_IMAGE           = 'img/game_over.png',
      NUM_DIAL_BEEPS            = 7,
      NUM_ZOMBIE_SOUNDS         = 7,
      NUM_ERROR_SOUNDS          = 4,
      ENEMY_SPEEDS              = {4: 0.01, 3: 0.05, 2: 0.14, 1: 0.8},
      ENEMY_DIFFICULTIES        = {7: 0.01, 6: 0.05, 5: 0.10, 4: 0.14, 3: 0.7},
      ENEMY_RESPAWN_FACTOR      = 2,
      EXPLOSION_DURATION        = 400,
      PLAYER_HITCIRCLE_RADIUS   = 50,
      ENEMY_BOSS_FREQUENCY      = 25,
      ENEMY_BOSS_SPEED          = 4,
      ENEMY_BOSS_DIFFICULTY     = 7,
      MUSIC_DIRECTORY           = 'audio/music/',
      SOUND_DIRECTORY           = 'audio/sound/';

  var GAME_OVER_QUOTES = [ "Looks like this game played you.",
                           "Looks like this number is out of service.",
                           "This lifeline has been disconnected.",
                           "Looks like somebody forgot to call 911.",
                           "Looks like you've been put on hold.",
                           "That's one number you can't call collect." ];

  var userAgent = navigator.userAgent;
  var browser = "";

  if (userAgent.indexOf("Chrome") != -1) {
    browser = "Chrome";
  } else if (userAgent.indexOf("Firefox") != -1) {
    browser = "Firefox";
  } else if (userAgent.indexOf("Safari") != -1) {
    browser = "Safari";
  }

  Crafty.init(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  Crafty.background("grey");

  var fadeIn = function(name, vol, maxVol) {
    if (typeof(vol) === "undefined") {
      vol = 0;
    }
    if (maxVol > 1) {
      maxVol = 1;
    }
    vol = Math.min(vol + 0.1, maxVol);
    Crafty.audio.setVolume(name, vol);
    if (vol != maxVol) {
      window.setTimeout(function() { fadeIn(name, vol, maxVol); }, 300);
    }
  };
  
  var loadAudio = function(id, filePath) {
    Crafty.audio.add(id,[
        filePath + ".mp3",
        filePath + ".ogg"
        ]);
  }

  var score;
  var enemiesKilled = 0;
  // Load high score
  var highScore = localStorage.getItem("highScore");

  if (highScore === null) {
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
      enemiesKilled = 0;

      this.bind("KeyDown", function(e) {
        var number = -1;

        if (e.key >= Crafty.keys['NUMPAD_0'] && e.key <= Crafty.keys['NUMPAD_9']) {
          number = e.key - Crafty.keys['NUMPAD_0'];
        }

        if (e.key >= Crafty.keys['0'] && e.key <= Crafty.keys['9']) {
          number = e.key - Crafty.keys['0'];
        }
        
        if (e.key == Crafty.keys['U']) {
          number = 4;
        } else if (e.key == Crafty.keys['I']) {
          number = 5;
        } else if (e.key == Crafty.keys['O']) {
          number = 6;
        } else if (e.key == Crafty.keys['J']) {
          number = 1;
        } else if (e.key == Crafty.keys['K']) {
          number = 2;
        } else if (e.key == Crafty.keys['L']) {
          number = 3;
        } else if (e.key == Crafty.keys['M'] || e.key == Crafty.keys['COMMA']) {
          number = 0;
        }

        if (number != -1) {
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
            try {
              var randomDialBeep = "dialBeep" + Crafty.math.randomInt(1,NUM_DIAL_BEEPS).toString();
              Crafty.audio.play(randomDialBeep, 1, 1.0);
            } catch (e) { }
            this.appendToTypedNumber(number);
            for (var i = invalidEnemyIndices.length - 1; i >= 0; i--) {
              this.enemies[invalidEnemyIndices[i]].resetCurDigitIndex();
              this.targetEnemyIndices.splice(this.targetEnemyIndices.indexOf(invalidEnemyIndices[i]), 1);
            }
          }
        }
        else if (e.key == Crafty.keys['ENTER'] || e.key == Crafty.keys['SPACE'] || e.key == Crafty.keys['P'] || e.key == 186 || e.key == Crafty.keys['PERIOD'] || e.key == 191) {
          this.resetTypedNumber();
          var killedEnemy = false;
          for (var i = this.targetEnemyIndices.length - 1; i >= 0; i--) {
            if (this.enemies[this.targetEnemyIndices[i]].checkIfNumberComplete()) {
              killedEnemy = true;
              try {
                Crafty.audio.play("zombie" + Crafty.math.randomInt(1,NUM_ZOMBIE_SOUNDS).toString(), 1, 1.0);
              }
              catch(e) {}
              var enemyToDestroy = this.enemies[this.targetEnemyIndices[i]];
              this.addToScore(enemyToDestroy.getScore());
              enemyToDestroy.destroyEnemy();
              this.enemies.splice(this.targetEnemyIndices[i], 1);
              enemiesKilled += 1;

              if (enemiesKilled % ENEMY_BOSS_FREQUENCY === 0) {
                try {
                  Crafty.audio.play("bossAlert", 1, 1.0);
                } catch (e) { }
                $('#warning').animate({opacity: 0.3}, 200).animate({opacity: 0}, 400).animate({opacity: 0.3}, 200).animate({opacity: 0}, 400);
                this.spawnBoss();
              } 

              if (enemiesKilled % ENEMY_RESPAWN_FACTOR === 0) {
                this.spawnEnemy(false);
              }
              this.spawnEnemy(false);
            }
            else {
              this.enemies[this.targetEnemyIndices[i]].resetCurDigitIndex();
            }
          }
          this.targetEnemyIndices = [];
          for (var i = 0; i < this.enemies.length; i++) {
            this.targetEnemyIndices.push(i);
          }
          if (!killedEnemy) {
            try {
              Crafty.audio.play("error" + Crafty.math.randomInt(1,NUM_ERROR_SOUNDS).toString(), 1, 1.0);
            } catch (e) { }
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
    
    spawnEnemy: function(easyMode) {
      var x = 0,
          y = 0;

      do {
        x = Crafty.math.randomInt(WALL_SIZE, WORLD_WIDTH - WALL_SIZE - ENEMY_WIDTH);
        y = Crafty.math.randomInt(WALL_SIZE, WORLD_HEIGHT - WALL_SIZE - ENEMY_HEIGHT);
      } while ( x >= -Crafty.viewport.x - ENEMY_WIDTH &&
                x <= -Crafty.viewport.x + VIEWPORT_WIDTH &&
                y >= -Crafty.viewport.y - ENEMY_HEIGHT &&
                y <= -Crafty.viewport.y + VIEWPORT_HEIGHT );

      var speed = 0;
      var speedRoll = Math.random();

      for (var i in ENEMY_SPEEDS) {
        if (speedRoll <= ENEMY_SPEEDS[i]) {
          speed = i;
          break;
        } else {
          speedRoll -= ENEMY_SPEEDS[i];
        }
      }

      var difficulty = 0;
      var difficultyRoll = Math.random();

      for (var i in ENEMY_DIFFICULTIES) {
        if (difficultyRoll <= ENEMY_DIFFICULTIES[i]) {
          difficulty = i;
          break;
        } else {
          difficultyRoll -= ENEMY_DIFFICULTIES[i];
        }
      }

      if (easyMode) {
        speed = Math.min(speed, EASY_ENEMY_MAX_SPEED);
        difficulty = Math.min(difficulty, EASY_ENEMY_MAX_DIFFICULTY);
      }

      this.enemies.push(Crafty.e("Enemy").addComponent("EnemySprite").difficulty(difficulty).setSpeed(speed).attr({x: x, y: y}).animate('EnemyWalk', 0, 0, 3).animate('EnemyWalk', 30, -1));
    },

    spawnBoss: function() {
      var x = 0,
          y = 0;

      do {
        x = Crafty.math.randomInt(WALL_SIZE, WORLD_WIDTH - WALL_SIZE - ENEMY_WIDTH);
        y = Crafty.math.randomInt(WALL_SIZE, WORLD_HEIGHT - WALL_SIZE - ENEMY_HEIGHT);
      } while ( x >= -Crafty.viewport.x - ENEMY_WIDTH &&
                x <= -Crafty.viewport.x + VIEWPORT_WIDTH &&
                y >= -Crafty.viewport.y - ENEMY_HEIGHT &&
                y <= -Crafty.viewport.y + VIEWPORT_HEIGHT );
      var boss = Crafty.e("Enemy")
        .addComponent("BossSprite")
        .difficulty(ENEMY_BOSS_DIFFICULTY)
        .setSpeed(ENEMY_BOSS_SPEED)
        .attr({x: x, y: y})
        .stop()
        .animate('BossWalk', 0, 0, 3)
        .animate('BossWalk', 15, -1);

      this.enemies.push(boss);
    },
    
    startGame: function() {
      this.setViewport();

      for (var i = 0; i < INITIAL_ENEMY_COUNT; i++) {
        this.spawnEnemy(true);
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
        .image(WALL_VERTICAL_IMAGE, "repeat");
      // Right
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WORLD_HEIGHT, x: WORLD_WIDTH - WALL_SIZE, y: 0, z: -3})
        .image(WALL_VERTICAL_IMAGE, "repeat")
        .flip("X");
      // Bottom
      Crafty.e("2D, DOM, Image")
        .attr({w: WORLD_WIDTH, h: WALL_SIZE, x: 0, y: WORLD_HEIGHT - WALL_SIZE, z: -3})
        .image(WALL_HORIZONTAL_IMAGE, "repeat")
        .flip("Y");
      // Top
      Crafty.e("2D, DOM, Image")
        .attr({w: WORLD_WIDTH, h: WALL_SIZE, x: 0, y: 0, z: -3})
        .image(WALL_HORIZONTAL_IMAGE, "repeat");

      // Top left corner
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WALL_SIZE, x: 0, y: 0, z: -2})
        .image(WALL_CORNER_IMAGE, "repeat");

      // Top Right corner
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WALL_SIZE, x: WORLD_WIDTH - WALL_SIZE, y: 0, z: -2})
        .image(WALL_CORNER_IMAGE, "repeat")
        .flip("X");

      // Bottom Left
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WALL_SIZE, x: 0, y: WORLD_HEIGHT - WALL_SIZE, z: -2})
        .image(WALL_CORNER_IMAGE, "repeat")
        .flip("Y");

      // Bottom Right
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WALL_SIZE, x: WORLD_WIDTH - WALL_SIZE, y: WORLD_HEIGHT - WALL_SIZE, z: -2})
        .image("img/wall_corner_bottom_right.png", "repeat");
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
        .collision().onHit("Enemy", function(e) { 
          if (e[0].obj.dead) {
            return;
          }
          var circle = new Crafty.circle(this.x + PLAYER_WIDTH / 2, this.y + PLAYER_HEIGHT / 2, PLAYER_HITCIRCLE_RADIUS);
          if (circle.containsPoint(e[0].obj.x + ENEMY_WIDTH / 2, e[0].obj.y + ENEMY_HEIGHT / 2)) {
            this.die();
          }
        })
        .bind("EnterFrame", function(e) {
          if (this.dead) {
            this.x = this.deathPosition.x;
            this.y = this.deathPosition.y;
          }
        })
        .bind("NewDirection", function(direction) {
          if (direction.x === 0 && direction.y === 0) {
            this.stop();
          } else if (!this.isPlaying('PlayerWalk')) {
            this.animate('PlayerWalk', 30, -1);
          }

          if (direction.x > 0 && direction.y > 0) {
            this.rotation = 135;
          } else if (direction.x === 0 && direction.y > 0) {
            this.rotation = 180;
          } else if (direction.x < 0 && direction.y > 0) {
            this.rotation = 225;
          } else if (direction.x < 0 && direction.y === 0) {
            this.rotation = 270;
          } else if (direction.x < 0 && direction.y < 0) {
            this.rotation = 315;
          } else if (direction.x === 0 && direction.y < 0) {
            this.rotation = 0;
          } else if (direction.x > 0 && direction.y < 0) {
            this.rotation = 45;
          } else if (direction.x > 0 && direction.y === 0) {
            this.rotation = 90;
          }
        });

      this.dead = false;
    },

    die: function() {
      if (this.dead) {
        return;
      }
      try {
        Crafty.audio.play("playerDeath", 1, 1.0);
      } catch (e) { }
      this.dead = true;
      this.deathPosition = {x: this.x, y: this.y};

      Crafty.e("Explosion")
        .attr({x: this.x, y: this.y, z: 9001});

      var player = this;

      window.setTimeout( function() { player.destroy(); }, EXPLOSION_DURATION / 4.0 * 3.0 );
      
      window.setTimeout( function() { Crafty.scene("gameOver"); }, 1500);
    }
  });
  
  Crafty.c("Enemy", {
    
    init: function() {
      this.addComponent("2D, DOM, Collision, SpriteAnimation, EnemySprite")
        .attr({w: ENEMY_WIDTH, h: ENEMY_HEIGHT})
        .origin(ENEMY_WIDTH / 2, ENEMY_HEIGHT / 2);
      this.curDigitIndex = 0;
      this.speed = 0;
      this.dead = false;
    },

    update: function(player) {
      if (this.x > player.x) {
        this.x = Math.max(this.x - this.speed, player.x);
      } else if (this.x < player.x) {
        this.x = Math.min(this.x + this.speed, player.x);
      }

      if (this.y > player.y) {
        this.y = Math.max(this.y - this.speed, player.y);
      } else if (this.y < player.y) {
        this.y = Math.min(this.y + this.speed, player.y);
      }

      direction = {
        x: player.x - this.x,
        y: player.y - this.y
      };
      this.rotation = Math.atan2(direction.y, direction.x) * 180 / Math.PI + 90;
    },
    
    difficulty: function(length) {
      this.difficulty = length;
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

    setSpeed: function(targetSpeed) {
      this.speed = parseInt(targetSpeed);
      return this;
    },

    getScore: function() {
      return this.speed * this.difficulty * 10;
    },
    
    tryDigit: function(digit) {
      if (this.number[this.curDigitIndex] == digit) {
        this.curDigitIndex += 1;
        this.numberRef.attr({z: 11});
        this.numberRef.text("<span class='typed'>" + this.number.slice(0,this.curDigitIndex) + "</span>" + this.number.slice(this.curDigitIndex));
        return true;
      }
      this.numberRef.attr({z: 10});
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
      this.dead = true;
      Crafty.e("Explosion")
        .attr({x: this.x, y: this.y});

      this.numberRef.destroy();
      var enemy = this;
      window.setTimeout( function() { enemy.destroy(); }, EXPLOSION_DURATION / 4.0 * 3.0 );
    }
  });

  Crafty.c("Explosion", {
    init: function() {
      this.addComponent("2D, DOM, Explosion1, SpriteAnimation")
        .animate('Explode', 0, 0, 3)
        .animate('Explode', 50 * EXPLOSION_DURATION / 1000, 1)
        .attr({w: 100, h: 100});
      var explosion = this;
      window.setTimeout( function() { explosion.destroy();}, EXPLOSION_DURATION);
    }
  });
  
  Crafty.c("Number", {
    init: function() {
      this.addComponent("2D, Color, DOM, Text, HTML")
      .attr({z: 10});
    }
  });

  Crafty.scene("main", function() {
    $("#score-box").show();
    Crafty.e("World");
  });

  Crafty.scene("gameOver", function() {
    Crafty(Crafty("World")[0]).destroy();

    highScore = Math.max(highScore, score);
    if (score == highScore) {
      localStorage.setItem("highScore", highScore);
    }

    $('#score-box').hide();
    
    Crafty.audio.stop("gameMusic");
    Crafty.audio.play("gameOver", 1, 0.0);
    fadeIn("gameOver", 0, 0.7);

    Crafty.viewport.x = 0;
    Crafty.viewport.y = 0;

    Crafty.e("2D, DOM, Image")
      .attr({w: 800, h: 600, x: 0, y: 0})
      .image(GAME_OVER_IMAGE)
      .bind("KeyDown", function(e) {
        if (e.key == Crafty.keys['ENTER']) {
          Crafty.audio.play("gameMusic", -1, 0.0);
          fadeIn("gameMusic", 0, 0.7);
          Crafty.scene("main");
        }
      });

    // Quote
    Crafty.e("2D, DOM, Text")
      .attr({w: 300, h: 100, x: 403, y: 153, z: 5})
      .text(Crafty.math.randomElementOfArray(GAME_OVER_QUOTES))
      .textColor("#000000")
      .css({'font-size': '20px', 'text-align': 'center', 'font-family': 'monospace'});

    // Hiscore
    Crafty.e("2D, DOM, Text")
      .attr({w: 300, h: 100, x: 446, y: 225, z: 5})
      .text("<span class='highscore'>High Score:</span> " + highScore)
      .textColor("#000000")
      .css({'font-size': '24px', 'text-align': 'left'});

    // Score
    Crafty.e("2D, DOM, Text")
      .attr({w: 300, h: 100, x: 446, y: 255, z: 5})
      .text("<span class='score'>Score:</span> " + score)
      .textColor("#000000")
      .css({'font-size': '24px', 'text-align': 'left'});

    // Kills
    Crafty.e("2D, DOM, Text")
      .attr({w: 300, h: 100, x: 446, y: 285, z: 5})
      .text("<span class='kills'>Phones Xploded:</span> " + enemiesKilled)
      .textColor("#000000")
      .css({'font-size': '24px', 'text-align': 'left'});

  });

  Crafty.scene("landing", function() {
    Crafty.audio.play("gameMusic", -1, 0.0);
    fadeIn("gameMusic", 0, 0.7);

    Crafty.e("2D, DOM, Image")
      .attr({w: 800, h: 600, x: 0, y: 0})
      .image(INTRO_IMAGE)
      .bind("KeyDown", function(e) {
        if (e.key == Crafty.keys['ENTER']) {
          Crafty.scene("main");
        }
      });
  });

  Crafty.scene("loading", function() {
    if (browser != "Safari") {
      for (var i = 1; i <= NUM_DIAL_BEEPS; i++) {
        loadAudio("dialBeep" + i.toString(), SOUND_DIRECTORY + "dialBeep" + i.toString());
      }
      for (var i = 1; i <= NUM_ZOMBIE_SOUNDS; i++) {
        loadAudio("zombie" + i.toString(), SOUND_DIRECTORY + "zombie" + i.toString());
      }
      for (var i = 1; i <= NUM_ERROR_SOUNDS; i++) {
        loadAudio("error" + i.toString(), SOUND_DIRECTORY + "error" + i.toString());
      }
    }

    loadAudio("gameMusic", MUSIC_DIRECTORY + "gameMusic");
    loadAudio("gameOver", MUSIC_DIRECTORY + "gameOver");
    loadAudio("bossAlert", SOUND_DIRECTORY + "siren");
    loadAudio("playerDeath", SOUND_DIRECTORY + "scream");

    // Load sprites
    Crafty.sprite(100, 70, "img/hero.png", {PlayerSprite: [0, 0]});
    Crafty.sprite(100, 77, "img/enemy1.png", {EnemySprite: [0, 0]});
    Crafty.sprite(100, 100, "img/enemy2.png", {BossSprite: [0, 0]});
    Crafty.sprite(80, 139, "img/cars.png", {RedCarSprite: [0, 0], BlueCarSprite: [1, 0], GreenCarSprite: [2, 0]}, 10, 0);
    Crafty.sprite(100, 100, "img/explosion1.png", {Explosion1: [0, 0]});

    Crafty.scene("landing");

  });
  
  Crafty.scene("loading");
  
};
