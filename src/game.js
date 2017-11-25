/*
planets-wekazaji
A basic ring physics tutorial to build off

source: https://phaser.io/news/2015/07/simulate-planet-gravity-with-box2d-tutorial
*/
var playGame = function(game){};

var game;

// groups containing crates and planets
// var crateGroup;
var planetGroup;
var cursors;

//for the player & walk animations
var player;
var walkR;
var walkL;
var stand;
var fall;

var enemy;

var teleporter;
var levelGoal;
var playerLastAngle;
var enemyLastAngle;

var messageCaption;
var score = 0;

// a force reducer to let the simulation run smoothly
var forceReducer = 0.0007; //was .00175

var playerVel = 25;
var enemyVel = 25;
var maxEnemyVel = 200;

var enemyCounterClockwise = -1;

var planetContact = false;

// graphic object where to draw planet gravity area
var gravityGraphics;

var currentLevel = 0;
/* x position, y position, gravity radius, gravity force, graphic asset */
var level = [
    [//level 0 - tutorial, jumping between planets
        {objectType: 'planet', x: -280, y: -100, gravRadius: 250, gravForce: 150, sprite: "smallplanet"},
        {objectType: 'planet', x: 130, y: 150, gravRadius: 400, gravForce: 250, sprite: "bigplanet"},
        {objectType: 'teleporter', x: 130, y: -3, radians: 0, goal: 1},
        {objectType: 'startPad', x: -425, y: -50 , radians:1.15},
        {objectType: 'gear', x: -350, y: -200, sprite: "gear"},
        {objectType: 'gear', x: -200, y: -150, sprite: "gear"},
        {objectType: 'gear', x: -220, y: 10, sprite: "gear"}

    ],
    [//level 1 - start in void
        {objectType: 'planet', x: -280, y: -100, gravRadius: 230, gravForce: 170, sprite: "bigplanet"},
        {objectType: 'planet', x: 160, y: 150, gravRadius: 130, gravForce: 140, sprite: "smallplanet"},
        {objectType: 'planet', x: 60, y: -180, gravRadius: 200, gravForce: 470, sprite: "smallplanet"},
        {objectType: 'teleporter', x: 278, y: 140, radians: 1.48, goal: 1},
        {objectType: 'startPad', x: 50, y: 180, radians: 1.4 },
        {objectType: 'gear', x: 100, y: -50, sprite: "gear"},
        {objectType: 'gear', x: -180, y: -150, sprite: "gear"},
        {objectType: 'player', x: 25, y: 190}
    ],
    [//level 2 - jumping to planets through void
        {objectType:"level3"},
        {objectType:"level3"},
        {objectType:"level3"}
    ] //level 3-static obstacles, level4-trampoline, level5-trampoline in the void, other ideas: planetoid chain, overlapping planets
];

