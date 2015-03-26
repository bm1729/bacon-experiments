$(function() {
    
    var startClickStream = $('#start').asEventStream('click');
    
    var levelBus = new Bacon.Bus();
    var levelProperty = levelBus.toProperty(1);
    
    levelProperty.onValue(function(level) {
            $("#level").text(level);
            $('#gameBoard').empty();
        });
    
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
    
    var startStream = coloursProperty.sampledBy(startClickStream);
    startStream.onValue(function (colours) {
            $.each(colours, function(index, value) {
                $('#gameBoard').append('<div class="col-xs-3 ' + colours[index] + '" id="' + index + '"></div>')
            });
        });
    startStream.delay(2000)
        .onValue(function() {
            $('#gameBoard div').css('background-color', 'grey');
        });
    
    var gameClickStream =  $('#gameBoard').asEventStream('click')
        .filter(function(event) { return event.target.id !== 'gameBoard'; })
        .filter(function(event) {
            return $(event.target).css('background-color') === 'rgb(128, 128, 128)';
        });
    
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
    

    // gameStream.onValue(function(eventObject) {
    //     var tileId = eventObject.gameClick.target.id;
    //     var tileColor = eventObject.colours[tileId];
    //     if (tileColor === 'red') {
    //         $('#' + tileId).css('background-color', 'red');
    //         var redsExposed = $('#gameBoard div').filter(function() {
    //             return $(this).css('background-color') === 'rgb(255, 0, 0)';
    //         }).length;
    //         if (redsExposed === eventObject.level) {
    //             alert("You win!");
    //             levelBus.push(eventObject.level + 1);
    //         }
    //     } else {
    //         alert("You lose!");
    //         levelBus.push(1);
    //     }
    // });
    
    // var showingTiles = startStream.toProperty(true);
});