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
                my = e.clientY - rect.top / (rect.bottom - rect.top) * board.getCanvas().height;
            return [mx, my];
        }
        //Game initializers
        board.init(55, 9); //Cell width, board dimension
        players.init('human','ai');
        board.drawBoard();

        //Click event handler
        board.getCanvas().addEventListener('mousedown', function (e) {
            var mouse, mx, my, tokens, i, dx, dy, moves, wall;

            //Shift pointer coordinates to 0,0 at top left of canvas
            mouse = fixMouse(e);
            mx = mouse[0];
            my = mouse[1];
            //Check to see if pointer intersects player tokens
            tokens = players.getTokens();
            for (i = 0; i < tokens.length; i++) {
                dx = mx - tokens[i].getX();
                dy = my - tokens[i].getY();

                if ((dx * dx + dy * dy) <= Math.pow(tokens[i].getRadius(), 2)) {
                    selectedToken = tokens[i];
                    offsetX = dx;
                    offsetY = dy;
                    break;
                }
            }
            wall = board.getWallPreview();
            if (selectedToken) {
                moves = board.getValidMoves(selectedToken.getPosition(), false);
                board.setValidMoves(moves);
                board.drawBoard();
            }
            else if (wall > -1) {
                if (board.isWallValid(wall)) {
                    board.placeWall(wall);
                    board.drawBoard();
                }
            }

        });

        //Move event
        board.getCanvas().addEventListener('mousemove', function (e) {
            var mouse = fixMouse(e),
                x, y;
            if (selectedToken) {
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
            if (selectedToken) {
                selectedToken.updatePosition();
                selectedToken.updateCoordinates();
                board.setValidMoves(undefined);
                board.drawBoard();
                selectedToken = undefined;
            }
        });

    });


})();