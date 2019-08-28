// USERNAME: mas682
// FULL NAME:Matt Stropkey

// this makes the browser catch a LOT more runtime errors. leave it here!
"use strict";

// arr.removeItem(obj) finds and removes obj from arr.
Array.prototype.removeItem = function(item) {
	let i = this.indexOf(item);

	if(i > -1) {
		this.splice(i, 1);
		return true;
	}

	return false;
}

// gets a random int in the range [min, max) (lower bound inclusive, upper bound exclusive)
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

// ------------------------------------------------------------------------------------
// Add your code below!
// ------------------------------------------------------------------------------------

// constants for you.
const IMG_W = 120;    // width of the mosquito image
const IMG_H = 88;     // height of the mosquito image
const SCREEN_W = 640; // width of the playfield area
const SCREEN_H = 480; // height of the playfield area
const MAX_MOSQUITOS = 14; // maximum mosquitos in a round

// global variables. add more here as you need them.
let playfield                  // holds the playfield html element
let body                       // holds the body element
let gameMessage                // holds the game message element
let continueRound              //
let mosquitoArr                // holds the mosquito array
let mosquitoCount              // holds current number of mosquitos created for round
let continueSpawn              // boolean for if still mosquitos to spawn
let roundHits                  // holds number of mosquito hits for round
let roundMisses                // holds number of mosquito misses for round
let roundOver                  // boolean for if round is over
let round                      // counter for round number
let totalScore                 // holds total score
let newHighScore               // boolean for if new high score achieved
let roundScore                 // score for the round
let mouseDown                  // used to prevent click from being activated when it shouldn't

window.onload = function() {
	// here is where you put setup code.
	// this way, we can write gameMessage.innerHTML or whatever in your code.
    //mosquitoCount = 0;
    mouseDown = false;          // set that mouseDown listener is not activated
    mosquitoArr = [];           // initialize mosquito array
    round = 0;                  // set round to 0
    totalScore = 0;             // set total score to 0
    newHighScore = false;       // set new high score to false
    displayHighScores();        // display the high scores
	playfield = document.getElementById("playfield");  // set playfield to the playfield element
    body = document.getElementById("mainBody");        // set body to the body element
    playfield.addEventListener("click", startGame, true);     // add an event listener to playfield for a click
};

function startGame(event)
{
    // this is needed as when restarting game, mousedown causes the click event listener to execute
    if(mouseDown)
    {
 		mouseDown = false;                 // set to false so on next click start game executes
		return;
	}
    event.stopPropagation();
    playfield.removeEventListener("click", startGame, true);
    round += 1                                 // increment round count
	continueRound = true;                      // initialize variable
	continueSpawn = true;                      // initialize variable
	roundHits = 0;                             // initialize number of hits for round
	roundMisses = 0;                           // initialize number of misses for round
    mosquitoCount = 0;                         // initialize mosquito count for round
    playfield.addEventListener("mousedown", missSquash, false);
    body.addEventListener("mousedown", missSquash, false);

    gameMessage = document.getElementById("gameMessage");
    gameMessage.style.display = "none";
    while(gameMessage.hasChildNodes())
    {
		gameMessage.removeChild(gameMessage.firstChild);
	}
    startSpawning();
    requestAnimationFrame(gameLoop);
}

// method to handle when the game has ended
function gameOver()
{
	playfield.removeEventListener("mousedown", missSquash, false);
    body.removeEventListener("mousedown", missSquash, false);
    removeAllMosquitos();
	setHighScore();
    displayHighScores();
    let restartMessage = document.createElement("p");
    restartMessage.innerHTML = "Game over...Click the screen to play again";
    if(!newHighScore)
    {
        let loseDisplay = document.createElement("H1");
        loseDisplay.innerHTML = "Sorry, you lose";
        loseDisplay.style.color = "blue";
    	gameMessage.innerHTML = "";
        gameMessage.appendChild(loseDisplay);
        gameMessage.appendChild(restartMessage);
    }
    else
	{
        let displayRecord = document.createElement("H1");
        displayRecord.innerHTML = "You have set a new high score with " + totalScore;
        displayRecord.style.color = "red";
        gameMessage.innerHTML = "";
        gameMessage.appendChild(displayRecord);
        gameMessage.appendChild(restartMessage);
		//gameMessage.innerHTML = "2. Game over...Click the screen to play again";
	}
    playfield.addEventListener("mousedown", restartGame, true);
    gameMessage.style.display = "inline-flex";
    gameMessage.style.flexDirection = "column";
}

