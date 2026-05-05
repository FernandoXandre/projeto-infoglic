const mongoose = require('mongoose');

// RF07 – Registro individual de dose (checklist diário)
const registroMedicacaoSchema = new mongoose.Schema(
  {
    medicamento: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicamento',
      required: [true, 'Medicamento é obrigatório'],
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
    },
    // Horário programado ao qual este registro pertence (ex: "07:00")
    horarioProgramado: {
      type: String,
      required: [true, 'Horário programado é obrigatório'],
    },
    // Data do dia deste registro (meia-noite UTC, para facilitar lookup por dia)
    dataDia: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: [true, 'Status é obrigatório'],
      enum: {
        values: ['tomado', 'pulado', 'adiado'],
        message: 'Status inválido. Use: tomado, pulado ou adiado',
      },
    },
    // RF07 – Local de aplicação para rodízio de insulina
    localAplicacao: {
      type: String,
      trim: true,
      maxlength: [60, 'Local de aplicação não pode ultrapassar 60 caracteres'],
    },
    observacao: {
      type: String,
      trim: true,
      maxlength: [200, 'Observação não pode ultrapassar 200 caracteres'],
    },
  },
  { timestamps: true }
);

// Garante unicidade de (cliente, medicamento, horario, dia)
registroMedicacaoSchema.index(
  { cliente: 1, medicamento: 1, horarioProgramado: 1, dataDia: 1 },
  { unique: true }
);

module.exports = mongoose.model('RegistroMedicacao', registroMedicacaoSchema);
