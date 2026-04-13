const mongoose = require('mongoose');

// RF04 – Modelo de registro de teste glicêmico
const registroGlicemicoSchema = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: [true, 'Cliente é obrigatório'],
    },
    valor: {
      type: Number,
      required: [true, 'Valor glicêmico é obrigatório'],
      min: [20, 'Valor mínimo é 20 mg/dL'],
      max: [600, 'Valor máximo é 600 mg/dL'],
    },
    dataHora: {
      type: Date,
      required: [true, 'Data e hora são obrigatórios'],
      default: Date.now,
      validate: {
        validator: function (v) { return v <= new Date(); },
        message: 'Não é permitido registrar datas futuras.',
      },
    },
    // RF04 – Categorização do estado do teste
    estado: {
      type: String,
      required: [true, 'Estado do teste é obrigatório'],
      enum: {
        values: ['Jejum', 'Pré-prandial', 'Pós-prandial', 'Madrugada', 'Geral'],
        message: 'Estado inválido. Use: Jejum, Pré-prandial, Pós-prandial, Madrugada ou Geral.',
      },
    },
    observacao: {
      type: String,
      trim: true,
      maxlength: [200, 'Observação não pode ultrapassar 200 caracteres'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RegistroGlicemico', registroGlicemicoSchema);