function restartGame(event)
{
    event.stopImmediatePropagation();
    mouseDown = true;
    newHighScore = false;
    playfield.removeEventListener("mousedown", restartGame, true);
	mosquitoArr = [];                        // reinitialize the mosquito array
    round = 0                                // set round back to 0
    totalScore = 0
    while(gameMessage.hasChildNodes())
    {
    	gameMessage.removeChild(gameMessage.firstChild);
    }
    gameMessage.innerHTML = "Click to start game!"
    gameMessage.style.display = "flex";
	let roundDisplay = document.getElementById("roundDisplay");
	roundDisplay.innerHTML = "";
	let mosquitoDisplay = document.getElementById("mosquitoDisplay");
	mosquitoDisplay.innerHTML = ""
	let missDisplay = document.getElementById("missesDisplay");    // get misses display element
	missDisplay.innerHTML = "";                           // set misses on screen
	let roundScoreDisplay = document.getElementById("roundScoreDisplay");
	roundScoreDisplay.innerHTML = "";
	let scoreDisplay = document.getElementById("scoreDisplay");    // get score display element
	scoreDisplay.innerHTML = "0";
    playfield.addEventListener("click", startGame, true);
}

// method sets a new high score if game score was a new high
function setHighScore()
{
    let scoresArr = getHighScores();
    if(scoresArr === null)
    {
        scoresArr = []
        scoresArr.push([totalScore])
        localStorage.setItem("highScores", JSON.stringify(scoresArr))
		newHighScore = true;
    }
    else
    {
		scoresArr = JSON.parse(scoresArr);
        if(scoresArr.length < 5)
        {
			scoresArr.push(totalScore);
            scoresArr.sort(function(a,b){return b-a});
			localStorage.setItem("highScores", JSON.stringify(scoresArr));
            newHighScore = true;
		}
        else
        {
			scoresArr.push(totalScore);
            scoresArr.sort(function(a,b){return b-a});
            let removed = scoresArr.pop();
            if(removed < totalScore)
            {
				newHighScore = true
			}
			localStorage.setItem("highScores", JSON.stringify(scoresArr));
		}
	}
}

// method to display the high score list
function displayHighScores()
{
    let scoresArr = getHighScores();
 	if(scoresArr === null)
    {
        return;
    }
    else
    {
		scoresArr = JSON.parse(scoresArr);
		let i = 0;
		let list = document.getElementById("highScores");
		while(list.hasChildNodes())
		{
			list.removeChild(list.firstChild);
		}
        while(i < scoresArr.length)
        {
			let score = document.createElement("li");     // create mosquito element for page
            score.innerHTML = scoresArr[i];
            i += 1;
            list.appendChild(score);
		}
	}
}

// method to get high scores from local storage
function getHighScores()
{
    if(localStorage.length < 1)
    {
    	return null;
    }
    else
	{
		return localStorage.getItem("highScores");
	}
}
// method to handle setup when user makes it to the next round
function nextRound()
{
    playfield.removeEventListener("mousedown", missSquash, false);
    body.removeEventListener("mousedown", missSquash, false);
    // remove mosquitos from screen

    if(mosquitoArr.length > 0){
		removeAllMosquitos();
	}

    let nextRoundDisplay = document.createElement("h3");
    let displayScore = document.createElement("h2");
    displayScore.innerHTML = "Round " + round  + " score: " + roundScore;
    nextRoundDisplay.innerHTML = "Click to start the next round";  // update display message
	nextRoundDisplay.style.color = "00FF00";
	gameMessage.innerHTML = "";  // update display message
    gameMessage.appendChild(displayScore);
    gameMessage.appendChild(nextRoundDisplay);
	gameMessage.style.display = "inline-flex";
	gameMessage.style.flexDirection = "column";
    playfield.addEventListener("click", startGame, true);  // add eventlistener for when to continue
}

// function removes all remaining mosquitos from the screen
function removeAllMosquitos()
{
    // while some mosquitos still exist
    while(mosquitoArr.length > 0)
    {
    	let mosquito = mosquitoArr.pop();       // get the last mosquito in the array
		let element = document.getElementById(mosquito.id);      // get the element corresponding to the mosquito
		element.parentNode.removeChild(element);                // remove the element from the page
	}
}

