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