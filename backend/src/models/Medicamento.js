const mongoose = require('mongoose');

// RF07 – Configuração de medicamento do usuário
const medicamentoSchema = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
    },
    nome: {
      type: String,
      required: [true, 'Nome do medicamento é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome não pode ultrapassar 100 caracteres'],
    },
    dosagem: {
      type: String,
      required: [true, 'Dosagem é obrigatória'],
      trim: true,
      maxlength: [50, 'Dosagem não pode ultrapassar 50 caracteres'],
    },
    tipo: {
      type: String,
      required: [true, 'Tipo é obrigatório'],
      enum: {
        values: ['Insulina', 'Oral', 'Outro'],
        message: 'Tipo inválido. Use: Insulina, Oral ou Outro',
      },
    },
    // Horários programados (ex: ["07:00", "19:00"])
    horarios: {
      type: [String],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Informe pelo menos um horário',
      },
    },
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicamento', medicamentoSchema);
