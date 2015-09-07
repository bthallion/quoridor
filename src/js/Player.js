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
        if (Math.floor(startPos / global.BOARD_DIMENSION) === 0) {
            return [global.BOARD_DIMENSION * (global.BOARD_DIMENSION - 1), Math.pow(global.BOARD_DIMENSION, 2) - 1];
        }
        else {
            return [0, global.BOARD_DIMENSION - 1];
        }
    }

    //Basic player constructor
    function Player(clr, idx, pos) {
        var my = {
            index: idx,
            color: clr,
            token: new Token(clr, this, pos),
            hasActed: false,
            wallCount: module.startingWalls
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

        this.getIndex = function getIndex() {
            return my.index;
        };

        this.getWallCount = function getWallCount() {
            return my.wallCount;
        };

        this.useWall = function useWall() {
            my.wallCount--;
        };
    }

    function HumanPlayer(clr, idx, pos) {
        Player.apply(this, arguments);
    }

    function ComputerPlayer(clr, idx, pos) {
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
        my.radius = global.CELL_WIDTH / 2 * 0.8;

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
        init: function init(p1, p2) {
            module.player1 = playerType(p1, 'red', 0, global.BOT_START_POS);
            module.player2 = playerType(p2, 'blue', 1, global.TOP_START_POS);

            function playerType(type, color, idx, pos) {
                if (type === 'human') {
                    return new HumanPlayer(color, idx, pos);
                }
                else {
                    return new ComputerPlayer(color, idx, pos);
                }
            }
            module.currentPlayer = module.player1;
        },
        getPlayer1: function getPlayer1() {
            return module.player1;
        },
        getPlayer2: function getPlayer2() {
            return module.player2;
        },
        getTokens: getTokens,
        getCurrentPlayer: function getCurrentPlayer() {
            return module.currentPlayer;
        },
        nextPlayer: function nextPlayer() {
            module.currentPlayer.act();
            module.currentPlayer = module.currentPlayer === module.player1 ? module.player2 : module.player1;
        },
        getWinningRange: getWinningRange
    };

})();