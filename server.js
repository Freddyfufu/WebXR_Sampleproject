const https = require('https');
const fs = require('fs');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors'); // Importiere das CORS-Paket

const app = express();
const ipv4 = "192.168.137.1";
//
const quizQuestions = require('./quiz.js').quizQuestions;

// Aktivieren von CORS für Express
app.use(cors({
    origin: ['https://' + ipv4 + ':8081'], // Erlaube nur Anfragen Web-Server
    methods: ['GET', 'POST'],
    credentials: true, // Damit Cookies und Sitzungen mit übertragen werden können
}));

const server = https.createServer({
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost.pem'),
}, app);

let players = [];
let quiz_active = false;
let quiz = {};

const io = socketIo(server, {
    cors: {
        origin: ['https://' + ipv4 + ':8081'], // Erlaube nur Anfragen von deinem Web-Server
        methods: ['GET', 'POST'],
        credentials: true, // Damit Cookies und Sitzungen mit übertragen werden können
    }
});

io.on('connection', (socket) => {
    const userAgent = socket.handshake.headers['user-agent'];
    console.log('Neuer Spieler verbunden mit User-Agent:', userAgent);
    socket.emit('player_joined', players);
    socket.on('player_added', (data) => {
        if (!data.dolly) {
            console.log('No dolly found.');
            return;
        }
        console.log('Player added:', data);
        let newPlayer = {id: socket.id, dolly: data.dolly};
        players.push(newPlayer);
        console.log("All players:", players);
        socket.broadcast.emit("add_player", newPlayer, players);
        // only send to the new player to update the other players
    });
    socket.on("player_removed", (socket_id) => {
        console.log('Player removed:', socket_id.socket_id);
        players = players.filter(player => player.id !== socket_id.socket_id);
        socket.broadcast.emit('remove_player', socket_id.socket_id);
        console.log("All players:", players);
        // socket.emit('update_players', {players:players, removed:socket_id.socket_id});
    });

    socket.on('quiz_answer', (data) => {
        console.log('Quiz answer SERVER:', data);
        io.emit('eval_answer', data.id, data.option === quiz.correctAnswer);
        quiz_active = false;

    });
    socket.on('request_quiz', (data) => {
            if (quiz_active) {
                console.log('Quiz already active');
                return;
            }
            quiz_active = true;
            console.log(data)
            console.log('Quiz requested');
            quiz = quizQuestions[data.exponat];
            let quiz_to_users = {name: data.exponat, question: quiz.question, options: quiz.options};
            console.log(quiz);
            io.emit('start_quiz', quiz_to_users);
            // start timer
            setTimeout(() => {
                quiz_active = false;
                console.log('Quiz ended');
                io.emit('end_quiz');
            }, 10000);
        }
    );


    // Wenn der Spieler die Verbindung trennt, entferne ihn aus der Liste
    socket.on('disconnect', () => {
        console.log('A player has disconnected.');
        players = players.filter(player => player.id !== socket.id); // Entferne den Spieler
        socket.broadcast.emit('remove_player', socket.id);
    });


    socket.on('update_character', (data) => {
        socket.broadcast.emit('update_character', data);
    });
});

server.listen(3000, ipv4, () => {
    console.log('WebSocket server is running on https://' + ipv4 + ':3000');
});
