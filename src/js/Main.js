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