function gameLoop() {
    roundOver = false;
    let bonusScore = 0;
    // 1. update the position of the mosquitoes
    if(mosquitoArr.length > 0)
    {
        for(let mosquito of mosquitoArr)
        {
            updateMosquito(mosquito);  // method to update mosquito position on page
        }
    }
    // 2. update the score/misses/etc. displays
    let roundDisplay = document.getElementById("roundDisplay");
    roundDisplay.innerHTML = round;
    let mosquitoDisplay = document.getElementById("mosquitoDisplay");
    mosquitoDisplay.innerHTML = 10 - roundHits;
	let missDisplay = document.getElementById("missesDisplay");    // get misses display element
	missDisplay.innerHTML = roundMisses;                           // set misses on screen
	let roundScoreDisplay = document.getElementById("roundScoreDisplay");
	roundScore = 0;
    if(roundMisses < 5)
    {
    	roundScore =  (roundHits * 100);
        bonusScore = (1000 - (roundMisses * 250))
    }
    else
    {
		roundScore = (roundHits * 100);
        bonusScore = 0;
    }
    roundScoreDisplay.innerHTML = roundScore;
	let scoreDisplay = document.getElementById("scoreDisplay");    // get score display element
	scoreDisplay.innerHTML = totalScore + roundScore;                      	   // set  total score

    // 3. check if the user won or lost
    if(roundMisses > 4)               // if more than 4 misses have occurred
    {
        roundOver = true;
        continueSpawn = false;
        totalScore = totalScore + roundScore;
        cancelAnimationFrame(gameLoop);
        gameOver();
    }
    else if(roundHits == 10)      // if you have hit 10 mosquitos for the round
    {
        roundOver = true;
        continueSpawn = false;
        totalScore = totalScore + roundScore + bonusScore;          // update total score
		roundScore += bonusScore;
		roundScoreDisplay.innerHTML = roundScore;
		scoreDisplay.innerHTML = totalScore;
        cancelAnimationFrame(gameLoop);
        nextRound();
        // be careful when this returns...
    }


    // this is sort of the "loop condition."
    // we call requestAnimationFrame again with gameLoop.
    // this isn't recursive; the browser will call us again
    // at some future point in time.
    if(mosquitoCount < 13 && !roundOver)              // set value to 1 less than what you actually want
    {
        continueSpawn = true;            // continue to spawn mosquitos
        continueRound = true;            // set that round not over yet...may be able to combine with roundOver

    }
    else if(!roundOver)          // if round not over and all mosquitos spawned
    {
        continueSpawn = false;
        // need this so that all mosquitos cross the screen even if no more to spawn
        // if mosquitoArr.length === 0, then there are not more mosquitos coming
        if(mosquitoArr.length === 0)
        {
            continueRound = false;                // round is over if no more mosquitos exist
			roundOver = true;
			continueSpawn = false;
			totalScore = totalScore + roundScore;          // update total score
			cancelAnimationFrame(gameLoop);
			nextRound();
        }
        else {           // if mosquitos still exist but no more going to be created, continue until all mosquitos gone
        	continueRound = true;
        }
    }
    if(continueRound && !roundOver) {       // if round not over, continue to update display
        requestAnimationFrame(gameLoop);
    }
}

// method used to update position of a mosquito on the screen
function updateMosquito(mosquito)
{
    // used to see if a mosquito has entered the viewing screen yet
    if(mosquito.onScreen == false)
    {
	    if(enteredScreen(mosquito.x, mosquito.y))
	    {
		    mosquito.onScreen = true;
	    }
    }
    // get the element for the mosquito
    let element = document.getElementById(mosquito.id);
    // if outside of legal area and already on the screen...remove mosquito
	if(checkPosition(mosquito.x, mosquito.y) && mosquito.onScreen)
	{
        // remove element from html
		element.parentNode.removeChild(element);
        if(element.style.visibility !== "hidden")
        {
			roundMisses += 1;
		}
		// remove the mosquito from the array...
        // the if and else are just for testing...remove but leave mosquitoArr.remove...
		if(!mosquitoArr.removeItem(mosquito))
		{
			console.log("Error removing mosquito from array")         // for testing
		}
        return;                 // if removing mosquito, return as do not need to update other values
	}
    // if mosquito not being removed....
	let speed = (round + 1)/2;
    mosquito.x += mosquito.vx * speed;                   // update x value of mosquito
    mosquito.y += mosquito.vy * speed;                     // update y value of mosquito
	element.style.left = mosquito.x + 'px';                // set value in css of x coord
	element.style.top = mosquito.y + 'px';                 // set value in css of y coord
}

// checks to see if mosquito is off the screen
// returns true if off screen completely
function checkPosition(x, y)
{
    if(x < 0 - IMG_W || x > SCREEN_W + IMG_W || y < 0 - IMG_H || y > SCREEN_H + IMG_H )
    {
        return true;
    }
    return false;
}