playGame.prototype = {
    init:function(){
      this.currentLevel = currentLevel;
    },
    preload: function () {
        game.load.image("enemy", "assets/redcrate.png");
        game.load.image("smallplanet", "assets/planet.png");
        game.load.image("bigplanet", "assets/bigplanet.png");
        game.load.image("space", "assets/seamlessspacebright.png");
        game.load.spritesheet('player',"assets/nebspritesv2.5.png",40,47);
        game.load.spritesheet('gear', 'assets/gearspritessmall.png',38,34);
        game.load.spritesheet('teleporter', 'assets/teleporterspritesheet.png', 48, 61);
        game.load.image("message_back", "assets/message_back.png");
        game.load.image("speechBubble", "assets/speechBubble.png");
        game.load.image("startPad","assets/pad.png");
    },
    create: function () {

        // new boundaries are centered on 0,0 so the world can rotate
        game.world.setBounds(-400, -300, 400, 300);

        game.time.desiredFps = 25;

        background=game.add.tileSprite(-1000, -1000, 1024, 1024, 'space');
        game.add.tileSprite(24, 24, 1024, 1024, 'space');
        game.add.tileSprite(-1000, 24, 1024, 1024, 'space');
        game.add.tileSprite(24, -1000, 1024, 1024, 'space');

        enemyGroup = game.add.group();
        planetGroup = game.add.group();
        objectGroup = game.add.group();

        // adding gravitiy line
        gravityGraphics = game.add.graphics(0, 0);
        gravityGraphics.lineStyle(2, 0xffffff, 0.5);

        game.stage.backgroundColor = "#222222";

        game.physics.startSystem(Phaser.Physics.BOX2D);





        // waiting for player input
        // game.input.onDown.add(addCrate, this);
        player = game.add.sprite(-430, -55, "player");
        game.physics.box2d.enable(player);
        player.frame = 4;
        walkR = player.animations.add('walkR',[5,6,7,8], 7, true);
        walkL = player.animations.add('walkL', [0,1,2,3], 7, true);
        stand = player.animations.add('stand',[4],1);
        fall = player.animations.add('fall',[9],1);

        createLevel();

        //add enemy - crate
        enemy = game.add.sprite(-350, 50, "enemy");
        game.physics.box2d.enable(enemy);
        enemy.body.static = false;
        enemy.body.setRectangle(12, 50);
        enemy.body.setCollisionMask(1);
        enemyGroup.add(enemy);

        player.body.setBodyContactCallback(enemy, enemyContactCallback, this);
        player.body.setCategoryContactCallback(2, gearCallback, this);
        player.body.setCategoryContactCallback(1,planetContactCallback,this);

        // text, seconds until it fades
        addMessage("Hi! There!", 1);
        // addMessage("Arrow keys to move \n Collect gears to fix \n your teleporter", 3);

        cursors = game.input.keyboard.createCursorKeys();
        game.camera.follow(player);

        // // add healthbar
        // // bar = game.add.sprite.rect(350,250,50,10);
        // // { fill: '#ffaaaa', font: '14pt Arial'})
        // // bad.body.setRectangle(50,10);
        // // bar.body.static = true;
        //
        // var maxHealthBar;
        // var healthBar;
        // var maxWidth = 50 // example;
        // var maxHeight = 10 // example;
        // var width = 25 // example;
        // var height = 5 // example;
        // var bmd = game.add.bitmapData(width, height);
        // var bmd2 = game.add.bitmapData(width, height);
        //
        // bmd.ctx.beginPath();
        // bmd.ctx.rect(0, 0, maxWidth, maxHeight);
        // bmd.ctx.fillStyle = '#ffff00';
        // bmd.ctx.fill();
        // maxHealthBar = game.add.sprite(game.world.centerX, game.world.centerY, bmd);
        // maxHealthBar.anchor.setTo(0.5, 0.5);
        //
        // bmd2.ctx.beginPath();
        // bmd2.ctx.rect(0, 0, width, height);
        // bmd2.ctx.fillStyle = '#ffffff';
        // bmd2.ctx.fill();
        // healthBar = game.add.sprite(game.world.centerX, game.world.centerY, bmd2);
        // healthBar.anchor.setTo(0.5, 0.5);
  //add score to the screen
  //       scoreCaption = game.add.text(300, 300, 'Score: ' + score, { fill: '#ffaaaa', font: '14pt Arial'});
  //       scoreCaption.fixedToCamera = true;
  //       scoreCaption.cameraOffset.setTo(300, 300);
    },

    update: function(){
        var enemyAngle = handleEnemyRotation(enemy);
        var playerAngle = handlePlayerRotation(player);

        applyGravityToObjects();
        checkTeleporterOverlap(teleporter);

        messageLocation(playerAngle);

        // Keep the enemy moving
        if (enemyCounterClockwise === -1) {
        enemy.body.velocity.x += enemyVel * Math.cos(enemyAngle - (Math.PI / 2)) ;
        enemy.body.velocity.y += enemyVel * Math.sin(enemyAngle - (Math.PI / 2)) ;

        } else {
            enemy.body.velocity.x += enemyVel * Math.cos(enemyAngle + (Math.PI / 2)) ;
            enemy.body.velocity.y += enemyVel * Math.sin(enemyAngle + (Math.PI / 2)) ;
        }

        //Handle keyboard input for the player
        handleKeyboardInput(playerAngle);

        constrainVelocity(player,150);
        constrainVelocity(enemy,maxEnemyVel);

        // camera.focusOnXY(player.x,player.y);
    },
    render: function() {
        game.debug.cameraInfo(game.camera, 32, 32);
        game.debug.spriteCoords(player, 32, 500);
    }
};

/*=============================================================================
   HELPER FUNCTIONS
=============================================================================*/
// function to add a crate
// function addCrate(e){
//     var crateSprite = game.add.sprite(e.x, e.y, "crate");
//     crateGroup.add(crateSprite);
//     game.physics.box2d.enable(crateSprite);
// }

function createLevel(){
    for (var i = 0; i < level[currentLevel].length; i++) {
        var addition = level[currentLevel][i];
        if (addition.objectType === 'planet') {
            addPlanet(addition.x, addition.y,
                addition.gravRadius, addition.gravForce, addition.sprite);
        }
        if(addition.objectType === 'teleporter') {
            addTeleporter(addition.x,addition.y, addition.radians, addition.goal);
        }
        if(addition.objectType === 'startPad') {
            addStartPad(addition.x, addition.y, addition.radians);
        }
        if(addition.objectType === 'gear'){
            addGear(addition.x, addition.y, addition.sprite);
        }
        if(addition.objectType === 'player'){
            movePlayer(addition.x,addition.y);
        }

    }
}

