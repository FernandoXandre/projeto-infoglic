const Cliente = require('../models/Cliente');

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
    const { nome, email, senha, telefone, cpf, dataNascimento } = req.body;

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

    const novoCliente = await Cliente.create({
      nome,
      email,
      senha,
      telefone,
      cpf,
      dataNascimento,
    });

    // Log detalhado no terminal
    logCadastro(novoCliente);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Cliente cadastrado com sucesso!',
      dados: {
        _id:            novoCliente._id,
        nome:           novoCliente.nome,
        email:          novoCliente.email,
        telefone:       novoCliente.telefone,
        cpf:            novoCliente.cpf,
        dataNascimento: novoCliente.dataNascimento,
        ativo:          novoCliente.ativo,
        createdAt:      novoCliente.createdAt,
      },
    });
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