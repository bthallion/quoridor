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