function handleEnemyRotation(sprite) {
    var angle = enemyGravityToPlanets(sprite);
    if (angle > -361) { // angle == -361 if the player is not in any gravity field.
        // orients players feet toward the ground. Uses var angle as degrees offset by -90
        sprite.body.angle = angle * 180 / Math.PI - 90;
        enemyLastAngle = angle;
    } else {
        angle = enemyLastAngle;
    }
    return angle;
}

/* calculates angle between the player and the planet it is gravitationally attracted to.
* Orients the player's feet to the ground & handles all the world rotation.
*/
function handlePlayerRotation(player){

    var angleToPlanet = gravityToPlanets(player);
    var playerAngle;

    if (playerLastAngle === undefined){
        playerAngle = angleToPlanet;
        playerLastAngle = playerAngle;
    }
    if (angleToPlanet > -361){ // angle == -361 if the player is not in any gravity field.
        //orients players feet toward the ground. Uses var angle as degrees offset by -90
        var playerRotationToGravity = radiansDelta(playerLastAngle, angleToPlanet);
        var maxPlayerRotationSpeed = 0.15;

        if (Math.abs(playerRotationToGravity) <= maxPlayerRotationSpeed){
            playerAngle = angleToPlanet;
        } else if ( playerRotationToGravity > Math.PI){
            playerAngle = playerLastAngle + maxPlayerRotationSpeed;
        } else {
            playerAngle = playerLastAngle - maxPlayerRotationSpeed;
        }

        player.body.angle = angleToPlanet * 180 / Math.PI - 90;
        playerLastAngle = playerAngle;
    } else{
        playerAngle = playerLastAngle;
    }

    game.world.pivot.x = player.x;          //these two rotate the world around the player
    game.world.pivot.y = player.y;
    game.world.rotation = -playerAngle + (Math.PI/2);     //rotates the world so the controls aren't global

    return playerAngle;
}

/* Shortest distance between two angles in range -pi to pi.
*
*/
function radiansDelta(fromAngle, toAngle){
    return normalizedRadians(fromAngle - toAngle + Math.PI) - Math.PI;
}

/* normalizes a angle to the range 0 to 2 pi.
*
*/
function normalizedRadians(rawAngle){
    var TAU = Math.PI * 2;
    return ((rawAngle % TAU) + TAU) % TAU;
}

// function drawHealthBar(x,y) {
//     var bmd = this.game.add.bitmapData(250, 40);
//     bmd.ctx.fillStyle = '#FEFF03';
//     bmd.ctx.beginPath();
//     bmd.ctx.rect(x, y, 250, 40);
//     bmd.ctx.fill();
//     // bmd.update();
//
//     // this.barSprite = this.game.add.sprite(this.x - this.bgSprite.width/2, this.y, bmd);
//     // this.barSprite.anchor.y = 0.5;
// }


function enemyGravityToPlanets(gravObject) {
    var p = findClosestPlanet(gravObject);
    var distanceFromPlanet = Phaser.Math.distance(gravObject.x,gravObject.y,p.x,p.y)
    var angle = Phaser.Math.angleBetween(gravObject.x,gravObject.y,p.x,p.y);

    enemy.body.applyForce(p.gravityForce * Math.cos(angle) * forceReducer * (distanceFromPlanet - p.width / 2), p.gravityForce * Math.sin(angle) * forceReducer * (distanceFromPlanet - p.width / 2));
    enemy.body.angle = angle;

    return angle;

}

/*
This is the code that calculates gravity fields for the player, if they are in the radius.
function returns -361, which is impossible in radian angles,
if the player is not in any gravity radius.
*/
function gravityToPlanets(gravObject){
    var angle = -361;
    // looping through all planets
    var p = findClosestPlanet(gravObject);

    if(p !== undefined) {
        var distanceFromPlanet = Phaser.Math.distance(gravObject.x, gravObject.y, p.x, p.y);

        // calculating angle between the planet and the crate
        angle = Phaser.Math.angleBetween(gravObject.x, gravObject.y, p.x, p.y);

        // add gravity force to the gravObject in the direction of planet center
        gravObject.body.applyForce(p.gravityForce * Math.cos(angle) * forceReducer * (distanceFromPlanet - p.width / 2),
            p.gravityForce * Math.sin(angle) * forceReducer * (distanceFromPlanet - p.width / 2));
    }
    return angle;
}

