window.addEventListener("load", function () {
  // Set up an instance of the Quintus engine  and include
  // the Sprites, Scenes, Input and 2D module. The 2D module
  // includes the `TileLayer` class as well as the `2d` componet.
  // Quintus object 1 creation
  var Q = (window.Q = Quintus({
    audioSupported: ["mp3", "ogg"],
    development: true, // remember to change to false before you upload it to the server.
  })
    .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio")
    // Maximize this game to whatever the size of the browser is
    .setup({
      maximize: true,
      scaleToFit: true,
    })
    // And turn on default input controls and touch input (for UI)
    .controls(true)
    .touch()
    // Enable sounds.
    .enableSound());
  Q.debug = false;
  Q.debugFill = false;

  // Load and init audio files.

  var songTitle;
  var tile = 70;

  function resetState() {
    Q.clearStages();
    Q.stageScene('mainMenu', 0);
    Q.stageScene("audioToggle", 2);
  };

  Q.input.keyboardControls({
    80: "P",
    32: 'space', // SPACE
    27: 'escape', // ESC
  });


  //Pause Method

  function game_paused() {
    var paused = !Q.state.get("paused");
    Q.state.set("paused", paused);
    if (paused) {
      Q.stageScene("Paused_screen", 3);
      Q.stage().pause();
    } else {
      Q.clearStage(3);
      Q.stage().unpause();
    }
  }

  //UI Button Pause Method

  function button_pause() { //FIXME: Make the button label text change when the pause state changes using the keyboard
    this.p.toggled = !this.p.toggled;
    if (this.p.toggled) {
      this.p.label = "Paused";
      game_paused();
    } else if (!this.p.toggled) {
      this.p.label = "Pause";
      game_paused();
    } else if (this.p.toggled && this.p.label == "Pause") {
      this.p.label = "Pause";
      game_paused();
    } else if (!this.p.toggled && this.p.label == "Paused") {
      this.p.label = "Pause";
      game_paused();
    }
  }

  // Main Keyboard Pause Method
  Q.input.on("escape", game_paused);


  // NOTE:
  /*
  Q.SPRITE masks
  
  0 = no sprites
  1 = Default sprite type
  2 = Particle sprite type
  4 = Active sprite type
  8 = Friendly sprite type
  16 = Enemy sprite type
  32 = Powerup sprite type
  64 = UI sprite type
  0xFFFF = All sprite type
  */

  Q.SPRITE_PLAYER = 1;
  Q.SPRITE_COLLECTABLE = 2;
  Q.SPRITE_ENEMY = 4;
  Q.SPRITE_DOOR = 8;
  Q.SPRITE_SPIKE = 12;

  /* Parent Player Class */
  Q.Sprite.extend("Player", {
    init: function (p) {
      this._super(p, { // this overloads the base constructor (init (p, defaults))
        sheet: "player",
        sprite: "player",
        direction: "right",
        standingPoints: [
          [-16, 44],
          [-23, 35],
          [-23, -48],
          [23, -48],
          [23, 35],
          [16, 44],
        ],
        duckingPoints: [
          [-16, 44],
          [-23, 35],
          [-23, -10],
          [23, -10],
          [23, 35],
          [16, 44],
        ],
        jumpSpeed: -500, // How much does the main character jump
        speed: 300,
        life: 3,
        strength: 100,
        score: 0,
        type: Q.SPRITE_PLAYER,
        collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_DOOR | Q.SPRITE_COLLECTABLE,
      });

      this.p.points = this.p.standingPoints;

      this.add("2d, platformerControls, animation, tween");

      this.on("bump.top", "breakTile");

      this.on("sensor.tile", "checkLadder");
      this.on("enemy.hit", "enemyHit");
      this.on("spike.hit", "spikeHit");
      this.on("jump");
      this.on("jumped");

      Q.input.on("down", this, "checkDoor");
      Q.input.on("fire", this, "attack");
    },

    jump: function (obj) {
      // Only play sound once.
      if (!obj.p.playedJump) {
        Q.audio.play("jump.mp3");
        obj.p.playedJump = true;
      }
    },

    jumped: function (obj) {
      obj.p.playedJump = false;
    },

    checkLadder: function (colObj) {
      if (colObj.p.ladder) {
        this.p.onLadder = true;
        this.p.ladderX = colObj.p.x;
      }
    },

    checkDoor: function () {
      this.p.checkDoor = true;
    },

    resetLevel: function () {
      Q.audio.stop();
      Q.clearStages(); //Clears everything
      Q.stageScene("endGame", 0, {
        label: "Play Again"
      }); //Loads the main menu
      this.p.strength = 100;
      this.animate({
        opacity: 1,
      });
    },

    enemyHit: function (data) {
      var col = data.col;
      var enemy = data.enemy;
      this.p.vy = -150;
      if (col.normalX == 1) {
        // Hit from left.
        this.p.x -= 15;
        this.p.y -= 15;
      } else {
        // Hit from right;
        this.p.x += 15;
        this.p.y -= 15;
      }
      this.p.immune = true;
      this.p.immuneTimer = 0;
      this.p.immuneOpacity = 1;
      this.p.strength -= 25;
      Q.stageScene("hud", 1, this.p);
      if (this.p.strength == 0) {
        this.p.life = this.p.life - 1;
        this.p.strength = 100;
        if (this.p.life == 0) {
          Q.clearStage(1);
          Q.stageScene("endGame", 0, {
            label: "you dun goofed m8"
          });
        }
      }
    },

    spikeHit: function (data) {
      var col = data.col;
      var spike = data.spike;
      this.p.vy = -150;
      if (col.normalY == 1) {
        // Hit from left.
        this.p.x -= 15;
        this.p.y -= 15;
      } else {
        // Hit from right;
        this.p.x += 15;
        this.p.y -= 15;
      }
      this.p.immune = false;
      this.p.immuneTimer = 0;
      this.p.immuneOpacity = 1;
      this.p.strength -= 25;
      Q.stageScene("hud", 1, this.p);
      if (this.p.strength == 0) {
        this.p.life = this.p.life - 1;
        this.p.strength = 100;
        if (this.p.life == 0) {
          Q.clearStage(1);
          Q.stageScene("endGame", 0, {
            label: "you dun goofed m8"
          });
        }
      }
    },

    continueOverSensor: function () {
      this.p.vy = 0;
      if (this.p.vx != 0) {
        this.play("walk_" + this.p.direction);
      } else {
        this.play("stand_" + this.p.direction);
      }
    },

    breakTile: function (col) {
      if (col.obj.isA("TileLayer")) {
        if (col.tile == 24) {
          col.obj.setTile(col.tileX, col.tileY, 36);
        } else if (col.tile == 36) {
          col.obj.setTile(col.tileX, col.tileY, 24);
        }
      }
      Q.audio.play("coin.mp3");
    },

    attack: function () {

    },


    step: function (dt) {
      console.log("X position: " + this.p.x + " Y Position: " + this.p.y);
      var processed = false;
      if (this.p.immune) {
        // Swing the sprite opacity between 50 and 100% percent when immune.
        if (this.p.immuneTimer % 12 == 0) {
          var opacity = this.p.immuneOpacity == 1 ? 0 : 1;
          this.animate({
            opacity: opacity,
          },
            0
          );
          this.p.immuneOpacity = opacity;
        }
        this.p.immuneTimer++;
        if (this.p.immuneTimer > 144) {
          // 3 seconds expired, remove immunity.
          this.p.immune = false;
          this.animate({
            opacity: 1,
          },
            1
          );
        }
      }

      if (this.p.onLadder) {
        this.p.gravity = 0;

        if (Q.inputs["up"]) {
          this.p.vy = -this.p.speed;
          this.p.x = this.p.ladderX;
          this.play("climb");
        } else if (Q.inputs["down"]) {
          this.p.vy = this.p.speed;
          this.p.x = this.p.ladderX;
          this.play("climb");
        } else {
          this.continueOverSensor();
        }
        processed = true;
      }

      if (!processed && this.p.door) {
        this.p.gravity = 1.47;
        if (this.p.checkDoor && this.p.landed > 0) {
          // Enter door.
          this.p.y = this.p.door.p.y;
          this.p.x = this.p.door.p.x;
          this.play("climb");
          this.p.toDoor = this.p.door.findLinkedDoor();
          processed = true;
        } else if (this.p.toDoor) {
          // Transport to matching door.
          this.p.y = this.p.toDoor.p.y;
          this.p.x = this.p.toDoor.p.x;
          this.stage.centerOn(this.p.x, this.p.y);
          this.p.toDoor = false;
          this.stage.follow(this);
          processed = true;
        }
      }

      if (!processed) {
        this.p.gravity = 1.47;

        if (Q.inputs["down"] && !this.p.door) {
          this.p.ignoreControls = true;
          this.play("duck_" + this.p.direction);
          if (this.p.landed > 0) {
            this.p.vx = this.p.vx * (1 - dt * 2);
          }
          this.p.points = this.p.duckingPoints;
        } else {
          this.p.ignoreControls = false;
          this.p.points = this.p.standingPoints;

          if (this.p.vx > 0) {
            if (this.p.landed > 0) {
              this.play("walk_right");
            } else {
              this.play("jump_right");
            }
            this.p.direction = "right";
          } else if (this.p.vx < 0) {
            if (this.p.landed > 0) {
              this.play("walk_left");
            } else {
              this.play("jump_left");
            }
            this.p.direction = "left";
          } else {
            this.play("stand_" + this.p.direction);
          }
        }
      }

      this.p.onLadder = false;
      this.p.door = false;
      this.p.checkDoor = false;

      if (this.p.y > 4550) {
        this.stage.unfollow();
      }

      if (this.p.y > 4550) {
        this.p.life = this.p.life - 1;
        Q.stageScene("level1", 0);
      }
    },
  });

  /* Parent Enemy class */
  Q.Sprite.extend("Enemy", {
    init: function (p, defaults) {
      this._super(
        p,
        Q._defaults(defaults || {}, {
          sheet: p.sprite,
          vx: 50,
          defaultDirection: "left",
          type: Q.SPRITE_ENEMY,
          collisionMask: Q.SPRITE_PLAYER,
        })
      );

      this.add("2d, aiBounce, animation");
      this.on("bump.top", this, "die");
      this.on("hit.sprite", this, "hit");
    },

    step: function (dt) {
      if (this.p.dead) {
        this.del("2d, aiBounce");
        this.p.deadTimer++;
        if (this.p.deadTimer > 10) {
          // Dead for 10 frames, remove it.
          this.destroy();
        }
        return;
      }
      var p = this.p;

      p.vx += p.ax * dt;
      p.vy += p.ay * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      this.play("walk");
    },

    hit: function (col) {
      if (col.obj.isA("Player") && !col.obj.p.immune && !this.p.dead) {
        col.obj.trigger("enemy.hit", {
          enemy: this,
          col: col,
        });
        Q.audio.play("hit.mp3");
      }
    },

    die: function (col) {
      if (col.obj.isA("Player")) {
        Q.audio.play("coin.mp3");
        this.p.vx = this.p.vy = 0;
        this.play("dead");
        this.p.dead = true;
        var that = this;
        col.obj.p.vy = -300;
        this.p.deadTimer = 0;
        this.destroy();
      }
    },
  });

  /* Bat Child class */
  Q.Enemy.extend("Bat", {});

  /* Skeleton1 Child class */
  Q.Enemy.extend("Skeleton1", {
    init: function (p) {
      this._super(p, {
        w: 55,
        h: 72,
      });
    },
  });

  /* Skeleton2 Child class */
  Q.Enemy.extend("Skeleton2", {
    init: function (p) {
      this._super(p, {
        w: 55,
        h: 72,
      });
    },
  });

  Q.Sprite.extend("Collectable", {
    init: function (p) {
      this._super(p, {
        sheet: p.sprite,
        type: Q.SPRITE_COLLECTABLE,
        collisionMask: Q.SPRITE_PLAYER,
        sensor: true,
        vx: 0,
        vy: 0,
        gravity: 0,
      });
      this.add("animation");

      this.on("sensor");
    },

    // When a Collectable is hit.
    sensor: function (colObj) {
      // Increment the score.
      if (this.p.amount) {
        colObj.p.score += this.p.amount;
        Q.stageScene("hud", 1, colObj.p);
      }
      Q.audio.play("coin.mp3");
      this.destroy();
    },
  });

  Q.Sprite.extend("Door", {
    init: function (p) {
      this._super(p, {
        sheet: p.sprite,
        type: Q.SPRITE_DOOR,
        collisionMask: Q.SPRITE_NONE,
        sensor: true,
        vx: 0,
        vy: 0,
        gravity: 0,
        open: true,
      });
      this.add("animation");

      this.on("sensor");
    },
    findLinkedDoor: function () {
      return this.stage.find(this.p.link);
    },
    // When the player is in the door.
    sensor: function (colObj) {
      // Mark the door object on the player.
      colObj.p.door = this;
    },
  });


  // FIXME: The closed door should not transport the player 
  // to another door until the key is collected.

  Q.Door.extend("door_closed", {
    init: function (p) {
      this._super(p, {
        sheet: p.sprite,
        type: Q.SPRITE_DOOR,
        collisionMask: Q.SPRITE_NONE,
        sensor: true,
        vx: 0,
        vy: 0,
        gravity: 0,
        open: false,
      });
      this.add("animation");

      this.on("sensor");
    },
    findLinkedDoor: function () {
      if (open == true) {
        return this.stage.find(this.p.link);
      }
    },
    // When the player is in the door.
    sensor: function (colObj) {
      // Mark the door object on the player.
      colObj.p.door = this;
    },
  });

  Q.Collectable.extend("Heart", {
    // When a Heart is hit.
    sensor: function (colObj) {
      // Increment the strength.
      if (this.p.amount) {
        colObj.p.strength = Math.max(colObj.p.strength + 25, 100);
        Q.stageScene("hud", 1, colObj.p);
        Q.audio.play("heart.mp3");
      }
      this.destroy();
    },
  });

  Q.Sprite.extend("HoverSprite", {
    init: function (p) {
      this._super(p, {
        // The amount to hover up and down from the original y-location.
        amplitude: 3,
        // The time it takes to hover up, down and back to level again.
        period: 2,
        // The y-coordinate around which the hovering happens.
        centerY: p.y,
        // The elapsed time since hovering started (supplied to the
        // function that determines the height).
        elapsed: 0,

      });
    },

    step: function (dt) {
      this.p.elapsed += dt;
      this.p.y =
        this.p.centerY +
        this.p.amplitude *
        Math.sin(2 * Math.PI * (this.p.elapsed / this.p.period));
    },
  });

  Q.Sprite.extend("play_button", {
    init: function (p) {
      this._super(p, {
        sheet: "play_button",
        sprite: "play_button",

      });
    },
    step: function (dt) {
      this.add("animation");
      this.play("light");
    },
  });

  Q.Sprite.extend("spike", {
    init: function (p) {
      this._super(p, {
        sheet: "spike",
        type: Q.SPRITE_SPIKE,
        collisionMask: Q.SPRITE_DEFAULT,
        sensor: true,
        vx: 0,
        vy: 0,
        gravity: 0
      });
      this.on("hit.sprite", this, "collision");
    },
    collision: function (col) {
      if (col.obj.isA("Player") && !col.obj.p.immune) {
        col.obj.trigger("spike.hit", {
          spike: this,
          col: col,

        });
      }
    }
  });

  Q.scene("Paused_screen", function (stage) {
    var container = stage.insert(
      new Q.UI.Container({
        x: Q.width / 2,
        y: Q.height / 2,
        fill: "rgba(0,0,0,0.5)"
      }));

    container.insert(new Q.UI.Text({
      x: -Q.width,
      y: -Q.height,
      label: " "
    }));

    container.insert(new Q.UI.Text({
      x: Q.width,
      y: Q.height,
      label: " "
    }));
    var Continue = container.insert(new Q.UI.Button({
      label: "Continue",
      y: 50,
      x: 0,
      fill: "#CCCCCC"
    }));

    var Exit = container.insert(new Q.UI.Button({
      label: "Exit",
      y: 100,
      x: 0,
      fill: "#CCCCCC"
    }));

    // FIXME: Continue.on("click", game_paused);

    container.fit(20);
  });

  // MainMenu
  Q.scene("mainMenu", function (stage) {
    Q.audio.stop();
    Q.clearStage(1);
    Q.clearStage(2);
    Q.clearStage(3);
    songTitle = "hof.mp3";
    if (Q.state.get("audioEnabled")) {
      Q.audio.play(songTitle, {
        loop: true,
      });
      console.log("Sound enabled!");
    } else if (!Q.state.get("audioEnabled")) {
      console.log("Sound not enabled!");
    }

    stage.insert(
      new Q.UI.Button({
        // UI Play Button
        sheet: "play_button",
        x: Q.width / 2,
        y: Q.height / 2,
      },
        function () {
          Q.audio.stop();
          Q.clearStage(1);
          Q.stageScene("level1", 0);
          Q.stageScene("hud", 1, Q("Player").first().p);
          Q.stageScene("audioToggle", 2);
        }
      )
    );

    stage.insert(
      new Q.HoverSprite({
        // title
        cx: 0,
        cy: 0,
        x: 16,
        y: 16,
        asset: "bw.png",
      })
    );
    stage.insert(
      new Q.Sprite({
        // copyright
        x: Q.width - Q.width / 4,
        y: Q.height - Q.height / 8,
        asset: "copyright.png",
      })
    );
  });

  // Level 1 scene
  Q.scene("level1", function (stage) {
    Q.audio.stop("hof.mp3");
    stage.insert(
      new Q.Repeater({
        asset: "bg-sky.png",
        speedX: 0.01,
        speedY: 0.01,
        type: 0,

      })
    );
    stage.insert(
      new Q.Repeater({
        asset: "moon.png",
        speedX: 0.1,
        speedY: 0.1,
        type: 0,
      })
    );
    // sky parallax
    stage.insert(
      new Q.Repeater({
        asset: "clouds1.png",
        speedX: 0.11,
        speedY: 0.11,
        type: 0,
      })
    );
    stage.insert(
      new Q.Repeater({
        asset: "trees1.png",
        speedX: 0.16,
        speedY: 0.16,
        type: 0,
      })
    );
    stage.insert(
      new Q.Repeater({
        asset: "houseS.png",
        speedX: 0.18,
        speedY: 0.18,
        type: 0,
      })
    );
    stage.insert(
      new Q.Repeater({
        asset: "mountain1.png",
        speedX: 0.2,
        speedY: 0.2,
        type: 0,
      })
    );
    stage.insert(
      new Q.Repeater({
        asset: "houses2.png",
        speedX: 0.22,
        speedY: 0.22,
        type: 0,
      })
    );
    stage.insert(
      new Q.Repeater({
        asset: "mountains2.png",
        speedX: 0.24,
        speedY: 0.24,
        type: 0,
      })
    );
    stage.insert(
      new Q.Repeater({
        asset: "bushes1.png",
        speedX: 0.27,
        speedY: 0.27,
        type: 0,
      })
    );
    stage.insert(
      new Q.Repeater({
        asset: "bushes2.png",
        speedX: 0.3,
        speedY: 0.3,
        type: 0,
      })
    );
    Q.stageTMX("level1.tmx", stage);
    songTitle = 'lb.mp3';

    //Only plays the background music if sound is enabled
    if (Q.state.get("audioEnabled")) {
      Q.audio.play(songTitle, {
        loop: true,
      });
      console.log("Sound enabled!");
    } else if (!Q.state.get("audioEnabled")) {
      console.log("Sound not enabled!");
    }
    stage.add("viewport").follow(Q("Player").first());
  });

  // HUD
  Q.scene("hud", function (stage) {
    var container = stage.insert(
      new Q.UI.Container({
        x: 50,
        y: 0,

      })
    );

    var label = container.insert(
      new Q.UI.Text({
        x: 210,
        y: 20,
        label: "Score: " + stage.options.score,
        color: "white",
      })
    );

    var strength = container.insert(
      new Q.UI.Text({
        x: 50,
        y: 20,
        label: "Health: " + stage.options.strength + "%",
        color: "white",
      })
    );

    var lives = container.insert(
      new Q.UI.Text({
        x: 340,
        y: 20,
        label: "Lives: " + stage.options.life,
        color: "white",
      })
    );

    var pause_button = new Q.UI.Button({
      label: "Pause",
      y: Q.height / 13,
      x: (Q.width / 8) * 7.3,
      fill: "#990000",
      border: 5,
      shadow: 10,
      shadowColor: "rgba(0,0,0,0.5)",
      toggled: stage.options.toggled,
    }, button_pause);
    stage.insert(pause_button);
    container.fit(20);
  });

  Q.scene("opSelector", function (stage) {
    var container = stage.insert(
      new Q.UI.Container({
        x: Q.width / 2,
        y: Q.height / 2,
        fill: "rgba(0,0,0,0.5)"
      }));

    container.insert(new Q.UI.Text({
      x: -Q.width,
      y: -Q.height,
      label: " "
    }));

    container.insert(new Q.UI.Text({
      x: Q.width,
      y: Q.height,
      label: " "
    }));

    container.insert(new Q.UI.Text({
      x: 0,
      y: 0,
      color: "White",
      label: "Enable Sound?"
    }));

    var button_yes = container.insert(new Q.UI.Button({
      label: "Yes",
      y: 50,
      x: -50,
      fill: "#CCCCCC"
    }));

    var button_no = container.insert(new Q.UI.Button({
      label: "No",
      y: 50,
      x: 50,
      fill: "#CCCCCC"
    }));

    button_yes.on("click", function () {
      Q.stageScene("mainMenu", 0);
      Q.stageScene("audioToggle", 2, {
        toggled: true,
      });
    });
    button_no.on("click", function () {
      Q.stageScene("mainMenu", 0);
      Q.stageScene("audioToggle", 2, {
        toggled: false,
      });
    });
    container.fit(20, 20);
  });

  Q.scene("audioToggle", function (stage) {
    // Create indicators for each of the buttons and add them to the stage.
    var audioToggleButton = new Q.UI.Button({
      x: 23,
      y: Q.height - 19,
      asset: stage.options.toggled ? "audio_on.png" : "audio_off.png",
      toggled: stage.options.toggled
    },
      function () {
        this.p.toggled = !this.p.toggled;
        this.p.asset = this.p.toggled ? "audio_on.png" : "audio_off.png";
        Q.state.set('audioEnabled', this.p.toggled);
        if (this.p.toggled) {
          Q.audio.play(songTitle);
        } else if (!this.p.toggled) {
          Q.audio.stop();
        }
      });
    stage.insert(audioToggleButton);
  });

  Q.scene("endGame", function (stage) {

    var container = stage.insert(new Q.UI.Container({
      x: Q.width / 2,
      y: Q.height / 2,
      fill: "rgba(0,0,0,0.5)"
    }));

    var button = container.insert(new Q.UI.Button({
      x: 0,
      y: 0,
      fill: "#CCCCCC",
      label: "Play Again"
    }));

    var label = container.insert(new Q.UI.Text({
      x: 10,
      y: -10 - button.p.h,
      color: "White",
      label: stage.options.label
    }));

    Q.input.on("space", function () {
      resetState();
    });

    button.on("click", function () {
      resetState();
    });

    container.fit(20);
  });

  Q.loadTMX(
    "level1.tmx, mountains2.png, bushes1.png, bushes2.png, clouds1.png, trees1.png, houses2.png, mountain1.png, houseS.png, bg-sky.png, moon.png, collectables.json, doors.json, enemies.json, lb.mp3, fire.mp3, jump.mp3, heart.mp3, hit.mp3, coin.mp3, player1.json, player1.png,audio_on.png, audio_off.png, endgame_popup_background.png, victory1.mp3, victory2.mp3, hof.mp3, title_theme.mp3, play_button.png, bw.png, copyright.png, play_button.json, spike.png, spike.json",
    function () {
      Q.compileSheets("player1.png", "player1.json");
      Q.compileSheets("collectables.png", "collectables.json");
      Q.compileSheets("enemies.png", "enemies.json");
      Q.compileSheets("doors.png", "doors.json");
      Q.compileSheets("play_button.png", "play_button.json");
      Q.compileSheets("spike.png", "spike.json");
      Q.animations("player", {
        walk_right: {
          frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          rate: 1 / 15,
          flip: false,
          loop: true,
        },
        walk_left: {
          frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          rate: 1 / 15,
          flip: "x",
          loop: true,
        },
        jump_right: {
          frames: [12],
          rate: 1 / 10,
          flip: false,
        },
        jump_left: {
          frames: [12],
          rate: 1 / 10,
          flip: "x",
        },
        stand_right: {
          frames: [1],
          rate: 1 / 10,
          flip: false,
        },
        stand_left: {
          frames: [1],
          rate: 1 / 10,
          flip: "x",
        },
        duck_right: {
          frames: [15],
          rate: 1 / 10,
          flip: false,
        },
        duck_left: {
          frames: [15],
          rate: 1 / 10,
          flip: "x",
        },
        climb: {
          frames: [16, 17],
          rate: 1 / 3,
          flip: false,
        },
        /*Attack: {
          frames: []
        },*/
      });
      var EnemyAnimations = {
        walk: {
          frames: [0, 1],
          rate: 1 / 3,
          loop: true,
        },
        dead: {
          frames: [2],
          rate: 1 / 10,
        },
      };
      Q.animations("bat", EnemyAnimations);
      Q.animations("skeleton1", EnemyAnimations);
      Q.animations("skeleton2", EnemyAnimations);
      Q.animations("play_button", {
        light: {
          frames: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
      });
      Q.stageScene("opSelector", 0);
    }, {
      progressCallback: function (loaded, total) {
        var element = document.getElementById("loading_progress");
        element.style.width = Math.floor((loaded / total) * 100) + "%";
        if (loaded == total) {
          document.getElementById("loading").remove();

        }
      },
    }
  );
});


// TODO list:

// TODO: add the falling system
// TODO: The key will be dropped by an enemy once every enemy on the scen is killed.
// TODO: Add a function to toggle audio using the keyboard.
// TODO: Add a method to recover lives.
// TODO: Add a defense system.

// TODO: remake the map and game using the "load" method instead of loadTMX to use the prerender function as well as the preload, to make the game run smoother.
// TODO: Add more enemies.
// TODO: Add another level.


/*
        Staging

Stage(n) - nth layer
.
.
.
Stage(2) - audio toggle
Stage(1) - Hud
Stage(0) - Main Layer (most complex)

Each Stage can be overwritten by
staging another scene into a given
stage index, because of this,
there can't be two stages with the
same index.

*/

// NOTE: on the json files: sx= starting in the x axis of the sprite, sy = same but for the y axis, tileW = width of the sprite or tile, tileH=height

// NOTE: p is for properties



// NOTE: in javascript a variable written like this:
/*

  var Q = (window.Q = Quintus({
    audioSupported: ["mp3", "ogg"],
    development: true, // remember to change to false before you upload it to the server.
  })

is an object

 */