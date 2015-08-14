var game = new Phaser.Game(1024, 768, Phaser.AUTO);

main = {};
main.waves = [];

game.global = {
    keys: {},
};

game.wave = 0

game.nextWave = function() {
    if (game.wave < 4) {
        game.state.start('WaveTransition')
    } else {
        game.state.start('Win')
    }
}

game.playNextWave = function() {
    game.wave += 1
    game.state.add('Wave'+game.wave.toString(), main.waves[game.wave])
    game.state.start('Wave'+game.wave.toString())
}

main.randomTip = function() {
    return tips[game.rnd.integerInRange(0, tips.length-1)];
}

main.spawnAnt = function() {
    ant = ants.create(Math.random()*game.world.height, Math.random()*game.world.width, 'sprites', 'ant-1.png');
    ant.animations.add('move',  Phaser.Animation.generateFrameNames('ant-', 1, 2, '.png', 1))
    ant.animations.play('move', 5, true)
    ant.anchor.setTo(0.5, 0.5);
    ant.body.collideWorldBounds = true;
    ant.scale.setTo(0.6, 0.6);
    ant.body.acceleration.x = 0
    ant.body.maxVelocity.setTo(75)
    ant.body.acceleration.y = 0
}

main.shoot = function() {
    bullet = bullets.create(player.x, player.y, 'sprites', 'poopile.png');
    bullet.anchor.setTo(0.5, 0.5);
    bullet.scale.setTo(player.size*player.size, player.size*player.size);
    bullet.outOfBoundsKill = true;
    bullet.checkWorldBounds = true;
    bullet.damage = Math.round((player.size-0.9)*10) // 1, 2, 3, 4, 5
    game.physics.arcade.velocityFromAngle(player.angle+90, 300, bullet.body.velocity);
    player.size = 1
}

main.stopMoving = function() {
    if (!game.global.pooing) {
        player.animations.stop();
    }
}

// check if player hits an ant and move the ants
main.collision = function(ant) {
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
}

main.shotAnt = function(bullet, ant) {
    if (bullet.damage < 3) {
        bullet.kill()
    }
    patch = blood.create(ant.x, ant.y, 'sprites', 'blood.png')
    patch.anchor.setTo(0.5, 0.5)
    patch.lifespan = 30000
    
    ant.y = Math.random()*game.world.height;
    ant.x = Math.random()*game.world.width;
}

main.createAlienBeam = function(x, y) {
    beam = beams.create(x, y, 'sprites', 'beam.png');
    beam.health = 10;
    beam.anchor.setTo(0, 0.5);
    beam.wheel = 'left';
    game.physics.arcade.enable(beam);
    beam.body.allowRotation = true;
    beam.body.angularDrag = 500;
    beam.body.maxAngular = 100;
}

