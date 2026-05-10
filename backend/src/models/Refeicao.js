const mongoose = require('mongoose');

const refeicaoSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    dataHora: { type: Date, required: [true, 'Data e hora são obrigatórias'] },
    foto: { type: String }, // base64 data URL
    carboidratos: {
      type: String,
      required: [true, 'Estimativa de carboidratos é obrigatória'],
      enum: { values: ['baixa', 'media', 'alta'], message: 'Estimativa inválida' },
    },
    descricao: { type: String, maxlength: [200, 'Máximo 200 caracteres'], trim: true },
    registroVinculado: { type: mongoose.Schema.Types.ObjectId, ref: 'RegistroGlicemico', default: null },
  },
  { timestamps: true }
);

refeicaoSchema.index({ cliente: 1, dataHora: -1 });
module.exports = mongoose.model('Refeicao', refeicaoSchema);
