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
    const { mes } = req.query;

    let inicio, fim;
    if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      const [ano, mesNum] = mes.split('-').map(Number);
      inicio = new Date(Date.UTC(ano, mesNum - 1, 1));
      fim    = new Date(Date.UTC(ano, mesNum,     1));
    } else {
      const str = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
      const [ano, mesNum] = str.split('-').map(Number);
      inicio = new Date(Date.UTC(ano, mesNum - 1, 1));
      fim    = new Date(Date.UTC(ano, mesNum,     1));
    }

    const registros = await RegistroGlicemico.find({
      cliente:  req.usuario._id,
      dataHora: { $gte: inicio, $lt: fim },
    }).sort({ dataHora: -1 });

    res.json({ sucesso: true, dados: registros, total: registros.length });
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

// RF04 – Meses que possuem ao menos um registro (YYYY-MM, ordenado)
const listarMeses = async (req, res) => {
  try {
    const registros = await RegistroGlicemico.find(
      { cliente: req.usuario._id },
      { dataHora: 1 }
    ).lean();

    const set = new Set(
      registros.map(r =>
        new Date(r.dataHora)
          .toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
          .slice(0, 7)
      )
    );

    res.json({ sucesso: true, dados: [...set].sort() });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar meses.' });
  }
};

module.exports = { criar, listar, atualizar, remover, listarMeses };
