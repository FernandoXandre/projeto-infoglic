const mongoose = require('mongoose');

const TAGS_VALIDAS = ['Estresse', 'Atividade Física', 'Doença/Febre', 'Álcool'];

// RF12 – Eventos externos que impactam a glicemia
const eventoExternoSchema = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
    },
    // Data do dia (meia-noite UTC) — um evento por dia por usuário
    dataDia: {
      type: Date,
      required: [true, 'Data é obrigatória'],
    },
    tags: {
      type: [String],
      enum: {
        values: TAGS_VALIDAS,
        message: 'Tag inválida.',
      },
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Selecione pelo menos uma tag.',
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

// Um evento por dia por usuário
eventoExternoSchema.index({ cliente: 1, dataDia: 1 }, { unique: true });

module.exports = mongoose.model('EventoExterno', eventoExternoSchema);