/* finds which planet the gravityObject is closest to, if it is within a gravity field.
* returns undefined if the object is outside all gravity fields.
*/
function findClosestPlanet(gravObject){
    var closestPlanetDistance = Infinity;
    var closestPlanet;

    for(var j = 0; j < planetGroup.total; j++){
        var p = planetGroup.getChildAt(j);
        var planetGravityRadius = p.width / 2 + p.gravityRadius / 2;
        var distanceFromPlanet = Phaser.Math.distance(gravObject.x, gravObject.y, p.x, p.y);

        if (distanceFromPlanet < planetGravityRadius){
            if (closestPlanet === undefined){
                closestPlanet = p;
                closestPlanetDistance = distanceFromPlanet;
            } else if( distanceFromPlanet < closestPlanetDistance){
                closestPlanet = p;
                closestPlanetDistance = distanceFromPlanet;
            }
        }
    }
    return closestPlanet;
}

function applyGravityToObjects(){
    for (var i = 0; i < objectGroup.total; i++){
        var o = objectGroup.getChildAt(i);
        gravityToPlanets(o);
    }
}

/*
This function implements a max velocity on a sprite, so it cannot accelerate too far and fly out of a
gravity field. Code from : http://www.html5gamedevs.com/topic/9835-is-there-a-proper-way-to-limit-the-speed-of-a-p2-body/
*/
function constrainVelocity(sprite, maxVelocity) {
    var body = sprite.body;
    var angle, currVelocitySqr, vx, vy;
    vx = body.velocity.x;
    vy = body.velocity.y;
    currVelocitySqr = vx * vx + vy * vy;
    if (currVelocitySqr > (maxVelocity * maxVelocity)) {
        angle = Math.atan2(vy, vx);
        vx = Math.cos(angle) * maxVelocity;
        vy = Math.sin(angle) * maxVelocity;
        body.velocity.x = vx;
        body.velocity.y = vy;
        // console.log('limited speed to: '+ maxVelocity);
    }
}

//=======adds text================================================================================================
function addMessage(text, sec){
    //add score to the screen
    messageBack = game.add.sprite(100,100,"speechBubble");
    messageBack.scale.setTo(0.6,0.6);
    messageBack.anchor.set(0.5);
    messageCaption = game.add.text(100, 100, text, {fill: '#000000', font: '9pt Arial'});
    messageCaption.anchor.set(0.5);
    if(sec > 0){
        messageTimer(sec); //fades message
    }
}

function messageTimer(sec){
    game.time.events.add(Phaser.Timer.SECOND * sec, fadeMessage, this);
}

function fadeMessage(){
    var bubbleTween = game.add.tween(messageBack).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None, true);
    var textTween = game.add.tween(messageCaption).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None, true);
    bubbleTween.onComplete.add(destroyMessage, this);
    textTween.onComplete.add(destroyMessage, this);
}

function updateMessage(text){
    messageCaption.text = text;
}

function destroyMessage(){
    messageBack.destroy();
    messageCaption.destroy();
}

function messageLocation(angle){
    messageBack.x = player.x - 100 * Math.cos(angle);
    messageBack.y = player.y - 100 * Math.sin(angle);
    messageCaption.x = Math.floor(messageBack.x);
    messageCaption.y = Math.floor(messageBack.y);
    messageBack.angle = angle * 180 / Math.PI - 90;
    messageCaption.angle = angle * 180 / Math.PI - 90;
}
//=======================================================================================================

function addPlanet(posX, posY, gravityRadius, gravityForce, asset){
    var planet = game.add.sprite(posX, posY, asset);
    planet.gravityRadius = gravityRadius;
    planet.gravityForce = gravityForce;
    planetGroup.add(planet);
    game.physics.box2d.enable(planet);
    planet.body.static = true;

    planet.body.setCircle(planet.width / 2);
    gravityGraphics.drawCircle(planet.x, planet.y, planet.width+planet.gravityRadius);
    planet.body.setCollisionCategory(1);
}

function addTeleporter(x, y, radians, goal) {
    teleporter = game.add.sprite(x, y, "teleporter", 6);
    game.physics.box2d.enable(teleporter);
    teleporter.animations.add('swirl', [0, 1, 2, 3, 4, 5], 15, true);
    teleporter.body.setRectangle(40, 47);
    teleporter.body.rotation += radians;
    teleporter.body.static = true;
    teleporter.body.setCollisionMask(0);
    levelGoal = goal;
}

