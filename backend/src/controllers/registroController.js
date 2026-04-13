const RegistroGlicemico = require('../models/RegistroGlicemico');

// RF04 – Criar registro glicêmico (autenticado + usuário padrão)
const criar = async (req, res) => {
  try {
    const { valor, dataHora, estado, observacao } = req.body;

    const dataHoraDate = dataHora ? new Date(dataHora) : new Date();
    if (dataHoraDate > new Date()) {
      return res.status(400).json({ sucesso: false, mensagem: 'Não é permitido registrar datas futuras.' });
    }

    const registro = await RegistroGlicemico.create({
      cliente: req.usuario._id,
      valor,
      dataHora: dataHoraDate,
      estado,
      observacao,
    });
    res.status(201).json({ sucesso: true, dados: registro });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagem = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, mensagem });
    }
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar registro glicêmico.' });
  }
};

// RF04 – Listar registros do usuário autenticado (mais recente primeiro)
const listar = async (req, res) => {
  try {
    const registros = await RegistroGlicemico.find({ cliente: req.usuario._id })
      .sort({ dataHora: -1 })
      .limit(100);
    res.json({ sucesso: true, dados: registros });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar registros.' });
  }
};

// RF04 – Editar registro (somente o dono)
const atualizar = async (req, res) => {
  try {
    const registro = await RegistroGlicemico.findOne({
      _id: req.params.id,
      cliente: req.usuario._id,
    });
    if (!registro) {
      return res.status(404).json({ sucesso: false, mensagem: 'Registro não encontrado.' });
    }

    const { valor, dataHora, estado, observacao } = req.body;

    if (dataHora !== undefined) {
      const dataHoraDate = new Date(dataHora);
      if (dataHoraDate > new Date()) {
        return res.status(400).json({ sucesso: false, mensagem: 'Não é permitido registrar datas futuras.' });
      }
      registro.dataHora = dataHoraDate;
    }

    if (valor !== undefined) registro.valor = valor;
    if (estado !== undefined) registro.estado = estado;
    if (observacao !== undefined) registro.observacao = observacao;

    await registro.save();
    res.json({ sucesso: true, dados: registro });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagem = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, mensagem });
    }
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar registro.' });
  }
};

// RF04 – Remover registro (somente o dono)
const remover = async (req, res) => {
  try {
    const registro = await RegistroGlicemico.findOneAndDelete({
      _id: req.params.id,
      cliente: req.usuario._id,
    });
    if (!registro) {
      return res.status(404).json({ sucesso: false, mensagem: 'Registro não encontrado.' });
    }
    res.json({ sucesso: true, mensagem: 'Registro removido com sucesso.' });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover registro.' });
  }
};

module.exports = { criar, listar, atualizar, remover };
