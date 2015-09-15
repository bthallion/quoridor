/**
 * Created by ben on 9/7/15.
 */
//When client makes first change to root node, send current board to server
//and use it as the root node for subsequent MCTS iterations
//Repeat this at the end of each turn
//At the beginning of AI turn
//1. After 10 seconds of thinking time, check server for value of all child(1) nodes and do most valuable move

//
var ai = (function () {
    'use strict';
    var socket = io('http://localhost:9000');

    function getMove(brdStr) {

    }

    function getData() {
        socket.emit('getData', board.getBoardString(), function (data) {
            var key;
            for (key in data) {
                if (data.hasOwnProperty(key)) {
                    my[key] = data[key];
                }
            }
        });
    }


    return {
        getMove: getMove
    };

})();
/**
* Created by ben on 9/2/15.
*/
//functions to keep track of last move, and undo
//create abstract board for simulations?
//how to share board functions with server?
var board;

function boardConstructor(data) {
    var my = {};
    init();

    function init() {
        var key;
        my.placedWalls = [];
        my.validMoves = [];
        if (data) {
            for (key in data) {
                if (data.hasOwnProperty(key)) {
                    my[key] = data[key];
                }
            }
        }
    }

    //Returned values:
    //0:Top 1:Right 2:Bottom 3:Left
    function getAdjacentBoardEdges(pos) {
        var i,
            edges = [];

        //Check if moves are on board
        for (i = 0; i < 4; i++) {
            if (getMovePosition(pos, i) === -1) {
                edges.push(i);
            }
        }

        return edges;
    }

    function moveIsOnBoard(pos1, pos2) {
        var direction = getRelativeDirection(pos1, pos2);

        switch (direction) {
            //North is valid if not on top edge
            case 0:
                return (Math.floor(pos1 / gameSpecs.BOARD_DIMENSION) > 0);
            //East is valid if not on right edge
            case 1:
                return ((pos1 % gameSpecs.BOARD_DIMENSION) < 8);
            //South
            case 2:
                return (Math.floor(pos1 / gameSpecs.BOARD_DIMENSION) < 8);
            //West
            case 3:
                return ((pos1 % gameSpecs.BOARD_DIMENSION) > 0);
            default:
                return false;
        }
    }

    function wallIntersects(wallIndex) {
        var i,
            conflictWalls;

        if ((wallIndex % 2) === 0) {
            conflictWalls = [
                wallIndex,
                wallIndex + 1,
                wallIndex + 2,
                wallIndex - 2
            ];
            if (wallIndex % ((gameSpecs.BOARD_DIMENSION - 1) * 2) === (((gameSpecs.BOARD_DIMENSION - 1) * 2) - 2)) {
                conflictWalls.splice(2,1);
            }
            if (wallIndex % ((gameSpecs.BOARD_DIMENSION - 1) * 2) === 0) {
                conflictWalls.splice(3,1);
            }
        }
        else {
            conflictWalls = [
                wallIndex,
                wallIndex - 1,
                wallIndex - (gameSpecs.BOARD_DIMENSION - 1) * 2,
                wallIndex + (gameSpecs.BOARD_DIMENSION - 1) * 2
            ];
        }

        for (i = 0; i < conflictWalls.length; i++) {
            if (my.placedWalls.indexOf(conflictWalls[i]) > -1) {
                return true;
            }
        }
        return false;
    }

    function wallIsValid(wallIndex) {
        return wallIndex > -1 &&
            !wallIntersects(wallIndex) &&
            tokensHavePaths(wallIndex);
    }

    function moveIsValid(movePosition) {
        if (my.validMoves.length > 0) {
            return (my.validMoves.indexOf(movePosition) !== -1);
        }
        else {
            return false;
        }
    }

    function tokensHavePaths(wallIndex) {
        var i, tokens;

        tokens = players.getTokens();

        for (i = 0; i < tokens.length; i++) {
            if (!tokenHasPathToEnd(tokens[i], wallIndex)) {
                return false;
            }
        }

        return true;
    }

    function tokenHasPathToEnd(token, includeWall) {
        var i, node, moves,
            winRange          = token.getWinRange(),
            positionQueue     = [token.getPosition()],
            examinedPositions = new Array(Math.pow(gameSpecs.BOARD_DIMENSION, 2) - 1)
                .join('0').split('').map(parseFloat);

        if (includeWall > -1) {
            my.placedWalls.push(includeWall);
        }

        do {
            node  = positionQueue.shift();
            if (node >= winRange[0] && node <= winRange[1]) {
                my.placedWalls.splice(my.placedWalls.length - 1, 1);
                return true;
            }
            moves = findValidMoves(node, false, true);
            for (i = 0; i < moves.length; i++) {
                if (examinedPositions[moves[i]] !== 1) {
                    examinedPositions[moves[i]] = 1;
                    positionQueue = positionQueue.concat(findValidMoves(moves[i], false, true));
                }
            }
        } while (positionQueue.length > 0);
        my.placedWalls.splice(my.placedWalls.length - 1, 1);
        return false;
    }

    function getTokenAtPosition(pos) {
        var tokens, i;

        tokens = players.getTokens();

        for (i = 0; i < tokens.length; i++) {
            if (pos === tokens[i].getPosition()) {
                return tokens[i];
            }
        }
        return undefined;
    }

    function findValidMoves(posIndex, ignoreJump, discardMoves, ignoreIdentity) {
        var moves = getMoveSet(posIndex),
            walls = getAdjacentWalls(posIndex, false),
            i, j, k, jumpSpace,
            opponentDirection, opponentMoves, wallOrientation;

        for (i = 0; i < walls.length; i++) {
            //If an obstructive wall has been placed
            if (my.placedWalls.indexOf(walls[i]) > -1) {
                //Get blocking direction of wall
                wallOrientation = getRelativeWallOrientation(posIndex, walls[i]);
                //And remove that direction from moveset
                moves.splice(moves.indexOf(getMovePosition(posIndex, wallOrientation)), 1);
            }
        }

        //Check for adjacent player, add valid jump moves
        if (ignoreJump === false) {
            for (i = 0; i < moves.length; i++) {
                //If there is an adjacent player
                if (typeof getTokenAtPosition(moves[i]) !== 'undefined' && moves[i] !== posIndex) {
                    //Get opponent direction and walls around its position
                    opponentDirection = getRelativeDirection(posIndex, moves[i]);
                    walls             = getAdjacentWalls(moves[i], false);
                    for (j = 0; j < walls.length; j++) {
                        wallOrientation = getRelativeWallOrientation(moves[i], walls[j]);
                        //If wall obstructs jump, add opponent's moveset to current player's
                        if (opponentDirection === wallOrientation) {
                            opponentMoves = findValidMoves(moves[i], true, true);
                        }
                    }
                    //If jump is clear, add jump to moveset
                    //remove opponent's position
                    //If jump is off the board (which is an unclear case in the rules!) add opponents moves
                    if (typeof opponentMoves === 'undefined') {
                        jumpSpace = getMovePosition(moves[i], opponentDirection);
                        if (jumpSpace > -1) {
                            moves.splice(i, 1, jumpSpace);
                        }
                        else {
                            opponentMoves = findValidMoves(moves[i], true, true);
                        }
                    }
                    if (typeof opponentMoves !== 'undefined') {
                        for (k = 0; k < opponentMoves.length; k++) {
                            if (moves.indexOf(opponentMoves[k]) === -1) {
                                moves.push(opponentMoves[k]);
                            }
                        }
                        moves.splice(i, 1);
                    }
                }
            }
        }
        if (ignoreIdentity) {
            moves.splice(moves.indexOf(posIndex), 1);
        }
        if (discardMoves === true) {
            return moves;
        }
        else {
            setValidMoves(moves);
        }
    }

    function setValidMoves(moves) {
        if (moves.constructor === Array) {
            my.validMoves = moves.slice();
        }
        else {
            my.validMoves = [];
        }
    }

    function getAdjacentWalls(posIndex, includePotentialWalls) {
        var i,
        //0,1:Southeast 2,3:Southwest 4,5:Northwest 6,7:Northeast Wall Vertices
            unboundedWalls = getUnboundedAdjacentWalls(posIndex),
            walls          = unboundedWalls.slice(),
            edges          = getAdjacentBoardEdges(posIndex),
            invalidWalls   = [];

        function removeWalls(wallIndexes) {
            var spliceIndex, k;

            for (k = 0; k < wallIndexes.length; k++) {
                spliceIndex = walls.indexOf(unboundedWalls[wallIndexes[k]]);
                if (spliceIndex !== -1) {
                    walls.splice(spliceIndex, 2);
                }
            }
        }

        //Remove invalid edge walls
        for (i = 0; i < edges.length; i++) {
            switch (edges[i]) {
                //Top edge
                case 0:
                    removeWalls([4,6]);
                    break;
                //Right edge
                case 1:
                    removeWalls([6,0]);
                    break;
                //Bottom edge
                case 2:
                    removeWalls([0,2]);
                    break;
                //Left edge
                case 3:
                    removeWalls([2,4]);
                    break;
            }
        }

        if (includePotentialWalls === true) {
            //Regardless of currently placed walls, solely based on position
            return walls;
        }
        else {
            for (i = 0; i < walls.length; i++) {
                if (my.placedWalls.indexOf(walls[i]) === -1) {
                    invalidWalls.push(walls[i]);
                }
            }
            for (i = 0; i < invalidWalls.length; i++) {
                walls.splice(walls.indexOf(invalidWalls[i]), 1);
            }
            return walls;
        }
    }

    //Direction indexes
    //0:North 1:East 2:South 3:West
    function getMovePosition(pos, dir) {
        var moves = [
            (pos - gameSpecs.BOARD_DIMENSION),
            (pos + 1),
            (pos + gameSpecs.BOARD_DIMENSION),
            (pos - 1)
        ];
        if (moveIsOnBoard(pos, moves[dir])) {
            return moves[dir];
        }
        else {
            return -1;
        }
    }

    //Returned values:
    //0 is North
    //1 is East
    //2 is South
    //3 is West
    //4 is Identical
    //-1 is non-cardinal or non-adjacent
    function getRelativeDirection(pos1, pos2) {
        var i,
            moves = getUnboundedMoveSet(pos1);
        for (i = 0; i < moves.length; i++) {
            if (moves[i] === pos2) {
                return i;
            }
        }
        return -1;
    }

    //Returned values:
    //0 is Horizontal Top
    //1 is Vertical Right
    //2 is Horizontal Bottom
    //3 is Vertical Left
    //-1 is Non-adjacent
    function getRelativeWallOrientation(posIndex, wallIndex) {
        var unboundedWalls = getUnboundedAdjacentWalls(posIndex),
            i;
        for (i = 0; i < unboundedWalls.length; i++) {
            if (unboundedWalls[i] === wallIndex) {
                switch (i) {
                    case 4:
                    case 6:
                        return 0;
                    case 1:
                    case 7:
                        return 1;
                    case 0:
                    case 2:
                        return 2;
                    case 3:
                    case 5:
                        return 3;
                }
            }
        }
        return -1;
    }

    //Returns moveset with respect to board position, ignores walls
    function getMoveSet(pos) {
        var i,
            unboundedMoveset = getUnboundedMoveSet(pos),
            moveset          = unboundedMoveset.slice(),
            edges            = getAdjacentBoardEdges(pos);

        for (i = 0; i < edges.length; i++) {
            moveset.splice(moveset.indexOf(unboundedMoveset[edges[i]]), 1);
        }

        return moveset;
    }

    //0:North 1:East 2:South 3:West 4:Identity
    function getUnboundedMoveSet(pos) {
        return [
            (pos - gameSpecs.BOARD_DIMENSION),
            (pos + 1),
            (pos + gameSpecs.BOARD_DIMENSION),
            (pos - 1),
            pos
        ];
    }

    //Returns surrounding wall indexes regardless of position on board
    function getUnboundedAdjacentWalls(pos) {
        var wall,
            walls = [];

        //Bottom right wall vertex
        wall = (pos % gameSpecs.BOARD_DIMENSION) * 2 +
            Math.floor(pos / gameSpecs.BOARD_DIMENSION) * (gameSpecs.BOARD_DIMENSION - 1) * 2;
        walls.push(wall, (wall + 1));

        //Bottom left
        wall -= 2;
        walls.push(wall, (wall + 1));

        //Top left
        wall -= (gameSpecs.BOARD_DIMENSION - 1) * 2;
        walls.push(wall, (wall + 1));

        //Top right
        wall += 2;
        walls.push(wall, (wall + 1));

        return walls;
    }

    return {
        placeWall: function placeWall(wall) {
            if (wall > -1) {
                my.placedWalls.push(wall);
            }
        },
        getBoardString: function getBoardString() {
            return JSON.stringify({
                dimension: gameSpecs.BOARD_DIMENSION,
                totalWalls: 128,
                placedWalls: my.placedWalls,
                validMoves: findValidMoves(players.getCurrentPlayer().getToken().getPosition(), false, true, true),
                currentPlayer: players.getCurrentPlayer().getName(),
                player1: {
                    position: players.getToken('player1').getPosition(),
                    winRange: players.getToken('player1').getWinRange(),
                    wallCount: players.getPlayer('player1').getWallCount()
                },
                player2: {
                    position: players.getToken('player2').getPosition(),
                    winRange: players.getToken('player2').getWinRange(),
                    wallCount: players.getPlayer('player2').getWallCount()
                }
            });
        },
        getValidMoves: function getValidMoves() {
            return my.validMoves;
        },
        setValidMoves: setValidMoves,
        findValidMoves: findValidMoves,
        wallIsValid: wallIsValid,
        moveIsValid: moveIsValid,
        getPlacedWalls: function getPlacedWalls() {
            return my.placedWalls;
        }
    };
}
/**
 * Created by ben on 9/3/15.
 */
