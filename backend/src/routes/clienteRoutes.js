const express = require('express');
const router = express.Router();
const { cadastrarCliente, listarClientes, buscarClientePorId } = require('../controllers/clienteController');
const { validarCadastroCliente, checarErros } = require('../middleware/validacoes');

// RF01 - POST /api/clientes - Cadastro de cliente
router.post('/', validarCadastroCliente, checarErros, cadastrarCliente);

// GET /api/clientes - Listar todos os clientes
router.get('/', listarClientes);

// GET /api/clientes/:id - Buscar cliente por ID
router.get('/:id', buscarClientePorId);

module.exports = router;