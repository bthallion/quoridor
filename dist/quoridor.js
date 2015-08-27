/**
 * Created by ben on 8/21/15.
 */
var ai = (function () {
    'use strict';

})();
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
    function getMovePosition(pos, dir) {
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

    function doesWallIntersect(wallIndex) {
        var i,
            conflictWalls;

        if ((wallIndex % 2) === 0) {
            conflictWalls = [
                wallIndex,
                wallIndex + 1,
                wallIndex + 2,
                wallIndex - 2
            ];
            if (wallIndex % ((my.boardDimension - 1) * 2) === (((my.boardDimension - 1) * 2) - 2)) {
                conflictWalls.splice(2,1);
            }
            if (wallIndex % ((my.boardDimension - 1) * 2) === 0) {
                conflictWalls.splice(3,1);
            }
        }
        else {
            conflictWalls = [
                wallIndex,
                wallIndex - 1,
                wallIndex - (my.boardDimension - 1) * 2,
                wallIndex + (my.boardDimension - 1) * 2
            ];
        }



        for (i = 0; i < conflictWalls.length; i++) {
            if (my.placedWalls.indexOf(conflictWalls[i]) > -1) {
                return true;
            }
        }
        return false;
    }

    function isWallValid(wallIndex) {
        return wallIndex > -1 &&
               !doesWallIntersect(wallIndex) &&
               checkTokenPaths(wallIndex);
    }

    function isMoveValid(movePosition) {
        if (typeof my.validMoves !== 'undefined') {
            return (my.validMoves.indexOf(movePosition) !== -1);
        }
        else {
            return false;
        }
    }

    function checkTokenPaths(wallIndex) {
        var i,
            tokens = players.getTokens();

        for (i = 0; i < tokens.length; i++) {
            if (!doesTokenHavePathToEnd(tokens[i], wallIndex)) {
                return false;
            }
        }

        return true;
    }

    function doesTokenHavePathToEnd(token, includeWall) {
        var i, node, moves,
            winRange          = token.getWinRange(),
            positionQueue     = [token.getPosition()],
            examinedPositions = new Array(Math.pow(my.boardDimension, 2) - 1)
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
            moves = findValidMovePositions(node, false);
            for (i = 0; i < moves.length; i++) {
                if (examinedPositions[moves[i]] !== 1) {
                    examinedPositions[moves[i]] = 1;
                    positionQueue = positionQueue.concat(findValidMovePositions(moves[i]));
                }
            }
        } while (positionQueue.length > 0);
        my.placedWalls.splice(my.placedWalls.length - 1, 1);
        return false;
    }

    function findValidMovePositions(posIndex, ignoreJump) {
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
                if (typeof players.getTokenAtPosition(moves[i]) !== 'undefined' && moves[i] !== posIndex) {
                    //Get opponent direction and walls around its position
                    opponentDirection = getRelativeDirection(posIndex, moves[i]);
                    walls             = getAdjacentWalls(moves[i], false);
                    for (j = 0; j < walls.length; j++) {
                        wallOrientation = getRelativeWallOrientation(moves[i], walls[j]);
                        //If wall obstructs jump, add opponent's moveset to current player's
                        if (opponentDirection === wallOrientation) {
                            opponentMoves = findValidMovePositions(moves[i], true);
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
                            opponentMoves = findValidMovePositions(moves[i], true);
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
        return moves;
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
            //If X or Y coordinates are in the last board unit
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
            if (boundTest1 && boundTest2 && my.wallPreview > -1) {
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
        if (idx % 2 === 0) {
            x = my.borderWidth + ((idx % ((my.boardDimension - 1) * 2)) / 2) * boardUnit;
            y = ( 1 + Math.floor(idx / ((my.boardDimension - 1) * 2))) * boardUnit;
        }
        else {
            x = ((((idx % ((my.boardDimension - 1) * 2)) - 1) / 2) + 1) * boardUnit;
            y = my.borderWidth + Math.floor(idx / ((my.boardDimension - 1) * 2)) * boardUnit;
        }
        return [x,y];
    }

    function positionToRectCellCoordinates(pos) {
        var pos1 = pos % my.boardDimension ,
            pos2 = Math.floor(pos / my.boardDimension),
            x    = pos1 * my.cellWidth + (pos1 + 1) * my.borderWidth,
            y    = pos2 * my.cellWidth + (pos2 + 1) * my.borderWidth;
        return [x,y];
    }

    function getValidMoveCoordinates() {
        var moves = [],
            i;
        if (typeof my.validMoves === 'undefined') {
            return undefined;
        }
        for (i = 0; i < my.validMoves.length; i++) {
            moves.push(positionToRectCellCoordinates(my.validMoves[i]));
        }
        return moves;
    }

    function drawBoard() {
        var i, j, k, x, y, coor, tokens, validMoveCoordinates;

        function drawCell(coor, fill) {
            my.boardContext.fillStyle = fill;
            my.boardContext.fillRect(coor[0], coor[1], my.cellWidth, my.cellWidth);
        }

        function drawWall(coor, fill, vertical) {
            my.boardContext.fillStyle = fill;
            if (vertical === true) {
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
                //Cell Coordinates
                x = my.borderWidth * (j + 1) + my.cellWidth * j;
                y = my.borderWidth * (i + 1) + my.cellWidth * i;
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

        if (typeof my.wallPreview !== 'undefined' && my.wallPreview > -1) {
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
        if (typeof tokens !== 'undefined') {
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
            my.topStartPos            = Math.floor(my.boardDimension / 2);
            my.botStartPos            = Math.floor(my.boardDimension / 2) +
                                        my.boardDimension * (my.boardDimension - 1);
            my.boardSize              = my.cellWidth * my.boardDimension +
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
        //Pixel coordinates on canvas return board position
        coordinatesToCellPosition: function coordinatesToCellPosition(coor) {
            var boardUnit = my.borderWidth + my.cellWidth,
                position  = Math.floor(coor[0] / boardUnit) + Math.floor(coor[1] / boardUnit) * my.boardDimension,
                boundTest,
                i;

            for (i = 0; i < 2; i++) {
                boundTest = coor[i] % boardUnit;
                if (boundTest <= my.borderWidth) {
                    return undefined;
                }
            }
            return position;

        },
        coordinatesToWallIndex: coordinatesToWallIndex,
        //Returns center coordinates of cell
        positionToCellCoordinates: function positionToCellCoordinates(pos) {
            var pos1 = pos % my.boardDimension,
                pos2 = Math.floor(pos / my.boardDimension),
                x = (pos1 + 0.5) * my.cellWidth + (pos1 + 1) * my.borderWidth,
                y = (pos2 + 0.5) * my.cellWidth + (pos2 + 1) * my.borderWidth;
            return [x,y];
        },
        //Returns top left coordinates of cell
        positionToRectCellCoordinates: positionToRectCellCoordinates,
        setValidMovePositions: function setValidMovePositions(mvs) {
            if (typeof mvs !== 'undefined') {
                my.validMoves = mvs.slice();
            }
            else {
                my.validMoves = undefined;
            }
        },
        getValidMovePositions: function getValidMovePositions() {
            return my.validMoves;
        },
        getValidMoveCoordinates: getValidMoveCoordinates,
        setWallPreview: function setWallPreview(coor) {
            if (coor.constructor === Array) {
                my.wallPreview = coordinatesToWallIndex(coor);
            }
            else {
                my.wallPreview = undefined;
            }
        },
        getWallPreview: function getWallPreview() {
            if (my.wallPreview > -1) {
                return my.wallPreview;
            }
            else {
                return undefined;
            }
        },
        placeWall: function placeWall(wall) {
            if (wall > -1) {
                my.placedWalls.push(wall);
            }
        },
        getAdjacentWalls: getAdjacentWalls,
        findValidMovePositions: findValidMovePositions,
        isMoveOnBoard: isMoveOnBoard,
        isWallValid: isWallValid,
        isMoveValid: isMoveValid
    };

})();
/**
 * Created by Ben on 8/18/2015.
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function init() {
        var selectedToken, offsetY, offsetX;

        function fixMouse(e) {
            var rect = board.getCanvas().getBoundingClientRect();
            var mx = (e.clientX - rect.left) / (rect.right - rect.left) * board.getCanvas().width,
                my = (e.clientY - rect.top) / (rect.bottom - rect.top) * board.getCanvas().height;
            return [mx, my];
        }
        //Game initializers
        board.init(55, 9); //Cell width, board dimension
        players.init('human','ai');
        board.drawBoard();

        //Click event handler
        board.getCanvas().addEventListener('mousedown', function (e) {
            var mouse, mx, my, token, dx, dy, moves, wall;

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

            wall = board.getWallPreview();
            if (typeof selectedToken !== 'undefined') {
                moves = board.findValidMovePositions(selectedToken.getPosition(), false);
                console.log('moves '+moves);
                board.setValidMovePositions(moves);
                board.drawBoard();
            }
            else if (board.isWallValid(wall)) {
                board.placeWall(wall);
                players.getCurrentPlayer().act();
                board.drawBoard();
            }

        });

        //Move event
        board.getCanvas().addEventListener('mousemove', function (e) {
            var mouse = fixMouse(e),
                x, y;
            if (typeof selectedToken !== 'undefined') {
                x = mouse[0] - offsetX;
                y = mouse[1] - offsetY;
                selectedToken.setCoordinates([x,y]);
            }
            else {
                board.setWallPreview(mouse);
            }
            board.drawBoard();
        });

        //Release event
        board.getCanvas().addEventListener('mouseup', function (e) {
            if (typeof selectedToken !== 'undefined') {
                selectedToken.updatePosition();
                selectedToken.updateCoordinates();
                selectedToken = undefined;
                board.setValidMovePositions(undefined);
                board.drawBoard();
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

    var my = {
        player1: undefined,
        player2: undefined,
        currentPlayer: undefined
    };

    function getTokens() {
        return [my.player1.getToken(), my.player2.getToken()];
    }

    function getWinningRange(startPos) {
        if (Math.floor(startPos / board.getDimension()) === 0) {
            return [board.getDimension() * (board.getDimension() - 1), Math.pow(board.getDimension(), 2) - 1];
        }
        else {
            return [0, board.getDimension() - 1];
        }
    }

    //Basic player constructor
    function Player(clr, pos, range) {
        var my = {
            color: clr,
            token: new Token(pos, range, clr, this),
            hasActed: false,
        };

        this.getToken = function getToken() {
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
    }

    function HumanPlayer(clr, pos) {
        Player.apply(this, arguments);
    }

    function ComputerPlayer(clr, pos) {
        Player.apply(this, arguments);
    }

    function Token(pos, range, clr, plr){
        var my = {
                position: pos,
                color: clr,
                player: plr,
                winRange: range
            },
            celWid = board.getCellWidth(),
            coors  = board.positionToCellCoordinates(my.position);

        my.x      = coors[0];
        my.y      = coors[1];
        my.radius = celWid / 2 * 0.8;

        this.drawToken = function drawToken(ctx) {
            ctx.fillStyle = my.color;
            ctx.beginPath();
            ctx.arc(my.x, my.y, my.radius, 0, Math.PI * 2);
            ctx.fill();
        };

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
            newPos = board.coordinatesToCellPosition(coor);
            if (newPos !== my.position && board.isMoveValid(newPos)) {
                my.player.act();
                my.position = newPos;
            }
        };
        this.updateCoordinates = function updateCoordinates() {
            var coor = board.positionToCellCoordinates(my.position);
            my.x = coor[0];
            my.y = coor[1];
        };
        this.getPosition = function getPosition() {
            return my.position;
        };
        this.getWinRange = function getWinRange() {
            return my.winRange;
        };
    }

    //Return public methods
    return {
        init: function init(p1, p2) {
            my.player1 = playerType(p1, 'red', board.getBotPos());
            my.player2 = playerType(p2, 'blue', board.getTopPos());

            function playerType(type, color, pos) {
                if (type === 'human') {
                    return new HumanPlayer(color, pos, getWinningRange(pos));
                }
                else {
                    return new ComputerPlayer(color, pos, getWinningRange(pos));
                }
            }
            my.currentPlayer = my.player1;
        },
        getPlayer1: function getPlayer1() {
            return my.player1;
        },
        getPlayer2: function getPlayer2() {
            return my.player2;
        },
        getTokens: getTokens,
        getTokenAtPosition: function getTokenAtPosition(pos) {
            var tokens = getTokens(),
                i;
            for (i = 0; i < tokens.length; i++) {
                if (pos === tokens[i].getPosition()) {
                    return tokens[i];
                }
            }
            return undefined;
        },
        getCurrentPlayer: function getCurrentPlayer() {
            return my.currentPlayer;
        },
        nextPlayer: function nextPlayer() {
            my.currentPlayer.act();
            my.currentPlayer = my.currentPlayer === my.player1 ? my.player2 : my.player1;
        }
    };

})();