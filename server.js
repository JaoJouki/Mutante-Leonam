// server.js (COM BANCO DE DADOS MONGODB)

const http = require('http');
const path = require('path');
const express = require('express');
// const crypto = require('crypto'); // Não é mais necessário para IDs
const socketIo = require('socket.io');

// --- Mongoose e DotEnv ADICIONADOS ---
const mongoose = require('mongoose');
require('dotenv').config(); // Carrega o .env
const Player = require('./models/Player'); // Importa o "molde"

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;

// --- Banco de Dados em memória REMOVIDO ---
// let playersDB = {}; 

// --- Função de Conexão com o Banco ---
async function connectToDB() {
    try {
        // Pega a string de conexão do arquivo .env (ou das variáveis do Render)
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Conectado ao MongoDB com sucesso!");
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        process.exit(1); // Sai da aplicação se não conseguir conectar
    }
}

app.use(express.json());
app.use(express.static(__dirname));

// --- API ROUTES (Modificadas com async/await) ---

// [API] Rota para criar um novo jogador
app.post('/api/player', async (req, res) => { // 'async' adicionado
    try {
        // Cria um novo jogador com os valores padrão
        // definidos no Schema (models/Player.js)
        const newPlayer = new Player({});
        
        await newPlayer.save(); // Salva no banco de dados
        
        console.log(`Novo jogador criado. ID: ${newPlayer.id}`);
        
        // .toObject() é importante para enviar os dados com o 'id' virtual
        io.emit('playerCreated', newPlayer.toObject()); 
        res.json(newPlayer.toObject());

    } catch (error) {
        console.error("Erro ao criar jogador:", error);
        res.status(500).json({ error: "Falha ao criar jogador" });
    }
});

// [API] Rota para o Mestre buscar TODOS os jogadores
app.get('/api/players', async (req, res) => { // 'async' adicionado
    try {
        const players = await Player.find({}); // Busca todos no banco
        // Converte cada jogador para objeto para incluir o 'id' virtual
        res.json(players.map(p => p.toObject()));
    } catch (error) {
        console.error("Erro ao buscar jogadores:", error);
        res.status(500).json({ error: "Falha ao buscar jogadores" });
    }
});

// [API] Rota para um jogador buscar SEUS dados
app.get('/api/player/:id', async (req, res) => { // 'async' adicionado
    try {
        const { id } = req.params;
        const playerData = await Player.findById(id); // Busca pelo _id
        
        if (playerData) {
            res.json(playerData.toObject());
        } else {
            res.status(404).json({ error: "Jogador não encontrado" });
        }
    } catch (error) {
        console.error("Erro ao buscar jogador:", error);
        res.status(500).json({ error: "Falha ao buscar jogador" });
    }
});

// [API] Rota para um jogador SALVAR seus dados
app.post('/api/player/:id/update', async (req, res) => { // 'async' adicionado
    try {
        const { id } = req.params;
        
        // Encontra e atualiza o jogador.
        // 'new: true' retorna o documento atualizado
        // O req.body é salvo diretamente (funciona por causa do strict: false)
        const updatedPlayer = await Player.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true } 
        );

        if (updatedPlayer) {
            console.log(`Dados salvos para o jogador: ${updatedPlayer.nome || id}`);
            
            io.emit('playerUpdated', updatedPlayer.toObject());
            
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
app.post('/api/player/:id/delete', async (req, res) => { // 'async' adicionado
    try {
        const { id } = req.params;
        const deletedPlayer = await Player.findByIdAndDelete(id); // Deleta do banco

        if (deletedPlayer) {
            console.log(`Jogador removido: ${deletedPlayer.nome} (ID: ${id})`);
            
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

app.get('/player/:id', async (req, res) => { // 'async' adicionado
    try {
        const player = await Player.findById(req.params.id); // Busca no DB
        
        if (player) {
            res.sendFile(path.join(__dirname, 'index.html'));
        } else {
            res.status(404).send('<h1>404 - Ficha de Jogador Não Encontrada</h1><p>Verifique o link ou peça ao Mestre para criar uma nova ficha.</p>');
        }
    } catch (error) {
        // Trata erro de ID mal formatado (ex: ID curto demais)
        if (error.kind === 'ObjectId') {
             res.status(404).send('<h1>404 - Ficha de Jogador Não Encontrada</h1><p>O ID fornecido não é válido.</p>');
        } else {
            res.status(500).send('<h1>Erro no servidor ao buscar jogador</h1>');
        }
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


// --- NOVO: Start the server (COM MongoDB) ---
// Primeiro conecta ao banco, DEPOIS inicia o servidor
connectToDB().then(() => {
    server.listen(port, () => {
        console.log(`Servidor rodando com sucesso!`);
        console.log(`Acesse o Escudo do Mestre em: http://localhost:${port}/dm`);
    });
});