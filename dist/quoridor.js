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
        //0 is horizontal, 1 is vertical
        wallImg: [],
        //0 is empty, 1 is highlighted
        cellImg: [],
        placedWalls: []
    };

    function positionIndexToPosition(idx) {
        var x = idx % my.boardDimension,
            y = Math.floor(idx / my.boardDimension);
        return [x,y];
    }

    function positionToRectCoordinates(position) {
        var x = position[0] * my.cellWidth + (position[0] + 1) * my.borderWidth,
            y = position[1] * my.cellWidth + (position[1] + 1) * my.borderWidth;
        return [x,y];
    }

    function drawBoard() {
        var i, j, k, x, y, tokens;

        my.boardContext.fillStyle = 'black';
        my.boardContext.fillRect(0, 0, my.boardSize, my.boardSize);
        for (i = 0; i < my.boardDimension; i++) {
            for (j = 0; j < my.boardDimension; j++) {
                x = my.borderWidth * (j + 1) + my.cellWidth * j;
                y = my.borderWidth * (i + 1) + my.cellWidth * i;
                //Draw highlighted cell
                if (my.validMoves) {
                    for (k = 0; k < my.validMoves.length; k++) {
                        if (my.validMoves[k][0] === x && my.validMoves[k][1] === y) {
                            my.boardContext.drawImage(my.cellImg[1], x, y);
                            k = my.validMoves.length + 1;
                            break;
                        }
                    }
                    if (k === my.validMoves.length) {
                        my.boardContext.drawImage(my.cellImg[0], x, y);
                    }
                }
                else {
                    my.boardContext.drawImage(my.cellImg[0], x, y);
                }
            }
        }
        tokens = players.getTokens();
        if (tokens) {
            tokens[0].drawToken(my.boardContext);
            tokens[1].drawToken(my.boardContext);
        }
    }

    return {
        init: function init(cw, dim) {
            my.cellWidth              = cw;
            my.boardDimension         = dim;
            my.borderWidth            = cw / 6;
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

            drawImgs();
            my.cellImg[0].onload = drawBoard;

            function drawImgs() {
                var canvas  = document.createElement('canvas'),
                    ctx     = canvas.getContext('2d'),
                    celWid  = my.cellWidth,
                    img     = document.createElement('img'),
                    borWid  = my.borderWidth;

                //Empty cell
                ctx.fillStyle = 'grey';
                ctx.fillRect(0, 0, celWid, celWid);
                img.src = canvas.toDataURL();
                my.cellImg[0] = img;

                //Highlighted cell
                img = document.createElement('img');
                ctx.fillStyle = '#D8D8D8';
                ctx.fillRect(0, 0, celWid, celWid);
                img.src = canvas.toDataURL();
                my.cellImg[1] = img;

                //Horizontal Wall
                img = document.createElement('img');
                ctx.fillStyle = 'white';
                ctx.clearRect(0, 0, celWid, celWid);
                ctx.fillRect(0, 0, celWid, borWid);
                img.src = canvas.toDataURL();
                my.wallImg[0] = img;
                
                //Vertical Wall
                img = document.createElement('img');
                ctx.clearRect(0, 0, celWid, borWid);
                ctx.fillRect(0, 0, borWid, celWid);
                img.src = canvas.toDataURL();
                my.wallImg[1] = img;
            }

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
        coordinatesToPosition: function coordinatesToPosition(coor) {
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
        //Returns center coordinates of cell
        positionToCoordinates: function positionToCoordinates(pos) {
            var x = (pos[0] + 0.5) * my.cellWidth + (pos[0] + 1) * my.borderWidth,
                y = (pos[1] + 0.5) * my.cellWidth + (pos[1] + 1) * my.borderWidth;
            return [x,y];
        },
        //Returns top left coordinates of cell
        positionToRectCoordinates: positionToRectCoordinates,
        setValidMoves: function setValidMoves(mvs) {
            var moves = [],
                i;
            if (mvs) {
                for (i = 0; i < mvs.length; i++) {
                    moves.push(positionToRectCoordinates(positionIndexToPosition(mvs[i])));
                }
                my.validMoves = moves;
            }
            else {
                my.validMoves = undefined;
            }
        },
        findValidMoves: function findValidMoves(posIndex) {
            var moves = [
                    posIndex,
                    (posIndex - 1),
                    (posIndex + 1),
                    (posIndex + my.boardDimension),
                    (posIndex - my.boardDimension)
                ],
                walls = [],
                horWall, verWall, i, j, moveIndex,
                upperQuadrant = false,
                leftQuadrant  = false;

            //Bottom right wall pair indexes
            horWall = (posIndex % my.boardDimension) * 2;
            verWall = (posIndex % my.boardDimension) * 2 + 1;
            horWall += Math.floor(posIndex / my.boardDimension) * (my.boardDimension - 1) * 2;
            verWall += Math.floor(posIndex / my.boardDimension) * (my.boardDimension - 1) * 2;

            //Consider indexes if the cell position is not on the bottom or right edges
            //Remove invalid moves
            if ((posIndex % my.boardDimension) < 8) {
                if (Math.floor(posIndex / my.boardDimension) < 8) {
                    walls.push(horWall, verWall);
                }
                else {
                    moveIndex = moves.indexOf((posIndex + my.boardDimension));
                    if (moveIndex > -1) {
                        moves.splice(moveIndex, 1);
                    }
                }
            }
            else {
                moveIndex = moves.indexOf((posIndex + 1));
                if (moveIndex > -1) {
                    moves.splice(moveIndex, 1);
                }
            }

            //Bottom left
            horWall -= 2;
            verWall -= 2;

            if ((posIndex % my.boardDimension) > 0) {
                if (Math.floor(posIndex / my.boardDimension) < 8) {
                    walls.push(horWall, verWall);
                }
            }
            else {
                moveIndex = moves.indexOf((posIndex - 1));
                if (moveIndex > -1) {
                    moves.splice(moveIndex, 1);
                }
            }

            //Top left
            horWall -= (my.boardDimension - 1) * 2;
            verWall -= (my.boardDimension - 1) * 2;

            if ((posIndex % my.boardDimension) > 0) {
                if (Math.floor(posIndex / my.boardDimension) > 0) {
                    walls.push(horWall, verWall);
                }
                else {
                    moveIndex = moves.indexOf((posIndex - my.boardDimension));
                    if (moveIndex > -1) {
                        moves.splice(moveIndex, 1);
                    }
                }
            }

            //Top right
            horWall += 2;
            verWall += 2;

            if ((posIndex % my.boardDimension) < 8) {
                if (Math.floor(posIndex / my.boardDimension) > 0) {
                    walls.push(horWall, verWall);
                }
                else {
                    moveIndex = moves.indexOf((posIndex - my.boardDimension));
                    if (moveIndex > -1) {
                        moves.splice(moveIndex, 1);
                    }
                }
            }
            else {
                moveIndex = moves.indexOf((posIndex + 1));
                if (moveIndex > -1) {
                    moves.splice(moveIndex, 1);
                }
            }

            for (i = 0; i < walls.length; i++) {
                //If an obstructive wall has been placed
                if (my.placedWalls.indexOf(walls[i]) > -1) {
                    for (j = 0; j < walls.length; j++) {
                        //Check to see if it is part of a left or top wall pairing
                        if (Math.floor(walls[i] / (my.boardDimension - 1)) < Math.floor(walls[j] / (my.boardDimension - 1))) {
                            upperQuadrant = true;
                        }
                        if ((walls[i] + 2) === walls[j]) {
                             leftQuadrant = true;
                        }
                    }
                    //If the wall is even, it is a horizontal wall
                    if (walls[i] % 2 === 0) {
                        //Top horizontal walls block moving up
                        if (upperQuadrant) {
                            moveIndex = moves.indexOf((posIndex - my.boardDimension));
                            if (moveIndex > -1) {
                                moves.splice(moveIndex, 1);
                            }
                        }
                        else {
                            moveIndex = moves.indexOf((posIndex + my.boardDimension));
                            if (moveIndex > -1) {
                                moves.splice(moveIndex, 1);
                            }
                        }
                    }
                    else {
                        //Left vertical walls block left
                        if (leftQuadrant) {
                            moveIndex = moves.indexOf((posIndex - 1));
                            if (moveIndex > -1) {
                                moves.splice(moveIndex, 1);
                            }
                        }
                        else {
                            moveIndex = moves.indexOf((posIndex + 1));
                            if (moveIndex > -1) {
                                moves.splice(moveIndex, 1);
                            }
                        }
                    }
                }
            }
            console.log('moves '+moves);
            return moves;
        }
    };

})();
/**
 * Created by Ben on 8/16/2015.
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function init() {
        var selectedToken, offsetY, offsetX;

        function fixMouse(e) {
            var mx = e.clientX - e.target.offsetLeft,
                my = e.clientY - e.target.offsetTop;
            return [mx, my];
        }
        //Game initializers
        board.init(55, 9); //Cell width, board dimension
        players.init('human','ai');

        //Click event handler
        board.getCanvas().addEventListener('mousedown', function (e) {
            var mouse, mx, my, token, i, dx, dy, moves;

            //Shift pointer coordinates to 0,0 at top left of canvas
            mouse = fixMouse(e);
            mx = mouse[0];
            my = mouse[1];

            //Check to see if pointer intersects player tokens
            token = players.getTokens();
            for (i = 0; i < token.length; i++) {
                dx = mx - token[i].getX();
                dy = my - token[i].getY();

                if ((dx * dx + dy * dy) <= Math.pow(token[i].getRadius(), 2)) {
                    selectedToken = token[i];
                    offsetX = dx;
                    offsetY = dy;
                    break;
                }
            }
            moves = board.findValidMoves(selectedToken.getPositionIndex());
            board.setValidMoves(moves);
            board.drawBoard();
        });

        //Move event
        board.getCanvas().addEventListener('mousemove', function (e) {
            var mouse, x, y;
            if (selectedToken) {
                mouse = fixMouse(e);
                x = mouse[0] - offsetX;
                y = mouse[1] - offsetY;
                //console.log("x "+x+" y "+y);
                selectedToken.setCoordinates([x,y]);
                board.drawBoard();
            }
        });

        //Release event
        board.getCanvas().addEventListener('mouseup', function (e) {
            if (selectedToken) {
                selectedToken.updatePosition();
                selectedToken.updateCoordinates();
                board.setValidMoves(undefined);
                board.drawBoard();
                selectedToken = undefined;
            }
            //console.log('mouseup');
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
        player2: undefined
    };

    //Basic player constructor
    function Player(clr, pos) {
        var my = {
            position: pos,
            currentPlayer: false,
            token: new Token(pos, clr, this)
        };

        this.getPosition = function getPosition() {
            return my.position;
        };

        this.currentPlayer = function currentPlayer() {
            return my.currentPlayer;
        };

        this.getToken = function getToken() {
            return my.token;
        };
    }

    function HumanPlayer(clr, pos) {
        Player.apply(this, arguments);

    }

    function ComputerPlayer(clr, pos) {
        Player.apply(this, arguments);
        
    }

    function Token(pos, clr, plr){
        var my = {
                position: pos,
                color: clr,
                player: plr
            },
            celWid   = board.getCellWidth();

        my.x      = (my.position[0] + 0.5) * celWid + (my.position[0] + 1) * board.getBorderWidth();
        my.y      = (my.position[1] + 0.5) * celWid + (my.position[1] + 1) * board.getBorderWidth();
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
            var coor = [my.x, my.y];

            my.position = board.coordinatesToPosition(coor);
        };
        this.updateCoordinates = function updateCoordinates() {
            var coor = board.positionToCoordinates(my.position);

            my.x = coor[0];
            my.y = coor[1];
        };
        this.getPositionIndex = function getPositionIndex() {
            return my.position[0] + my.position[1] * board.getDimension();
        };
    }

    //Return public methods
    return {
        init: function init(p1, p2) {
            my.player1 = playerType(p1, 'red', board.getBotPos());
            my.player2 = playerType(p2, 'blue', board.getTopPos());

            function playerType(type, color, pos) {
                if (type === 'human') {
                    return new HumanPlayer(color, pos);
                }
                else {
                    return new ComputerPlayer(color, pos);
                }
            }
        },
        getPlayer1: function getPlayer1() {
            return my.player1;
        },
        getPlayer2: function getPlayer2() {
            return my.player2;
        },
        getTokens: function getTokens() {
            return [my.player1.getToken(), my.player2.getToken()];
        }
    };

})();