// server.js (MODIFICADO COM MONGODB)

const http = require('http');
const path = require('path');
const express = require('express');
const crypto = require('crypto');
const socketIo = require('socket.io');

// NOVO: Mongoose e DotEnv
const mongoose = require('mongoose');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

// NOVO: Importar o modelo do jogador
const Player = require('./models/Player');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000; // Importante para o Render

// --- "Banco de Dados" em memória REMOVIDO ---
// let playersDB = {}; // Removido

// --- Funções de Persistência (Removidas) ---
// ...

app.use(express.json());
app.use(express.static(__dirname));

// --- API ROUTES (Modificadas com async/await) ---

// [API] Rota para criar um novo jogador
app.post('/api/player', async (req, res) => {
    try {
        const playerId = crypto.randomBytes(8).toString('hex');
        
        // Usa o Schema do Mongoose para criar o novo jogador
        const newPlayer = new Player({
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
        });

        await newPlayer.save(); // Salva no MongoDB
        
        console.log(`Novo jogador criado. ID: ${playerId}`);
        
        io.emit('playerCreated', newPlayer); // Notifica todos os clientes
        res.json(newPlayer);

    } catch (error) {
        console.error("Erro ao criar jogador:", error);
        res.status(500).json({ error: "Falha ao criar jogador" });
    }
});

// [API] Rota para o Mestre buscar TODOS os jogadores
app.get('/api/players', async (req, res) => {
    try {
        const players = await Player.find({}); // Busca todos os jogadores no DB
        res.json(players);
    } catch (error) {
        console.error("Erro ao buscar jogadores:", error);
        res.status(500).json({ error: "Falha ao buscar jogadores" });
    }
});

// [API] Rota para um jogador buscar SEUS dados
app.get('/api/player/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Busca um jogador pelo campo "id" customizado
        const playerData = await Player.findOne({ id: id }); 
        
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
app.post('/api/player/:id/update', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Encontra o jogador pelo "id" e atualiza com os dados do req.body
        // { new: true } retorna o documento atualizado
        const updatedPlayer = await Player.findOneAndUpdate(
            { id: id }, 
            req.body, 
            { new: true, runValidators: true, strict: false }
        );

        if (updatedPlayer) {
            console.log(`Dados salvos para o jogador: ${updatedPlayer.nome || id}`);
            
            // Emite a atualização para todos os clientes
            io.emit('playerUpdated', updatedPlayer);
            
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
app.post('/api/player/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPlayer = await Player.findOneAndDelete({ id: id });

        if (deletedPlayer) {
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


// --- PAGE ROUTES (Modificadas com async/await) ---

app.get('/dm', (req, res) => {
    res.sendFile(path.join(__dirname, 'dm.html'));
});

app.get('/player/:id', async (req, res) => { // Rota agora é async
    try {
        // Verifica se o jogador existe no DB
        const player = await Player.findOne({ id: req.params.id }); 
        
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


// --- NOVO: Start the server & Connect to MongoDB ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('A variável de ambiente MONGODB_URI não foi definida!');
}

console.log('Conectando ao MongoDB...');
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Conectado ao MongoDB com sucesso!');
        
        // Inicia o servidor APENAS após conectar ao DB
        server.listen(port, () => {
            console.log(`Servidor rodando com sucesso!`);
            console.log(`Acesse o Escudo do Mestre em: http://localhost:${port}/dm`);
        });
    })
    .catch(err => {
        console.error('Falha ao conectar ao MongoDB:', err);
        process.exit(1); // Encerra o processo se não conseguir conectar
    });