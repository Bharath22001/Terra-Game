let instructions = [
    "Welcome to Terra!",
    " ",
    " ",
    "Collect all 5 orbs to escape.",
    " ",
    " ",
    "Controls:",
    "A - Move Left",
    "D - Move Right",
    "S - Stop Moving",
    "Space - Jump",
    " ",
    " ",
    " ",
    "Press 'Enter' to Start:"
];
let currentLine = 0;
let currentChar = 0;
let typingSpeed = 3;
let startupScreenActive = true;
let levelComplete = false;
let player;
let playerImage;
let bottoms = [] //invisible floor
let gravity = 0.09;
let hop = -6.5;
let yPos = 15;
let playerx = 50;
let playery = 50;
let topcolor, bottomcolor;
let orbs = [];
var isFound;
let cloudSpeed = 0.3;
let cloudInterval = 10; //Time interval for clouds (ms)
let cloudLastMoved = 0;
let clouds = []
let trees = [];
let treeSpacing = 400; // Adjust the spacing between trees
let grounds = [];
let mountain1 = [];
let mountain2 = [];
let maxJumps = 1; //number of allowed jumps
let remainingJumps = maxJumps; 
let onGround = false;
let orbCount = 0;
let cameraPosX = 0;
let playerLives = 0; //player life
let heartSprites = []; 
let extraLives = [];
let gameState = "playing"; // "playing" or "gameover"
var orbSound; 
var backgroundMusic;
var deathSound;
var gameOverSound;
var restoreHealthSound;
let particles = [];
let ghosts = [];
let traps = [];
let risingPlatformY = 232;
let risingPlatformDirection = 1; // 1 for upward, -1 for downward
const risingPlatformSpeed = 2;
const risingPlatformThickness = 5;
let gate;
let portal;

///////////////////////////////////////////// STARTING SCREEN ///////////////////////////////////////////////////////////////

function displayStartupScreen() {
    background(24, 21, 45); 
    fill(255); 
    textSize(24); 
    textAlign(CENTER, CENTER); 

    let startY = height / 2 - (instructions.length * 24) / 2; // Calculate vertical position
    let centerX = width / 2; // Calculate the horizontal center

    for (let i = 0; i < currentLine; i++) {
        let line = instructions[i];
        text(line, centerX, startY + i * 24); 
    }

    if (currentLine < instructions.length) {
        let line = instructions[currentLine];
        let animatedText = line.substring(0, currentChar);

        text(animatedText, centerX, startY + currentLine * 24); // Display the animated text

        if (frameCount % typingSpeed === 0) {
            if (currentChar < line.length) {
                currentChar++; // Move to the next character
            } else {
                currentChar = 0; // Move to the next line
                currentLine++;
            }
        }
    }
}

///////////////////////////////////////////// BACKGROUND GRADIENT ///////////////////////////////////////////////////////////////

function drawGBG(){
    for(let y=0; y<height;y++){
        n = map(y+160,0,height,0,1)
        let newcolor = lerpColor(topcolor,bottomcolor,n);
        stroke(newcolor);
        line(0,y,width,y);
    }
}

///////////////////////////////////////////// SOUND + IMAGE //////////////////////////////////////////////////////////////////////
function preload() {
    playerImage = loadImage('Assets/clipart338756.png'); // url: https://www.clipartmax.com/download/m2i8i8b1K9Z5i8b1_pin-robot-head-clipart-circle/
    portal = loadImage('Assets/Portal image.png'); // url: https://www.seekpng.com/idown/u2a9o0o0r5y3w7a9_rick-and-morty-portal-png/#google_vignette

    soundFormats('mp3','wav'); // all sounds taken fom https://mixkit.co/
    backgroundMusic = loadSound('Assets/mixkit-vampires-in-the-city-892.mp3');
    backgroundMusic.setVolume(0.15);
    orbSound = loadSound('Assets/mixkit-circular-object-touch-3169.wav');
    orbSound.setVolume(0.20);
    deathSound = loadSound('Assets/mixkit-boxing-punch-2051.wav');
    gameOverSound = loadSound('Assets/dramatic-synth-echo-43970.mp3');
    restoreHealthSound = loadSound('Assets/mixkit-video-game-health-recharge-2837.wav');
    restoreHealthSound.setVolume(0.20);
}

