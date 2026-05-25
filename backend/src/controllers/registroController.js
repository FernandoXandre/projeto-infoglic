const RegistroGlicemico = require('../models/RegistroGlicemico');
const { enviarEmail } = require('../config/email');

// RF06 – Envia e-mail de alerta para valores críticos (fire-and-forget)
async function alertarValorCritico(cliente, valor, dataHora) {
  const ehHipo       = valor < 70;
  const frontendUrl  = process.env.FRONTEND_URL || 'http://localhost:3000';
  const corHeader    = ehHipo ? '#dc2626' : '#d97706';
  const icone        = ehHipo ? '🩸' : '⚠️';
  const tituloAlerta = ehHipo
    ? `Hipoglicemia detectada: ${valor} mg/dL`
    : `Hiperglicemia detectada: ${valor} mg/dL`;

  const horarioFormatado = new Date(dataHora).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const instrucoes = ehHipo
    ? [
        'Consuma 15g de carboidratos de absorção rápida (suco de laranja, mel ou glicose)',
        'Aguarde 15 minutos e repita a medição',
        'Se o valor não subir, procure atendimento médico imediatamente',
      ]
    : [
        'Hidrate-se bem — beba bastante água',
        'Verifique se tomou a medicação conforme prescrita',
        'Consulte seu médico se o valor persistir elevado',
      ];

  await enviarEmail({
    para:    cliente.email,
    assunto: `⚠️ InfoGlic – ${tituloAlerta}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
        <div style="background:${corHeader};padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:1.4rem">💉 InfoGlic — Alerta Glicêmico</h1>
        </div>
        <div style="background:#f8fafc;padding:28px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
          <p style="margin:0 0 16px">Olá, <strong>${cliente.nome.split(' ')[0]}</strong>!</p>
          <div style="background:#fff;border:2px solid ${corHeader};border-radius:8px;padding:16px 20px;margin-bottom:20px">
            <p style="margin:0;font-size:1.1rem;font-weight:700;color:${corHeader}">${icone} ${tituloAlerta}</p>
            <p style="margin:8px 0 0;color:#475569;font-size:.9rem">Registrado em: <strong>${horarioFormatado}</strong></p>
          </div>
          <p style="margin:0 0 10px;font-weight:600">O que fazer agora:</p>
          <ul style="margin:0 0 24px;padding-left:20px;line-height:2">
            ${instrucoes.map(i => `<li>${i}</li>`).join('')}
          </ul>
          <a href="${frontendUrl}/dashboard"
             style="display:inline-block;padding:12px 28px;background:${corHeader};color:#fff;
                    border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">
            Abrir o InfoGlic →
          </a>
          <p style="margin-top:24px;color:#94a3b8;font-size:.8rem">
            Mantenha seus registros em dia para um melhor acompanhamento do seu controle glicêmico.
          </p>
        </div>
      </div>
    `,
  });
}

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

    // RF06 – Dispara alerta por e-mail se valor for crítico (não bloqueia a resposta)
    if (valor < 70 || valor > 180) {
      alertarValorCritico(req.usuario, valor, dataHoraDate).catch(err =>
        console.error('\x1b[31m❌ Alerta glicêmico não enviado:\x1b[0m', err.message)
      );
    }

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

    // RF06 – Alerta por e-mail se o valor editado for crítico
    if (registro.valor < 70 || registro.valor > 180) {
      alertarValorCritico(req.usuario, registro.valor, registro.dataHora).catch(err =>
        console.error('\x1b[31m❌ Alerta glicêmico (edição) não enviado:\x1b[0m', err.message)
      );
    }

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
