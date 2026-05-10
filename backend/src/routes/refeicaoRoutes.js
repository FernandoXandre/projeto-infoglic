const express = require('express');
const router = express.Router();
const { criar, listar, atualizar, remover, vincular } = require('../controllers/refeicaoController');
const { proteger, apenasUsuarioPadrao } = require('../middleware/authMiddleware');

router.use(proteger, apenasUsuarioPadrao);
router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);
router.patch('/:id/vincular', vincular);

module.exports = router;