///////////////////////////////////////////// TREES ///////////////////////////////////////////////////////////////////////////////

function drawTrees() {
    for (let i = 0; i < trees.length; i++) {
        let tree = trees[i];
        push();
        translate(-cameraPosX, 0);

        // Draw trunk
        noStroke();
        fill(20, 19, 34);
        rect(tree.x, tree.y, tree.trunkWidth, tree.trunkHeight);

        // Draw triangles for branches
        triangle(tree.x, tree.y + 200, tree.x - 40, tree.y + 185, tree.x, tree.y + 190);
        triangle(tree.x , tree.y + 170, tree.x + 80, tree.y + 165, tree.x, tree.y + 155);

        // Draw ellipses for leaves 
        fill(183, 96, 201);
        ellipse(tree.x - 40, tree.y + 5, 105, 105);
        ellipse(tree.x + tree.trunkWidth / 2, tree.y + 5, 105, 105);
        ellipse(tree.x + tree.trunkWidth + 60, tree.y + 5, 105, 105);

        fill(194, 143, 206);
        ellipse(tree.x + tree.trunkWidth / 2 + 30, tree.y + 10, 105, 105);
        pop();
    }
}

///////////////////////////////////////////// GIVES MOTION TO CLOUDS //////////////////////////////////////////////////////////////

function moveClouds(){
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].pos_x += cloudSpeed;

        //reset clouds when they go off screen bounds
        if (clouds[i].pos_x > width + 100) {
            clouds[i].pos_x = -100;
        }
    }
}

///////////////////////////////////////////// MOUNTAIN SET 1 & 2 ////////////////////////////////////////////////////////////////

function drawMountain1() {
    for (let i = 0; i < mountain1.length; i++) {
        fill(mountain1[i].fillColor);
        beginShape();
        for (let j = 0; j < mountain1[i].vertices.length; j++) {
            vertex(mountain1[i].vertices[j].x, mountain1[i].vertices[j].y);
        }
        endShape(CLOSE);
    }
}

function drawMountain2() {
    for (let i = 0; i < mountain2.length; i++) {
        fill(mountain2[i].fillColor);
        beginShape();
        for (let j = 0; j < mountain2[i].vertices.length; j++) {
            vertex(mountain2[i].vertices[j].x, mountain2[i].vertices[j].y);
        }
        endShape(CLOSE);
    }
}

///////////////////////////////////////////// TERRAIN STRUCTURES ////////////////////////////////////////////////////////////////

class Ground {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.mainColor = color(24, 21, 45);
        this.topColor = color(54, 50, 81);
        this.topHeight = 18;
    }

    display() {

        // Draw main part
        noStroke();
        fill(this.mainColor);
        rect(this.x, this.y, this.width, this.height);
        // Draw top part
        fill(this.topColor);
        rect(this.x, this.y, this.width, this.topHeight);
    }
}

//Allows player to walk on grounds
function Bottom(x, y, width, height) {
    let bottom = createSprite(x + width / 2, y + height / 2, width, height);

    bottom.draw = function () {
        noFill();
        rect(0, 0, this.width, this.height);
    };

    return bottom;
}

// Create collapsing bridge
function createTrap(x, y) {
    let trap = createSprite(x + 30, y, 60, 5);
    trap.shapeColor = color(133, 86, 0);
    trap.timer = 15; // each trap supports the player for 15 frames
    trap.collapsed = false; // property to track if the trap has collapsed

    trap.checkCollision = function () {
        // Check if player collides with the trap
        if (player.collide(this) && this.timer <= 0) {
            this.collapsed = true; // Set trap to collapsed
            // Reset player position
            player.position.x = 40;
            player.position.y = height - 210;
            player.velocity.y = 0;
        }
    };

    traps.push(trap);
}

//function to add new traps
function addTrap(x, y) {
    traps.push(createTrap(x, y));
}

//Creates rising platform
function updateRisingPlatform() {
    // Move the platform based on the speed and direction
    risingPlatformY += risingPlatformSpeed * risingPlatformDirection;

    // Check if the platform has reached the top or bottom limit
    if (risingPlatformY == 232 || risingPlatformY == 576) {
        risingPlatformDirection *= -1;
    }

    // Check for collision with the player
    if (checkCollision(player, 1850, risingPlatformY, 150, risingPlatformThickness)) {
        // Adjust player's position based on the rising platform
        player.position.y = risingPlatformY - 30;
    }
}

