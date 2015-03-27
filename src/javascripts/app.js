$(function() {
    
    var startClickStream = $('#start').asEventStream('click');
    
    // TODO How can I get rid of the level bus?
    var levelBus = new Bacon.Bus();
    var levelProperty = levelBus.toProperty(1);
    
    // When the level changes - update the level text and empty the game board
    levelProperty.onValue(function(level) {
            $("#level").text(level);
            $('#gameBoard').empty();
        });
    
    // When the level changes - generate the new colours
    var coloursProperty = levelProperty.map(function(level) {
            var coloursLength = level * 2;
            var newColours = _.times(coloursLength, _.constant("blue"));
            var redsPlaced = 0;
            while (redsPlaced < level) {
                var candidateRedIndex = _.random(coloursLength - 1, false);
                if (newColours[candidateRedIndex] === "blue") {
                    newColours[candidateRedIndex] = "red";
                    ++redsPlaced;
                }
            }
            return newColours;
        });
    
    // Whether or not we are showing the true tiles' colour
    var showingTilesProperty = startClickStream.flatMapLatest(function(colours) {
            return Bacon.once(true).merge(Bacon.later(2000, false));
        })
        .toProperty(false);
        
    // Set the tile colours as appropriate
    Bacon.combineTemplate(
        {
            colours: coloursProperty,
            showingTiles: showingTilesProperty
        })
        .onValue(function(value) {
            if (value.showingTiles) {
                $.each(value.colours, function(index, value) {
                    $('#gameBoard').append('<div class="col-xs-3" id="' + index + '"></div>');
                });
                $('#gameBoard div').each(function(index, element) {
                    $(element).css('background-color', value.colours[ element.id]);
                });
            } else {
                $('#gameBoard div').css('background-color', 'grey');
            }
        });
    
    // When someone clicks on the game board and the tiles have been hidden
    // TODO Don't store state in the DOM
    var gameClickStream =  $('#gameBoard').asEventStream('click')
        .filter(function(event) { return event.target.id !== 'gameBoard'; })
        .filter(showingTilesProperty.not());
    
    // Show the red tiles as they are uncovered - go to next level when all red tiles are found or back to level one if they make a mistake
    // TODO Don't store state in the DOM
    var gameTemplate = Bacon.combineTemplate({
            colours: coloursProperty,
            level: levelProperty
        });
    gameTemplate.sampledBy(gameClickStream, function(propertyValue, eventValue) {
            return {colours: propertyValue.colours,
                level: propertyValue.level,
                id: eventValue.target.id
            };
        })
        .onValue(function(value) {
            var tileId = value.id;
            var tileColor = value.colours[tileId];
            if (tileColor === 'red') {
                $('#' + tileId).css('background-color', 'red');
                var redsExposed = $('#gameBoard div').filter(function() {
                    return $(this).css('background-color') === 'rgb(255, 0, 0)';
                }).length;
                if (redsExposed === value.level) {
                    console.log("You win!");
                    levelBus.push(value.level + 1);
                }
            } else {
                console.log("You lose!");
                levelBus.push(1);
            }
        });
});