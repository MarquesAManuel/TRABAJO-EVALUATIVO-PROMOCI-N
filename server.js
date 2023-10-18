const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Configuración del juego
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 10;
let paddles = {
  paddle1: { y: 200 },
  paddle2: { y: 200 }
};
let ball = { x: 300, y: 200, speedX: 5, speedY: 2 };

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
  });
  

  socket.on('move', (data) => {
    // Mover paletas
    if (data.player === 'paddle1') {
      movePaddle(paddles.paddle1, data.direction);
    } else if (data.player === 'paddle2') {
      movePaddle(paddles.paddle2, data.direction);
    }
    // Transmitir las nuevas posiciones de las paletas a todos los clientes
    io.emit('move', { paddles, ball });
  });
});

// Agregar variables para llevar un registro de los puntajes
let score = {
    player1: 0,
    player2: 0
  };

// Función para mover las paletas
function movePaddle(paddle, direction) {
  if (direction === 'up' && paddle.y > 0) {
    paddle.y -= 10;
  } else if (direction === 'down' && paddle.y < 400 - paddleHeight) {
    paddle.y += 10;
  }
}

// Función para actualizar la posición de la pelota
function updateBall() {
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  // Colisión con las paletas
  if (
    ball.x < 20 &&
    ball.x + ballSize > 10 + paddleWidth &&
    ball.y > paddles.paddle1.y &&
    ball.y < paddles.paddle1.y + paddleHeight
  ) {
    ball.speedX = -ball.speedX;
  } else if (
    ball.x > 570 &&
    ball.x + ballSize < 580 + paddleWidth &&
    ball.y > paddles.paddle2.y &&
    ball.y < paddles.paddle2.y + paddleHeight
  ) {
    ball.speedX = -ball.speedX;
  }

  // Colisión con las paredes superior e inferior
  if (ball.y < 0 || ball.y > 400 - ballSize) {
    ball.speedY = -ball.speedY;
  }


  if (ball.x < 0) {
    // Jugador 2 anota un punto
    score.player2++;
    resetGame();
  } else if (ball.x > 600) {
    // Jugador 1 anota un punto
    score.player1++;
    resetGame();
  }
}

// Función para reiniciar el juego
function resetGame() {
    ball.x = 300;
    ball.y = 200;
    ball.speedX = 5;
    ball.speedY = 2;
}
// Función para actualizar el juego en intervalos regulares
function gameLoop() {
    updateBall();
    io.emit('move', { paddles, ball, score }); // Transmitir puntajes
}


setInterval(gameLoop, 1000 / 60); // 60 FPS

server.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
