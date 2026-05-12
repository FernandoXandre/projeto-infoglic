const cron = require('node-cron');
const Cliente = require('../models/Cliente');
const RegistroGlicemico = require('../models/RegistroGlicemico');
const Refeicao = require('../models/Refeicao');
const { enviarEmail } = require('../config/email');

const DIAS_AUSENTE = 3;

// Cada janela define o período esperado (horas BRT) e quando notificar
const JANELAS_REFEICAO = [
  { nome: 'Café da manhã', inicio: 6,  fim: 10, cron: '0 11 * * *' }, // notifica às 11h
  { nome: 'Almoço',        inicio: 11, fim: 17, cron: '0 18 * * *' }, // notifica às 18h
  { nome: 'Jantar',        inicio: 18, fim: 22, cron: '0 22 * * *' }, // notifica às 22h
];

function inicioDoDia() {
  const str = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  return new Date(`${str}T00:00:00.000Z`);
}

// Converte hora BRT (inteiro) para Date UTC do dia de hoje
function horaBRTparaUTC(hora) {
  const hoje = inicioDoDia().toISOString().slice(0, 10);
  // BRT = UTC-3, então hora BRT + 3 = hora UTC
  const horaUTC = hora + 3;
  return new Date(`${hoje}T${String(horaUTC).padStart(2, '0')}:00:00.000Z`);
}