main.updateAlienBeam = function(alienBeam) {
    desiredRotation = game.physics.arcade.angleBetween(alienBeam, player)*(180/Math.PI)
    if (alienBeam.wheel == 'right') {
        if (desiredRotation > 0) {
            desiredRotation -= 180
        } else {
            desiredRotation += 180
        };
    }

    if (alienBeam.body.rotation > desiredRotation+5 || alienBeam.body.rotation < desiredRotation-5) {
        if (Math.abs(desiredRotation - alienBeam.body.rotation) > 180) {
            if (desiredRotation < alienBeam.body.rotation) {
                desiredRotation += 360;
            } else {
                desiredRotation -= 360;
            }
        }
        if (desiredRotation > alienBeam.body.rotation) {
            alienBeam.body.angularVelocity = 50;
        } else {
            if ( desiredRotation < alienBeam.body.rotation) {
                alienBeam.body.angularVelocity = -50;
            }
        }
    } else {
        if (alienBeam.wheel == 'left') {
            game.physics.arcade.velocityFromAngle(alienBeam.angle, 377, point);
        } else {
            rotation = alienBeam.angle
            if (rotation > 0) {
                rotation -= 180
            } else {
                rotation += 180
            };
            game.physics.arcade.velocityFromAngle(rotation, 377, point);
        }

        if (alienBeam.wheel == 'right') {
            alienBeam.wheel = 'left';
            alienBeam.anchor.setTo(0, 0.5)
            alienBeam.x += point.x
            alienBeam.y += point.y
        } else {
            alienBeam.wheel = 'right';
            alienBeam.anchor.setTo(1, 0.5)
            alienBeam.x += point.x
            alienBeam.y += point.y
        }
    }

    // Check if beam hits player
    if (alienBeam.wheel == 'left') {
        game.physics.arcade.velocityFromAngle(alienBeam.angle, 377, point);
    } else {
        rotation = alienBeam.angle
        if (rotation > 0) {
            rotation -= 180
        } else {
            rotation += 180
        };
        game.physics.arcade.velocityFromAngle(rotation, 377, point);
    }

    line = new Phaser.Line(alienBeam.x, alienBeam.y, alienBeam.x+point.x, alienBeam.y+point.y);
    game.physics.arcade.velocityFromAngle(player.angle-90, 40, pointTwo);
    linetwo = new Phaser.Line(player.x+pointTwo.x, player.y+pointTwo.y, player.x-pointTwo.x, player.y-pointTwo.y);
    if (line.intersects(linetwo)){
        main.lose();
    }
    game.physics.arcade.velocityFromAngle(player.angle, 20, pointTwo);
    linetwo = new Phaser.Line(player.x+pointTwo.x, player.y+pointTwo.y, player.x-pointTwo.x, player.y-pointTwo.y);
    if (line.intersects(linetwo)){
        main.lose();
    }

    // check if beam is shot
    for (i in bullets.children) {
        if (Math.sqrt(Math.pow(bullets.children[i].x-(alienBeam.x+(point.x/15)), 2) + Math.pow(bullets.children[i].y-(alienBeam.y+(point.y/15)), 2)) < 50 ){
            alienBeam.health -= bullets.children[i].damage;
            bullets.removeChild(bullets.children[i]);
        } else if (Math.sqrt(Math.pow(bullets.children[i].x-(alienBeam.x+point.x-(point.x/15)), 2) + Math.pow(bullets.children[i].y-(alienBeam.y+point.y+(point.y/15)), 2)) < 50 ) {
            alienBeam.health -= bullets.children[i].damage;
            bullets.removeChild(bullets.children[i]);
        }
    }

    if (alienBeam.health < 1) {
        alienBeam.destroy()
        if (beams.total < 1 && game.wave != 4) {
            game.nextWave();
        }
    }
}

main.createAlienCar = function(x, y) {
    alien = aliens.create(x, y, 'sprites', 'car.png');
    alien.health = 20;
    alien.anchor.setTo(0.5,0.5);
    game.physics.arcade.enable(alien);
    alien.body.allowRotation = true;
    alien.angle = -90;
    alien.body.angularDrag = 500;
    alien.body.maxAngular = 100;
}


main.updateAlienCar = function(theAlien) {
    // Move the alien
    desiredRotation = game.physics.arcade.angleBetween(theAlien, player)*(180/Math.PI)

    if (theAlien.body.rotation > desiredRotation+10 || theAlien.body.rotation < desiredRotation-10) {
        if (Math.abs(desiredRotation - theAlien.body.rotation) > 180) {
            if (desiredRotation < theAlien.body.rotation) {
                desiredRotation += 360;
            } else {
                desiredRotation -= 360;
            }
        }
        if (desiredRotation > theAlien.body.rotation) {
            theAlien.body.angularVelocity = 40+(20-theAlien.health)*1.5;
        } else {
            if ( desiredRotation < theAlien.body.rotation) {
                theAlien.body.angularVelocity = -40-(20-theAlien.health)*1.5;
            }
        }
        game.physics.arcade.velocityFromAngle(theAlien.angle, 100+((20-theAlien.health)*12), theAlien.body.velocity);
    } else {
        game.physics.arcade.velocityFromAngle(theAlien.angle, 200+((20-theAlien.health)*12), theAlien.body.velocity);
    }

    // Alien on player collision
    if (Math.sqrt(Math.pow(player.x-theAlien.x, 2) + Math.pow(player.y-theAlien.y, 2)) < 95 ){
        main.lose();
    }

    game.physics.arcade.overlap(bullets, theAlien, main.hitAlien, null, this);

    bossHealth.text = "Car Health: "+theAlien.health.toString();
}

main.alienShoot = function() {
    alien = aliens.getFirstAlive();
    bullet = enemyBullets.create(alien.x, alien.y, 'sprites', 'ball.png');
    bullet.anchor.setTo(0.5, 0.5);
    bullet.scale.setTo(0.6, 0.6);
    bullet.outOfBoundsKill = true;
    bullet.checkWorldBounds = true;
    bullet.damage = 1;
    game.physics.arcade.velocityFromAngle(alien.angle-180, 400, bullet.body.velocity);
}

