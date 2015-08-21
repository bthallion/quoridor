/**
 * Created by Ben on 8/16/2015.
 */
'use strict';
(function () {
    var board;
    
    function boardConstructor(cd, dim) {
        var my = {
            cellDimension: cd,
            borderWidth: cd/6,
            boardDimension: dim,
            boardCanvas: undefined,
            boardContext: undefined,
            //0 is empty, 1 is Player 1, 2 is Player 2
            cellImg: [],
            wallImg: undefined
        };

        return {
            init: function init() {
                var boardSize =  my.cellDimension * my.boardDimension +
                                 my.borderWidth * (my.boardDimension + 1);

                my.boardCanvas            = document.createElement('canvas');
                my.boardCanvas.height     = boardSize;
                my.boardCanvas.width      = boardSize;
                my.boardContext           = my.boardCanvas.getContext('2d');
                my.boardContext.fillStyle = 'black';
                my.boardContext.fillRect(0, 0, boardSize, boardSize);
                document.body.appendChild(my.boardCanvas);
                drawCells();
                buildBoard();

                function drawCells() {
                    var canvas  = document.createElement('canvas'),
                        ctx     = canvas.getContext('2d'),
                        cellDim = my.cellDimension,
                        img     = undefined;

                    //Empty cell
                    colorCell('white');
                    saveImg();
                    //Player 1
                    colorCell('red');
                    saveImg();
                    //Player 2
                    colorCell('blue');
                    saveImg();
                    function saveImg() {
                        img.src = canvas.toDataURL();
                        my.cellImg.push(img);
                    }

                    function colorCell(color) {
                        img = document.createElement('img');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, cellDim, cellDim);
                        ctx.fillStyle = color;
                        if (ctx.fillStyle !== '#ffffff') {
                            ctx.beginPath();
                            ctx.arc(cellDim / 2, cellDim / 2, cellDim / 2 * .8, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                        }
                    }
                }
                
                function buildBoard() {
                    var i, j, cell, x, y;

                    for (i = 0; i < my.boardDimension; i++) {
                        for (j = 0; j < my.boardDimension; j++) {
                            switch (i * 10 + j) {
                                case Math.floor(my.boardDimension / 2):
                                    //Middle Top is Player 1
                                    cell = my.cellImg[1];
                                    break;
                                case (my.boardDimension - 1) * 10 + Math.floor(my.boardDimension / 2):
                                    //Middle Bottom is Player 2
                                    cell = my.cellImg[2];
                                    break;
                                default:
                                    //Empty cell
                                    cell = my.cellImg[0];
                                    break;

                            }
                            x = my.borderWidth * (j + 1) + my.cellDimension * j;
                            y = my.borderWidth * (i + 1) + my.cellDimension * i;
                            my.boardContext.drawImage(cell, x, y);
                        }
                    }
                }
                
            }

        };
    }

    function playerConstructor() {}

    document.addEventListener('DOMContentLoaded', function init() {
        board = boardConstructor(60,9);
        board.init();
        console.log("done");
    });

})();