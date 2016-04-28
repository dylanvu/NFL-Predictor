var fs = require('fs');
var GAME_DATA = JSON.parse(fs.readFileSync('../data/games.json'));
var RESULT_DATA = JSON.parse(fs.readFileSync('../data/results.json'));
var _ = require('underscore');
var url = require('url');

// function filterGames(minGameId) {
// 	var i = 0;
// 	while (i < minGameId) {
// 		GAME_DATA.shift();
// 		++i;
// 	}
// }
// filterGames(2980);

// grabs basic information from all games
function allGames() {
	var result = [ ];
	for (var i = 3189; i < GAME_DATA.length; ++i) {
		var obj = {
			gameId: GAME_DATA[i].gid,
			season: GAME_DATA[i].seas,
			home: GAME_DATA[i].h,
			visitor: GAME_DATA[i].v,
			week: GAME_DATA[i].wk
		};
		result.push(obj);
	}
	return result;
};
var ALL_GAMES = allGames();


//change JSON to have overtime.
function fixSecondsForOvertime(plays) {
	var	result = [ ];

	// First solution: assumes that any play with game time greater than previous game is overtime
	// Penalties that give time back are assumed to be overtime, making this solution not work.
	// ----------------------------
	// var hitOT = false;
	// for (var i = 0; i < plays.length; ++i) {
	// 	var isNotFirstPlay = (i !== 0);
	// 	var isOutOfOrder = (isNotFirstPlay && (plays[i - 1].time < plays[i].time));
	// 	if (isOutOfOrder)
	// 		hitOT = true;
	// 	if (hitOT) {
	// ---------------------------

	for (var i = 0; i < plays.length; ++i) {
		if(plays[i].InOT){
			var obj = {
				gameId: plays[i].gameId,
				playId: plays[i].playId,
				time:  (plays[i].time) - 900,
				type: plays[i].type,
				homeWp: plays[i].homeWp,
				visitorWp: plays[i].visitorWp,
				InOT: plays[i].InOT
			}
		}
		else {
			var obj = {
				gameId: plays[i].gameId,
				playId: plays[i].playId,
				time:  plays[i].time,
				type: plays[i].type,
				homeWp: plays[i].homeWp,
				visitorWp: plays[i].visitorWp,
				InOT: plays[i].InOT
			}
		}
		result.push(obj);
	}
	return result;
}

function getPlaysForGame(gameId){
	var plays = [ ];
	for (var i = 0; i < RESULT_DATA.length; ++i) {
		if (gameId == RESULT_DATA[i].gid) {
			var obj = {
				gameId: RESULT_DATA[i].gid,
				playId: RESULT_DATA[i].pid,
				time: RESULT_DATA[i].Seconds,
				type: RESULT_DATA[i].type,
				homeWp: (1 - RESULT_DATA[i].VisitorWP),
				visitorWp: RESULT_DATA[i].VisitorWP,
				InOT: RESULT_DATA[i].InOT
			};
			plays.push(obj);
		}
	}
	plays = fixSecondsForOvertime(plays);
	return plays;
}

