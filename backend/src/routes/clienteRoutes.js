const express = require('express');
const router = express.Router();
const { cadastrarCliente, listarClientes, buscarClientePorId, obterPerfil, atualizarPerfil } = require('../controllers/clienteController');
const { validarCadastroCliente, checarErros } = require('../middleware/validacoes');
const { proteger, apenasAdmin } = require('../middleware/authMiddleware');

// RF01 - POST /api/clientes - Cadastro de cliente
router.post('/', validarCadastroCliente, checarErros, cadastrarCliente);

// GET /api/clientes - Listar todos (somente admin)
router.get('/', proteger, apenasAdmin, listarClientes);

// RF09 – GET/PATCH /api/clientes/perfil — deve vir antes de /:id
router.get('/perfil', proteger, obterPerfil);
router.patch('/perfil', proteger, atualizarPerfil);

// GET /api/clientes/:id - Buscar por ID (autenticado)
router.get('/:id', proteger, buscarClientePorId);

module.exports = router;