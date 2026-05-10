const { body, validationResult } = require('express-validator');

// RF01 – Validação de cadastro
const validarCadastroCliente = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('Formato de e-mail inválido')
    .customSanitizer(v => v.toLowerCase()),

  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula')
    .matches(/\d/).withMessage('Senha deve conter ao menos um número'),

  body('confirmarSenha')
    .notEmpty().withMessage('Confirmação de senha é obrigatória')
    .custom((value, { req }) => {
      if (value !== req.body.senha) throw new Error('As senhas não coincidem');
      return true;
    }),

  body('telefone')
    .trim()
    .notEmpty().withMessage('Telefone é obrigatório')
    .matches(/^(\(?\d{2}\)?\s?)(\d{4,5}-?\d{4})$/).withMessage('Formato de telefone inválido (ex: (61) 99999-9999)'),

  body('cpf')
    .trim()
    .notEmpty().withMessage('CPF é obrigatório')
    .matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/).withMessage('Formato de CPF inválido'),

  body('dataNascimento')
    .notEmpty().withMessage('Data de nascimento é obrigatória')
    .isISO8601().withMessage('Data de nascimento inválida')
    .custom((value) => {
      const hoje = new Date();
      const nascimento = new Date(value);
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const m = hoje.getMonth() - nascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
      if (idade < 18) throw new Error('É necessário ter pelo menos 18 anos para se cadastrar');
      if (idade > 120) throw new Error('Data de nascimento inválida');
      return true;
    }),

  // RF01 – tipo de diabetes
  body('tipoDiabetes')
    .notEmpty().withMessage('Tipo de diabetes é obrigatório')
    .isIn(['Tipo 1', 'Tipo 2', 'Gestacional', 'Outros'])
    .withMessage('Tipo de diabetes inválido'),
];

// RF02 – Validação de login
const validarLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('Formato de e-mail inválido')
    .customSanitizer(v => v.toLowerCase()),

  body('senha')
    .notEmpty().withMessage('Senha é obrigatória'),
];

// RF03 – Validação de recuperação de senha
const validarRecuperarSenha = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('Formato de e-mail inválido')
    .customSanitizer(v => v.toLowerCase()),
];

// RF03 – Validação de redefinição de senha
const validarRedefinirSenha = [
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula')
    .matches(/\d/).withMessage('Senha deve conter ao menos um número'),

  body('confirmarSenha')
    .notEmpty().withMessage('Confirmação de senha é obrigatória')
    .custom((value, { req }) => {
      if (value !== req.body.senha) throw new Error('As senhas não coincidem');
      return true;
    }),
];

const checarErros = (req, res, next) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(422).json({
      sucesso: false,
      mensagem: 'Dados inválidos. Verifique os campos.',
      erros: erros.array().map((e) => ({ campo: e.path, mensagem: e.msg })),
    });
  }
  next();
};

module.exports = { validarCadastroCliente, validarLogin, validarRecuperarSenha, validarRedefinirSenha, checarErros };
