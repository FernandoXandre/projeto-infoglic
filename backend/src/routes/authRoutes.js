const express = require('express');
const router = express.Router();
const { login, ativarConta, recuperarSenha, redefinirSenha } = require('../controllers/authController');
const { validarLogin, validarRecuperarSenha, validarRedefinirSenha, checarErros } = require('../middleware/validacoes');

// RF02 – POST /api/auth/login
router.post('/login', validarLogin, checarErros, login);

// RF01 – GET /api/auth/ativar/:token
router.get('/ativar/:token', ativarConta);

// RF03 – POST /api/auth/recuperar-senha
router.post('/recuperar-senha', validarRecuperarSenha, checarErros, recuperarSenha);

// RF03 – POST /api/auth/redefinir-senha/:token
router.post('/redefinir-senha/:token', validarRedefinirSenha, checarErros, redefinirSenha);

module.exports = router;
