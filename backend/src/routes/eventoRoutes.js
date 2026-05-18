const express = require('express');
const router = express.Router();
const { listarEventos, listarMeses, salvarEvento, removerEvento } = require('../controllers/eventoController');
const { proteger } = require('../middleware/authMiddleware');

// RF12 – Eventos externos (todas exigem autenticação)
router.get('/meses',  proteger, listarMeses);
router.get('/',       proteger, listarEventos);
router.post('/',      proteger, salvarEvento);
router.delete('/:id', proteger, removerEvento);

module.exports = router;