var GUI = (function () {
    'use strict';

    var module = {};

    function coordinatesToWallIndex(coor) {
        var boardUnit  = gameSpecs.BORDER_WIDTH + gameSpecs.CELL_WIDTH,
            index      = 0,
        //X coordinate is inside of a cell border
            boundTest1 = (coor[0] % boardUnit) <= gameSpecs.BORDER_WIDTH,
        //Y coordinate is inside of a cell border
            boundTest2 = (coor[1] % boardUnit) <= gameSpecs.BORDER_WIDTH,
        //X and Y coordinates are greater than the top and left border widths
            boundTest3 = coor[0] > gameSpecs.BORDER_WIDTH && coor[1] > gameSpecs.BORDER_WIDTH,
        //X and Y coordinates are less than the bottom and right border dimensions
            boundTest4 = Math.floor(coor[0] / boardUnit) < gameSpecs.BOARD_DIMENSION &&
                Math.floor(coor[1] / boardUnit) < gameSpecs.BOARD_DIMENSION;

        if ((boundTest1 !== boundTest2) && boundTest3 && boundTest4) {
            //Vertical wall y coordinate component
            if (Math.floor(coor[1] / boardUnit) > 0 && coor[1] % boardUnit > gameSpecs.BORDER_WIDTH) {
                index += 2 * Math.floor(coor[1] / boardUnit) * (gameSpecs.BOARD_DIMENSION - 1);
            }
            //Horizontal wall y coordinate component
            else if (Math.floor(coor[1] / boardUnit) > 0 ) {
                index += 2 * (Math.floor(coor[1] / boardUnit) - 1) * (gameSpecs.BOARD_DIMENSION - 1);
            }
            if (Math.floor(coor[0] / boardUnit) < gameSpecs.BOARD_DIMENSION) {
                //Horizontal wall x coordinate component
                if (coor[0] % boardUnit > gameSpecs.BORDER_WIDTH) {
                    index += 2 * Math.floor(coor[0] / boardUnit);
                }
                //Vertical wall x coordinate component
                else {
                    index += 2 * Math.floor(coor[0] / boardUnit) - 1;
                }
            }
            //If X or Y coordinates are in the last board unit
            //use the index of the previous wall
            if (Math.floor(coor[0] / boardUnit) === (gameSpecs.BOARD_DIMENSION - 1) &&
                coor[0] % boardUnit > gameSpecs.BORDER_WIDTH) {
                index -= 2;
            }
            else if (Math.floor(coor[1] / boardUnit) === (gameSpecs.BOARD_DIMENSION - 1) &&
                coor[1] % boardUnit > gameSpecs.BORDER_WIDTH) {
                index -= (gameSpecs.BOARD_DIMENSION - 1) * 2;
            }
        }
        else {
            //If pointer is at wall vertex, use currently previewed index
            if (boundTest1 && boundTest2 && module.wallPreview > -1) {
                return module.wallPreview;
            }
            else {
                return -1;
            }
        }
        return index;
    }

    function indexToWallCoordinates(idx) {
        var x, y,
            boardUnit = gameSpecs.BORDER_WIDTH + gameSpecs.CELL_WIDTH;
        if (idx % 2 === 0) {
            x = gameSpecs.BORDER_WIDTH + ((idx % ((gameSpecs.BOARD_DIMENSION - 1) * 2)) / 2) * boardUnit;
            y = ( 1 + Math.floor(idx / ((gameSpecs.BOARD_DIMENSION - 1) * 2))) * boardUnit;
        }
        else {
            x = ((((idx % ((gameSpecs.BOARD_DIMENSION - 1) * 2)) - 1) / 2) + 1) * boardUnit;
            y = gameSpecs.BORDER_WIDTH + Math.floor(idx / ((gameSpecs.BOARD_DIMENSION - 1) * 2)) * boardUnit;
        }
        return [x,y];
    }

    function positionToRectCellCoordinates(pos) {
        var pos1 = pos % gameSpecs.BOARD_DIMENSION ,
            pos2 = Math.floor(pos / gameSpecs.BOARD_DIMENSION),
            x    = pos1 * gameSpecs.CELL_WIDTH + (pos1 + 1) * gameSpecs.BORDER_WIDTH,
            y    = pos2 * gameSpecs.CELL_WIDTH + (pos2 + 1) * gameSpecs.BORDER_WIDTH;
        return [x,y];
    }

    function getValidMoveCoordinates() {
        var i,
            coors = [],
            moves = board.getValidMoves();

        if (typeof moves === 'undefined') {
            return undefined;
        }
        for (i = 0; i < moves.length; i++) {
            coors.push(positionToRectCellCoordinates(moves[i]));
        }
        return coors;
    }

    function drawHud() {
        var x, y, i,
            player1Walls = players.getPlayer('player1').getWallCount(),
            player2Walls = players.getPlayer('player2').getWallCount();

        module.hudContext.fillStyle = 'black';
        module.hudContext.fillRect(0, 0, gameSpecs.BOARD_SIZE / 3, gameSpecs.BOARD_SIZE);

        for (i = 0; i < player2Walls; i++) {
            x = gameSpecs.BORDER_WIDTH + (i % 5) * 2 * gameSpecs.BORDER_WIDTH;
            y = gameSpecs.CELL_WIDTH * 2.5 * (0.3 + Math.floor(i / 5));
            drawWall([x,y], module.hudContext, players.getPlayer('player2').getColor(), true);
        }

        for (i = 0; i < player1Walls; i++) {
            x = gameSpecs.BORDER_WIDTH + (i % 5) * 2 * gameSpecs.BORDER_WIDTH;
            y = gameSpecs.CELL_WIDTH * 5 + gameSpecs.CELL_WIDTH * 2.5 * (0.3 + Math.floor(i / 5));
            drawWall([x,y], module.hudContext, players.getPlayer('player1').getColor(), true);
        }
    }

    function drawWall(coor, ctx, fill, vertical) {
        ctx.fillStyle = fill;
        if (vertical === true) {
            ctx.fillRect(coor[0], coor[1], gameSpecs.BORDER_WIDTH, gameSpecs.CELL_WIDTH * 2 + gameSpecs.BORDER_WIDTH);
        }
        else {
            ctx.fillRect(coor[0], coor[1], gameSpecs.CELL_WIDTH * 2 + gameSpecs.BORDER_WIDTH, gameSpecs.BORDER_WIDTH);
        }
    }

    function drawToken(token) {
        var x = token.getX(),
            y = token.getY(),
            radius = token.getRadius();

        module.boardContext.fillStyle = token.getColor();
        module.boardContext.beginPath();
        module.boardContext.arc(x, y, radius, 0, Math.PI * 2);
        module.boardContext.fill();
    }

    function drawBoard() {
        var i, j, k, x, y, coor, tokens, validMoveCoordinates,
            placedWalls = board.getPlacedWalls();

        function drawCell(coor, fill) {
            module.boardContext.fillStyle = fill;
            module.boardContext.fillRect(coor[0], coor[1], gameSpecs.CELL_WIDTH, gameSpecs.CELL_WIDTH);
        }

        module.boardContext.fillStyle = 'black';
        module.boardContext.fillRect(0, 0, gameSpecs.BOARD_SIZE, gameSpecs.BOARD_SIZE);

        for (i = 0; i < gameSpecs.BOARD_DIMENSION; i++) {
            for (j = 0; j < gameSpecs.BOARD_DIMENSION; j++) {
                //Cell Coordinates
                x = gameSpecs.BORDER_WIDTH * (j + 1) + gameSpecs.CELL_WIDTH * j;
                y = gameSpecs.BORDER_WIDTH * (i + 1) + gameSpecs.CELL_WIDTH * i;
                validMoveCoordinates = getValidMoveCoordinates();
                //Draw highlighted cells
                if (typeof validMoveCoordinates !== 'undefined') {
                    for (k = 0; k < validMoveCoordinates.length; k++) {
                        if (validMoveCoordinates[k][0] === x && validMoveCoordinates[k][1] === y) {
                            drawCell([x,y], '#D8D8D8');
                            k = validMoveCoordinates.length + 1;
                        }
                    }
                    if (k === validMoveCoordinates.length) {
                        drawCell([x,y], 'grey');
                    }
                }
                else {
                    drawCell([x,y], 'grey');
                }
            }
        }

        if (module.wallPreview > -1) {
            coor = indexToWallCoordinates(module.wallPreview);
            if (module.wallPreview % 2 === 0) {
                drawWall(coor, module.boardContext, players.getCurrentPlayer().getColor(), false);
            }
            else {
                drawWall(coor, module.boardContext, players.getCurrentPlayer().getColor(), true);
            }
        }

        if (placedWalls.length > 0) {
            for (i = 0; i < placedWalls.length; i++) {
                coor = indexToWallCoordinates(placedWalls[i]);
                if (placedWalls[i] % 2 === 0) {
                    drawWall(coor, module.boardContext, 'white', false);
                }
                else {
                    drawWall(coor, module.boardContext, 'white', true);
                }
            }
        }

        tokens = players.getTokens();
        drawToken(tokens[0]);
        drawToken(tokens[1]);
    }

    function update() {
        drawBoard();
        drawHud();
    }

    //Public methods
    return {
        init: function init() {
            //HUD Canvas (Wall count)
            module.hudCanvas              = document.createElement('canvas');
            module.hudCanvas.id           = 'hud';
            module.hudCanvas.height       = gameSpecs.BOARD_SIZE;
            module.hudCanvas.width        = gameSpecs.BOARD_SIZE / 3;
            module.hudContext             = module.hudCanvas.getContext('2d');
            module.hudContext.fillStyle   = 'black';
            module.hudContext.fillRect(0, 0, gameSpecs.BOARD_SIZE / 3, gameSpecs.BOARD_SIZE);
            document.body.appendChild(module.hudCanvas);
            //Board Canvas
            module.boardCanvas            = document.createElement('canvas');
            module.boardCanvas.id         = 'board';
            module.boardCanvas.height     = gameSpecs.BOARD_SIZE;
            module.boardCanvas.width      = gameSpecs.BOARD_SIZE;
            module.boardContext           = module.boardCanvas.getContext('2d');
            module.boardContext.fillStyle = 'black';
            module.boardContext.fillRect(0, 0, gameSpecs.BOARD_SIZE, gameSpecs.BOARD_SIZE);
            document.body.appendChild(module.boardCanvas);
            module.wallPreview = -1;
            update();
        },
        update: update,
        getBoardCanvas: function getBoardCanvas() {
            return module.boardCanvas;
        },
        getBoardContext: function getBoardContext() {
            return module.boardContext;
        },
        //Pixel coordinates on canvas return board position
        coordinatesToCellPosition: function coordinatesToCellPosition(coor) {
            var boardUnit = gameSpecs.BORDER_WIDTH + gameSpecs.CELL_WIDTH,
                position  = Math.floor(coor[0] / boardUnit) + Math.floor(coor[1] / boardUnit) * gameSpecs.BOARD_DIMENSION,
                boundTest,
                i;

            for (i = 0; i < 2; i++) {
                boundTest = coor[i] % boardUnit;
                if (boundTest <= gameSpecs.BORDER_WIDTH) {
                    return undefined;
                }
            }
            return position;
        },
        coordinatesToWallIndex: coordinatesToWallIndex,
        //Returns center coordinates of cell
        positionToCellCoordinates: function positionToCellCoordinates(pos) {
            var pos1 = pos % gameSpecs.BOARD_DIMENSION,
                pos2 = Math.floor(pos / gameSpecs.BOARD_DIMENSION),
                x = (pos1 + 0.5) * gameSpecs.CELL_WIDTH + (pos1 + 1) * gameSpecs.BORDER_WIDTH,
                y = (pos2 + 0.5) * gameSpecs.CELL_WIDTH + (pos2 + 1) * gameSpecs.BORDER_WIDTH;
            return [x,y];
        },
        getWallPreview: function getWallPreview() {
            return module.wallPreview;
        },
        setWallPreview: function setWallPreview(wall) {
            if (wall > -1) {
                module.wallPreview = wall;
            }
            else {
                module.wallPreview = -1;
            }
        },
        //Returns top left coordinates of cell
        positionToRectCellCoordinates: positionToRectCellCoordinates,
        getValidMoveCoordinates: getValidMoveCoordinates
    };

})();
/**
 * Created by Ben on 8/18/2015.
 */

