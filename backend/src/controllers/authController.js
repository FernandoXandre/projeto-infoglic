const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Cliente = require('../models/Cliente');
const { enviarEmail } = require('../config/email');

const gerarToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'infoglic_secret_dev', { expiresIn: '7d' });

// RF02 – Login de Usuário
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Busca case-insensitive para evitar falha por capitalização residual
    const cliente = await Cliente.findOne({
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).select('+senha');

    if (!cliente) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'E-mail ou senha incorretos.',
      });
    }

    if (!cliente.ativo) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'E-mail ou senha incorretos.',
      });
    }

    // RF02 – verifica se a conta foi ativada por e-mail
    if (!cliente.emailVerificado) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Conta não ativada. Verifique seu e-mail e clique no link de ativação.',
      });
    }

    const senhaCorreta = await cliente.compararSenha(senha);
    if (!senhaCorreta) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'E-mail ou senha incorretos.',
      });
    }

    const token = gerarToken(cliente._id);

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso.',
      token,
      dados: {
        _id: cliente._id,
        nome: cliente.nome,
        email: cliente.email,
        role: cliente.role,
        tipoDiabetes: cliente.tipoDiabetes,
      },
    });
  } catch (error) {
    console.error('\x1b[31m❌ Erro no login:\x1b[0m', error.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

// RF01 – Ativar conta via link de e-mail
const ativarConta = async (req, res) => {
  try {
    const { token } = req.params;

    const cliente = await Cliente.findOne({
      tokenAtivacao: token,
      tokenAtivacaoExpira: { $gt: Date.now() },
    }).select('+tokenAtivacao +tokenAtivacaoExpira');

    if (!cliente) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Token de ativação inválido ou expirado.',
      });
    }

    cliente.emailVerificado = true;
    cliente.tokenAtivacao = undefined;
    cliente.tokenAtivacaoExpira = undefined;
    await cliente.save();

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Conta ativada com sucesso! Você já pode fazer login.',
    });
  } catch (error) {
    console.error('\x1b[31m❌ Erro ao ativar conta:\x1b[0m', error.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

// RF03 – Solicitação de recuperação de senha
const recuperarSenha = async (req, res) => {
  try {
    const { email } = req.body;

    const cliente = await Cliente.findOne({ email });

    // Resposta genérica para não revelar se o e-mail existe
    if (!cliente) {
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    cliente.tokenResetSenha = token;
    cliente.tokenResetSenhaExpira = Date.now() + 60 * 60 * 1000; // 1 hora
    await cliente.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkReset = `${frontendUrl}/redefinir-senha/${token}`;

    const resultado = await enviarEmail({
      para: cliente.email,
      assunto: 'InfoGlic – Recuperação de senha',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#2563eb">InfoGlic</h2>
          <p>Olá, <strong>${cliente.nome}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
          <a href="${linkReset}"
             style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
                    border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
            Redefinir minha senha
          </a>
          <p style="color:#6b7280;font-size:0.85rem">
            Se você não solicitou a recuperação, ignore este e-mail.
          </p>
        </div>
      `,
    });

    const resposta = {
      sucesso: true,
      mensagem: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.',
    };

    if (process.env.NODE_ENV !== 'production') {
      resposta.previewUrl = resultado.previewUrl;
    }

    return res.status(200).json(resposta);
  } catch (error) {
    console.error('\x1b[31m❌ Erro ao recuperar senha:\x1b[0m', error.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

// RF03 – Redefinição de senha com token
const redefinirSenha = async (req, res) => {
  try {
    const { token } = req.params;
    const { senha } = req.body;

    const cliente = await Cliente.findOne({
      tokenResetSenha: token,
      tokenResetSenhaExpira: { $gt: Date.now() },
    }).select('+tokenResetSenha +tokenResetSenhaExpira');

    if (!cliente) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Token de recuperação inválido ou expirado.',
      });
    }

    cliente.senha = senha;
    cliente.tokenResetSenha = undefined;
    cliente.tokenResetSenhaExpira = undefined;
    await cliente.save();

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Senha redefinida com sucesso. Você já pode fazer login.',
    });
  } catch (error) {
    console.error('\x1b[31m❌ Erro ao redefinir senha:\x1b[0m', error.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = { login, ativarConta, recuperarSenha, redefinirSenha };