module.exports = function(app) {

	// Returns list of all games.
	app.get('/api/games', function(req, res) {
		console.log("Client requested list of all games...");
		res.writeHead(200,{'Content-Type': 'application/json'});
	    res.end(JSON.stringify(ALL_GAMES));
	});

	// Return list of games from a season.
	app.get('/api/games/:season', function(req, res) {
		var season = req.params.season;
		console.log("Client requested list of all games from season: " + season + "...");
		var result = [ ];
		for (var i = 0; i < ALL_GAMES.length; ++i) {
		 	if(ALL_GAMES[i].season == season){
		 		result.push(ALL_GAMES[i]);
		 	}
	 	}
		res.writeHead(200,{'Content-Type': 'application/json'});
    	res.end(JSON.stringify(result));
    });

	// Return list of all games from a week of a season.
	app.get('/api/games/:season/:week', function(req, res) {
		var season = req.params.season;
		var week = req.params.week;
		console.log("Client requested list of all games from season: " + season + ": Week " + week + "...");
		var result = [ ];
		for (var i = 0; i < ALL_GAMES.length; ++i) {
		 	if(ALL_GAMES[i].season == season && ALL_GAMES[i].week == week){
		 		result.push(ALL_GAMES[i]);
		 	}
	 	}
		res.writeHead(200,{'Content-Type': 'application/json'});
        res.end(JSON.stringify(result));
    });

/**/

	app.get('/api/gamesByTeam/:teamAbbreviation', function(req, res) {
		var team = req.params.teamAbbreviation;
		console.log("Client requested list of all games from the selected team: " + team + "...");
		var result = [ ];
		for (var i = 0; i < ALL_GAMES.length; ++i) {
		 	if(ALL_GAMES[i].visitor == team || ALL_GAMES[i].home == team){
		 		result.push(ALL_GAMES[i]);
		 	}
	 	}
		res.writeHead(200,{'Content-Type': 'application/json'});
        res.end(JSON.stringify(result));
    });

	//
	app.get('/api/plays/:gameId', function(req, res) {
		var gameId = req.params.gameId;
		console.log("Client requested plays from game " + gameId + "...");
		var plays = getPlaysForGame(gameId);
		res.writeHead(200,{'Content-Type': 'application/json'});
        res.end(JSON.stringify(plays));
    });

    function wpDiffComparison(a, b) {
    	return Math.abs(b.homeWpDiff)- Math.abs(a.homeWpDiff);
    }
    function findBigestPlays(plays, n) {
    	var sortedPlays = plays.sort(wpDiffComparison);
		return sortedPlays.slice(0, n);
    }
    // returns top 10 plays from a game
    app.get('/api/topTen/:gameId', function(req, res) {
    	var gameId = req.params.gameId;
    	console.log("Client requested top ten plays for game " + gameId + "...");
    	var newPlays = [ ];
    	var plays = getPlaysForGame(gameId);
    	for (var i = 0; i < plays.length; ++i) {
    		var notLastPlay = (i < (plays.length - 1));
			if (notLastPlay) {
				var curentWP = (1 - plays[i].visitorWp);
				var futureWP = (1 - plays[i + 1].visitorWp);
				var obj = {
					gameId: plays[i].gameId,
					playId: plays[i].playId,
					time: plays[i].time,
					type: plays[i].type,
					homeWpDiff: futureWP - curentWP
				};
				newPlays.push(obj);
			}
		}
		var topTen = findBigestPlays(newPlays, 10);

		res.writeHead(200,{'Content-Type': 'application/json'});
        res.end(JSON.stringify(topTen));
    });

    //returns top 10 plays from all games combined 
    app.get('/api/topTen', function(req, res) {
    	console.log("Client is requested Top Ten plays from all all games combined...")
    	var results = [ ];
    	for (var i = 0; i < RESULT_DATA.length - 1; i++) {
    		if (RESULT_DATA[i].gid !== RESULT_DATA[i + 1].gid) {
    			continue;
    		}
    		var curentWP = (1 - RESULT_DATA[i].VisitorWP);
			var futureWP = (1 - RESULT_DATA[i + 1].VisitorWP);
			var obj = {
    			gameId: RESULT_DATA[i].gid,
				playId: RESULT_DATA[i].pid,
				time: RESULT_DATA[i].Seconds,
				type: RESULT_DATA[i].type,
				homeWpDiff: futureWP - curentWP
    		};
	    	results.push(obj);	
    	}
    	var allTopTen = findBigestPlays(results, 100)
    	res.writeHead(200,{'Content-Type': 'application/json'});
        res.end(JSON.stringify(allTopTen));
    });

// Grabs games by quarter where quarter is time left in seconds (e.g 3600 -> 2700 seconds = 1st quarter)
    app.get('/api/plays/:gameId/:quarter', function(req, res) {
		var gameId = req.params.gameId;
		var quarter =req.params.quarter;
		var plays = [ ];
		var quarterStart = undefined;
		var quarterEnd = (3600 - (quarter * 900));
		if (quarter == 1) {
			quarterStart = 3600;
		}
		else{
			quarterStart = (3600 - (900 * (quarter-1)));
		}
		for (var i = 0; i < RESULT_DATA.length; ++i) {
			var play = RESULT_DATA[i];
			if (gameId == play.gid && play.Seconds <= quarterStart && play.Seconds > quarterEnd) {
				var obj = {
					gameId: play.gid,
					playId: play.pid,
					time: play.Seconds,
					type: play.type,
					homeWp: (1 - play.VisitorWP),
					visitorWp: play.VisitorWP
				};
				plays.push(obj);
			}
		}
		res.writeHead(200,{'Content-Type': 'application/json'});
        res.end(JSON.stringify(plays));
    });

};
