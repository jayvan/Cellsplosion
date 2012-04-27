
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
      SOUND_DIRECTORY           = 'audio/sound/',
      KILL_STREAK_MULTIPLIER    = 7,
      MINIMUM_KILL_STREAK       = 5,
      KILL_STREAK_TIME          = 3000,
      UNPAUSE_TIME              = 3000;

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

  var warningSiren = function() {
    try {
      Crafty.audio.play("bossAlert", 1, 1.0);
    } catch (e) { }
    $("#warning").css("background", "red").css("opacity", "0").show();
    $('#warning').animate({opacity: 0.3}, 200).animate({opacity: 0}, 400).animate({opacity: 0.3}, 200).animate({opacity: 0}, 400);
  }

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
  };

  var addToScore = function(scoreToAdd) {
    score += scoreToAdd;
    $("#score-box .number").text(score);
  };

  var calculateKillStreakScore = function() {
    return killStreak * killStreak * KILL_STREAK_MULTIPLIER;
  };

  var isPaused;
  var unpausing;
  var score;
  var enemiesKilled;
  var killStreak;
  var timeOfLastKill;
  // Load high score
  var highScore = localStorage.getItem("highScore");
  var tutorialComplete = localStorage.getItem("tutorialComplete");

  var world;

  if (highScore === null) {
    highScore = 0;
  }

  if (tutorialComplete) {
    $('#info-bar').css('opacity', '1');
  }

  $(window).blur(function(){
    if (world) {
      world.pause(true);
    }
  });

  Crafty.c("World", {
    init: function() {
      isPaused = false;
      unpausing = false;
      score = 0;
      enemiesKilled = 0;
      killStreak = 0;
      timeOfLastKill = 0;

      addToScore(0);

      this.player = Crafty.e("Player");
      this.enemies = [];
      this.targetEnemyIndices = [];
      this.typedNumber = "";

      this.bind("KeyDown", function(e) {
        if (!this.player.dead && (e.key == 61 || e.key == 107 || e.key == 187)) {
          this.pause();
        }

        if (isPaused) {
          return;
        }

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
              addToScore(enemyToDestroy.getScore());
              enemyToDestroy.destroyEnemy();
              this.enemies.splice(this.targetEnemyIndices[i], 1);
              enemiesKilled += 1;

              if (enemiesKilled % ENEMY_BOSS_FREQUENCY === 0) {
                warningSiren();
                this.spawnBoss();
              } 

              if (enemiesKilled % ENEMY_RESPAWN_FACTOR === 0) {
                this.spawnEnemy(false);
              }
              this.spawnEnemy(false);

              killStreak += 1;
              timeOfLastKill = new Date();
              if (killStreak >= MINIMUM_KILL_STREAK) {
                $("#killStreak").html("<span style='font-size: 18px'>x</span>" + killStreak);
                $("#killStreak").stop().animate({opacity: 1.0}, 100);
                $("#killStreak").animate({opacity: 0.0}, KILL_STREAK_TIME);
              }
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
        if (killStreak >= MINIMUM_KILL_STREAK && new Date() - timeOfLastKill >= KILL_STREAK_TIME) {
          addToScore(calculateKillStreakScore());
          killStreak = 0;
        }

        // Update all of the enemies
        for (var i = 0; i < this.enemies.length; i++) {
          this.enemies[i].update(this.player);
        }

        // Bounds check the player
        if (this.player.x < WALL_SIZE) {
          this.player.x = WALL_SIZE;
        } else if (this.player.x > this.width - WALL_SIZE - PLAYER_WIDTH) {
          this.player.x = this.width - WALL_SIZE - PLAYER_WIDTH;
        }
        
        if (this.player.y < WALL_SIZE) {
          this.player.y = WALL_SIZE;
        } else if (this.player.y > this.height - WALL_SIZE - PLAYER_HEIGHT) {
          this.player.y = this.height - WALL_SIZE - PLAYER_HEIGHT;
        }
      });
    },

    setViewport: function() {
      Crafty.viewport.follow(this.player, 0, 0);
    },
    
    spawnEnemy: function(easyMode) {
      if (!this.spawnEnemies) {
        return false;
      }

      var x = 0,
          y = 0;

      do {
        x = Crafty.math.randomInt(WALL_SIZE, this.width - WALL_SIZE - ENEMY_WIDTH);
        y = Crafty.math.randomInt(WALL_SIZE, this.height - WALL_SIZE - ENEMY_HEIGHT);
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
        x = Crafty.math.randomInt(WALL_SIZE, this.width - WALL_SIZE - ENEMY_WIDTH);
        y = Crafty.math.randomInt(WALL_SIZE, this.height - WALL_SIZE - ENEMY_HEIGHT);
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
    
    startGame: function(width, height, initialCount, spawning) {
      if (typeof(initialCount) === "undefined") {
        initialCount = INITIAL_ENEMY_COUNT;
      }

      if (typeof(spawning) === "undefined") {
        spawning = true;
      }

      this.width = width;
      this.height = height;
      this.spawnEnemies = spawning;
      this.player.attr({x: this.width / 2 - PLAYER_WIDTH / 2, y: this.height / 2 - PLAYER_HEIGHT / 2});
      this.setViewport();

      for (var i = 0; i < initialCount; i++) {
        this.spawnEnemy(true);
        this.targetEnemyIndices.push(i);
      }

      // Create the floor
      Crafty.e("2D, DOM, Image")
       .attr({w: this.width, h: this.height, z: -5})
       .image(FLOOR_IMAGE, "repeat");

      Crafty.e("2D, DOM, Image")
        .attr({w: this.width, h: this.height, z: -4})
        .image(PARKING_IMAGE, "repeat");

      // Create the walls
      // Left
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: this.height, x: 0, y: 0, z: -3})
        .image(WALL_VERTICAL_IMAGE, "repeat");
      // Right
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: this.height, x: this.width - WALL_SIZE, y: 0, z: -3})
        .image(WALL_VERTICAL_IMAGE, "repeat")
        .flip("X");
      // Bottom
      Crafty.e("2D, DOM, Image")
        .attr({w: this.width, h: WALL_SIZE, x: 0, y: this.height - WALL_SIZE, z: -3})
        .image(WALL_HORIZONTAL_IMAGE, "repeat")
        .flip("Y");
      // Top
      Crafty.e("2D, DOM, Image")
        .attr({w: this.width, h: WALL_SIZE, x: 0, y: 0, z: -3})
        .image(WALL_HORIZONTAL_IMAGE, "repeat");

      // Top left corner
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WALL_SIZE, x: 0, y: 0, z: -2})
        .image(WALL_CORNER_IMAGE, "repeat");

      // Top Right corner
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WALL_SIZE, x: this.width - WALL_SIZE, y: 0, z: -2})
        .image(WALL_CORNER_IMAGE, "repeat")
        .flip("X");

      // Bottom Left
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WALL_SIZE, x: 0, y: this.height - WALL_SIZE, z: -2})
        .image(WALL_CORNER_IMAGE, "repeat")
        .flip("Y");

      // Bottom Right
      Crafty.e("2D, DOM, Image")
        .attr({w: WALL_SIZE, h: WALL_SIZE, x: this.width - WALL_SIZE, y: this.height - WALL_SIZE, z: -2})
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

    pause: function(toggle) {
      if (unpausing) {
        return;
      }
      if (arguments.length == 1 ? toggle : !isPaused) {
        $("#countdown .main").text("ON HOLD");
        $("#countdown .subtext").text("Press the + key to continue").show();
        $("#countdown").css("opacity", 1).show();
        $("#warning").css("background", "black").css("opacity", 0.5).show();
        isPaused = true;
        timeOfLastKill = new Date() - timeOfLastKill;
        Crafty.pause(true);
        $(".Number").hide();
      } else {
        unpausing = true;
        $("#warning").hide();

        $("#countdown .subtext").hide();
        $("#countdown .main").text("3");
        $("#countdown").animate({opacity: 1}, 100).animate({opacity: 0}, 900);
        window.setTimeout(function(){$("#countdown .main").text("2");}, 1000);
        $("#countdown").animate({opacity: 1}, 100).animate({opacity: 0}, 900);
        window.setTimeout(function(){$("#countdown .main").text("1");}, 2000);
        $("#countdown").animate({opacity: 1}, 100).animate({opacity: 0}, 900);
        window.setTimeout(function() {
          $("#countdown").hide();
          isPaused = false;
          unpausing = false;
          timeOfLastKill = new Date() - timeOfLastKill;
          Crafty.pause(false);
          $(".Number").show();
        }, UNPAUSE_TIME);
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

  Crafty.c("Player", {
    init: function() {
      this.addComponent("2D, DOM, Multiway, Collision, SpriteAnimation, PlayerSprite")
        .attr({x: this.width / 2, y: this.height / 2, w: PLAYER_WIDTH, h: PLAYER_HEIGHT, z: 5})
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
            this.disableControl();
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

      if (killStreak >= MINIMUM_KILL_STREAK) {
        addToScore(calculateKillStreakScore());
      }

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
      this.trigger("Die");
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
    world = null;
    world = Crafty.e("World").startGame(VIEWPORT_WIDTH * 3, VIEWPORT_HEIGHT * 3);
  });

  Crafty.scene("tutorial", function() {
    $("#score-box").show();
    world = Crafty.e("World").startGame(VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 0, false);

    var hintText = Crafty.e("2D, DOM, Text")
      .attr({w: VIEWPORT_WIDTH - 2 * WALL_SIZE, h: 80, x: WALL_SIZE, y: VIEWPORT_HEIGHT - WALL_SIZE - 80, z: 5})
      .text("Hold W, A, S, and D to walk around</br>Grab a phone, you'll need it!")
      .textColor("#ffffff")
      .css({'font-size': '30px', 'text-align': 'center', 'font-family': 'monospace', 'background': 'rgba(0,0,0,0.75)'});

    var checkTutorialOver = function() {
      var targetsRemaining = Crafty("CellPhone").length;
      if (targetsRemaining == 0) {
        hintText.text("Quick! Type the number above the zombies head and press enter!");
        $("#info-bar").animate({opacity: 1.0}, 1000);
        Crafty(Crafty("Player")[0]).disableControl().stop();

        var world = Crafty(Crafty("World")[0]);
        var enemy = Crafty.e("Enemy").addComponent("EnemySprite").difficulty(3).setSpeed(0).attr({x: VIEWPORT_WIDTH / 2 - ENEMY_WIDTH / 2, y: VIEWPORT_HEIGHT / 2 - ENEMY_HEIGHT / 2});
        enemy.bind("Die", function() {
          hintText.text("Kaboom, Baby!<br />Starting the full game in 5 seconds...");
          localStorage.setItem("tutorialComplete", true);
          window.setTimeout(function() {
            warningSiren();
            Crafty.scene("main");
          }, 5000);
        });

        world.enemies.push(enemy);
        world.targetEnemyIndices.push(0);
      } else {
        hintText.text("This one's a dud!</br>Grab the other phone, quick!")
      }

      return false;
    }

    Crafty.e("2D, DOM, Color, Collision, CellPhone")
      .attr({w: 75, h: 75, x: WALL_SIZE + 5, y: WALL_SIZE + 5})
      .color("Green")
      .css({'border-radius': '25px'})
      .collision().onHit("Player", function(e) {
        this.destroy();
        checkTutorialOver();
      });

    Crafty.e("2D, DOM, Color, Collision, CellPhone")
      .attr({w: 75, h: 75, x: VIEWPORT_WIDTH - WALL_SIZE - 80, y: VIEWPORT_HEIGHT - WALL_SIZE - 160})
      .color("Green")
      .css({'border-radius': '25px'})
      .collision().onHit("Player", function(e) {
        this.destroy();
        checkTutorialOver();
      });
  });

  Crafty.scene("gameOver", function() {
    Crafty(Crafty("World")[0]).destroy();
    world = null;

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
          if (tutorialComplete) {
            Crafty.scene("main");
          } else {
            Crafty.scene("tutorial");
          }
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
    Crafty.sprite(75, 75, "img/cell_pickup.png", {CellPhone: [0, 0]});

    Crafty.scene("landing");

  });
  
  Crafty.scene("loading");
  
};
