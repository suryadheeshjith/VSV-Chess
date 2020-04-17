(function () {

  WinJS.UI.processAll().then(function () {

    var socket, serverGame;
    var username, playerColor;
    var game, board;
    var usersOnline = [];
    var myGames = [];
    socket = io();

    //////////////////////////////
    // Socket.io handlers
    //////////////////////////////

    socket.on('login', function (msg) {
      usersOnline = msg.users;
      updateUserList();

      myGames = msg.games;
      updateGamesList();
    });

    socket.on('joinlobby', function (msg) {
      addUser(msg);
    });

    socket.on('leavelobby', function (msg) {
      removeUser(msg);
    });

    socket.on('gameadd', function (msg) {});

    socket.on('resign', function (msg) {
      if (msg.gameId == serverGame.id) {

        socket.emit('login', username);

        $('#page-lobby').show();
        $('#page-game').hide();
      }
    });

    socket.on('joingame', function (msg) {
      console.log("joined as game id: " + msg.game.id);
      playerColor = msg.color;
      initGame(msg.game, msg.oppon);

      $('#page-lobby').hide();
      $('#page-game').show();

    });

    socket.on('move', function (msg) {
      if (serverGame && msg.gameId === serverGame.id) {
        game.move(msg.move);
        board.position(game.fen());
      }
    });


    socket.on('logout', function (msg) {
      removeUser(msg.username);
    });

    // socket.on('new-msg', function (packet) {

    //   if (packet.from == username || packet.to == username) {
    //     console.log("Received Message: " + packet.message + " from - " + packet.from);
    //     document.getElementById('chatty').innerHTML += '<div><b>' +
    //       packet.from + '</b>: ' + packet.message + '</div>';
    //   }
    // });

    socket.on('new-msg', function (game) {

      if (game.id == serverGame.id) {

        document.getElementById('chatty').innerHTML = '';
          for(i = 0; i<game.chat.length; i++)
          {
            var name_msg = game.chat[i].split(':',2);
            document.getElementById('chatty').innerHTML += '<div class="msg_bub">'+'<b>' + name_msg[0] +'</b>: '
              + name_msg[1]+ '</div>';
          }
          serverGame.chat = game.chat;
      }
    });

    //////////////////////////////
    // Menus
    //////////////////////////////
    $('#login').on('click', function () {
      username = $('#username').val();

      if (username.length > 0) {
        $('#userLabel').text(username);
        socket.emit('login', username);

        $('#page-login').hide();
        $('#page-lobby').show();
      }
    });

    $('#game-back').on('click', function () {
      socket.emit('login', username);

      $('#page-game').hide();
      $('#page-lobby').show();
    });

    $('#game-resign').on('click', function () {
      socket.emit('resign', {
        userId: username,
        gameId: serverGame.id
      });

      socket.emit('login', username);
      $('#page-game').hide();
      $('#page-lobby').show();
    });

    $('#sendmsg').on('click', function () {

      var msg = $('#message').val();
      var msg_packet = "\n\n"+username + ": "+msg+"\n\n";
      if (msg.length > 0) {
        serverGame.chat.push(msg_packet);
        
        // socket.emit('msg', serverGame.id, {
        //   message: msg,
        //   from: username
        // });
        
        socket.emit('msg',serverGame)

      }
      console.log("Sending Message.\nCurrent chat:-\n"+serverGame.chat);
      document.getElementById('message').value = "";
    });


    var addUser = function (userId) {
      usersOnline.push(userId);
      updateUserList();
    };

    var removeUser = function (userId) {
      for (var i = 0; i < usersOnline.length; i++) {
        if (usersOnline[i] === userId) {
          usersOnline.splice(i, 1);
        }
      }

      updateUserList();
    };

    var updateGamesList = function () {
      document.getElementById('gamesList').innerHTML = '';
      myGames.forEach(function (game) {
        $('#gamesList').append($('<button>')
          .text('#' + game)
          .on('click', function () {
            socket.emit('resumegame', game);
          }));
      });
    };

    var updateUserList = function () {
      document.getElementById('userList').innerHTML = '';
      usersOnline.forEach(function (user) {
        $('#userList').append($('<button>')
          .text(user)
          .on('click', function () {
            socket.emit('invite', user);
          }));
      });
    };

    //////////////////////////////
    // Chess Game
    //////////////////////////////

    var initGame = function (serverGameState, oppon) {
      serverGame = serverGameState;

      var cfg = {
        draggable: true,
        showNotation: false,
        orientation: playerColor,
        position: serverGame.board ? serverGame.board : 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
      };

      game = serverGame.board ? new Chess(serverGame.board) : new Chess();
      board = new ChessBoard('game-board', cfg);

      $('#name2').text(username);
      $('#name1').text(oppon);
      document.getElementById('chatty').innerHTML = '';
      
      for(i = 0; i<serverGame.chat.length; i++)
          {
            var name_msg = serverGame.chat[i].split(':',2);
            document.getElementById('chatty').innerHTML += '<div class="msg_bub">' +'<b>'+ name_msg[0] +'</b>: '
              + name_msg[1]+ '</div>';
          }
    }

    // do not pick up pieces if the game is over
    // only pick up pieces for the side to move
    var onDragStart = function (source, piece, position, orientation) {
      if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() !== playerColor[0])) {
        return false;
      }
    };

    var onDrop = function (source, target) {
      // see if the move is legal
      var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
      });

      // illegal move
      if (move === null) {
        return 'snapback';
      } else {
        socket.emit('move', {
          move: move,
          gameId: serverGame.id,
          board: game.fen()
        });
      }

    };

    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    var onSnapEnd = function () {
      board.position(game.fen());
    };
  });
})();