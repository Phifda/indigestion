var game = new Phaser.Game(1000, 1000, Phaser.AUTO);

main = {};

game.global = {
    keys: {},
}

main.thegame = function(){};

main.thegame.prototype = {
    preload: function() {
    },

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.world.setBounds(0, 0, 2000, 2000);

        // background
        game.add.tileSprite(0, 0, game.world.width, game.world.height, 'sprites', 'mars.png')

        // 'BLOOD'
        blood = game.add.group();
        // blood.classType = Phaser.Image

        // 'ANTS'
        ants = game.add.group();
        ants.enableBody = true;

        // 'BULLETS'
        bullets = game.add.group();
        bullets.enableBody = true;

        // CREATE THE PLAYER
        player = game.add.sprite(game.world.width/2, game.world.height/2, 'sprites', 'worm-1.png');
        player.animations.add("move", Phaser.Animation.generateFrameNames('worm-', 1, 4, '.png', 1))
        player.animations.add("poo", Phaser.Animation.generateFrameNames('poo-', 1, 4, '.png', 1))
        game.physics.arcade.enable(player);
        player.anchor.setTo(0.5,0.5);
        player.body.allowRotation = true;
        player.body.maxAngular = 100;
        player.body.angularDrag = 500;
        player.size = 1

        game.camera.follow(player);

        // ALIEN
        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;

        timer = game.time.create();
        timer.loop(800, main.thegame.prototype.alienShoot, false)
        timer.start(0)

        alien = game.add.sprite(game.world.width/2, game.world.height-258, 'sprites', 'car.png');
        alien.health = 20;
        alien.anchor.setTo(0.5,0.5);
        game.physics.arcade.enable(alien);
        alien.body.allowRotation = true;
        alien.angle = -90;
        alien.body.angularDrag = 500;
        alien.body.maxAngular = 100;
        point = new Phaser.Point();

        // KEYS
        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        w = game.input.keyboard.addKey(Phaser.Keyboard.W);
        w.onUp.add(main.thegame.prototype.stopMoving);
        a = game.input.keyboard.addKey(Phaser.Keyboard.A);
        d = game.input.keyboard.addKey(Phaser.Keyboard.D);

        // h = game.input.keyboard.addKey(Phaser.Keyboard.H);
        // h.onDown.add(main.thegame.prototype.alienShoot)
        // n = game.input.keyboard.addKey(Phaser.Keyboard.N);
        // b = game.input.keyboard.addKey(Phaser.Keyboard.B);

        // text
        bossHealth = game.add.text(0, 20, "Boss Health: 20", {
            fontSize: 36,
            boundsAlignH: 'center'});
        bossHealth.setTextBounds(0, 0, game.height, game.width);
        bossHealth.fixedToCamera = true;

        for (var i=0; i<25; i++) {
            main.thegame.prototype.spawnAnt();
        }
    },

    update: function() {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.body.angularAcceleration = 0;
        alien.body.angularAcceleration = 0;
        player.scale.setTo(player.size, player.size);

        if (space.isDown) {
            if (!game.global.pooing) {
                player.animations.play('poo', 1.5, false);
            }

            game.global.pooing = true
        } else if (game.global.pooing) {
            if (player.animations.currentAnim._frameIndex == 3) {
                main.thegame.prototype.shoot();
            }
            game.global.pooing = false;
            player.animations.play('move', 0, true);
            player.animations.stop();
        }

        // player collide with world boundries
        game.physics.arcade.velocityFromAngle(player.angle-90, 40*player.size, point);

        if (player.x+point.x < 0) {
            player.body.velocity.x = 0;
            player.x = 0-point.x;
        } else if (player.x+point.x > game.world.height) {
            player.body.velocity.x = 0;
            player.x = game.world.height-point.x;
        }
        if (player.y+point.y < 0) {
            player.body.velocity.y = 0;
            player.y = 0-point.y;
        } else if (player.y+point.y > game.world.height) {
            player.body.velocity.y = 0;
            player.y = game.world.height-point.y;
        }

        // move forward
        if (w.isDown && !space.isDown) {
            game.physics.arcade.velocityFromAngle(player.angle-90, 250, player.body.velocity);
            player.animations.play('move', 10, true);
        }

        // Rotate
        if (a.isDown) {
            player.body.angularAcceleration = -500;
        }

        if (d.isDown) {
            player.body.angularAcceleration = 500;
        }

        // Move the alien
        desiredRotation = game.physics.arcade.angleBetween(alien, player)*(180/Math.PI)

        if (alien.body.rotation > desiredRotation+10 || alien.body.rotation < desiredRotation-10) {
            if (Math.abs(desiredRotation - alien.body.rotation) > 180) {
                if (desiredRotation < alien.body.rotation) {
                    desiredRotation += 360;
                } else {
                    desiredRotation -= 360;
                }
            }
            if (desiredRotation > alien.body.rotation) {
                alien.body.angularVelocity = 40+(20-alien.health)*1.5;
            } else {
                if ( desiredRotation < alien.body.rotation) {
                    alien.body.angularVelocity = -40-(20-alien.health)*1.5;
                }
            }
            game.physics.arcade.velocityFromAngle(alien.angle, 100+((20-alien.health)*12), alien.body.velocity);
        } else {
            game.physics.arcade.velocityFromAngle(alien.angle, 200+((20-alien.health)*12), alien.body.velocity);
        }

        // Alien on player collision
        if (Math.sqrt(Math.pow(player.x-alien.x, 2) + Math.pow(player.y-alien.y, 2)) < 95 ){
            main.thegame.prototype.lose();
        }


        game.physics.arcade.overlap(bullets, ants, main.thegame.prototype.shotAnt, null, this);
        game.physics.arcade.overlap(enemyBullets, ants, main.thegame.prototype.shotAnt, null, this);
        game.physics.arcade.overlap(enemyBullets, player, main.thegame.prototype.lose, null, this);
        game.physics.arcade.overlap(bullets, alien, main.thegame.prototype.hitAlien, null, this);

        ants.forEach(main.thegame.prototype.collision, this, true);
        blood.forEachDead(main.thegame.prototype.remove, this);

        bossHealth.text = "Boss Health: "+alien.health.toString();
    },

    spawnAnt: function() {
        ant = ants.create(Math.random()*game.world.height, Math.random()*game.world.width, 'sprites', 'ant-1.png');
        ant.animations.add('move',  Phaser.Animation.generateFrameNames('ant-', 1, 2, '.png', 1))
        ant.animations.play('move', 5, true)
        ant.anchor.setTo(0.5, 0.5);
        ant.body.collideWorldBounds = true;
        ant.scale.setTo(0.6, 0.6);
        ant.body.acceleration.x = 0
        ant.body.maxVelocity.setTo(75)
        ant.body.acceleration.y = 0
    },

    shoot: function() {
        bullet = bullets.create(player.x, player.y, 'sprites', 'poopile.png');
        bullet.anchor.setTo(0.5, 0.5);
        bullet.scale.setTo(player.size*player.size, player.size*player.size);
        bullet.outOfBoundsKill = true;
        bullet.checkWorldBounds = true;
        bullet.damage = Math.round((player.size-0.9)*10) // 1, 2, 3, 4, 5
        game.physics.arcade.velocityFromAngle(player.angle+90, 300, bullet.body.velocity);
        player.size = 1
    },

    stopMoving: function() {
        if (!game.global.pooing) {
            player.animations.stop();
        }
    },

    // check if player hits an ant and move the ants
    collision: function(ant) {
        game.physics.arcade.velocityFromAngle(player.angle-90, 30*player.size, point);

        if (Math.sqrt(Math.pow(player.x+point.x-ant.x, 2) + Math.pow(player.y+point.y-ant.y, 2)) < 25*player.size) {
            if (player.size < 1.4) {
                player.size += 0.1;
            }

            patch = blood.create(ant.x, ant.y, 'sprites', 'blood.png')
            patch.anchor.setTo(0.5, 0.5)
            patch.lifespan = 30000

            ant.y = Math.random()*game.world.height;
            ant.x = Math.random()*game.world.width;
        }
        ant.body.velocity.x += Math.random()*10-5
        ant.body.velocity.y += Math.random()*10-5
    },

    shotAnt: function(bullet, ant) {
        if (bullet.damage < 3) {
            bullet.kill()
        }
        patch = blood.create(ant.x, ant.y, 'sprites', 'blood.png')
        patch.anchor.setTo(0.5, 0.5)
        patch.lifespan = 30000
        
        ant.y = Math.random()*game.world.height;
        ant.x = Math.random()*game.world.width;
    },

    alienShoot: function() {
        game.physics.arcade.velocityFromAngle(alien.angle-180, 500, point);
        enemyBullet = enemyBullets.create(alien.x+(point.x*0.2), alien.y+(point.y*0.2), 'sprites', 'ball.png');
        enemyBullet.anchor.setTo(0.5, 0.5);
        enemyBullet.scale.setTo(0.6, 0.6);
        enemyBullet.outOfBoundsKill = true;
        enemyBullet.checkWorldBounds = true;
        enemyBullet.damage = 1
        game.physics.arcade.velocityFromAngle(alien.angle-180, 350, enemyBullet.body.velocity);
    },

    hitAlien: function(temp, bullet) {
        alien.health -= bullet.damage
        bullet.kill();

        if (alien.health < 1) {
            game.state.start('Win');
        }
    },

    remove: function(object) {
        object.destroy()
    },

    lose: function() {
        game.state.start('Lose')
    }
}

