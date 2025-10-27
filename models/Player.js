// models/Player.js

const mongoose = require('mongoose');

// Este é o "esquema" que define como um jogador é salvo no MongoDB
const playerSchema = new mongoose.Schema({
    // O ID customizado que você já usa (para a URL /player/:id)
    id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    
    // Campos Básicos
    nome: String,
    papel: String,
    imagemUrl: String,

    // Atributos e Trauma
    forca: Number,
    agilidade: Number,
    astucia: Number,
    empatia: Number,

    dano1: String, dano2: String, dano3: String, dano4: String, dano5: String,
    fadiga1: String, fadiga2: String, fadiga3: String, fadiga4: String, fadiga5: String,
    confusao1: String, confusao2: String, confusao3: String, confusao4: String, confusao5: String,
    duvida1: String, duvida2: String, duvida3: String, duvida4: String, duvida5: String,

    // Condições
    faminto: String,
    desidratado: String,
    insone: String,
    hipotermico: String,

    // Trackers
    'pontos-mutacao': Number,
    protecao: Number,
    balas: Number,
    'pontos-experiencia': Number, // Adicionando campos da ficha

    // Textareas
    historia: String,
    ferimentos: String,
    talentos: String,
    mutacoes: String,
    habilidadesMutacao: String,
    equipamento: String,
    'itens-pequenos': String,
    notas: String,

    // Perícias (apenas as padrão, as customizadas são salvas separadamente)
    atirar: Number,
    compreender: Number,
    'conhecer-zona': Number,
    curar: Number,
    esgueirar: Number,
    impelir: Number,
    lutar: Number,
    manipular: Number,
    mover: Number,
    observar: Number,
    'sentir-emocoes': Number,
    suportar: Number,

    // Armas (Exemplo para 3 armas)
    'arma-1-nome': String, 'arma-1-bonus': Number, 'arma-1-dano': Number, 'arma-1-alcance': String, 'arma-1-obs': String,
    'arma-2-nome': String, 'arma-2-bonus': Number, 'arma-2-dano': Number, 'arma-2-alcance': String, 'arma-2-obs': String,
    'arma-3-nome': String, 'arma-3-bonus': Number, 'arma-3-dano': Number, 'arma-3-alcance': String, 'arma-3-obs': String,

    // Perícias Customizadas (salvas como strings)
}, { 
    // Isso permite salvar campos que não estão no esquema acima
    // Útil para as perícias customizadas (ex: "custom-skill-name-12345")
    strict: false 
});

// "Player" será o nome da "coleção" (tabela) no MongoDB
const Player = mongoose.model('Player', playerSchema);

module.exports = Player;