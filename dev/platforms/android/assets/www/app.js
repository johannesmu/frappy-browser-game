
window.addEventListener("load",function(){
    resizeCanvas();
    initGame();
	readScore();
});
window.addEventListener("unload",function(){
	saveScore();
});
window.addEventListener("reload",function(){
	saveScore();
});
window.addEventListener("resize",resizeCanvas,false);
window.addEventListener("keydown",onKeyDown);
window.addEventListener("keyup",onKeyUp);


var stage = new createjs.Stage("gamecanvas");
createjs.Touch.enable(stage);

////////////////variables used in the game need to be declared here
//so they can be shared/accessed by various functions in the game
var mouseisdown = false;
var timer = createjs.Ticker;
var width;
var height;
var player;
var scale = 0.8;
var isalive = true;
var playerheight;
var score = 0;
var highscore = 0;
var tween;

//interval controls how often obstacles appear
//in ticks, eg create an obstacle every 250 ticks
var interval = 250;
//how fast the obstacles move in pixels/tick
var obspeed = 2;
//an array to keep track of obstacles in the game, so 
//they can be removed when they are out of sight (left of stage)
var obstacles = new Array();
//reference folder location where all obstacles images are stored
obsfolder="assets/images/";
//list the names of obstacle image files here
obslist = ["obs_tv.png","obs_radio.png",
           "obs_camera.png","obs_light.png",
           "obs_mic.png"
          ];

//////////////////////////game functions
//resize the canvas
function resizeCanvas(){
    canvas = document.getElementById("gamecanvas");
    container = document.getElementById("gamecontainer");
    ww = container.offsetWidth;
    wh = container.offsetHeight;
    canvas.width = container.offsetWidth;
    canvas.height = wh-50;
    width = canvas.width;
    height = canvas.height;
    stage.update();
    //if screen is small set player to smaller scale
    if(width<=360){
        scale = 0.6;
    }
}
//start game for the first time
function initGame(){
	//set onTick to be executed every tick of the timer
    timer.on("tick",onTick,this);
	//set the timer to run at 60fps
    timer.setFPS(60);
	//add a listener for everytime the stage is clicked/tapped
    stage.addEventListener("stagemousedown",onStageClick);
	//add a listener for everytime mouse/tap is released
    stage.on("stagemouseup",onStageMouseUp);
	//create the player
    setupPlayer();
	//initialise the obstacles
    intializeObstacles();
}
//function to reset the game
function resetGame(){
	//reload the page to reset game
	window.location.reload();

}
//function to initialise the obstacles
function intializeObstacles(){
	//create a loop to go through all the obstacles
    for(i=0;i<obslist.length;i++){
		//load images of all obstacles
        obs = new createjs.Bitmap(obsfolder+obslist[i]);
		//scale the obstacle
        obs.scaleX = scale *2;
        obs.scaleY = scale *2;
		//measure the size of the obstacle after scaling
        get = obs.getTransformedBounds();
    }
}
function onStageClick(e){
    //if player is still alive, set mouseisdown to true
    //this will animate it upwards in the onTick() function
    if(isalive){
        mouseisdown = true;
    }
}
function onStageMouseUp(){
    mouseisdown = false;
}