main.hitAlien = function(alien, bullet) {
    alien = aliens.getFirstAlive();
    alien.health -= bullet.damage;
    bullet.kill();

    if (alien.health < 1) {
        alienShooting.stop();
        alien.kill();
        alien.destroy();
    }
}

main.updateChickens = function(chicken) {
    there = false;

    if (chicken.x > chicken.destonation.x - 100 && chicken.x < chicken.destonation.x + 100) {
        if (chicken.y > chicken.destonation.y - 100 && chicken.y < chicken.destonation.y + 100) {
            there = true;
        }
    }

    if (there) {
        chicken.destonation.x = game.rnd.integerInRange(0, game.world.width)
        chicken.destonation.y = game.rnd.integerInRange(0, game.world.height)

        chicken.body.acceleration.x = -(chicken.x - chicken.destonation.x)/5;
        chicken.body.acceleration.y = -(chicken.y - chicken.destonation.y)/5;
    }

    chicken.body.acceleration.x = -(chicken.x - chicken.destonation.x)/5;
    chicken.body.acceleration.y = -(chicken.y - chicken.destonation.y)/5;

    if (Math.sqrt(Math.pow(player.x-chicken.x, 2) + Math.pow(player.y-chicken.y, 2)) < 120 ){
        main.lose();
    }
}

main.shotChicken = function(bullet, chicken) {
    if (bullet.damage == 5) {
        chicken.destroy();
    } else if (bullet.damage > 2) {
        chicken.destroy();
        bullet.kill();
    } else {
        bullet.kill();
    }
    if (chickens.total == 0 && game.wave != 4) {
        game.nextWave();
    }
}

main.remove = function(object) {
    object.destroy();
}

main.lose = function() {
    game.state.start('Lose')
}


// ------------------------------------------------------------------
//  WAVE ONE
// ------------------------------------------------------------------

