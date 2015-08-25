/**
 * Created by ben on 8/21/15.
 */
var players = (function () {
    'use strict';

    var my = {
        player1: undefined,
        player2: undefined
    };

    function getTokens() {
        return [my.player1.getToken(), my.player2.getToken()];
    }

    //Basic player constructor
    function Player(clr, pos) {
        var my = {
            currentPlayer: false,
            token: new Token(pos, clr, this)
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
            celWid = board.getCellWidth();

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
        getTokens: getTokens,
        getTokenAtPositionIndex: function getTokenAtPositionIndex(pos) {
            var tokens = getTokens(),
                i;
            for (i = 0; i < tokens.length; i++) {
                if (pos === tokens[i].getPositionIndex()) {
                    return tokens[i];
                }
            }
            return undefined;
        }
    };

})();