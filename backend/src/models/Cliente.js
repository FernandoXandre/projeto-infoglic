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
      select: false, // não retorna a senha nas queries por padrão
    },
    telefone: {
      type: String,
      required: [true, 'Telefone é obrigatório'],
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
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // cria createdAt e updatedAt automaticamente
    toJSON: {
      transform(doc, ret) {
        delete ret.senha; // garante que a senha nunca saia no JSON
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