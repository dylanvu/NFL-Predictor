$(document).ready(function() {
	buildSeasonsFilter();
	buildWeeksFilter();
	buildGamesFilter();
	buildChartFromData();
	renderFromQueryString();
	window.addEventListener('popstate', function(e) {
		renderFromQueryString();
	});
});

function setSelectedSeasonText(season) {
	$('.seasonsDropdown .selection').text(season);
}

function setSelectedWeekText(week) {
	$('.weeksDropdown .selection').text(week);
}

function setSelectedGameText(title) {
	$('.gamesDropdown .selection').text(title);
}

function gameTitle(gameObj) {
	return (gameObj.visitor + ' @ ' + gameObj.home); 
}

function chartTitle(gameObj) {
	return (gameObj.season + ' - Week ' + gameObj.week + ': ' + gameObj.visitor + ': ' + gameObj.ptsVisitor 
			+ ' @ ' + gameObj.home + ': ' + gameObj.ptsHome);
}

function renderFromQueryString() {
	var queryString = window.location.search;
	var queryParam = queryString.substr(5, 4);
	var url = '/api/plays/' + queryParam;
	$.ajax({ url: '/api/games', success: function(result) {
		for (var i = 0; i < result.length; ++i) {
			if (queryParam == result[i].gameId) {
				setSelectedSeasonText(result[i].season);
				setSelectedWeekText(result[i].week);
				setSelectedGameText(gameTitle(result[i]));
				buildGamesFilter(result[i].season, result[i].week);
				renderGame(result[i]);
				console.log('Requested gameId: ' + result[i].gameId);
				break;
			}
		}
	}});
}	

function renderGame(game) {
	var url = '/api/plays/' + game.gameId;
	$.ajax({ url: url, success: function(result) {
		var lastPlay = result[result.length-1].time;
		buildChartFromData(result, chartTitle(game), lastPlay, game.home);
		displayTopTen(game.gameId);
	}});
	$('.homeLogo, .awayLogo').removeClass(function(idx, css) {
		var match = css.match(/team\-.*/);
		return match ? match.join(' ') : null;
	});
	$('.homeLogo').addClass('team-' + game.home.toLowerCase());
	$('.awayLogo').addClass('team-' + game.visitor.toLowerCase());
}

function buildSeasonsFilter() {
	$('.seasonsDropdown .dropdown-content').empty();
	var results = [2012, 2013, 2014, 2015];
	_.each(results, function(season) {
		var $listItem = $('<a class="dropdownLink"></a>');
		var $div = $('<div><span>' + season + '</span></div>');
		$listItem.append($div);
		$listItem.click(function (e) {
			$('.seasonsDropdown .dropdownLink div').removeClass('activeFilterItem');
            $(e.currentTarget).children('div').addClass('activeFilterItem');
			buildChartFromData();
			setSelectedSeasonText(season);
			setSelectedWeekText(' -- ');
			setSelectedGameText(' -- ');
			buildWeeksFilter(season);
		});
		$('.seasonsDropdown .dropdown-content').append($listItem);
	});
}

function buildWeeksFilter(season) {
	$('.weeksDropdown .dropdown-content').empty();
	var results = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
	_.each(results, function(week) {
		var $listItem = $('<a class="dropdownLink"></a>');
		var $div = $('<div><span>' + week + '</span></div>');
		$listItem.append($div);
		$listItem.click(function (e) {
			$('.weeksDropdown .dropdownLink div').removeClass('activeFilterItem');
            $(e.currentTarget).children('div').addClass('activeFilterItem');
			buildChartFromData();
			setSelectedWeekText(week);
			setSelectedGameText(' -- ');
			buildGamesFilter(season, week);
		});
		$('.weeksDropdown .dropdown-content').append($listItem);
	});
}

function playDescription(play) {
	var homeWpDiff = Math.floor(play.homeWpDiff * 1000) / 10;
	if (play.homeWpDiff > 0) {
	 	return '<span>' + play.type + ' play at ' + play.time + ' seconds left. <span class="posWp">(+' + homeWpDiff + '%)</span></span>';
	}
	else{
	 	return '<span>' + play.type + ' play with ' + play.time + ' seconds left. <span class="negWp">(' + homeWpDiff + '%)</span></span>';
	}
}

function displayTopTen(gameId){
	$('.topPlays').empty();
	$.ajax({ url: '/api/topTen/' + gameId, success: function(topTen) {
		var $topTenDiv = $('.topPlays');
		_.each(topTen, function(play) {
			var $playElement = $('<div class="homeWP">' + playDescription(play) + '</div>');
			$topTenDiv.append($playElement);
		});
	}});
}

function onGameClick(e, game) {
	$('.gamesDropdown .dropdownLink div').removeClass('activeFilterItem');
    $(e.currentTarget).children('div').addClass('activeFilterItem');
	setSelectedGameText(gameTitle(game));
	history.pushState(null, null, '/?gid=' + game.gameId);
	renderGame(game);
	console.log('Requested gameId: ' + game.gameId);
};

function buildGamesFilter(season, week) {
	$('.gamesDropdown .dropdown-content').empty();
	$.ajax({ url: '/api/games/' + season + '/' + week, success: function(result) {

		_.each(result, function(game) {
			var $listItem = $('<a class="dropdownLink"></a>');
			var $div = $('<div><span>' + gameTitle(game) + '</span></div>');
			$listItem.append($div);
			$listItem.click(function (e) {
				onGameClick(e, game);
			});
			$('.gamesDropdown .dropdown-content').append($listItem);
		});
	}, error: function() {
		console.log('error');
	}});
}





