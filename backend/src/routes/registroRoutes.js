const express = require('express');
const router = express.Router();
const { criar, listar, atualizar, remover } = require('../controllers/registroController');
const { proteger, apenasUsuarioPadrao } = require('../middleware/authMiddleware');

// RF04 – Registro de Teste Glicêmico
// Criar: exige autenticação + role 'user'
router.post('/', proteger, apenasUsuarioPadrao, criar);

// Listar, editar e remover: apenas autenticação (verifica dono no controller)
router.get('/', proteger, listar);
router.put('/:id', proteger, atualizar);
router.delete('/:id', proteger, remover);

module.exports = router;
