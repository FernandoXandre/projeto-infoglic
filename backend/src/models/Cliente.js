const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clienteSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      minlength: [3, 'Nome deve ter pelo menos 3 caracteres'],
      maxlength: [100, 'Nome não pode ultrapassar 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'E-mail é obrigatório'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de e-mail inválido'],
    },
    senha: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
      select: false,
    },
    telefone: {
      type: String,
      required: [true, 'Telefone é obrigatório'],
      unique: true,
      trim: true,
      match: [/^(\(?\d{2}\)?\s?)(\d{4,5}-?\d{4})$/, 'Formato de telefone inválido'],
    },
    cpf: {
      type: String,
      required: [true, 'CPF é obrigatório'],
      unique: true,
      trim: true,
      match: [/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'Formato de CPF inválido'],
    },
    dataNascimento: {
      type: Date,
      required: [true, 'Data de nascimento é obrigatória'],
    },
    // RF01 – tipo de diabetes do paciente
    tipoDiabetes: {
      type: String,
      required: [true, 'Tipo de diabetes é obrigatório'],
      enum: {
        values: ['Tipo 1', 'Tipo 2', 'Gestacional', 'Outros'],
        message: 'Tipo de diabetes inválido',
      },
    },
    // Tipo de usuário para controle de acesso futuro (RF01 – nota)
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // RF01 – confirmação de conta por e-mail (Ethereal)
    emailVerificado: {
      type: Boolean,
      default: false,
    },
    tokenAtivacao: {
      type: String,
      select: false,
    },
    tokenAtivacaoExpira: {
      type: Date,
      select: false,
    },
    // RF03 – recuperação de senha
    tokenResetSenha: {
      type: String,
      select: false,
    },
    tokenResetSenhaExpira: {
      type: Date,
      select: false,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    ultimoAcesso: {
      type: Date,
      default: null,
    },
    // RF09 – fator de sensibilidade à insulina (mg/dL por unidade)
    fatorSensibilidade: {
      type: Number,
      min: [1, 'FSI deve ser entre 1 e 200'],
      max: [200, 'FSI deve ser entre 1 e 200'],
      default: null,
    },
    // RF09 – glicemia alvo para cálculo de correção
    glicemiaAlvo: {
      type: Number,
      min: [60, 'Glicemia alvo mínima é 60 mg/dL'],
      max: [200, 'Glicemia alvo máxima é 200 mg/dL'],
      default: 100,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.senha;
        delete ret.tokenAtivacao;
        delete ret.tokenAtivacaoExpira;
        delete ret.tokenResetSenha;
        delete ret.tokenResetSenhaExpira;
        return ret;
      },
    },
  }
);

// Hash da senha antes de salvar
clienteSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Método para comparar senhas
clienteSchema.methods.compararSenha = async function (senhaInformada) {
  return bcrypt.compare(senhaInformada, this.senha);
};

module.exports = mongoose.model('Cliente', clienteSchema);