const crypto = require('crypto');
const Cliente = require('../models/Cliente');
const { enviarEmail } = require('../config/email');

// Utilitário de log colorido no terminal
const logCadastro = (cliente) => {
  const linha = '─'.repeat(52);
  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  console.log('\n\x1b[44m\x1b[97m  INFOGLIC – NOVO CADASTRO  \x1b[0m');
  console.log(`\x1b[90m${linha}\x1b[0m`);
  console.log(`\x1b[32m✔  Cliente salvo no MongoDB com sucesso!\x1b[0m`);
  console.log(`\x1b[90m${linha}\x1b[0m`);
  console.log(`  \x1b[36m🆔 ID         \x1b[0m ${cliente._id}`);
  console.log(`  \x1b[36m👤 Nome       \x1b[0m ${cliente.nome}`);
  console.log(`  \x1b[36m📧 E-mail     \x1b[0m ${cliente.email}`);
  console.log(`  \x1b[36m📱 Telefone   \x1b[0m ${cliente.telefone}`);
  console.log(`  \x1b[36m🪪 CPF        \x1b[0m ${cliente.cpf}`);
  console.log(`  \x1b[36m🎂 Nascimento \x1b[0m ${new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}`);
  console.log(`  \x1b[36m🕒 Registrado \x1b[0m ${agora}`);
  console.log(`  \x1b[36m✅ Status     \x1b[0m \x1b[32mAtivo\x1b[0m`);
  console.log(`\x1b[90m${linha}\x1b[0m\n`);
};

// RF01 - Cadastro de Cliente
const cadastrarCliente = async (req, res) => {
  try {
    const { nome, email, senha, telefone, cpf, dataNascimento, tipoDiabetes } = req.body;

    // Verificar duplicatas
    const emailExistente = await Cliente.findOne({ email });
    if (emailExistente) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'E-mail já cadastrado no sistema.',
        erros: [{ campo: 'email', mensagem: 'Este e-mail já está em uso' }],
      });
    }

    const cpfExistente = await Cliente.findOne({ cpf });
    if (cpfExistente) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'CPF já cadastrado no sistema.',
        erros: [{ campo: 'cpf', mensagem: 'Este CPF já está cadastrado' }],
      });
    }

    const telefoneExistente = await Cliente.findOne({ telefone });
    if (telefoneExistente) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Telefone já cadastrado no sistema.',
        erros: [{ campo: 'telefone', mensagem: 'Este telefone já está em uso' }],
      });
    }

    // RF01 – token de ativação por e-mail
    const tokenAtivacao = crypto.randomBytes(32).toString('hex');

    const novoCliente = await Cliente.create({
      nome,
      email,
      senha,
      telefone,
      cpf,
      dataNascimento,
      tipoDiabetes,
      tokenAtivacao,
      tokenAtivacaoExpira: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
    });

    // Log detalhado no terminal
    logCadastro(novoCliente);

    // RF01 – envio do e-mail de ativação via Ethereal
    // O link aponta para a página React /ativar/:token, que chama o backend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkAtivacao = `${frontendUrl}/ativar/${tokenAtivacao}`;

    let previewUrl = null;
    try {
      const resultado = await enviarEmail({
        para: novoCliente.email,
        assunto: 'InfoGlic – Ative sua conta',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#2563eb">InfoGlic</h2>
            <p>Olá, <strong>${novoCliente.nome}</strong>! Bem-vindo ao InfoGlic.</p>
            <p>Clique no botão abaixo para ativar sua conta. O link expira em <strong>24 horas</strong>.</p>
            <a href="${linkAtivacao}"
               style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
                      border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
              Ativar minha conta
            </a>
          </div>
        `,
      });
      previewUrl = resultado.previewUrl;
    } catch (emailError) {
      console.error('\x1b[33m⚠ Falha ao enviar e-mail de ativação:\x1b[0m', emailError.message);
    }

    const resposta = {
      sucesso: true,
      mensagem: 'Cadastro realizado! Verifique seu e-mail para ativar a conta.',
      dados: {
        _id:            novoCliente._id,
        nome:           novoCliente.nome,
        email:          novoCliente.email,
        telefone:       novoCliente.telefone,
        cpf:            novoCliente.cpf,
        dataNascimento: novoCliente.dataNascimento,
        tipoDiabetes:   novoCliente.tipoDiabetes,
        role:           novoCliente.role,
        emailVerificado: novoCliente.emailVerificado,
        ativo:          novoCliente.ativo,
        createdAt:      novoCliente.createdAt,
      },
    };

    if (process.env.NODE_ENV !== 'production' && previewUrl) {
      resposta.emailPreviewUrl = previewUrl;
    }

    return res.status(201).json(resposta);
  } catch (error) {
    console.error('\x1b[31m❌ Erro ao cadastrar cliente:\x1b[0m', error.message);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor. Tente novamente mais tarde.',
    });
  }
};

// Listar todos os clientes (admin)
const listarClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find({ ativo: true }).sort({ createdAt: -1 });
    return res.status(200).json({
      sucesso: true,
      total: clientes.length,
      dados: clientes,
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar clientes.' });
  }
};

// Buscar cliente por ID
const buscarClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ sucesso: false, mensagem: 'Cliente não encontrado.' });
    }
    return res.status(200).json({ sucesso: true, dados: cliente });
  } catch (error) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar cliente.' });
  }
};

module.exports = { cadastrarCliente, listarClientes, buscarClientePorId };