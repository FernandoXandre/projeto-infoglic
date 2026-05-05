const Medicamento = require('../models/Medicamento');
const RegistroMedicacao = require('../models/RegistroMedicacao');

// Retorna meia-noite UTC do dia atual em Brasília
function diaBrasilia() {
  const agora = new Date();
  const str = agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  return new Date(`${str}T00:00:00.000Z`);
}

// RF07 – Listar medicamentos ativos do usuário
const listarMedicamentos = async (req, res) => {
  try {
    const meds = await Medicamento.find({ cliente: req.usuario._id, ativo: true }).sort({ createdAt: 1 });
    res.json({ sucesso: true, dados: meds });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar medicamentos.' });
  }
};

// RF07 – Criar medicamento
const criarMedicamento = async (req, res) => {
  try {
    const { nome, dosagem, tipo, horarios } = req.body;
    const med = await Medicamento.create({ cliente: req.usuario._id, nome, dosagem, tipo, horarios });
    res.status(201).json({ sucesso: true, dados: med });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagem = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, mensagem });
    }
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar medicamento.' });
  }
};

// RF07 – Editar medicamento (somente o dono)
const atualizarMedicamento = async (req, res) => {
  try {
    const med = await Medicamento.findOne({ _id: req.params.id, cliente: req.usuario._id });
    if (!med) return res.status(404).json({ sucesso: false, mensagem: 'Medicamento não encontrado.' });

    const { nome, dosagem, tipo, horarios } = req.body;
    if (nome     !== undefined) med.nome     = nome;
    if (dosagem  !== undefined) med.dosagem  = dosagem;
    if (tipo     !== undefined) med.tipo     = tipo;
    if (horarios !== undefined) med.horarios = horarios;

    await med.save();
    res.json({ sucesso: true, dados: med });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagem = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, mensagem });
    }
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar medicamento.' });
  }
};

// RF07 – Desativar medicamento (soft delete)
const desativarMedicamento = async (req, res) => {
  try {
    const med = await Medicamento.findOneAndUpdate(
      { _id: req.params.id, cliente: req.usuario._id },
      { ativo: false },
      { new: true }
    );
    if (!med) return res.status(404).json({ sucesso: false, mensagem: 'Medicamento não encontrado.' });
    res.json({ sucesso: true, mensagem: 'Medicamento removido.' });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover medicamento.' });
  }
};

// RF07 – Listar registros de medicação do dia atual
const listarRegistrosDia = async (req, res) => {
  try {
    const dia = diaBrasilia();
    const amanha = new Date(dia.getTime() + 24 * 60 * 60 * 1000);

    const registros = await RegistroMedicacao.find({
      cliente: req.usuario._id,
      dataDia: { $gte: dia, $lt: amanha },
    }).populate('medicamento', 'nome dosagem tipo');

    res.json({ sucesso: true, dados: registros });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar registros do dia.' });
  }
};

// RF07 – Registrar confirmação de dose (tomado / pulado / adiado)
const criarRegistro = async (req, res) => {
  try {
    const { medicamentoId, horarioProgramado, status, localAplicacao, observacao } = req.body;

    const med = await Medicamento.findOne({ _id: medicamentoId, cliente: req.usuario._id, ativo: true });
    if (!med) return res.status(404).json({ sucesso: false, mensagem: 'Medicamento não encontrado.' });

    if (!med.horarios.includes(horarioProgramado)) {
      return res.status(400).json({ sucesso: false, mensagem: 'Horário não pertence a este medicamento.' });
    }

    const dia = diaBrasilia();

    // Upsert: atualiza se já existe registro para este (medicamento, horario, dia)
    const registro = await RegistroMedicacao.findOneAndUpdate(
      { cliente: req.usuario._id, medicamento: medicamentoId, horarioProgramado, dataDia: dia },
      { status, localAplicacao, observacao },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ sucesso: true, dados: registro });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagem = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, mensagem });
    }
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao registrar dose.' });
  }
};

// RF07 – Histórico de locais de aplicação (rodízio de insulina)
const historicoLocais = async (req, res) => {
  try {
    const registros = await RegistroMedicacao.find({
      cliente: req.usuario._id,
      medicamento: req.params.id,
      status: 'tomado',
      localAplicacao: { $exists: true, $ne: '' },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('localAplicacao dataDia horarioProgramado');

    res.json({ sucesso: true, dados: registros });
  } catch {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar histórico.' });
  }
};

module.exports = {
  listarMedicamentos,
  criarMedicamento,
  atualizarMedicamento,
  desativarMedicamento,
  listarRegistrosDia,
  criarRegistro,
  historicoLocais,
};