var gameSpecs = {};

(function () {
    'use strict';
    //Set constant gameSpecs board properties
    gameSpecs.BOARD_DIMENSION = 9;
    gameSpecs.CELL_WIDTH = 55;
    gameSpecs.BORDER_WIDTH = gameSpecs.CELL_WIDTH / 5;
    gameSpecs.BOARD_SIZE = gameSpecs.CELL_WIDTH * gameSpecs.BOARD_DIMENSION +
            gameSpecs.BORDER_WIDTH * (gameSpecs.BOARD_DIMENSION + 1);
    gameSpecs.TOP_START_POS = Math.floor(gameSpecs.BOARD_DIMENSION / 2);
    gameSpecs.BOT_START_POS = Math.floor(gameSpecs.BOARD_DIMENSION / 2) +
        gameSpecs.BOARD_DIMENSION * (gameSpecs.BOARD_DIMENSION - 1);

    function fixMouse(e) {
        var rect = GUI.getBoardCanvas().getBoundingClientRect();
        var mx = (e.clientX - rect.left) / (rect.right - rect.left) * GUI.getBoardCanvas().width,
            my = (e.clientY - rect.top) / (rect.bottom - rect.top) * GUI.getBoardCanvas().height;
        return [mx, my];
    }

    document.addEventListener('DOMContentLoaded', function init() {
        var selectedToken, offsetY, offsetX;

        //Game initializers
        board = boardConstructor();
        players.init();
        GUI.init();
        console.log("board: "+board.getBoardString());

        //Click event handler
        GUI.getBoardCanvas().addEventListener('mousedown', function (e) {
            var mouse, mx, my, token, dx, dy, wall;

            //Shift pointer coordinates to 0,0 at top left of canvas
            mouse = fixMouse(e);
            mx = mouse[0];
            my = mouse[1];
            //Check to see if pointer intersects player tokens
            token = players.getCurrentPlayer().getToken();
            dx = mx - token.getX();
            dy = my - token.getY();
            if ((dx * dx + dy * dy) <= Math.pow(token.getRadius(), 2)) {
                selectedToken = token;
                offsetX = dx;
                offsetY = dy;
            }

            wall = GUI.getWallPreview();
            if (typeof selectedToken !== 'undefined') {
                board.findValidMoves(selectedToken.getPosition(), false, false);
                GUI.update();
            }
            else if (board.wallIsValid(wall)) {
                board.placeWall(wall);
                players.getCurrentPlayer().act();
                players.getCurrentPlayer().useWall();
                GUI.update();
            }

        });

        //Move event
        GUI.getBoardCanvas().addEventListener('mousemove', function (e) {
            var mouse = fixMouse(e),
                x, y;
            if (typeof selectedToken !== 'undefined') {
                x = mouse[0] - offsetX;
                y = mouse[1] - offsetY;
                selectedToken.setCoordinates([x,y]);
            }
            else {
                GUI.setWallPreview(GUI.coordinatesToWallIndex(mouse));
            }
            GUI.update();
        });

        //Release event
        GUI.getBoardCanvas().addEventListener('mouseup', function (e) {
            if (typeof selectedToken !== 'undefined') {
                selectedToken.updatePosition();
                selectedToken.updateCoordinates();
                selectedToken = undefined;
                board.setValidMoves([]);
                GUI.update();
            }
            if (players.getCurrentPlayer().hasActed()) {
                players.nextPlayer();
            }
        });
    });


})();

