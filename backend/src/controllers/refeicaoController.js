const Refeicao = require('../models/Refeicao');
const RegistroGlicemico = require('../models/RegistroGlicemico');

const MAX_FOTO_BYTES = 400 * 1024; // 400 KB

// RF08 – Criar refeição
const criar = async (req, res) => {
  try {
    const { dataHora, foto, carboidratos, descricao } = req.body;

    if (foto && Buffer.byteLength(foto, 'utf8') > MAX_FOTO_BYTES) {
      return res.status(400).json({ sucesso: false, mensagem: 'Foto excede o limite de 400 KB.' });
    }

    const refeicao = await Refeicao.create({
      cliente: req.usuario._id,
      dataHora,
      foto,
      carboidratos,
      descricao,
    });

    res.status(201).json({ sucesso: true, dados: refeicao });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagem = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, mensagem });
    }
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar refeição.' });
  }
};

// RF08 – Listar refeições dos últimos N dias
const listar = async (req, res) => {
  try {
    const dias = Math.min(parseInt(req.query.dias) || 7, 90);
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);

    const refeicoes = await Refeicao.find({
      cliente: req.usuario._id,
      dataHora: { $gte: desde },
    })
      .populate('registroVinculado', 'valor estado dataHora')
      .sort({ dataHora: -1 })
      .limit(100);

    res.json({ sucesso: true, dados: refeicoes });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar refeições.' });
  }
};

// RF08 – Atualizar refeição (somente o dono)
const atualizar = async (req, res) => {
  try {
    const refeicao = await Refeicao.findOne({
      _id: req.params.id,
      cliente: req.usuario._id,
    });

    if (!refeicao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Refeição não encontrada.' });
    }

    const { dataHora, foto, carboidratos, descricao } = req.body;

    if (foto !== undefined) {
      if (foto && Buffer.byteLength(foto, 'utf8') > MAX_FOTO_BYTES) {
        return res.status(400).json({ sucesso: false, mensagem: 'Foto excede o limite de 400 KB.' });
      }
      refeicao.foto = foto;
    }
    if (dataHora !== undefined) refeicao.dataHora = dataHora;
    if (carboidratos !== undefined) refeicao.carboidratos = carboidratos;
    if (descricao !== undefined) refeicao.descricao = descricao;

    await refeicao.save();
    await refeicao.populate('registroVinculado', 'valor estado dataHora');

    res.json({ sucesso: true, dados: refeicao });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagem = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, mensagem });
    }
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar refeição.' });
  }
};

// RF08 – Remover refeição (somente o dono)
const remover = async (req, res) => {
  try {
    const refeicao = await Refeicao.findOneAndDelete({
      _id: req.params.id,
      cliente: req.usuario._id,
    });

    if (!refeicao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Refeição não encontrada.' });
    }

    res.json({ sucesso: true, mensagem: 'Refeição removida com sucesso.' });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover refeição.' });
  }
};

// RF08 – Vincular / desvincular refeição a um teste glicêmico pós-prandial
const vincular = async (req, res) => {
  try {
    const refeicao = await Refeicao.findOne({
      _id: req.params.id,
      cliente: req.usuario._id,
    });

    if (!refeicao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Refeição não encontrada.' });
    }

    const { registroId } = req.body;

    if (registroId) {
      const registro = await RegistroGlicemico.findOne({
        _id: registroId,
        cliente: req.usuario._id,
      });

      if (!registro) {
        return res.status(404).json({ sucesso: false, mensagem: 'Registro glicêmico não encontrado.' });
      }

      if (registro.estado !== 'Pós-prandial') {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Apenas testes Pós-prandiais podem ser vinculados a uma refeição.',
        });
      }

      refeicao.registroVinculado = registroId;
    } else {
      refeicao.registroVinculado = null;
    }

    await refeicao.save();
    await refeicao.populate('registroVinculado', 'valor estado dataHora');

    res.json({ sucesso: true, dados: refeicao });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao vincular refeição.' });
  }
};

module.exports = { criar, listar, atualizar, remover, vincular };
