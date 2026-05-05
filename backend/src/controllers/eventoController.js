const EventoExterno = require('../models/EventoExterno');

function diaBrasilia(dataStr) {
  const str = dataStr
    ? new Date(dataStr).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    : new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  return new Date(`${str}T00:00:00.000Z`);
}

// RF12 – Listar eventos dos últimos N dias (padrão: 30, para cobrir o gráfico)
const listarEventos = async (req, res) => {
  try {
    const dias = Math.min(parseInt(req.query.dias) || 30, 90);
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);

    const eventos = await EventoExterno.find({
      cliente: req.usuario._id,
      dataDia: { $gte: limite },
    }).sort({ dataDia: -1 });

    res.json({ sucesso: true, dados: eventos });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar eventos.' });
  }
};

// RF12 – Salvar evento do dia (cria ou atualiza — upsert por dia)
const salvarEvento = async (req, res) => {
  try {
    const { tags, observacao, data } = req.body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Selecione pelo menos uma tag.' });
    }

    const dataDia = diaBrasilia(data);

    const evento = await EventoExterno.findOneAndUpdate(
      { cliente: req.usuario._id, dataDia },
      { tags, observacao },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ sucesso: true, dados: evento });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagem = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, mensagem });
    }
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar evento.' });
  }
};

// RF12 – Remover evento
const removerEvento = async (req, res) => {
  try {
    const evento = await EventoExterno.findOneAndDelete({
      _id: req.params.id,
      cliente: req.usuario._id,
    });
    if (!evento) return res.status(404).json({ sucesso: false, mensagem: 'Evento não encontrado.' });
    res.json({ sucesso: true, mensagem: 'Evento removido.' });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover evento.' });
  }
};

module.exports = { listarEventos, salvarEvento, removerEvento };