/**
 * Created by ben on 8/21/15.
 */
var players = (function () {
    'use strict';

    var module = {
        player1: undefined,
        player2: undefined,
        currentPlayer: undefined,
        startingWalls: 10
    };

    function getTokens() {
        return [module.player1.getToken(), module.player2.getToken()];
    }

    function getWinningRange(startPos) {
        if (Math.floor(startPos / gameSpecs.BOARD_DIMENSION) === 0) {
            return [gameSpecs.BOARD_DIMENSION * (gameSpecs.BOARD_DIMENSION - 1), Math.pow(gameSpecs.BOARD_DIMENSION, 2) - 1];
        }
        else {
            return [0, gameSpecs.BOARD_DIMENSION - 1];
        }
    }

    //Basic player constructor
    function Player(clr, n, pos) {
        var my = {
            name: n,
            color: clr,
            token: new Token(clr, this, pos),
            hasActed: false,
            wallCount: module.startingWalls
        };

        this.getName = function getName() {
            return my.name;
        };

        this.getToken = function getToken() {
            console.log('get token');
            return my.token;
        };

        this.getColor = function getColor() {
            return my.color;
        };

        this.act = function act() {
            my.hasActed = !my.hasActed;
        };

        this.hasActed = function hasActed() {
            return my.hasActed;
        };

        this.getWallCount = function getWallCount() {
            return my.wallCount;
        };

        this.useWall = function useWall() {
            my.wallCount--;
        };
    }

    function HumanPlayer(clr, n, pos) {
        Player.apply(this, arguments);
    }

    function ComputerPlayer(clr, n, pos) {
        Player.apply(this, arguments);
    }

    function Token(clr, plr, pos){
        var my = {
                position: pos,
                color: clr,
                player: plr,
                winRange: getWinningRange(pos)
            },
            coors  = GUI.positionToCellCoordinates(my.position);
        my.x      = coors[0];
        my.y      = coors[1];
        my.radius = gameSpecs.CELL_WIDTH / 2 * 0.8;

        this.getX = function getX() {
            return my.x;
        };

        this.getY = function getY() {
            return my.y;
        };

        this.setX = function setX(xPos) {
            my.x = xPos;
        };

        this.setY = function setY(yPos) {
            my.y = yPos;
        };

        //Position on board cell matrix
        this.setPosition = function setPosition(pos) {
            my.position = pos;
        };

        this.getRadius = function getRadius() {
            return my.radius;
        };

        //Pixel coordinates on canvas
        this.setCoordinates = function setCoordinates(coor) {
            my.x = coor[0];
            my.y = coor[1];
        };

        this.getCoordinates = function getCoordinates() {
            return [my.x, my.y];
        };

        this.updatePosition = function updatePosition() {
            var newPos,
                coor = [my.x, my.y];
            newPos = GUI.coordinatesToCellPosition(coor);
            if (newPos !== my.position && board.moveIsValid(newPos)) {
                my.player.act();
                my.position = newPos;
            }
        };

        this.updateCoordinates = function updateCoordinates() {
            var coor = GUI.positionToCellCoordinates(my.position);
            my.x = coor[0];
            my.y = coor[1];
        };

        this.getPosition = function getPosition() {
            return my.position;
        };

        this.getWinRange = function getWinRange() {
            return my.winRange;
        };

        this.getColor = function getColor() {
            return my.color;
        };
    }

    //Return public methods
    return {
        init: function init() {
            module.player1 = new HumanPlayer('red', 'player1', gameSpecs.BOT_START_POS);
            module.player2 = new ComputerPlayer('blue', 'player2', gameSpecs.TOP_START_POS);
            module.currentPlayer = module.player1;
        },
        getPlayer: function getPlayer(name) {
            return module[name];
        },
        getToken: function getToken(name) {
            return module[name].getToken();
        },
        getTokens: getTokens,
        getCurrentPlayer: function getCurrentPlayer() {
            return module.currentPlayer;
        },
        nextPlayer: function nextPlayer() {
            module.currentPlayer.act();
            module.currentPlayer = module.currentPlayer === module.player1 ? module.player2 : module.player1;
        }
    };

})();