function drawRisingPlatform() {
    fill(133, 86, 0);
    rect(1850, risingPlatformY, 150, 5);
}

function checkCollision(obj, x, y, width, height) {
    return (
        obj.position.x + obj.width > x &&
        obj.position.x < x + width &&
        obj.position.y + obj.height > y &&
        obj.position.y < y + height
    );
}

///////////////////////////////////////////// PLAYER MOVEMENT + KEY BINDING ///////////////////////////////////////////////////////////////////

function keyPressed() {
    if (keyCode === ENTER && startupScreenActive) {
        startupScreenActive = false; // Deactivate the startup screen
    } else if (keyCode === 32) { // spacebar
        // allow jumping only if there are remaining jumps or on ground
        if (onGround || remainingJumps > 0) {
            jump(player);
            if (!onGround) {
                remainingJumps--; // decrement remainingJumps only if not on the ground
            }
        }
    } else if (keyCode === 13) {
        if (gameState === "gameover") {
            resetGame();
        }
    } else if (keyCode === 83) { // S to stop moving
        move(player, 2, 90);
    } else if (keyCode === 68) { // D to move right
        move(player, 2, 0);
    } else if (keyCode === 65) { // A to move left
        move(player, 2, 180);
    }
}

function jump(player) {
    player.velocity.y = hop+3;   
}

function move(player, speed, direction) {
    player.setSpeed(speed, direction);

}

///////////////////////////////////////////// COLLECTABLES + PARTICLES SYSTEM //////////////////////////////////////////////////////////////////////


function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.display();

        // Remove particles that exceed their lifetime
        if (p.lifetime <= 275) {
            particles.splice(i, 1);
        }
    }
}

function drawOrbs() {
    for (let i = 0; i < orbs.length; i++) {
        let orb = orbs[i];
        if (orb && !orb.isFound) {
            fill(83, 206, 255);
            ellipse(orb.x_pos, orb.y_pos, 25, 25);
            fill(0, 182, 255);
            ellipse(orb.x_pos, orb.y_pos, 19, 19);

            // Emit particles continuously
            for (let j = 0; j < 1; j++) {
                particles.push(new Particle(orb.x_pos, orb.y_pos));
            }
        }
    }
}

//Particles for orbs
function Particle(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.2, 0.2), random(-0.2, 0.2));
    this.color = color(83, 206, 255 );
    this.lifetime = 5.5 * 60; // 5.5 seconds at 60 frames per second

    this.update = function() {
        this.pos.add(this.vel);
        this.lifetime--;
    };

    this.display = function() {
        let alpha = map(this.lifetime, 0, 5 * 60, 0, 255);
        noStroke();
        fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], alpha);
        ellipse(this.pos.x, this.pos.y, 5, 5);
    };
}

function checkIfGameCharInOrbRange() {
    for (let i = 0; i < orbs.length; i++) {
        let orb = orbs[i];
        if (orb) {
            var d = dist(player.position.x, player.position.y, orb.x_pos, orb.y_pos);
            if (d < 30 && !orb.isFound) {
                orb.isFound = true;
                orbCount++;
                orbSound.play(); // Play the orb pickup sound
            }
        }
    }
}

///////////////////////////////////////////// LIFE SYSTEM ///////////////////////////////////////////////////////////////////////

function initializeHearts() {
    for (let i = 0; i < playerLives; i++) {
        let heart = createSprite(10 + i * 15, 15, 20, 20); // position 
        heart.draw = function () {
            drawHeart(this.position.x, this.position.y, 17); // size of the hearts
        };
        heartSprites.push(heart);
    }
}