// ── Lembrete de refeição por janela ──────────────────────────────
async function verificarJanelaRefeicao(janela) {
  console.log(`\x1b[36m🍽️  Verificando ${janela.nome}...\x1b[0m`);

  const clientes = await Cliente.find({ ativo: true, emailVerificado: true });
  const inicioJanela = horaBRTparaUTC(janela.inicio);
  const fimJanela    = horaBRTparaUTC(janela.fim);
  const frontendUrl  = process.env.FRONTEND_URL || 'http://localhost:3000';

  let enviados = 0;

  for (const cliente of clientes) {
    const count = await Refeicao.countDocuments({
      cliente:  cliente._id,
      dataHora: { $gte: inicioJanela, $lt: fimJanela },
    });

    if (count > 0) continue;

    try {
      await enviarEmail({
        para:    cliente.email,
        assunto: `InfoGlic – Você registrou o(a) ${janela.nome}?`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
            <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:1.4rem">💉 InfoGlic</h1>
            </div>
            <div style="background:#f8fafc;padding:28px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
              <p style="margin:0 0 16px">Olá, <strong>${cliente.nome.split(' ')[0]}</strong>!</p>
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:flex-start;gap:12px">
                <span style="font-size:1.5rem">🍽️</span>
                <p style="margin:0">Não encontramos nenhuma refeição registrada para o período de
                  <strong>${janela.nome}</strong>
                  (${String(janela.inicio).padStart(2,'0')}h – ${String(janela.fim).padStart(2,'0')}h).
                  Não se esqueça de registrar!</p>
              </div>
              <a href="${frontendUrl}/dashboard"
                 style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;
                        border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">
                Registrar refeição →
              </a>
              <p style="margin-top:24px;color:#94a3b8;font-size:.8rem">
                Registrar suas refeições ajuda a correlacionar a alimentação com sua glicemia.
              </p>
            </div>
          </div>
        `,
      });
      enviados++;
    } catch (err) {
      console.error(`\x1b[31m❌ Erro ao enviar lembrete de ${janela.nome} para ${cliente.email}:\x1b[0m`, err.message);
    }
  }

  console.log(`\x1b[32m✔  ${janela.nome}: ${enviados}/${clientes.length} lembretes enviados\x1b[0m`);
}

// ── Lembrete diário (glicemia, pré/pós-prandial, ausência) ───────
async function verificarEEnviarLembretes() {
  console.log('\x1b[36m🔔 Lembrete diário: verificando usuários...\x1b[0m');

  const clientes = await Cliente.find({ ativo: true, emailVerificado: true });
  const hoje = inicioDoDia();
  const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
  const limiteAusente = new Date(Date.now() - DIAS_AUSENTE * 24 * 60 * 60 * 1000);
  const agora = new Date();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  let enviados = 0;

  for (const cliente of clientes) {
    const registrosHoje = await RegistroGlicemico.find({
      cliente:  cliente._id,
      dataHora: { $gte: hoje, $lt: amanha },
    }).lean();

    const semGlicemia   = registrosHoje.length === 0;
    const semPrePrandial = !registrosHoje.some(r => r.estado === 'Pré-prandial');
    const ausente = !cliente.ultimoAcesso || cliente.ultimoAcesso < limiteAusente;
    const diasSemAcesso = cliente.ultimoAcesso
      ? Math.floor((Date.now() - cliente.ultimoAcesso.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Pré-prandiais sem pós-prandial correspondente (2h já passaram)
    const presSemPos = registrosHoje
      .filter(r => r.estado === 'Pré-prandial')
      .filter(pre => {
        const dtPre = new Date(pre.dataHora);
        if (agora - dtPre < 2 * 60 * 60 * 1000) return false;
        return !registrosHoje.some(
          r => r.estado === 'Pós-prandial' &&
               new Date(r.dataHora) > dtPre &&
               new Date(r.dataHora) - dtPre <= 4 * 60 * 60 * 1000
        );
      });

    const precisaLembrete = semGlicemia || ausente || presSemPos.length > 0 || semPrePrandial;
    if (!precisaLembrete) continue;

    const itens = [];

    if (ausente) {
      const textoAusencia = diasSemAcesso !== null
        ? `Você está há <strong>${diasSemAcesso} dias</strong> sem acessar o InfoGlic.`
        : 'Você ainda não acessou o InfoGlic desde o cadastro.';
      itens.push({ icone: '📅', texto: textoAusencia });
    }

    if (semGlicemia) {
      itens.push({ icone: '🩸', texto: 'Nenhuma medição de glicemia foi registrada hoje.' });
    } else if (semPrePrandial) {
      itens.push({ icone: '🩸', texto: 'Nenhum teste <strong>Pré-prandial</strong> foi registrado hoje.' });
    }

    if (presSemPos.length > 0) {
      const formatarHora = (d) =>
        new Date(d).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      const horas = presSemPos.map(r => `<strong>${formatarHora(r.dataHora)}</strong>`).join(', ');
      const plural = presSemPos.length > 1 ? 'testes Pré-prandiais' : 'teste Pré-prandial';
      itens.push({
        icone: '⏱️',
        texto: `${plural.charAt(0).toUpperCase() + plural.slice(1)} registrado(s) às ${horas} sem o <strong>Pós-prandial</strong> correspondente.`,
      });
    }

    const listaItens = itens
      .map(i => `
        <li style="margin-bottom:12px;display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:1.2rem">${i.icone}</span>
          <span>${i.texto}</span>
        </li>`)
      .join('');

    try {
      await enviarEmail({
        para:    cliente.email,
        assunto: 'InfoGlic – Não esqueça dos seus registros de hoje!',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
            <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:1.4rem">💉 InfoGlic</h1>
            </div>
            <div style="background:#f8fafc;padding:28px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
              <p style="margin:0 0 16px">Olá, <strong>${cliente.nome.split(' ')[0]}</strong>! Passando para lembrar:</p>
              <ul style="list-style:none;padding:0;margin:0 0 24px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px">
                ${listaItens}
              </ul>
              <a href="${frontendUrl}/dashboard"
                 style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;
                        border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">
                Acessar o InfoGlic →
              </a>
              <p style="margin-top:24px;color:#94a3b8;font-size:.8rem">
                Manter seus registros em dia ajuda você e seu médico a acompanhar melhor seu controle glicêmico.
              </p>
            </div>
          </div>
        `,
      });
      enviados++;
    } catch (err) {
      console.error(`\x1b[31m❌ Erro ao enviar lembrete para ${cliente.email}:\x1b[0m`, err.message);
    }
  }

  console.log(`\x1b[32m✔  Lembretes diários: ${enviados}/${clientes.length} enviados\x1b[0m`);
}

// ── Inicializa todos os crons ─────────────────────────────────────
function iniciarLembretes() {
  const tz = 'America/Sao_Paulo';

  // Um job por janela de refeição
  JANELAS_REFEICAO.forEach(janela => {
    cron.schedule(janela.cron, () => verificarJanelaRefeicao(janela), { timezone: tz });
    console.log(`\x1b[36m🍽️  Lembrete de ${janela.nome} agendado (${janela.cron})\x1b[0m`);
  });

  // Job diário de glicemia / pré-pós / ausência
  cron.schedule('0 20 * * *', verificarEEnviarLembretes, { timezone: tz });
  console.log('\x1b[36m🔔 Lembrete diário agendado (20:00 BRT)\x1b[0m');
}

module.exports = { iniciarLembretes, verificarEEnviarLembretes, verificarJanelaRefeicao, JANELAS_REFEICAO };