function onKeyDown(e){
    //if spacebar is pressed
	if(e.keyCode == 32){
		mouseisdown = true;
	}
}
function onKeyUp(){
	mouseisdown = false;
}
function setupPlayer(){
    var data = {
    images: ["assets/sprites/bird.png"],
    frames: {width:200, height:120},
    animations: {fly:[0,3],dead:[5]}
    };
    var spriteSheet = new createjs.SpriteSheet(data);
    var animation = new createjs.Sprite(spriteSheet, "fly");
    player = new createjs.Sprite(spriteSheet,animation);
    player.x = width*.3;
    player.y= height/2;
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
function onTick(){
    if(timer.getPaused()==false){
        if(player.y<60 || player.y >= height-50){
            killPlayer();
        }
        
        if(mouseisdown==false){
//            createjs.Tween
//                .get(player,{override:true})
//                .to({y:height},3000);
			tween = TweenLite.to(player,3,{y:height,ease:Power0.easeIn});
        }
        //if mouseisdown is true, animate upwards towards
        //the top of the screen
        else{
//            createjs.Tween
//                .get(player,{override:true})
//                .to({y:0},2000);
			tween = TweenLite.to(player,3,{y:0,ease:Power0.easeIn});
        }
        
        manageObstacles();
        showScore();
		moveBackGround("gamebg",1);
    }
    stage.update();
}

function killPlayer(){
    if(isalive==true){
        player.gotoAndStop("dead");
        isalive = false;
        playerheight = player.getTransformedBounds().height;
        stopheight = playerheight+150;
        //tween.killTweensOf(player);
        //tween = TweenLite.to(player,1,{y:stopheight,rotation:90,ease:Power0.easeIn,onComplete:stopGame,delay:3});
		var restart = window.setTimeout(function(){
			stopGame();
			window.clearTimeOut(restart);
		},5000);
    }
}

function stopGame(){
    console.log("stop game");
    timer.setPaused(true);
    showMenu(true);
}

//this function generates a semi-random number
function randomNumber(limit,rounding){
    rn = Math.random()*limit;
    //if rounding is set to true then
    //return a rounded number
    if(rounding==true){
        return Math.round(rn);
    }
    //if rouding is false
    else{
        return rn;
    }
}
//this function creates an obstacle
function createObstacle(){
    //generate random number 
    num = randomNumber(obslist.length-1,true);
//    size = scale*2;
	size = scale*1.8;
    obs = new createjs.Bitmap(obsfolder+obslist[num]);
    obs.scaleX = size;
    obs.scaleY = size;
    ypos = height-obs.getTransformedBounds().height;
    space = randomNumber(ypos,false);
    obs.y = space;
    obs.name="item";
    return obs;
}

function manageObstacles(){
    //this function manages the creation
    //the movement and the removal of obstacles from the game environment
	//if the number of ticks is perfectly divisible by the value of interval
	//eg 7%3=1 where 6%3=0 google:modulo
    if(timer.getTicks()%interval==0){
        obstacle = createObstacle();
        obstacle.x = width+1;
		obstacles.push(obstacle);
        stage.addChildAt(obstacle,0);
    }
    else if(obstacles.length>0){
        //check if there are any obstacles
        //check all obstacles via "obstacles" array
        for(i=0;i<obstacles.length;i++){
            obs = obstacles[i];
            pos = obs.x;
            obswidth = obs.getTransformedBounds().width;
            
            //if obstacle is further than left edge of screen
            if(pos>(width-width*2) && isalive == true){
                //move it to the left
                obstacles[i].x = pos-obspeed;
                if(obstacles[i].x <= player.x){
                    if(obs.name == "item" && isalive == true){
						addScore();
                        //score++;
                        obs.name = "remove";
                    }
                }
            }

            else if(pos<(obswidth*-1)){
                //if obstacle is not visible 
                //remove it from stage
                //remove from list of obstacles on stage
                stage.removeChild(obstacles.shift());
            }
            if(checkCollision(player,obs)!=false){
                killPlayer();
            }
          
        }
        
    }
    
}
var pos;
function moveBackGround(elm,amount){
	pos=pos-amount;
	document.getElementById(elm).style.backgroundPositionX = pos+"px";
}
function showMenu(status){
    if(status==true){
        document.getElementById("restartbtn")
        .addEventListener("mousedown",function(){
            resetGame();
        });
//		document.getElementById("restartbtn").addEventListener("touchend",function(){
//			resetGame();
//		});
        document.getElementById("restart").style.visibility = "visible";
    }
    else{
        document.getElementById("restart").style.visibility = "hidden";
    }
    
}
function checkCollision(obj1,obj2){
    // Pixel Perfect Collision
    var collision = ndgmr.checkPixelCollision(obj1,obj2,0);
        //console.log(collision);
        return collision;
    // true or false
    // alphaThreshold default is 0, set to higher value to ignore collisions with semi transparent pixels
}

function showScore(){
    //show a message on the top of screen
	document.getElementById("score").innerHTML=score;
	document.getElementById("highscore").innerHTML="highscore="+highscore;
}

////saving high score
function addScore(){
	score++;
	if(score>=highscore){
		highscore = score;
	}
	showScore();
}
function saveScore(){
	try{
		window.localStorage.setItem("highest",highscore);
	}
	catch(err){

	}
}
///restore high score
function readScore(){
	try{
		if(localStorage.length>0){
			storedscore = window.localStorage.getItem("highest");
			highscore = storedscore;
		}
	}
	catch(err){

	}
}
//mobile stuff
document.addEventListener("deviceready",function(){
	document.addEventListener("back",onBack);
	function onBack(){
		saveScore();
		navigator.app.exitApp();
	}
});


