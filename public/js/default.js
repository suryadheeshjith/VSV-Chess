var board;
var game;
var socket = io();

window.onload = function () {
    initGame();
};

var initGame = function() {
   var cfg = {
       draggable: true,
       position: 'start',
       onDrop: handleMove,
   };
   
   board = new ChessBoard('gameBoard', cfg);
   game = new Chess();

   board.position(game.fen())
};

var handleMove = function(source, target ) {
    var move = game.move({from: source, to: target});
    if (move === null)  return 'snapback';
    var SAN = move.san
    game.undo()
    move = game.move(SAN)
    board.position(game.fen());
    socket.emit('move', move);
};

socket.on('move', function (msg) {
    game.move(msg);
    board.position(game.fen()); // fen is the board layout
});