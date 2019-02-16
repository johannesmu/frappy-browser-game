//when window is loaded
window.addEventListener("load", function () {
    //adjust canvas size
    resizeCanvas();
    //start game
    initGame();
    //read score from storage
    readScore();
});
//when game is closed
window.addEventListener("unload", function () {
    //set restart to false
    saveScore();
});
//when window is reloaded
window.addEventListener("reload", function () {
    //saveScore();
});
//when window is resized
window.addEventListener("resize", resizeCanvas, false);
//listen for keydown so game can be played using space bar
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);


var stage = new createjs.Stage("gamecanvas");
//support touch devices
createjs.Touch.enable(stage);

////////////////variables used in the game need to be declared here
//so they can be shared/accessed by various functions in the game
var mouseisdown = false;
//create a reference for our timer
var timer = createjs.Ticker;
//canvas dimensions
var width;
var height;
//reference used to refer to the player
var player;
//
var scale = 0.8;
var isalive = true;
var playerheight;
var score = 0;
var highscore = 0;
var tween;
var restart = false;

//interval controls how often obstacles appear
//in ticks, eg create an obstacle every x number of ticks
//our game is running 60 ticks per second
//250 is easy 150 is hard
var interval = 250;
//how fast the obstacles move in pixels/tick
var obspeed = 2;
//an array to keep track of obstacles in the game, so
//they can be removed when they are out of sight (left of stage)
var obstacles = new Array();

//reference path where all obstacles images are stored
obsfolder = "assets/images/";

//list the names of obstacle image files here
obslist = ["obs_tv.png", "obs_radio.png",
    "obs_camera.png", "obs_light.png",
    "obs_mic.png"
];

//////////////////////////game functions
//resize the canvas
function resizeCanvas() {
    canvas = document.getElementById("gamecanvas");
    container = document.getElementById("gamecontainer");
    ww = container.offsetWidth;
    wh = container.offsetHeight;
    canvas.width = container.offsetWidth;
    canvas.height = wh - 50;
    width = canvas.width;
    height = canvas.height;
    stage.update();
    //if screen is small set player to smaller scale
    if (width <= 480) {
        scale = 0.6;
    }
}
//start game for the first time
function initGame() {
    time = setRestart("get") - new Date().getTime();
    if (time > 10 * 2000) {
        showMenu(true, "start");
    }
    //set onTick to be executed every tick of the timer
    timer.on("tick", onTick, this);
    //set the timer to run at 60fps
    timer.setFPS(120);
    //add a listener for everytime the stage is clicked/tapped
    stage.addEventListener("stagemousedown", onStageClick);
    //add a listener for everytime mouse/tap is released
    stage.on("stagemouseup", onStageMouseUp);
    //create the player
    setupPlayer();
    //initialise the obstacles
    intializeObstacles();
}
//function to reset the game
function resetGame() {
    //set restart to true so we know the game is being restarted
    if (setRestart("set") == "success") {
        //reload the page to reset game
        window.location.reload();
    }
}

function setRestart(command) {
    if (command == "set") {
        try {
            window.localStorage.setItem("timestamp", new Date().getTime());
            return "success";
        } catch (err) {
            return "error";
        }
    } else if (command == "get") {
        try {
            time = window.localStorage.getItem("timestamp");
            return time;
        } catch (err) {
            return "error";
        }
    }
}
//function to initialise the obstacles
function intializeObstacles() {
    //create a loop to go through all the obstacles
    for (i = 0; i < obslist.length; i++) {
        //load images of all obstacles
        obs = new createjs.Bitmap(obsfolder + obslist[i]);
        //scale the obstacle
        obs.scaleX = scale * 2;
        obs.scaleY = scale * 2;
        //measure the size of the obstacle after scaling
        get = obs.getTransformedBounds();
    }
}

function onStageClick(e) {
    //if player is still alive, set mouseisdown to true
    //this will animate it upwards in the onTick() function
    if (isalive) {
        mouseisdown = true;
    }
}

function onStageMouseUp() {
    mouseisdown = false;
}

function onKeyDown(e) {
    //if spacebar is pressed
    if (e.keyCode == 32) {
        mouseisdown = true;
    }
}

function onKeyUp() {
    mouseisdown = false;
}
//setup the player
function setupPlayer() {
    var data = {
        images: ["assets/sprites/bird.png"],
        frames: {
            width: 200,
            height: 120
        },
        animations: {
            fly: [0, 3],
            dead: [5]
        }
    };
    var spriteSheet = new createjs.SpriteSheet(data);
    var animation = new createjs.Sprite(spriteSheet, "fly");
    player = new createjs.Sprite(spriteSheet, animation);
    player.x = width * .3;
    player.y = height / 2;
    player.scaleX = scale;
    player.scaleY = scale;
    player.regX = 100;
    player.regY = 80;
    player.gotoAndPlay("fly");
    player.name = "player";
    stage.addChild(player);
    stage.update();
}