main.lose = function(){}; 

main.lose.prototype = {
    preload: function() {
        game.load.image('death', 'assets/death.png');
    },

    create: function() {
        game.add.tileSprite(0, 0, game.width, game.height, 'sprites', 'mars.png')

        game.add.image(game.width-550, game.height-500, 'death')

        textOne = game.add.text(0, game.height/3-128, "You Lose", {
            fontSize: 128,
            boundsAlignH: 'center'});
        textOne.setTextBounds(0, 0, game.height, game.width);

        textTwo = game.add.text(0, game.height/3+36, "press space to restart", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textTwo.setTextBounds(0, 0, game.height, game.width)

        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    },

    update: function() {
        if (space.isDown) {
            game.state.start('PlayGame')
        }
    }
}

main.win = function(){}; 

main.win.prototype = {
    preload: function() {
        // game.load.image('death', 'assets/death.png'); 
        // MAKE A WIN IMAGE
    },

    create: function() {
        game.add.tileSprite(0, 0, game.width, game.height, 'sprites', 'mars.png')

        // game.add.image(game.width-550, game.height-500, 'death')

        textOne = game.add.text(0, game.height/3-128, "You Win", {
            fontSize: 128,
            boundsAlignH: 'center'});
        textOne.setTextBounds(0, 0, game.height, game.width);

        textTwo = game.add.text(0, game.height/3+36, "press space to restart", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textTwo.setTextBounds(0, 0, game.height, game.width)

        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    },

    update: function() {
        if (space.isDown) {
            game.state.start('PlayGame')
        }
    }
}

main.menu = function(){}; 

main.menu.prototype = {
    preload: function() {
        // MAKE A MENU IMAGE
        game.load.atlasJSONHash('sprites', 'assets/sprites.png', 'assets/sprites.json');
    },

    create: function() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignVertically = true;


        game.add.tileSprite(0, 0, game.width, game.height, 'sprites', 'mars.png') //background

        textOne = game.add.text(0, game.height/3-128, "Indigestion", {
            fontSize: 128,
            boundsAlignH: 'center'});
        textOne.setTextBounds(0, 0, game.height, game.width);

        textTwo = game.add.text(0, game.height/2-20, "use WASD to move", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textTwo.setTextBounds(0, 0, game.height, game.width)

        textThree = game.add.text(0, game.height/2+20, "use SPACE to shoot", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textThree.setTextBounds(0, 0, game.height, game.width)

        textFour = game.add.text(0, (game.height/4)*3, "press space to play", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textFour.setTextBounds(0, 0, game.height, game.width)

        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    },

    update: function() {
        if (space.isDown) {
            game.state.start('PlayGame')
        }
    }
}

game.state.add('PlayGame', main.thegame);
game.state.add('Lose', main.lose);
game.state.add('Win', main.win);
game.state.add('Menu', main.menu);
game.state.start('Menu');