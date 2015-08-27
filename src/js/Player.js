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
        console.log('win range condition for '+startPos+' '+(Math.floor(startPos / board.getDimension()) === 0));
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
            acted: false,
        };

        this.getToken = function getToken() {
            return my.token;
        };

        this.getColor = function getColor() {
            return my.color;
        };

        this.acted = function didAction() {
            my.acted = !my.acted;
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
            if (newPos !== my.position) {
                my.player.acted();
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
            my.currentPlayer = my.currentPlayer === my.player1 ? my.player2 : my.player1;
        }
    };

})();