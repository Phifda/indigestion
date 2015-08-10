var game = new Phaser.Game(1000, 1000, Phaser.AUTO, '', { preload: preload, create: create, update: update });

game.global = {keys: {} }

function preload() {
	game.load.atlasJSONHash('player', 'assets/player.png', 'assets/player.json');
    game.load.image('background', 'assets/background.png')
}

function create() {
	game.world.height = 1000;
	game.world.width = 1000;

	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.scale.pageAlignVertically = true;
	// game.stage.backgroundColor = '#016691';

    game.world.height = 5000
    game.world.width = 5000

    game.add.tileSprite(0, 0, game.world.width, game.world.height, 'background')

    player = game.add.sprite(game.world.width/2, game.world.height/2, 'player', 'worm-1.png');
    player.animations.add("move", Phaser.Animation.generateFrameNames('worm-', 1, 4, '.png', 1))
    player.animations.add("poo", Phaser.Animation.generateFrameNames('worm-poo-', 1, 4, '.png', 1))
    game.physics.arcade.enable(player);
    player.anchor.setTo(0.5,0);
    player.body.allowRotation = true;
    player.body.maxVelocity.set(100);
    player.body.drag.set(500);
    player.body.maxAngular = 100
    player.body.angularDrag = 500

    // player.animations.play('move');

    temp = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    temp.onDown.add(shootspace);

    game.global.keys.w = game.input.keyboard.addKey(Phaser.Keyboard.W);
    game.global.keys.w.onUp.add(stopMoving)
    game.global.keys.w.onDown.add(startMoving)
    game.global.keys.a = game.input.keyboard.addKey(Phaser.Keyboard.A);
    game.global.keys.d = game.input.keyboard.addKey(Phaser.Keyboard.D);
}

function update() {
    player.body.acceleration.x = 0;
    player.body.acceleration.y = 0;
    player.body.angularAcceleration = 0;

    if (game.global.keys.w.isDown) {
        game.physics.arcade.velocityFromAngle(player.angle-90, 500, player.body.velocity);
        if (player.animations.currentAnim != 'move') {
            player.animations.play('move', 10, true);
        }
    }

    if (game.global.keys.a.isDown) {
        player.body.angularAcceleration = -500;
    }

    if (game.global.keys.d.isDown) {
        player.body.angularAcceleration = 500;
    }
}

function shootspace() {
    player.animations.play('poo', 10, true)
}

function stopMoving() {
    player.animations.stop(resetFrame=true)
}

function startMoving() {
    player.animations.play('move', 10, true)
}