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
            else if (board.wallIsValid(wall)) {
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