function drawHeart(x, y, size) {
    fill(255, 70, 119); 
    beginShape();
    vertex(x, y);
    bezierVertex(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
    bezierVertex(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
    endShape(CLOSE);
}

function removeLife() {
    playerLives--;
    if (playerLives == -1) {
        gameState = "gameover";
        gameOverSound.play();
        backgroundMusic.stop();
    } else {
        if (heartSprites.length > 0) {
            let heart = heartSprites.pop();
            heart.remove();
            deathSound.play();
        }
    }
}


function resetGame() {
    playerLives = 0;
    orbCount = 0; // Reset orb count
    gameState = "playing";
    player.position.x = 70;
    player.position.y = height - 210;
    player.velocity.y = 0;

    // Reset orbs
    for (let i = 0; i < orbs.length; i++) {
        orbs[i].isFound = false;
    }

    // Reset extra life collectables
    for (let i = 0; i < extraLives.length; i++) {
        extraLives[i].isFound = false;
    }

    // Reset traps
    for (let i = 0; i < traps.length; i++) {
        traps[i].timer = 25; // Reset trap timer
        trap.collapsed = false; 
    }
}



function drawExtraLives() {
    for (let i = 0; i < extraLives.length; i++) {
        let extraLife = extraLives[i];
        if (extraLife && !extraLife.isFound) {
            drawHeart(extraLife.x_pos, extraLife.y_pos, 25);
        }
    }
}

function checkIfGameCharInExtraLifeRange() {
    for (let i = 0; i < extraLives.length; i++) {
        let extraLife = extraLives[i];
        if (extraLife) {
            var d = dist(player.position.x, player.position.y, extraLife.x_pos, extraLife.y_pos);
            if (d < 30 && !extraLife.isFound) {
                extraLife.isFound = true;
                playerLives++; // Increase player lives
                initializeHearts(); // Update heart sprites
                restoreHealthSound.play();

            }
        }
    }
}

///////////////////////////////////////////// ENEMIES ///////////////////////////////////////////////////////////////////////

class Ghost {
    constructor(x, y, minX, maxX) {
        this.x = x;
        this.y = y;
        this.bodyColor = this.randomColor(); // Use the randomColor function to set the body color
        this.eyeColor = color(255);
        this.eyePupilColor = color(0);
        this.width = 40;
        this.height = 30;
        this.eyeSize = 15;
        this.pupilSize = 8;
        this.speed = 2;
        this.minX = minX;
        this.maxX = maxX;
        this.direction = 1; // 1 for right, -1 for left
    }

    display() {
        fill(this.bodyColor);
        beginShape();
        vertex(this.x, this.y);
        bezierVertex(this.x, this.y, this.x + 20, this.y - 35, this.x + 40, this.y);
        endShape();
        rect(this.x, this.y, this.width, this.height);

        beginShape();
        vertex(this.x, this.y + 30);
        vertex(this.x + 5, this.y + 40);
        vertex(this.x + 10, this.y + 30);
        vertex(this.x + 10, this.y + 30);
        vertex(this.x + 15, this.y + 40);
        vertex(this.x + 20, this.y + 30);
        vertex(this.x + 20, this.y + 30);
        vertex(this.x + 25, this.y + 40);
        vertex(this.x + 30, this.y + 30);
        vertex(this.x + 30, this.y + 30);
        vertex(this.x + 35, this.y + 40);
        vertex(this.x + 40, this.y + 30);
        endShape();

        fill(this.eyeColor);
        ellipse(this.x + 10, this.y + 8, this.eyeSize, this.eyeSize);
        ellipse(this.x + 30, this.y + 8, this.eyeSize, this.eyeSize);

        fill(this.eyePupilColor);
        ellipse(this.x + 7, this.y + 8, this.pupilSize, this.pupilSize);
        ellipse(this.x + 27, this.y + 8, this.pupilSize, this.pupilSize);
    }

    update() {
        this.x += this.speed * this.direction;

        // Check if ghost has reached constraints
        if (this.x <= this.minX || this.x + this.width >= this.maxX) {
            // Reverse the direction
            this.direction *= -1;
        }
    }

    randomColor() {
        let colors = [color(255, 0, 0), color(0, 0, 255), color(255, 165, 0), color(255, 127, 146)];
        return random(colors);
    }
}

function checkForGhostCollisions() {
    for (let i = 0; i < ghosts.length; i++) {
        let ghost = ghosts[i];
        let d = dist(player.position.x, player.position.y, ghost.x, ghost.y);
        if (d < 30) { // distance for collision check
            removeLife();
            // Reset player position
            player.position.x = 40;
            player.position.y = height - 210;
            player.velocity.y = 0;
        }
    }
}

///////////////////////////////////////////// CALLING GAME ELEMENT FUNCTIONS ///////////////////////////////////////////////////////////////////////

function drawGameElements() {
    drawParticles();
    drawOrbs();
    drawExtraLives();

    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].display();
        ghosts[i].update(cameraPosX);
    }
}

