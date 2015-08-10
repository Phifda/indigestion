var game = new Phaser.Game(800, 800, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render});

game.global = {keys: {} }
var player;

function preload() {
    game.load.atlasJSONHash('sprites', 'assets/sprites.png', 'assets/sprites.json');
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignVertically = true;

    game.world.setBounds(0, 0, 1500, 1500);

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
    // player.body.maxVelocity.set(100);
    // player.body.drag.set(500);
    player.body.maxAngular = 100;
    player.body.angularDrag = 500;
    player.body.collideWorldBounds = true;
    player.size = 1

    game.camera.follow(player);

    game.global.keys.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    game.global.keys.w = game.input.keyboard.addKey(Phaser.Keyboard.W);
    game.global.keys.w.onUp.add(stopMoving)
    // game.global.keys.w.onDown.add(startMoving)
    game.global.keys.a = game.input.keyboard.addKey(Phaser.Keyboard.A);
    game.global.keys.d = game.input.keyboard.addKey(Phaser.Keyboard.D);

    for (var i=0; i<20; i++) {
        spawnAnt();
    }
}

function update() {
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;
    player.body.angularAcceleration = 0;
    player.scale.setTo(player.size, player.size)

    if (game.global.keys.space.isDown) {
        // player.body.velocity.setTo(0,0);

        if (!game.global.pooing) {
            player.animations.play('poo', 1.5, false);
        }

        game.global.pooing = true
    } else if (game.global.pooing) {
        if (player.animations.currentAnim._frameIndex == 3) {
            shoot();
        }
        game.global.pooing = false;
        player.animations.play('move', 0, true);
        player.animations.stop();
    }

    if (game.global.keys.w.isDown && !game.global.keys.space.isDown) {
        game.physics.arcade.velocityFromAngle(player.angle-90, 100, player.body.velocity);
        // player.animations.stop('move', resetFrame=true);
        player.animations.play('move', 10, true);
    }

    if (game.global.keys.a.isDown) {
        player.body.angularAcceleration = -500;
    }

    if (game.global.keys.d.isDown) {
        player.body.angularAcceleration = 500;
    }

    ants.forEach(collision, this, true)
    blood.forEachDead(remove, this)
}

function spawnAnt() {
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

function shoot() {
    bullet = bullets.create(player.x, player.y, 'sprites', 'ball.png');
    bullet.anchor.setTo(0.5, 0.5);
    bullet.scale.setTo(player.size-0.5, player.size-0.5);
    bullet.outOfBoundsKill = true;
    bullet.checkWorldBounds = true;
    bullet.damage = player.size*player.size*2
    game.physics.arcade.velocityFromAngle(player.angle+90, 500, bullet.body.velocity);
    player.size = 1
}

function stopMoving() {
    if (!game.global.pooing) {
        player.animations.stop();
    }
}

function collision(ant) {
    point = new Phaser.Point()
    game.physics.arcade.velocityFromAngle(player.angle-90, 30*player.size, point);

    if (Math.sqrt(Math.pow(player.x+point.x-ant.x, 2) + Math.pow(player.y+point.y-ant.y, 2)) < 15*player.size) {
        if (player.size < 1.5) {
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

function remove(object) {
    object.destroy()
}

function render() {
    // game.debug.cameraInfo(game.camera, 32, 32);
}