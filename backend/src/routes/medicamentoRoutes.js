const express = require('express');
const router = express.Router();
const {
  listarMedicamentos,
  criarMedicamento,
  atualizarMedicamento,
  desativarMedicamento,
  listarRegistrosDia,
  criarRegistro,
  historicoLocais,
  historicoDoses,
} = require('../controllers/medicamentoController');
const { proteger } = require('../middleware/authMiddleware');

// Rotas de medicamentos (todas exigem autenticação)
router.get('/',    proteger, listarMedicamentos);
router.post('/',   proteger, criarMedicamento);
router.put('/:id', proteger, atualizarMedicamento);
router.delete('/:id', proteger, desativarMedicamento);

// RF07 – Checklist diário (registros de doses)
// Definidos antes de /:id para evitar conflito de rota
router.get('/registros/hoje',    proteger, listarRegistrosDia);
router.post('/registros/hoje',   proteger, criarRegistro);

router.get('/registros/historico', proteger, historicoDoses);

// RF07 – Histórico de locais de aplicação (rodízio de insulina)
router.get('/:id/locais', proteger, historicoLocais);

module.exports = router;