function checkGameInteractions() {
    checkIfGameCharInOrbRange();
    checkIfGameCharInExtraLifeRange();
    checkForGhostCollisions();
}
///////////////////////////////////////////// PORTAL ////////////////////////////////////////////////////////////////

function updatePortal() {
    // Rotate the portal clockwise
    portalSprite.rotation += 1;

    // Check the distance between player and portal
    let distance = dist(
        player.position.x,
        player.position.y,
        portalSprite.position.x,
        portalSprite.position.y
    );

    // threshold for distance to trigger level complete
    let distanceThreshold = 110;
    if (distance < distanceThreshold) {
        levelComplete = true;
    }
}

///////////////////////////////////////////// GAME COMPLETE SCREEN ////////////////////////////////////////////////////////////////

function displayCompletionScreen() {
    backgroundMusic.stop();
    fill(24, 21, 45);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text('Level Complete!', width / 2, height / 2);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function initGame(){

    ///////////////////////////////////////////// COLOURS FOR BACKGROUND GRADIENT /////////////////////////////////////////////////

    topcolor = color(255,124,166);
    bottomcolor = color(250, 190, 160);

    ///////////////////////////////////////////// PLAYER + GHOST CREATION ////////////////////////////////////////////////////////////////

    player = createSprite(90, height - 210, playerx, playery);
    playerImage.resize(50, 50);
    player.addImage(playerImage);
    player.maxSpeed = 10;

    // Create Ghost instances with constraints
    ghosts.push(new Ghost(490, 390, 490, 1190, cameraPosX));
    ghosts.push(new Ghost(1550, 390, 1550, 1850, cameraPosX));

    ///////////////////////////////////////////// PORTAL + PORTAL'S GATE //////////////////////////////////////////////////////////////

    portalSprite = createSprite(2250, 150);
    portalSprite.addImage(portal);
    portal.resize(150, 150);

    gate = createSprite(2100, 120, 5, 240);
    gate.shapeColor = color(150);

    ///////////////////////////////////////////// CREATES NEW CLOUDS //////////////////////////////////////////////////////////////

    cloudLastMoved = millis();

    clouds.push({ pos_x: -200, pos_y: 110 });
    clouds.push({ pos_x: 30, pos_y: 110 });
    clouds.push({ pos_x: 290, pos_y: 80 });
    clouds.push({ pos_x: 490, pos_y: 110 });
    clouds.push({ pos_x: 790, pos_y: 130 });

    ///////////////////////////////////////////// ALLOWS PLAYER TO WALK ON GROUND /////////////////////////////////////////////////

    bottoms.push(new Bottom(0, 0, 0, 1000));
    bottoms.push(new Bottom(0, 432, 250, 144));
    bottoms.push(new Bottom(320, 462, 100, 144));
    bottoms.push(new Bottom(490, 432, 700, 144));
    bottoms.push(new Bottom(890, 300, 160, 40));
    bottoms.push(new Bottom(1550, 432, 300, 144));
    bottoms.push(new Bottom(2000, 240, 400, 200));
    bottoms.push(new Bottom(2000, 532, 400, 200));
    bottoms.push(new Bottom(2390, 240, 0, 400));
    bottoms.push(new Bottom(2400, 0, 0, 1000));

    ///////////////////////////////////////////// CREATES NEW GROUNDS //////////////////////////////////////////////////////////////

    grounds.push(new Ground(0, 432, 250, 144));
    grounds.push(new Ground(320, 462, 100, 144));
    grounds.push(new Ground(490, 432, 700, 144));
    grounds.push(new Ground(890, 300, 160, 40));
    grounds.push(new Ground(1550, 432, 300, 144));
    grounds.push(new Ground(2390, 240, 10, 400));
    grounds.push(new Ground(2000, 240, 400, 200));
    grounds.push(new Ground(2000, 532, 400, 200));

    ///////////////////////////////////////////// COllAPSING BRIDGE /////////////////////////////////////////////////////////////////
    
    createTrap(1190, 436);
    createTrap(1250, 436);
    createTrap(1310, 436);
    createTrap(1370, 436);
    createTrap(1430, 436);
    createTrap(1490, 436);

    ///////////////////////////////////////////// TREES //////////////////////////////////////////////////////////////

    for (let i = 0; i < width + treeSpacing * 2; i += treeSpacing) {
        trees.push({ x: i, y: 0, trunkWidth: 40, trunkHeight: 732 });
    }

    ///////////////////////////////////////////// MOUNTAINS ///////////////////////////////////////////////////////////

    mountain1.push({
        fillColor: [102, 86, 122],
        vertices: [
            createVector(20, 500),
            createVector(120, 190),
            createVector(240, 500),
        ],
    });
    mountain1.push({
        fillColor: [37, 34, 67],
        vertices: [
            createVector(-60, 500),
            createVector(20, 140),
            createVector(120, 500),
        ],
    });
    mountain1.push({                  
        fillColor: [232, 231, 242],
        vertices: [
            createVector(-20, 210),
            createVector(10, 230),
            createVector(41, 215),
            createVector(20, 140),
        ],
    });      
    mountain1.push({
        fillColor: [37, 34, 67],
        vertices: [
            createVector(150, 550),
            createVector(240, 140),
            createVector(460, 650), 
        ],
    }); 

    mountain1.push({                  
        fillColor: [232, 231, 242],
        vertices: [
            createVector(224,210),
            createVector(240,210),
            createVector(260,240),
            createVector(289,250),
            createVector(240,140), 
        ],
    });  

    mountain2.push({
        fillColor: [102, 86, 122],
        vertices: [
            createVector(640, 500),
            createVector(760, 190),
            createVector(890, 500),
        ],
    });

    mountain2.push({
        fillColor: [37, 34, 67],
        vertices: [
            createVector(580, 500),
            createVector(690, 140),
            createVector(790, 500),
        ],
    });

    mountain2.push({                   
        fillColor: [232, 231, 242],
        vertices: [
            createVector(668, 210),
            createVector(680, 230),
            createVector(711, 215),
            createVector(690, 140),
        ],
    });

    mountain2.push({
        fillColor: [37, 34, 67],
        vertices: [
            createVector(700, 500),
            createVector(850, 230),
            createVector(1000, 500),
        ],
    });

    mountain2.push({
        fillColor: [232, 231, 242],
        vertices: [
            createVector(827, 270),
            createVector(840, 300),
            createVector(855, 276),
            createVector(883, 288),
            createVector(850, 230),
        ],
    }); 

    ///////////////////////////////////////////// ORB + HEART COLLECTABLES ////////////////////////////////////////////////////////

    orbs.push({ x_pos: 370, y_pos: 440, size: 40, isFound: false });
    orbs.push({ x_pos: 630, y_pos: 400, size: 40, isFound: false });
    orbs.push({ x_pos: 968, y_pos: 400, size: 40, isFound: false });
    orbs.push({ x_pos: 1370, y_pos: 400, size: 40, isFound: false });
    orbs.push({ x_pos: 2370, y_pos: 500, size: 40, isFound: false });

    initializeHearts();
    extraLives.push({ x_pos: 968, y_pos: 260, isFound: false });

}

function setup()
{
    createCanvas(1024, 576);
    backgroundMusic.loop();
    initGame();
}

function draw()
{  
    if (startupScreenActive) {
        displayStartupScreen();
    } else {
        ///////////////////////////////////////////// SCROLLING AND DRAW GBG ////////////////////////////////////////////////////////
        cameraPosX = constrain(player.position.x/1.5, 0, 2400 - width);
        drawGBG();

        ///////////////////////////////////////////// SUN //////////////////////////////////////////////////////////////////////////

        strokeWeight(0);
        fill(206, 188, 136);
        ellipse(width/2, yPos, 184, 184);
        fill(205, 150, 0);
        ellipse(width/2, yPos, 154, 154);

        ///////////////////////////////////////////// MOUNTAINS ///////////////////////////////////////////////////////////////////

        drawMountain1();
        drawMountain2();

        ///////////////////////////////////////////// CLOUDS //////////////////////////////////////////////////////////////////////

        //draw clouds
        for (let i = 0; i < clouds.length; i++) {
            noStroke();
            fill(255);
            ellipse(clouds[i].pos_x - 40, clouds[i].pos_y, 55, 55);
            ellipse(clouds[i].pos_x - 10, clouds[i].pos_y, 70, 70);
            ellipse(clouds[i].pos_x + 10, clouds[i].pos_y, 55, 55);
            ellipse(clouds[i].pos_x + 30, clouds[i].pos_y, 45, 45);
        }

        // Move clouds
        if (millis() - cloudLastMoved > cloudInterval) {
            moveClouds();
            cloudLastMoved = millis();
        }

        ///////////////////////////////////////////// TREES //////////////////////////////////////////////////////////////////////

        drawTrees();

        ///////////////////////////////////////////// GROUND //////////////////////////////////////////////////////////////////////

        noStroke();
        fill(19, 18, 29);
        rect(0, 432, 5000, 144);

        push();
        translate(-cameraPosX, 0);
        for (let i = 0; i < grounds.length; i++) {
            grounds[i].display();
        }

        ///////////////////////////////////////////// TRAPS //////////////////////////////////////////////////////////////////////

        for (let i = 0; i < traps.length; i++) {
            let trap = traps[i];
            trap.checkCollision();

            // Check if player collides with the trap
            if (player.collide(trap)) {
                trap.timer--;

                // If the timer reaches 0, makes the trap fall
                if (trap.timer <= 0) {
                    trap.setVelocity(0, 5); // Adjust the falling speed
                }
            }
        }

        drawRisingPlatform();
        updateRisingPlatform();
        
        ///////////////////////////////////////////// PORTAL'S GATE //////////////////////////////////////////////////////////////////////

        // Check if the player has collected 5 orbs
        if (orbCount == 5) {
            // Decrement the y value of the gate
            gate.position.y -= 1;
        }

        // Check for collision between player and gate
        if (player.collide(gate)) {
            player.velocity.x = 0;
            player.velocity.y = 0;
        }

        ///////////////////////////////////////////// BOTTOMS //////////////////////////////////////////////////////////////////////

        // Update the position of existing bottoms
        let onGround = false;
        for (let i = 0; i < bottoms.length; i++) {
            if (player.collide(bottoms[i])) {
                onGround = true;
                remainingJumps = maxJumps;
            }
        }

        // Reset the position updated flag for the next frame
        for (let i = 0; i < bottoms.length; i++) {
            bottoms[i].positionUpdated = false;
        }

        pop();

        ///////////////////////////////////////////// JUMP + GRAVITY //////////////////////////////////////////////////////////////////

        // allow jumping only if there are remaining jumps or on ground
        if(keyIsDown(32) && (onGround || remainingJumps > 0)){
            jump(player);
            if (!onGround){ 
                remainingJumps --; //decrement remainingJumps only if not on ground
            }
        }

        player.velocity.y += gravity;


        ///////////////////////////////////////////// SCORE COUNT ////////////////////////////////////////////////////

        fill(25, 25, 90 );
        textSize(20);
        textFont('monospace');
        text("Orbs: " + orbCount + "/5", 10, 20);

        ///////////////////////////////////////////// PLAYER ROTATION //////////////////////////////////////////////////////

        // Rotate player based on movement direction
        if (player.velocity.x !== 0) {
            player.rotation += player.velocity.x * 2; // Adjust the rotation speed
        }

        ///////////////////////////////////////////// COLLECTABLES + DRAWSPRITES //////////////////////////////////////////////////////

        if (levelComplete) {
            displayCompletionScreen();
            heart.remove();
        } else {
            updatePortal();
            
            push();
            translate(-cameraPosX, 0);
            drawGameElements();
            drawSprites();
            pop();
            
            checkGameInteractions();
        }

        ///////////////////////////////////////////// PORTAL //////////////////////////////////////////////////////////////////////////

        // Rotate the portal clockwise
        portalSprite.rotation += 1;

        ///////////////////////////////////////////// DEATH //////////////////////////////////////////////////////////////////////////

        //when player falls outside canvas bounds
        if (player.position.y > height) {
            removeLife();
            // Reset player position
            player.position.x = 40;
            player.position.y = height - 210;
            player.velocity.y = 0;
        }

        if (gameState === "gameover") {
            fill(24, 21, 45);
            rect(0,0,width,height);
            fill(255);
            textSize(48);
            textAlign(CENTER, CENTER);
            text("Game Over", width / 2, height / 2);
            textSize(24);
            text("Press 'ENTER' to restart", width / 2, height / 2 + 50);
        }

        //////////////////////////////////////////// DRAW HEARTS OUTSIDE SCROLLING ///////////////////////////////////////////////////

        for (let i = 0; i < heartSprites.length; i++) {
            heartSprites[i].display();
        }

    }
}