//this function gets run every tick of the timer
//if timer is 60fps, this function gets called 60 times/sec
function onTick() {
    //check if game is paused
    if (timer.getPaused() == false) {
        //if not paused, if player hits the top or the bottom of screen
        if (player.y < 60 || player.y >= height - 50) {
            killPlayer();
        }
        //if mouse is not pressed
        if (mouseisdown == false) {
            tween = TweenLite.to(player, 3, {
                y: height,
                ease: Power0.easeIn
            });
        }
        //if mouseisdown is true, animate upwards towards
        //the top of the screen
        else {
            tween = TweenLite.to(player, 3, {
                y: 0,
                ease: Power0.easeIn
            });
        }
        manageObstacles();
        showScore();
    }
    stage.update();
    moveBackground("gamebg",1);
    moveBackground('ground',4);
}

function killPlayer() {
    if (isalive == true) {
        player.gotoAndStop("dead");
        isalive = false;
        playerheight = player.getTransformedBounds().height;
        stopheight = playerheight + 150;
        var restarttimer = window.setTimeout(function () {
            stopGame();
            //clearTimeOut(restarttimer);
        }, 3000);
    }
}

function stopGame() {
    saveScore();
    timer.setPaused(true);
    //show the restart button which will call resetGame()
    showMenu(true, "Restart");
}

//this function generates a semi-random number
function randomNumber(limit, rounding) {
    rn = Math.random() * limit;
    //if rounding is set to true then
    //return a rounded number
    if (rounding == true) {
        return Math.floor(rn);
    }
    //if rouding is false
    else {
        return rn;
    }
}
//this function creates an obstacle
function createObstacle() {
    //generate random number
    num = randomNumber(obslist.length - 1, true);
    //    size = scale*2;
    size = scale * 1.8;
    obs = new createjs.Bitmap(obsfolder + obslist[num]);
    obs.scaleX = size;
    obs.scaleY = size;
    ypos = height - obs.getTransformedBounds().height;
    space = randomNumber(ypos, false);
    obs.y = space;
    obs.name = "item";
    return obs;
}

function manageObstacles() {
    //this function manages the creation
    //the movement and the removal of obstacles from the game environment
    //if the number of ticks is perfectly divisible by the value of interval
    //eg 7%3=1 where 6%3=0 google:modulo
    if (timer.getTicks() % interval == 0) {
        obstacle = createObstacle();
        obstacle.x = width + 1;
        obstacles.push(obstacle);
        stage.addChildAt(obstacle, 0);
    } 
    else if (obstacles.length > 0) {
        //check if there are any obstacles
        //check all obstacles via "obstacles" array
        for (i = 0; i < obstacles.length; i++) {
            obs = obstacles[i];
            pos = obs.x;
            //get the width of the obstacle
            obswidth = obs.getTransformedBounds().width;

            //if obstacle is further than left edge of screen
            if (pos > (width - width * 2) && isalive == true) {
                //move it to the left
                obstacles[i].x = pos - obspeed;
                //if obstacle is cleared by the player
                if (obstacles[i].x <= player.x) {
                    //
                    if (obs.name == "item" && isalive == true) {
                        addScore();
                        obs.name = "remove";
                    }
                }
            } else if (pos < (obswidth * -1)) {
                //if obstacle is not visible
                //remove it from stage
                //remove from list of obstacles on stage
                stage.removeChild(obstacles.shift());
            }
            if (checkCollision(player, obs) != false) {
                killPlayer();
            }

        }

    }

}

//function to show or hide menu
function showMenu(show, label) {
    if (show == true) {
        document.getElementById("restartbtn").addEventListener("mousedown", function () {
            resetGame();
        });
        document.getElementById("restartbtn").innerHTML = label;
        document.getElementById("restart").style.visibility = "visible";
    } else {
        document.getElementById("restart").style.visibility = "hidden";
    }

}

function checkCollision(obj1, obj2) {
    var collision = ndgmr.checkPixelCollision(obj1, obj2, 0);
    return collision;
    // true or false
}

//////////////////////////scoring
function showScore() {
    //show a message on the top of screen in the div with id="score"
    document.getElementById("score").innerHTML = score;
    document.getElementById("highscore").innerHTML = "highscore=" + highscore;
}

////saving high score
function addScore() {
    score++;
    if (score >= highscore) {
        highscore = score;
    }
    //we check score here and make game go faster
    switch (score) {
        case score > 10:
            interval = 200;
            break;
        case score > 20:
            interval = 150;
            break;
        case score > 40:
            interval = 120;
            break;
    }
    //update score display
    showScore();
}

function saveScore() {
    try {
        window.localStorage.setItem("highest", highscore);
    } 
    catch (err) {
        console.log("error saving score " + err);
    }
}
///restore high score
function readScore() {
    try {
        if (localStorage.length > 0) {
            storedscore = window.localStorage.getItem("highest");
            highscore = storedscore;
        }
    } 
    catch (err) {
        console.log("error reading score " + err);
    }
}
//animate background
var bgposition = 0;
function moveBackground(elm,speed){
    if (timer.getTicks() % 5 == 0) {
        bgposition -= speed;
        var position=bgposition+"px 0px";
        document.getElementById(elm).style.backgroundPosition=position; 
    }
}
//cordova stuff for the android app
