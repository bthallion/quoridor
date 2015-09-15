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