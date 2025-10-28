// server.js (REVERTIDO PARA BANCO EM MEMÓRIA)

const http = require('http');
const path = require('path');
const express = require('express');
const crypto = require('crypto');
const socketIo = require('socket.io');

// --- Mongoose e DotEnv REMOVIDOS ---
// const mongoose = require('mongoose');
// require('dotenv').config(); 
// const Player = require('./models/Player');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;

// --- "Banco de Dados" em memória RE-ADICIONADO ---
let playersDB = {}; // Armazena os jogadores aqui

// --- Funções de Persistência (Removidas) ---
// ...

app.use(express.json());
app.use(express.static(__dirname));

// --- API ROUTES (Modificadas sem async/await) ---

// [API] Rota para criar um novo jogador
app.post('/api/player', (req, res) => {
    try {
        const playerId = crypto.randomBytes(8).toString('hex');
        
        // Objeto padrão do novo jogador
        const newPlayer = {
            id: playerId,
            nome: "Novo Mutante",
            papel: "",
            imagemUrl: "",
            forca: 0, agilidade: 0, astucia: 0, empatia: 0,
            dano1: 'off', dano2: 'off', dano3: 'off', dano4: 'off', dano5: 'off',
            fadiga1: 'off', fadiga2: 'off', fadiga3: 'off', fadiga4: 'off', fadiga5: 'off',
            confusao1: 'off', confusao2: 'off', confusao3: 'off', confusao4: 'off', confusao5: 'off',
            duvida1: 'off', duvida2: 'off', duvida3: 'off', duvida4: 'off', duvida5: 'off',
            faminto: 'off', desidratado: 'off', insone: 'off', hipotermico: 'off',
            'pontos-mutacao': 10,
            protecao: 0,
            balas: 0
        };

        playersDB[playerId] = newPlayer; // Salva no objeto em memória
        
        console.log(`Novo jogador criado. ID: ${playerId}`);
        
        io.emit('playerCreated', newPlayer); // Notifica todos os clientes
        res.json(newPlayer);

    } catch (error) {
        console.error("Erro ao criar jogador:", error);
        res.status(500).json({ error: "Falha ao criar jogador" });
    }
});

// [API] Rota para o Mestre buscar TODOS os jogadores
app.get('/api/players', (req, res) => {
    try {
        // Converte o objeto de jogadores em um array
        const players = Object.values(playersDB); 
        res.json(players);
    } catch (error) {
        console.error("Erro ao buscar jogadores:", error);
        res.status(500).json({ error: "Falha ao buscar jogadores" });
    }
});

// [API] Rota para um jogador buscar SEUS dados
app.get('/api/player/:id', (req, res) => {
    try {
        const { id } = req.params;
        const playerData = playersDB[id]; // Busca no objeto em memória
        
        if (playerData) {
            res.json(playerData);
        } else {
            res.status(404).json({ error: "Jogador não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao buscar jogador:", error);
        res.status(500).json({ error: "Falha ao buscar jogador" });
    }
});

// [API] Rota para um jogador SALVAR seus dados
app.post('/api/player/:id/update', (req, res) => {
    try {
        const { id } = req.params;
        const updatedPlayer = playersDB[id];

        if (updatedPlayer) {
            // Atualiza os dados do jogador em memória mesclando o req.body
            playersDB[id] = { ...updatedPlayer, ...req.body };
            
            console.log(`Dados salvos para o jogador: ${playersDB[id].nome || id}`);
            
            // Emite a atualização para todos os clientes
            io.emit('playerUpdated', playersDB[id]);
            
            res.json({ success: true, message: "Dados salvos." });
        } else {
            res.status(404).json({ error: "Jogador não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao salvar dados:", error);
        res.status(500).json({ error: "Falha ao salvar dados" });
    }
});

// [API] Rota para REMOVER um jogador
app.post('/api/player/:id/delete', (req, res) => {
    try {
        const { id } = req.params;
        const deletedPlayer = playersDB[id];

        if (deletedPlayer) {
            delete playersDB[id]; // Remove do objeto em memória
            
            console.log(`Jogador removido: ${deletedPlayer.nome} (ID: ${id})`);
            
            // Notifica todos os clientes que este jogador foi removido
            io.emit('playerDeleted', id); 
            
            res.json({ success: true, message: "Jogador removido." });
        } else {
            res.status(404).json({ error: "Jogador não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao remover jogador:", error);
        res.status(500).json({ error: "Falha ao remover jogador" });
    }
});


// --- PAGE ROUTES (Modificadas sem async/await) ---

app.get('/dm', (req, res) => {
    res.sendFile(path.join(__dirname, 'dm.html'));
});

app.get('/player/:id', (req, res) => { // Rota não é mais async
    try {
        // Verifica se o jogador existe no DB em memória
        const player = playersDB[req.params.id]; 
        
        if (player) {
            res.sendFile(path.join(__dirname, 'index.html'));
        } else {
            res.status(404).send('<h1>404 - Ficha de Jogador Não Encontrada</h1><p>Verifique o link ou peça ao Mestre para criar uma nova ficha.</p>');
        }
    } catch (error) {
        res.status(500).send('<h1>Erro no servidor ao buscar jogador</h1>');
    }
});

app.get('/', (req, res) => {
    res.redirect('/dm');
});


// --- SOCKET.IO EVENTS (Sem mudanças) ---
io.on('connection', (socket) => {
    console.log('Um cliente conectado');

    socket.on('playerRoll', (rollData) => {
        io.emit('rollResult', rollData);
    });

    socket.on('disconnect', () => {
        console.log('Um cliente desconectado');
    });
});


// --- NOVO: Start the server (Sem MongoDB) ---
server.listen(port, () => {
    console.log(`Servidor rodando com sucesso!`);
    console.log(`Acesse o Escudo do Mestre em: http://localhost:${port}/dm`);
});