function addStartPad(x, y, radians) {
    startPad = game.add.sprite(x, y, "startPad", 6);
    objectGroup.add(startPad);
    game.physics.box2d.enable(startPad);
    startPad.body.setRectangle(40,10);
    startPad.body.rotation += radians;
    startPad.body.static = true;
    startPad.body.setCollisionCategory(1);
}

//rebounds the player sprite back after enemy collision
function enemyContactCallback(body1, body2, fixture1, fixture2, begin){
    if (!begin){
        return;
    }

    if (enemyCounterClockwise === -1) {
        enemyCounterClockwise = 0;
    } else {
        enemyCounterClockwise = -1;
    }
    enemyVel += 30;


}

// kills the gear when touched
function gearCallback(body1,body2, fixture1, fixture2, begin) {
    //body1, body2, fixture1, fixture2, begin
    // body1 is the player because it's the body that owns the callback
    // body2 is the body it impacted with, in this case the gear
    // fixture1 is the fixture of body1 that was touched
    // fixture2 is the fixture of body2 that was touched

    // This callback is also called for EndContact events, which we are not interested in.
    if (!begin)
    {
        return;
    }
    score += 1;
    addMessage(score + " / " + levelGoal, 1);
    if (score>=levelGoal){
        teleporter.animations.play('swirl');
    }
    body2.sprite.destroy();
}

function planetContactCallback(body1, body2, fixture1, fixture2, begin){
    // console.log("planet touch");
    if (!begin){
        return;
    }
    planetContact =  true;
}

function addGear(x, y, sprite){
    var gear = game.add.sprite(x, y, sprite);
    objectGroup.add(gear);
    game.physics.box2d.enable(gear);
    gear.body.setCollisionCategory(2);
    gear.body.static = false;
    spin=gear.animations.add('spin', [0,1,2,3]);
    gear.animations.play('spin', 10, true);
}

function movePlayer(x, y){
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;
    player.body.x = x;
    player.body.y = y;
}

// function addRandomGears(numGears, spriteImage){
//     for (var i = 0; i < numGears; i++) {
//         var gear = game.add.sprite(game.world.randomX, game.world.randomY, spriteImage);
//         objectGroup.add(gear);
//         game.physics.box2d.enable(gear);
//         gear.body.setCollisionCategory(2);
//         // gear.body.sensor = true;
//         gear.body.static = false;
//         gear.animations.add(0,1,2,3);
//     }
// }

function checkTeleporterOverlap(teleporter){
    var playerBounds = player.getBounds();
    var teleporterBounds = teleporter.getBounds();

    if (Phaser.Rectangle.intersects(playerBounds,teleporterBounds) && score >= levelGoal){
        changeLevel();
    }
}

function changeLevel(){
    teleporter.destroy();
    // console.log('contact with teleporter');
    currentLevel++;
    // console.log('currentLevel: ', currentLevel);
    planetGroup.destroy();
    planetGroup = game.add.group();

    objectGroup.destroy();
    objectGroup = game.add.group();

    enemyGroup.destroy();
    enemyGroup = game.add.group();

    gravityGraphics.destroy();
    gravityGraphics = game.add.graphics(0, 0);
    gravityGraphics.lineStyle(2, 0xffffff, 0.5);

    // console.log('destroy!');
    score = 0;
    createLevel()
    // game.state.start("PlayGame", true, false, this.currentLevel);
}

function handleKeyboardInput(angle){
    if (cursors.left.isDown ) {
        // player.body.moveLeft(90);
        player.body.velocity.x += playerVel * Math.cos(angle + (Math.PI/2));
        player.body.velocity.y += playerVel * Math.sin(angle + (Math.PI/2));
        player.animations.play('walkL');
    }
    else if (cursors.right.isDown ) {
        // player.body.moveRight(90);
        player.body.velocity.x += playerVel * Math.cos(angle - (Math.PI / 2)) ;
        player.body.velocity.y += playerVel * Math.sin(angle - (Math.PI / 2)) ;
        player.animations.play('walkR');
    }
    if (cursors.up.isDown) {
        player.body.velocity.x += -playerVel * Math.cos(angle);
        player.body.velocity.y += -playerVel * Math.sin(angle);
        player.animations.play('fall');

    }
    if (cursors.down.isDown) {
        player.body.velocity.x += playerVel * Math.cos(angle);
        player.body.velocity.y += playerVel * Math.sin(angle);
        player.animations.play('stand');

    }

    if (cursors.left.justUp || cursors.right.justUp){
        player.animations.play('stand');
    }
}

// Consistently checks if the players health goes to zero, and if so resets the level.
// function resetLevel(health) {
// TBD
// }
