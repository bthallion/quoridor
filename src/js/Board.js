/**
 * Created by ben on 8/21/15.
 */
var board = (function () {
    'use strict';

    var my = {
        placedWalls: []
    };

    //Returns surrounding wall indexes regardless of position on board
    function getUnboundedAdjacentWalls(pos) {
        var wall,
            walls = [];

        //Bottom right wall vertex
        wall = (pos % my.boardDimension) * 2 +
            Math.floor(pos / my.boardDimension) * (my.boardDimension - 1) * 2;
        walls.push(wall, (wall + 1));

        //Bottom left
        wall -= 2;
        walls.push(wall, (wall + 1));

        //Top left
        wall -= (my.boardDimension - 1) * 2;
        walls.push(wall, (wall + 1));

        //Top right
        wall += 2;
        walls.push(wall, (wall + 1));

        return walls;
    }

    //0:North 1:East 2:South 3:West 4:Identity
    function getUnboundedMoveSet(pos) {
        return [
            (pos - my.boardDimension),
            (pos + 1),
            (pos + my.boardDimension),
            (pos - 1),
            pos
        ];
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

    //Direction indexes
    //0:North 1:East 2:South 3:West
    function getMovePositionIndex(pos, dir) {
        var moves = [
                (pos - my.boardDimension),
                (pos + 1),
                (pos + my.boardDimension),
                (pos - 1)
            ];
        if (isMoveOnBoard(pos, moves[dir])) {
            return moves[dir];
        }
        else {
            return -1;
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

        if (includePotentialWalls) {
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
    
    //Returned values:
    //0:Top 1:Right 2:Bottom 3:Left
    function getAdjacentBoardEdges(pos) {
        var i,
            edges = [];

        //Check if moves are on board
        for (i = 0; i < 4; i++) {
            if (getMovePositionIndex(pos, i) === -1) {
                edges.push(i);
            }
        }

        return edges;
    }

    function isMoveOnBoard(pos1, pos2) {
        var direction = getRelativeDirection(pos1, pos2);

        switch (direction) {
            //North is valid if not on top edge
            case 0:
                return (Math.floor(pos1 / my.boardDimension) > 0);
            //East is valid if not on right edge
            case 1:
                return ((pos1 % my.boardDimension) < 8);
            //South
            case 2:
                return (Math.floor(pos1 / my.boardDimension) < 8);
            //West
            case 3:
                return ((pos1 % my.boardDimension) > 0);
            default:
                return false;
        }
    }

    function getValidMoves(posIndex, ignoreJump) {
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
                moves.splice(moves.indexOf(getMovePositionIndex(posIndex, wallOrientation)), 1);
            }
        }

        //Check for adjacent player, add valid jump moves
        if (!ignoreJump) {
            for (i = 0; i < moves.length; i++) {
                if (players.getTokenAtPositionIndex(moves[i]) && moves[i] !== posIndex) {
                    opponentDirection = getRelativeDirection(posIndex, moves[i]);
                    walls             = getAdjacentWalls(moves[i], false);
                    for (j = 0; j < walls.length; j++) {
                        wallOrientation = getRelativeWallOrientation(moves[i], walls[j]);
                        //If wall obstructs jump, add opponent's moveset to current player's
                        if (opponentDirection === wallOrientation) {
                            opponentMoves = getValidMoves(moves[i], true);
                        }
                    }
                    //If jump is clear, add jump to moveset
                    //remove opponent's position
                    //If jump is off of board (which is an unclear case in the rules!) add opponents moves
                    if (!opponentMoves) {
                        jumpSpace = getMovePositionIndex(moves[i], opponentDirection);
                        if (jumpSpace > -1) {
                            moves.splice(i, 1, jumpSpace);
                        }
                        else {
                            opponentMoves = getValidMoves(moves[i], true);
                        }
                    }
                    if (opponentMoves) {
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
        return moves;
    }

    function positionIndexToPosition(idx) {
        var x = idx % my.boardDimension,
            y = Math.floor(idx / my.boardDimension);
        return [x,y];
    }

    function coordinatesToWallIndex(coor) {
        var boardUnit  = my.borderWidth + my.cellWidth,
            index      = 0,
            //X coordinate is inside of a cell border
            boundTest1 = (coor[0] % boardUnit) <= my.borderWidth,
            //Y coordinate is inside of a cell border
            boundTest2 = (coor[1] % boardUnit) <= my.borderWidth,
            //X and Y coordinates are greater than the top and left border widths
            boundTest3 = coor[0] > my.borderWidth && coor[1] > my.borderWidth,
            //X and Y coordinates are less than the bottom and right border dimensions
            boundTest4 = Math.floor(coor[0] / boardUnit) < my.boardDimension &&
                Math.floor(coor[1] / boardUnit) < my.boardDimension;

        if ((boundTest1 !== boundTest2) && boundTest3 && boundTest4) {
            //Vertical wall y coordinate component
            if (Math.floor(coor[1] / boardUnit) > 0 && coor[1] % boardUnit > my.borderWidth) {
                index += 2 * Math.floor(coor[1] / boardUnit) * (my.boardDimension - 1);
            }
            //Horizontal wall y coordinate component
            else if (Math.floor(coor[1] / boardUnit) > 0 ) {
                index += 2 * (Math.floor(coor[1] / boardUnit) - 1) * (my.boardDimension - 1);
            }
            if (Math.floor(coor[0] / boardUnit) < my.boardDimension) {
                //Horizontal wall x coordinate component
                if (coor[0] % boardUnit > my.borderWidth) {
                    index += 2 * Math.floor(coor[0] / boardUnit);
                }
                //Vertical wall x coordinate component
                else {
                    index += 2 * Math.floor(coor[0] / boardUnit) - 1;
                }
            }
            //If X or Y coordinates are within in the last board unit
            //use the index of the previous wall
            if (Math.floor(coor[0] / boardUnit) === (my.boardDimension - 1) &&
                coor[0] % boardUnit > my.borderWidth) {
                index -= 2;
            }
            else if (Math.floor(coor[1] / boardUnit) === (my.boardDimension - 1) &&
                coor[1] % boardUnit > my.borderWidth) {
                index -= (my.boardDimension - 1) * 2;
            }
        }
        else {
            //If pointer is at wall vertex, use currently previewed index
            if(boundTest1 && boundTest2 && my.wallPreview > -1) {
                return my.wallPreview;
            }
            else {
                return -1;
            }
        }
        return index;
    }

    function indexToWallCoordinates(idx) {
        var x, y,
            boardUnit = my.borderWidth + my.cellWidth;
        console.log('index to wall coors ');
        if (idx % 2 === 0) {
            x = my.borderWidth + ((idx % ((my.boardDimension - 1) * 2)) / 2) * boardUnit;
            y = ( 1 + Math.floor(idx / ((my.boardDimension - 1) * 2))) * boardUnit;
            console.log('even x '+x+' y '+y);
        }
        else {
            console.log('odd ');
            x = ((((idx % ((my.boardDimension - 1) * 2)) - 1) / 2) + 1) * boardUnit;
            y = my.borderWidth + Math.floor(idx / ((my.boardDimension - 1) * 2)) * boardUnit;
        }
        return [x,y];
    }

    function positionToRectCellCoordinates(position) {
        var x = position[0] * my.cellWidth + (position[0] + 1) * my.borderWidth,
            y = position[1] * my.cellWidth + (position[1] + 1) * my.borderWidth;
        return [x,y];
    }

    function drawBoard() {
        var i, j, k, x, y, coor, tokens;

        function drawCell(coor, fill) {
            my.boardContext.fillStyle = fill;
            my.boardContext.fillRect(coor[0], coor[1], my.cellWidth, my.cellWidth);
        }

        function drawWall(coor, fill, vertical) {
            my.boardContext.fillStyle = fill;
            if (vertical) {
                my.boardContext.fillRect(coor[0], coor[1], my.borderWidth, my.cellWidth * 2 + my.borderWidth);
            }
            else {
                my.boardContext.fillRect(coor[0], coor[1], my.cellWidth * 2 + my.borderWidth, my.borderWidth);
            }
        }

        my.boardContext.fillStyle = 'black';
        my.boardContext.fillRect(0, 0, my.boardSize, my.boardSize);
        for (i = 0; i < my.boardDimension; i++) {
            for (j = 0; j < my.boardDimension; j++) {
                x = my.borderWidth * (j + 1) + my.cellWidth * j;
                y = my.borderWidth * (i + 1) + my.cellWidth * i;
                //Draw highlighted cells
                if (my.validMoves) {
                    for (k = 0; k < my.validMoves.length; k++) {
                        if (my.validMoves[k][0] === x && my.validMoves[k][1] === y) {
                            drawCell([x,y], '#D8D8D8');
                            k = my.validMoves.length + 1;
                            break;
                        }
                    }
                    if (k === my.validMoves.length) {
                        drawCell([x,y], 'grey');
                    }
                }
                else {
                    drawCell([x,y], 'grey');
                }
            }
        }

        if (my.wallPreview !== undefined && my.wallPreview > -1) {
            coor = indexToWallCoordinates(my.wallPreview);
            if (my.wallPreview % 2 === 0) {
                drawWall(coor, players.getCurrentPlayer().getColor(), false);
            }
            else {
                drawWall(coor, players.getCurrentPlayer().getColor(), true);
            }
        }

        if (my.placedWalls.length > 0) {
            for (i = 0; i < my.placedWalls.length; i++) {
                coor = indexToWallCoordinates(my.placedWalls[i]);
                if (my.placedWalls[i] % 2 === 0) {
                    drawWall(coor, 'white', false);
                }
                else {
                    drawWall(coor, 'white', true);
                }
            }
        }

        tokens = players.getTokens();
        if (tokens) {
            tokens[0].drawToken(my.boardContext);
            tokens[1].drawToken(my.boardContext);
        }
    }

    //Public methods
    return {
        init: function init(cw, dim) {
            my.cellWidth              = cw;
            my.boardDimension         = dim;
            my.borderWidth            = cw / 5;
            my.topStartPos            = [Math.floor(my.boardDimension / 2), 0];
            my.botStartPos            = [Math.floor(my.boardDimension / 2), my.boardDimension - 1];
            my.boardSize              =  my.cellWidth * my.boardDimension +
                                         my.borderWidth * (my.boardDimension + 1);
            //HUD Canvas (Wall count)
            my.hudCanvas              = document.createElement('canvas');
            my.hudCanvas.id           = 'hud';
            my.hudCanvas.height       = my.boardSize;
            my.hudCanvas.width        = my.boardSize / 3;
            my.hudContext             = my.hudCanvas.getContext('2d');
            my.hudContext.fillStyle   = 'black';
            my.hudContext.fillRect(0,0,my.boardSize/3,my.boardSize);
            document.body.appendChild(my.hudCanvas);

            //Board Canvas
            my.boardCanvas            = document.createElement('canvas');
            my.boardCanvas.id         = 'board';
            my.boardCanvas.height     = my.boardSize;
            my.boardCanvas.width      = my.boardSize;
            my.boardContext           = my.boardCanvas.getContext('2d');
            my.boardContext.fillStyle = 'black';
            my.boardContext.fillRect(0, 0, my.boardSize, my.boardSize);
            document.body.appendChild(my.boardCanvas);

        },
        drawBoard: drawBoard,
        positionIndexToPosition: positionIndexToPosition,
        getCanvas: function getCanvas() {
            return my.boardCanvas;
        },
        getContext: function getContext() {
            return my.boardContext;
        },
        getDimension: function getDimension() {
            return my.boardDimension;
        },
        getCellWidth: function getCellWidth() {
            return my.cellWidth;
        },
        getBorderWidth: function getBorderWidth() {
            return my.borderWidth;
        },
        getBotPos: function getBotPos() {
            return my.botStartPos;
        },
        getTopPos: function getTopPos() {
            return my.topStartPos;
        },
        //Pixel coordinates on canvas return board matrix position
        coordinatesToCellPosition: function coordinatesToCellPosition(coor) {
            var boardUnit = my.borderWidth + my.cellWidth,
                pos1      = Math.floor(coor[0] / boardUnit),
                pos2      = Math.floor(coor[1] / boardUnit),
                boundTest,
                i;
            for (i = 0; i < 2; i++) {
                boundTest = coor[i] % boardUnit;
                if (boundTest <= my.borderWidth) {
                    return undefined;
                }
            }
            return [pos1, pos2];

        },
        coordinatesToWallIndex: coordinatesToWallIndex,
        //Returns center coordinates of cell
        positionToCellCoordinates: function positionToCellCoordinates(pos) {
            var x = (pos[0] + 0.5) * my.cellWidth + (pos[0] + 1) * my.borderWidth,
                y = (pos[1] + 0.5) * my.cellWidth + (pos[1] + 1) * my.borderWidth;
            return [x,y];
        },
        //Returns top left coordinates of cell
        positionToRectCellCoordinates: positionToRectCellCoordinates,
        setValidMoves: function setValidMoves(mvs) {
            var moves = [],
                i;
            if (mvs) {
                for (i = 0; i < mvs.length; i++) {
                    moves.push(positionToRectCellCoordinates(positionIndexToPosition(mvs[i])));
                }
                my.validMoves = moves;
            }
            else {
                my.validMoves = undefined;
            }
        },
        setWallPreview: function setWallPreview(coor) {
            if (coor) {
                console.log('coor '+coor);
                my.wallPreview = coordinatesToWallIndex(coor);
            }
            else {
                my.wallPreview = undefined;
            }
        },
        getAdjacentWalls: getAdjacentWalls,
        getValidMoves: getValidMoves,
        isMoveOnBoard: isMoveOnBoard
    };

})();