main.waves[1] = function() {};
main.waves[1].prototype = {

    preload: function() {},

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.world.setBounds(0, 0, 1500, 1500);

        // background
        game.add.tileSprite(0, 0, game.world.width, game.world.height, 'sprites', 'mars.png')

        // 'BLOOD'
        blood = game.add.group();
        // main.blood.classType = Phaser.Image

        // 'ANTS'
        ants = game.add.group();
        ants.enableBody = true;

        // 'BULLETS'
        bullets = game.add.group();
        bullets.enableBody = true;
        

        // CREATE THE PLAYER
        player = game.add.sprite(game.world.width/2, game.world.height/2, 'sprites', 'worm-1.png');
        player.animations.add("move", Phaser.Animation.generateFrameNames('worm-', 1, 4, '.png', 1));
        player.animations.add("poo", Phaser.Animation.generateFrameNames('poo-', 1, 4, '.png', 1));
        game.physics.arcade.enable(player);
        player.anchor.setTo(0.5,0.5);
        player.body.allowRotation = true;
        player.body.maxAngular = 100;
        player.body.angularDrag = 500;
        player.size = 1;

        chickens = game.add.group();
        chickens.enableBody = true;

        // Spawn chickens
        for (i=1; i<4; i++) {
            chicken = chickens.create(game.world.width/2, game.world.height/2, "sprites", "chicken-1.png");
            game.physics.arcade.enable(chicken);
            chicken.animations.add("move", Phaser.Animation.generateFrameNames("chicken-", 1, 3, ".png", 1));
            chicken.animations.play("move", 10, true);
            chicken.anchor.setTo(0.5,0.5);
            chicken.body.maxVelocity.set(100);
            chicken.body.drag.set(500);
            while (true) {
                chicken.x = game.rnd.integerInRange(0, game.world.width);
                chicken.y = game.rnd.integerInRange(0, game.world.height);
                if (chicken.x < player.x - 500 || chicken.x > player.x + 500) {
                    break;
                } else if (chicken.y < player.y - 500 || chicken.y > player.y + 500) {
                    break;
                }
            }
            chicken.destonation = new Phaser.Point();
            chicken.destonation.x = chicken.x;
            chicken.destonation.y = chicken.y;
        }

        game.camera.follow(player);

        point = new Phaser.Point();

        // KEYS
        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        w = game.input.keyboard.addKey(Phaser.Keyboard.W);
        w.onUp.add(main.stopMoving);
        a = game.input.keyboard.addKey(Phaser.Keyboard.A);
        d = game.input.keyboard.addKey(Phaser.Keyboard.D);

        k = game.input.keyboard.addKey(Phaser.Keyboard.K);
        k.onUp.add(game.nextWave);

        game.graphics = game.add.graphics()

        // text
        bossHealth = game.add.text(0, 20, "", {
            fontSize: 36,
            boundsAlignH: 'center'});
        bossHealth.setTextBounds(0, 0, game.width, game.height);
        bossHealth.fixedToCamera = true;

        for (var i=0; i<25; i++) {
            main.spawnAnt();
        }
    },

    update: function() {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.body.angularAcceleration = 0;
        player.scale.setTo(player.size, player.size);

        if (space.isDown) {
            if (!game.global.pooing) {
                player.animations.play('poo', 1.5, false);
            }

            game.global.pooing = true
        } else if (game.global.pooing) {
            if (player.animations.currentAnim._frameIndex == 3) {
                main.shoot();
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

        game.physics.arcade.overlap(bullets, ants, main.shotAnt, null, this);
        game.physics.arcade.overlap(bullets, chickens, main.shotChicken, null, this);

        ants.forEach(main.collision, this, true);
        blood.forEachDead(main.remove, this);

        chickens.forEach(main.updateChickens, this, true)

        bossHealth.text = chickens.total.toString()+" Aliens Left"
    }
}


// ------------------------------------------------------------------
//  WAVE TWO
// ------------------------------------------------------------------


main.waves[2] = function(){};

main.waves[2].prototype = {
    preload: function() {
    },

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.world.setBounds(0, 0, 1500, 1500);

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

        // alien beams
        beams = game.add.group();
        beams.enableBody = true;

        point = new Phaser.Point();
        pointTwo = new Phaser.Point();

        // KEYS
        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        w = game.input.keyboard.addKey(Phaser.Keyboard.W);
        w.onUp.add(main.stopMoving);
        a = game.input.keyboard.addKey(Phaser.Keyboard.A);
        d = game.input.keyboard.addKey(Phaser.Keyboard.D);

        k = game.input.keyboard.addKey(Phaser.Keyboard.K);
        k.onUp.add(game.nextWave);

        game.graphics = game.add.graphics()

        // text
        bossHealth = game.add.text(0, 20, "", {
            fontSize: 36,
            boundsAlignH: 'center'});
        bossHealth.setTextBounds(0, 0, game.width, game.height);
        bossHealth.fixedToCamera = true;

        for (var i=0; i<25; i++) {
            main.spawnAnt();
        }

        main.createAlienBeam(game.world.width/2, 258);

        main.createAlienBeam(game.world.width/2, game.world.height-258);
    },

    update: function() {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.body.angularAcceleration = 0;
        player.scale.setTo(player.size, player.size);

        if (space.isDown) {
            if (!game.global.pooing) {
                player.animations.play('poo', 1.5, false);
            }

            game.global.pooing = true
        } else if (game.global.pooing) {
            if (player.animations.currentAnim._frameIndex == 3) {
                main.shoot();
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


        game.physics.arcade.overlap(bullets, ants, main.shotAnt, null, this);

        ants.forEach(main.collision, this, true);
        blood.forEachDead(main.remove, this);
        beams.forEach(main.updateAlienBeam, this);

        bossHealth.text = beams.total.toString()+" Beams Left"
    }
}


// ------------------------------------------------------------------
//  WAVE THREE
// ------------------------------------------------------------------


main.waves[3] = function(){};

main.waves[3].prototype = {
    preload: function() {
    },

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.world.setBounds(0, 0, 1500, 1500);

        alienShooting = game.time.create();
        alienShooting.loop(800, main.alienShoot, false)
        alienShooting.start(0)

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

        point = new Phaser.Point();
        pointTwo = new Phaser.Point();

        game.camera.follow(player);

        // Enemy Bullets
        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;

        // ALIENS
        aliens = game.add.group();
        aliens.enableBody = true;

        // KEYS
        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        w = game.input.keyboard.addKey(Phaser.Keyboard.W);
        w.onUp.add(main.stopMoving);
        a = game.input.keyboard.addKey(Phaser.Keyboard.A);
        d = game.input.keyboard.addKey(Phaser.Keyboard.D);

        k = game.input.keyboard.addKey(Phaser.Keyboard.K);
        k.onUp.add(game.nextWave);

        game.graphics = game.add.graphics()

        // text
        bossHealth = game.add.text(0, 20, "", {
            fontSize: 36,
            boundsAlignH: 'center'});
        bossHealth.setTextBounds(0, 0, game.width, game.height);
        bossHealth.fixedToCamera = true;

        for (var i=0; i<25; i++) {
            main.spawnAnt();
        }

        main.createAlienCar(game.world.width/2, game.world.height-258);
    },

    update: function() {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.body.angularAcceleration = 0;
        player.scale.setTo(player.size, player.size);

        if (space.isDown) {
            if (!game.global.pooing) {
                player.animations.play('poo', 1.5, false);
            }

            game.global.pooing = true
        } else if (game.global.pooing) {
            if (player.animations.currentAnim._frameIndex == 3) {
                main.shoot();
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


        game.physics.arcade.overlap(bullets, ants, main.shotAnt, null, this);
        game.physics.arcade.overlap(enemyBullets, ants, main.shotAnt, null, this);
        game.physics.arcade.overlap(enemyBullets, player, main.lose, null, this);

        ants.forEach(main.collision, this, true);
        blood.forEachDead(main.remove, this);
        aliens.forEach(main.updateAlienCar, this);

        if (aliens.total == 0) {
            game.nextWave();
        }
    }
}


// ------------------------------------------------------------------
//  WAVE FOUR
// ------------------------------------------------------------------


main.waves[4] = function(){};

main.waves[4].prototype = {
    preload: function() {
    },

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.world.setBounds(0, 0, 1500, 1500);

        alienShooting = game.time.create();
        alienShooting.loop(800, main.alienShoot, false)
        alienShooting.start(0)

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

        // Enemy Bullets
        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;

        chickens = game.add.group();
        chickens.enableBody = true;

        // Spawn chickens
        for (i=1; i<2; i++) {
            chicken = chickens.create(game.world.width/2, game.world.height/2, "sprites", "chicken-1.png");
            game.physics.arcade.enable(chicken);
            chicken.animations.add("move", Phaser.Animation.generateFrameNames("chicken-", 1, 3, ".png", 1));
            chicken.animations.play("move", 10, true);
            chicken.anchor.setTo(0.5,0.5);
            chicken.body.maxVelocity.set(100);
            chicken.body.drag.set(500);
            while (true) {
                chicken.x = game.rnd.integerInRange(0, game.world.width);
                chicken.y = game.rnd.integerInRange(0, game.world.height);
                if (chicken.x < player.x - 500 || chicken.x > player.x + 500) {
                    break;
                } else if (chicken.y < player.y - 500 || chicken.y > player.y + 500) {
                    break;
                }
            }
            chicken.destonation = new Phaser.Point();
            chicken.destonation.x = chicken.x;
            chicken.destonation.y = chicken.y;
        }

        // ALIENS
        aliens = game.add.group();
        aliens.enableBody = true;

        // alien beams
        beams = game.add.group();
        beams.enableBody = true;

        point = new Phaser.Point();

        // KEYS
        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        w = game.input.keyboard.addKey(Phaser.Keyboard.W);
        w.onUp.add(main.stopMoving);
        a = game.input.keyboard.addKey(Phaser.Keyboard.A);
        d = game.input.keyboard.addKey(Phaser.Keyboard.D);

        k = game.input.keyboard.addKey(Phaser.Keyboard.K);
        k.onUp.add(game.nextWave);

        game.graphics = game.add.graphics()

        // text
        bossHealth = game.add.text(0, 20, "", {
            fontSize: 36,
            boundsAlignH: 'center'});
        bossHealth.setTextBounds(0, 0, game.width, game.height);
        bossHealth.fixedToCamera = true;

        for (var i=0; i<25; i++) {
            main.spawnAnt();
        }

        main.createAlienCar(game.world.width/2, game.world.height-258);

        main.createAlienBeam(game.world.width/2, 258);
    },

    update: function() {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.body.angularAcceleration = 0;
        player.scale.setTo(player.size, player.size);

        if (space.isDown) {
            if (!game.global.pooing) {
                player.animations.play('poo', 1.5, false);
            }

            game.global.pooing = true
        } else if (game.global.pooing) {
            if (player.animations.currentAnim._frameIndex == 3) {
                main.shoot();
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


        game.physics.arcade.overlap(bullets, ants, main.shotAnt, null, this);
        game.physics.arcade.overlap(enemyBullets, ants, main.shotAnt, null, this);
        game.physics.arcade.overlap(enemyBullets, player, main.lose, null, this);
        game.physics.arcade.overlap(bullets, chickens, main.shotChicken, null, this);

        ants.forEach(main.collision, this, true);
        blood.forEachDead(main.remove, this);
        aliens.forEach(main.updateAlienCar, this);
        chickens.forEach(main.updateChickens, this, true)
        beams.forEach(main.updateAlienBeam, this);

        enemies = aliens.total+beams.total+chickens.total;
        bossHealth.text = enemies.toString()+" Enemies Left";

        if (aliens.total == 0 && beams.total == 0 && chickens.total == 0) {
            game.nextWave();
        }
    }
}

main.losescreen = function(){}; 

main.losescreen.prototype = {
    preload: function() {
        game.load.image('death', 'assets/death.png');
    },

    create: function() {
        game.add.tileSprite(0, 0, game.width, game.height, 'sprites', 'mars.png')

        game.add.image(game.width-550, game.height-500, 'death')

        textOne = game.add.text(0, game.height/3-128, "You Lose", {
            fontSize: 128,
            boundsAlignH: 'center'});
        textOne.setTextBounds(0, 0, game.width, game.height);

        textTwo = game.add.text(0, game.height/3+36, "press space to restart", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textTwo.setTextBounds(0, 0, game.width, game.height)

        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    },

    update: function() {
        if (space.isDown) {
            game.wave = 0;
            game.nextWave();
        }
    }
}

main.win = function(){}; 

main.win.prototype = {
    preload: function() {
        game.load.image('win', 'assets/win.png');
    },

    create: function() {
        game.add.tileSprite(0, 0, game.width, game.height, 'sprites', 'mars.png')

        game.add.image(game.width-780, game.height-220, 'win')

        textOne = game.add.text(0, game.height/3-128, "You Win", {
            fontSize: 128,
            boundsAlignH: 'center'});
        textOne.setTextBounds(0, 0, game.width, game.height);

        textTwo = game.add.text(0, game.height/3+36, "press space to restart", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textTwo.setTextBounds(0, 0, game.width, game.height)

        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    },

    update: function() {
        if (space.isDown) {
            game.wave = 0;
            game.nextWave();
        }
    }
}

main.waveTransition = function(){}; 

main.waveTransition.prototype = {
    preload: function() {},

    create: function() {
        game.add.tileSprite(0, 0, game.width, game.height, 'sprites', 'mars.png')

        // game.add.image(game.width-550, game.height-500, 'death')

        textOne = game.add.text(0, game.height/3-128, "Wave "+(game.wave+1).toString()+" of 4", {
            fontSize: 128,
            boundsAlignH: 'center'});
        textOne.setTextBounds(0, 0, game.width, game.height);

        textTwo = game.add.text(0, game.height/3+36, main.randomTip(), {
            fontSize: 36,
            boundsAlignH: 'center'});
        textTwo.setTextBounds(0, 0, game.width, game.height)

        textThree = game.add.text(0, (game.height/4)*3+30, "press space to start", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textThree.setTextBounds(0, 0, game.width, game.height)

        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    },

    update: function() {
        if (space.isDown) {
            game.playNextWave();
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
        textOne.setTextBounds(0, 0, game.width, game.height);

        textTwo = game.add.text(0, game.height/2-20, "use WASD to move", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textTwo.setTextBounds(0, 0, game.width, game.height)

        textThree = game.add.text(0, game.height/2+20, "hold SPACE to shoot", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textThree.setTextBounds(0, 0, game.width, game.height)

        textFour = game.add.text(0, game.height/2+60, "eat bugs to power up", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textFour.setTextBounds(0, 0, game.width, game.height)

        textFive = game.add.text(0, (game.height/4)*3+30, "press space to play", {
            fontSize: 36,
            boundsAlignH: 'center'});
        textFive.setTextBounds(0, 0, game.width, game.height)

        space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    },

    update: function() {
        if (space.isDown) {
            // game.state.start('PlayGame')
            game.nextWave();
        }
    }
}

game.state.add('Lose', main.losescreen);
game.state.add('WaveTransition', main.waveTransition);
game.state.add('Win', main.win);
game.state.add('Menu', main.menu);
game.state.start('Menu');