// checks if a mosquito has entered the visible screen yet
function enteredScreen(x,y)
{
    if(x > 0 && x < SCREEN_W)
    {
        if(y > 0 && y < SCREEN_H )
        {
            return true;
        }
    }
    return false;
}

function startSpawning() {
    // 1000 ms (1 second) from now, spawnMosquito() will be called.
    window.setTimeout(spawnMosquito, 1000);
}

// mosquito object
function Mosquito(x, y, vx, vy, id, onScreen, squashed)
{
    this.id = id;         // id is a string for a mosquitos name that corresponds to it's id for it's img tag
    this.x = x;           // holds the x coordinate of the mosquito
    this.y = y;           // holds the y coordinate of the mosquito
    this.vx = vx;         // holds the velocity of x
    this.vy = vy;         // holds the velocy of y
    this.onScreen = onScreen;    // boolean for if mosquito has been on the visible screen yet
}

// fuction to handle when user hits a mosquito
function squashMosquito(event) {
    // if left clicked on mosquito
	if(event.button === 0)
    {
        let mosquitoName = event.target.id;          // get id of element that caused event
        let mosquito = document.getElementById(mosquitoName);       // get the mosquito on screen
        mosquito.style.visibility="hidden";                         // set mosquito to hidden
        roundHits += 1;                                            // increment hits for the round
    }
    event.stopPropagation();
}

// function to handle when user misses hitting a mosquito
function missSquash(event) {
	// if left click on anything but mosquito in screen
    if(event.button === 0)
    {
        roundMisses += 1;                              // increment number of misses for round
    }
    event.stopPropagation();
}

function spawnMosquito() {
    // if the round is not over yet, spawn another mosquito
    if(!roundOver)
    {
    	// this is a "destructuring assignment."
    	// it makes 4 local variables by extracting elements of the array that was returned.
    	let [x, y, vx, vy] = pickPointAndVector();
    	// create a new mosquito with passing values from array
    	mosquitoCount += 1;                        // increment number of mosquitos for round
    	let newMosq = new Mosquito(x, y, vx, vy, "mosquito" + mosquitoCount, false); // create mosquito object
    	mosquitoArr.push(newMosq);                    // add mosquito to the mosquito array
		let mosquito = document.createElement("img");     // create mosquito element for page
    	mosquito.src = "mosquito.png";                    // set source to mosquito image
    	mosquito.addEventListener("mousedown", squashMosquito);    // set event listener on element for when clicked upon
		mosquito.id = "mosquito" + mosquitoCount;  // set the elements id to retrieve later
		mosquito.style.width = IMG_W;              // set image width
		mosquito.style.height = IMG_H;             // set image height
		mosquito.style.position = "absolute";      // set image position
		mosquito.style.left = x + 'px';            // set image position on screen
		mosquito.style.top = y + 'px';
		// make element child of playfield
		playfield.appendChild(mosquito);           // add the element to be the child of playfield
    }
    // if there are still mosquitos that need spawned
    if(continueSpawn) {
        // spawn another one a second from now
        window.setTimeout(spawnMosquito, 1000/((round+1)/2));
    }
}

// given a side (0, 1, 2, 3 = T, R, B, L), returns a 2-item array containing the x and y
// coordinates of a point off the edge of the screen on that side.
function randomPointOnSide(side) {
	switch(side) {
		/* top    */ case 0: return [getRandomInt(0, SCREEN_W - IMG_W), -IMG_H];
		/* right  */ case 1: return [SCREEN_W, getRandomInt(0, SCREEN_H - IMG_H)];
		/* bottom */ case 2: return [getRandomInt(0, SCREEN_W - IMG_W), SCREEN_H];
		/* left   */ case 3: return [-IMG_W, getRandomInt(0, SCREEN_H - IMG_H)];
	}
}

// returns a 4-item array containing the x, y, x direction, and y direction of a mosquito.
// use it like:
// let [x, y, vx, vy] = pickPointAndVector()
// then you can multiply vx and vy by some number to change the speed.
function pickPointAndVector() {
	let side = getRandomInt(0, 4);                    // pick a side...
	let [x, y] = randomPointOnSide(side);             // pick where to place it...
	let [tx, ty] = randomPointOnSide((side + 2) % 4); // pick a point on the opposite side...
	let [dx, dy] = [tx - x, ty - y];                  // find the vector to that other point...
	let mag = Math.hypot(dx, dy);                     // and normalize it.
	let [vx, vy] = [(dx / mag), (dy / mag)];
	return [x, y, vx, vy];
}
