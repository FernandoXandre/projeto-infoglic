import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import { listar, criar, atualizar, remover } from '../services/registroService';
import {
  listarMedicamentos,
  criarMedicamento,
  atualizarMedicamento,
  desativarMedicamento,
  listarRegistrosDia,
  registrarDose,
  historicoLocais,
} from '../services/medicamentoService';
import { listarEventos, salvarEvento, removerEvento } from '../services/eventoService';

const ESTADOS = ['Jejum', 'Pré-prandial', 'Pós-prandial', 'Madrugada', 'Geral'];
const HORARIOS_KEY = 'infoglic_horarios';

// RF07
const LOCAIS_APLICACAO = [
  'Abdômen D', 'Abdômen E',
  'Coxa D', 'Coxa E',
  'Braço D', 'Braço E',
  'Glúteo D', 'Glúteo E',
];

// RF12
const TAGS_EVENTOS = ['Estresse', 'Atividade Física', 'Doença/Febre', 'Álcool'];
const TAG_CORES = {
  'Estresse':         '#f97316',
  'Atividade Física': '#3b82f6',
  'Doença/Febre':     '#ef4444',
  'Álcool':           '#a855f7',
};

// ── Helpers ────────────────────────────────────────────────────
function classificar(valor) {
  if (valor < 70)  return 'hipo';
  if (valor <= 180) return 'normal';
  return 'hiper';
}

function corValor(valor) {
  if (valor < 70)  return '#e02535';
  if (valor <= 180) return '#4ade80';
  return '#f97316';
}

const TZ_BRASIL = 'America/Sao_Paulo';

function formatarDataHora(dataHora) {
  return new Date(dataHora).toLocaleString('pt-BR', {
    timeZone: TZ_BRASIL,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function agoraBrasil() {
  return new Date()
    .toLocaleString('sv-SE', { timeZone: TZ_BRASIL })
    .replace(' ', 'T')
    .slice(0, 16);
}

function paraInputBrasil(dataHora) {
  return new Date(dataHora)
    .toLocaleString('sv-SE', { timeZone: TZ_BRASIL })
    .replace(' ', 'T')
    .slice(0, 16);
}

function dataBrasilia(d) {
  return new Date(d || Date.now()).toLocaleDateString('sv-SE', { timeZone: TZ_BRASIL });
}

// ── RF06: Alertas de Hipoglicemia e Hiperglicemia ──────────────
function gerarAlertasGlicemia(registros) {
  if (!registros.length) return [];
  const ultimo = registros[0];

  if (ultimo.valor < 70) {
    return [{
      id: `hipo-${ultimo._id}`,
      tipo: 'hipo',
      titulo: 'Hipoglicemia Detectada',
      mensagem: `Sua última medição foi ${ultimo.valor} mg/dL, abaixo do limite seguro de 70 mg/dL.`,
      instrucoes: [
        'Consuma 15g de carboidratos de absorção rápida (suco de laranja, mel ou glicose)',
        'Aguarde 15 minutos e repita a medição',
        'Se o valor não subir, procure atendimento médico imediatamente',
      ],
    }];
  }

  if (ultimo.valor > 180) {
    return [{
      id: `hiper-${ultimo._id}`,
      tipo: 'hiper',
      titulo: 'Hiperglicemia Detectada',
      mensagem: `Sua última medição foi ${ultimo.valor} mg/dL, acima do limite de 180 mg/dL.`,
      instrucoes: [
        'Hidrate-se bem — beba bastante água',
        'Verifique se tomou a medicação conforme prescrita',
        'Consulte seu médico se o valor persistir elevado',
      ],
    }];
  }

  return [];
}

// ── RF05: Alertas de lembretes de testes ──────────────────────
function gerarAlertasLembretes(registros, horarios) {
  const alertas = [];
  const agora = new Date();
  const hoje = agora.toLocaleString('sv-SE', { timeZone: TZ_BRASIL }).slice(0, 10);

  const refeicoes = [
    { chave: 'cafe',   nome: 'Café da manhã' },
    { chave: 'almoco', nome: 'Almoço' },
    { chave: 'jantar', nome: 'Jantar' },
  ];

  refeicoes.forEach(({ chave, nome }) => {
    const horario = horarios[chave];
    if (!horario) return;

    const horarioRefeicao = new Date(`${hoje}T${horario}:00-03:00`);
    const limiteAlerta = new Date(horarioRefeicao.getTime() + 30 * 60 * 1000);

    if (agora < limiteAlerta) return;

    const janela = 60 * 60 * 1000;
    const temRegistro = registros.some(r =>
      Math.abs(new Date(r.dataHora) - horarioRefeicao) <= janela
    );

    if (!temRegistro) {
      alertas.push({
        id: `lembrete-${chave}-${hoje}`,
        tipo: 'lembrete',
        titulo: `Lembrete: ${nome}`,
        mensagem: `Nenhuma medição encontrada próxima ao horário de ${nome.toLowerCase()} (${horario}). Não esqueça de registrar suas medições.`,
        instrucoes: [],
      });
    }
  });

  const inicioDia = new Date(`${hoje}T00:00:00-03:00`);
  const fimDia    = new Date(`${hoje}T23:59:59-03:00`);

  const prepranciais = registros.filter(r =>
    r.estado === 'Pré-prandial' &&
    new Date(r.dataHora) >= inicioDia &&
    new Date(r.dataHora) <= fimDia
  );

  prepranciais.forEach(pre => {
    const dtPre  = new Date(pre.dataHora);
    const hora2h = new Date(dtPre.getTime() + 2 * 60 * 60 * 1000);
    const hora4h = new Date(dtPre.getTime() + 4 * 60 * 60 * 1000);

    if (agora < hora2h) return;

    const posExiste = registros.some(r =>
      r.estado === 'Pós-prandial' &&
      new Date(r.dataHora) > dtPre &&
      new Date(r.dataHora) <= hora4h
    );

    if (!posExiste) {
      alertas.push({
        id: `pos-prandial-${pre._id}`,
        tipo: 'lembrete',
        titulo: 'Teste Pós-Prandial Pendente',
        mensagem: `Você registrou um teste Pré-prandial às ${formatarDataHora(pre.dataHora)} e já se passaram mais de 2 horas.`,
        instrucoes: ['Realize a medição Pós-prandial e registre-a no sistema'],
      });
    }
  });

  return alertas;
}

// ── Gráfico SVG de linha (RF04 + RF12 markers) ────────────────
function GraficoGlicemia({ registros, eventos }) {
  if (registros.length === 0) {
    return (
      <div className="grafico-vazio">
        Registre sua primeira medição para ver o gráfico aqui.
      </div>
    );
  }

  const dados = [...registros]
    .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
    .slice(-14);

  const W = 600, H = 260;
  const PAD = { top: 30, right: 24, bottom: 66, left: 54 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const vals = dados.map(d => d.valor);
  const minV = Math.min(Math.min(...vals) - 15, 55);
  const maxV = Math.max(Math.max(...vals) + 15, 210);
  const rangeV = maxV - minV;

  const xPos = (i) =>
    PAD.left + (dados.length === 1 ? innerW / 2 : (i / (dados.length - 1)) * innerW);
  const yPos = (v) => PAD.top + innerH - ((v - minV) / rangeV) * innerH;

  function curvaPath(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1];
      const c = pts[i];
      const offset = (c.x - p.x) / 3;
      d += ` C ${p.x + offset},${p.y} ${c.x - offset},${c.y} ${c.x},${c.y}`;
    }
    return d;
  }

  const pontos = dados.map((d, i) => ({ x: xPos(i), y: yPos(d.valor) }));

  const y70  = yPos(70);
  const y180 = yPos(180);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const yFloor = H - PAD.bottom;

  // RF12 – Índice de eventos por dia
  // dataDia é armazenado como meia-noite UTC da data brasileira (ex: "2026-05-04T00:00:00Z").
  // Ler o trecho UTC evita o deslocamento de -3h que produziria o dia anterior.
  const eventosPorDia = {};
  const eventoObsPorDia = {};
  (eventos || []).forEach(ev => {
    const dia = new Date(ev.dataDia).toISOString().slice(0, 10);
    eventosPorDia[dia] = ev.tags || [];
    if (ev.observacao) eventoObsPorDia[dia] = ev.observacao;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="grafico-svg" aria-label="Histórico glicêmico">
      <rect
        x={PAD.left} y={clamp(y70, PAD.top, yFloor)}
        width={innerW}
        height={Math.max(0, yFloor - clamp(y70, PAD.top, yFloor))}
        fill="rgba(224,37,53,0.08)"
      />
      <rect
        x={PAD.left} y={PAD.top}
        width={innerW}
        height={Math.max(0, clamp(y180, PAD.top, yFloor) - PAD.top)}
        fill="rgba(249,115,22,0.06)"
      />
      {[80, 120, 160, 200].map(v => {
        const y = yPos(v);
        if (y < PAD.top || y > yFloor) return null;
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
              stroke="rgba(136,128,192,0.1)" strokeWidth="1" />
            <text x={PAD.left - 7} y={y + 4} textAnchor="end" fontSize="9"
              fill="rgba(136,128,192,0.45)">{v}</text>
          </g>
        );
      })}
      {y70 >= PAD.top && y70 <= yFloor && (
        <>
          <line x1={PAD.left} y1={y70} x2={PAD.left + innerW} y2={y70}
            stroke="rgba(224,37,53,0.6)" strokeWidth="1" strokeDasharray="5,4" />
          <text x={PAD.left - 7} y={y70 + 4} textAnchor="end" fontSize="9"
            fill="rgba(224,37,53,0.8)">70</text>
        </>
      )}
      {y180 >= PAD.top && y180 <= yFloor && (
        <>
          <line x1={PAD.left} y1={y180} x2={PAD.left + innerW} y2={y180}
            stroke="rgba(249,115,22,0.6)" strokeWidth="1" strokeDasharray="5,4" />
          <text x={PAD.left - 7} y={y180 + 4} textAnchor="end" fontSize="9"
            fill="rgba(249,115,22,0.8)">180</text>
        </>
      )}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={yFloor}
        stroke="rgba(136,128,192,0.22)" strokeWidth="1" />
      <line x1={PAD.left} y1={yFloor} x2={PAD.left + innerW} y2={yFloor}
        stroke="rgba(136,128,192,0.22)" strokeWidth="1" />
      {dados.length > 1 && (
        <path d={curvaPath(pontos)} fill="none" stroke="#c9a030"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {dados.map((d, i) => {
        const cx = xPos(i);
        const cy = yPos(d.valor);
        const cor = corValor(d.valor);
        const diaDado = dataBrasilia(d.dataHora);
        const tagsNoDia = eventosPorDia[diaDado] || [];
        const obsDia    = eventoObsPorDia[diaDado] || '';
        const tooltipEvento = tagsNoDia.length
          ? tagsNoDia.join(', ') + (obsDia ? `\n${obsDia}` : '')
          : '';

        return (
          <g key={d._id}>
            <circle cx={cx} cy={cy} r="5.5" fill={cor} stroke="#0c0930" strokeWidth="1.8">
              {tooltipEvento && <title>{tooltipEvento}</title>}
            </circle>
            <text x={cx} y={cy - 11} textAnchor="middle" fontSize="9.5"
              fontWeight="600" fill={cor}>{d.valor}</text>
            <text x={cx} y={yFloor + 15} textAnchor="middle" fontSize="8.5"
              fill="rgba(136,128,192,0.65)">
              {new Date(d.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </text>
            {/* RF12 – Marcadores de eventos no gráfico */}
            {tagsNoDia.map((tag, ti) => (
              <circle
                key={tag}
                cx={cx - ((tagsNoDia.length - 1) * 4) + ti * 8}
                cy={yFloor + 29}
                r="3.5"
                fill={TAG_CORES[tag] || '#888'}
                opacity="0.85"
              >
                <title>{tag}{obsDia ? ` — ${obsDia}` : ''}</title>
              </circle>
            ))}
            {/* Ícone de nota quando há observação registrada no dia */}
            {obsDia && tagsNoDia.length > 0 && (
              <text x={cx} y={yFloor + 43} textAnchor="middle" fontSize="9"
                fill="rgba(201,160,48,0.7)">
                <title>{obsDia}</title>
                ✎
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Formulário inicial ─────────────────────────────────────────
const FORM_VAZIO = { valor: '', dataHora: '', estado: 'Jejum', observacao: '' };
const FORM_MED_VAZIO = { nome: '', dosagem: '', tipo: 'Oral', horarios: ['08:00'] };

export default function Dashboard() {
  // ── Registros glicêmicos ──────────────────────────────────
  const [registros, setRegistros]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId]   = useState(null);
  const [form, setForm]               = useState(FORM_VAZIO);
  const [salvando, setSalvando]       = useState(false);
  const [erroForm, setErroForm]       = useState('');
  const [mensagem, setMensagem]       = useState('');

  // RF05 / RF06 – alertas e horários
  const [alertas, setAlertas]               = useState([]);
  const [alertasFechados, setAlertasFechados] = useState(new Set());
  const [horarios, setHorarios]             = useState(() => {
    try { return JSON.parse(localStorage.getItem(HORARIOS_KEY) || '{}'); }
    catch { return {}; }
  });
  const [modalHorarios, setModalHorarios]   = useState(false);
  const [formHorarios, setFormHorarios]     = useState(horarios);

  // RF07 – Medicamentos
  const [medicamentos, setMedicamentos]         = useState([]);
  const [registrosDia, setRegistrosDia]         = useState([]);
  const [slotConfirmando, setSlotConfirmando]   = useState(null); // { medId, horario }
  const [localSelecionado, setLocalSelecionado] = useState(LOCAIS_APLICACAO[0]);
  const [locaisHistorico, setLocaisHistorico]   = useState([]);
  const [modalMed, setModalMed]                 = useState(false);
  const [vistaMed, setVistaMed]                 = useState('lista'); // 'lista' | 'form'
  const [editandoMedId, setEditandoMedId]       = useState(null);
  const [formMed, setFormMed]                   = useState(FORM_MED_VAZIO);
  const [erroMed, setErroMed]                   = useState('');
  const [salvandoMed, setSalvandoMed]           = useState(false);

  // RF12 – Eventos externos
  const [eventos, setEventos]             = useState([]);
  const [eventoHoje, setEventoHoje]       = useState(null);
  const [tagsHoje, setTagsHoje]           = useState([]);
  const [obsEvento, setObsEvento]         = useState('');
  const [salvandoEvento, setSalvandoEvento] = useState(false);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  // ── Loaders ────────────────────────────────────────────────
  const carregarRegistros = useCallback(async () => {
    try {
      const resp = await listar();
      setRegistros(resp.dados || []);
    } catch {
      setMensagem('Erro ao carregar registros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarMedicamentos = useCallback(async () => {
    try {
      const resp = await listarMedicamentos();
      setMedicamentos(resp.dados || []);
    } catch {}
  }, []);

  const carregarRegistrosDia = useCallback(async () => {
    try {
      const resp = await listarRegistrosDia();
      setRegistrosDia(resp.dados || []);
    } catch {}
  }, []);

  const carregarEventos = useCallback(async () => {
    try {
      const resp = await listarEventos(30);
      const lista = resp.dados || [];
      setEventos(lista);
      const hoje = dataBrasilia();
      const evt = lista.find(e => new Date(e.dataDia).toISOString().slice(0, 10) === hoje);
      if (evt) {
        setEventoHoje(evt);
        setTagsHoje(evt.tags || []);
        setObsEvento(evt.observacao || '');
      } else {
        setEventoHoje(null);
        setTagsHoje([]);
        setObsEvento('');
      }
    } catch {}
  }, []);

  useEffect(() => {
    carregarRegistros();
    carregarMedicamentos();
    carregarRegistrosDia();
    carregarEventos();
  }, [carregarRegistros, carregarMedicamentos, carregarRegistrosDia, carregarEventos]);

  useEffect(() => {
    setAlertas([
      ...gerarAlertasGlicemia(registros),
      ...gerarAlertasLembretes(registros, horarios),
    ]);
    setAlertasFechados(new Set());
  }, [registros, horarios]);

  // ── Modal de registros glicêmicos ─────────────────────────
  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...FORM_VAZIO, dataHora: agoraBrasil() });
    setErroForm('');
    setModalAberto(true);
  }

  function abrirEdicao(r) {
    setEditandoId(r._id);
    setForm({
      valor:      r.valor,
      dataHora:   paraInputBrasil(r.dataHora),
      estado:     r.estado,
      observacao: r.observacao || '',
    });
    setErroForm('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setErroForm('');
  }

  async function handleSalvar(e) {
    e.preventDefault();
    const valorNum = Number(form.valor);
    if (!form.valor || !form.dataHora || !form.estado) {
      return setErroForm('Preencha todos os campos obrigatórios.');
    }
    if (isNaN(valorNum) || valorNum < 20 || valorNum > 600) {
      return setErroForm('Valor deve estar entre 20 e 600 mg/dL.');
    }
    if (form.dataHora > agoraBrasil()) {
      return setErroForm('Não é permitido registrar datas futuras.');
    }

    setSalvando(true);
    setErroForm('');
    try {
      const dados = { ...form, valor: valorNum, dataHora: form.dataHora + ':00-03:00' };
      if (editandoId) {
        await atualizar(editandoId, dados);
        exibirMensagem('Registro atualizado com sucesso!');
      } else {
        await criar(dados);
        exibirMensagem('Medição registrada com sucesso!');
      }
      fecharModal();
      carregarRegistros();
    } catch (err) {
      setErroForm(err.response?.data?.mensagem || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id) {
    if (!window.confirm('Deseja remover este registro permanentemente?')) return;
    try {
      await remover(id);
      exibirMensagem('Registro removido.');
      carregarRegistros();
    } catch {
      exibirMensagem('Erro ao remover registro.');
    }
  }

  function exibirMensagem(texto) {
    setMensagem(texto);
    setTimeout(() => setMensagem(''), 4000);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }

  function fecharAlerta(id) {
    setAlertasFechados(prev => new Set([...prev, id]));
  }

  function handleSalvarHorarios(e) {
    e.preventDefault();
    localStorage.setItem(HORARIOS_KEY, JSON.stringify(formHorarios));
    setHorarios(formHorarios);
    setModalHorarios(false);
    exibirMensagem('Horários de refeição salvos!');
  }

  // ── RF07: Checklist de medicação ──────────────────────────
  function getRegistroDia(medId, horario) {
    return registrosDia.find(
      r => r.medicamento?._id === medId && r.horarioProgramado === horario
    );
  }

  async function handleDose(medId, horario, status, med) {
    if (status === 'tomado' && med.tipo === 'Insulina') {
      // Para insulina: abre seleção de local antes de confirmar
      const hist = await historicoLocais(medId).catch(() => ({ dados: [] }));
      setLocaisHistorico(hist.dados || []);
      setLocalSelecionado(LOCAIS_APLICACAO[0]);
      setSlotConfirmando({ medId, horario });
      return;
    }
    await confirmarDose(medId, horario, status, '');
  }

  async function confirmarDose(medId, horario, status, local) {
    try {
      await registrarDose({ medicamentoId: medId, horarioProgramado: horario, status, localAplicacao: local });
      setSlotConfirmando(null);
      await carregarRegistrosDia();
      exibirMensagem(
        status === 'tomado' ? 'Dose registrada!' :
        status === 'pulado' ? 'Dose pulada.' : 'Dose adiada.'
      );
    } catch (err) {
      exibirMensagem(err.response?.data?.mensagem || 'Erro ao registrar dose.');
    }
  }

  // ── RF07: Gerenciar medicamentos ──────────────────────────
  function abrirModalMed() {
    setVistaMed('lista');
    setEditandoMedId(null);
    setFormMed(FORM_MED_VAZIO);
    setErroMed('');
    setModalMed(true);
  }

  function abrirFormNovaMed() {
    setEditandoMedId(null);
    setFormMed(FORM_MED_VAZIO);
    setErroMed('');
    setVistaMed('form');
  }

  function abrirFormEditarMed(med) {
    setEditandoMedId(med._id);
    setFormMed({ nome: med.nome, dosagem: med.dosagem, tipo: med.tipo, horarios: [...med.horarios] });
    setErroMed('');
    setVistaMed('form');
  }

  async function handleSalvarMed(e) {
    e.preventDefault();
    const horariosLimpos = formMed.horarios.filter(h => h.trim() !== '');
    if (!formMed.nome || !formMed.dosagem || horariosLimpos.length === 0) {
      return setErroMed('Preencha nome, dosagem e ao menos um horário.');
    }
    setSalvandoMed(true);
    setErroMed('');
    try {
      const dados = { ...formMed, horarios: horariosLimpos };
      if (editandoMedId) {
        await atualizarMedicamento(editandoMedId, dados);
        exibirMensagem('Medicamento atualizado!');
      } else {
        await criarMedicamento(dados);
        exibirMensagem('Medicamento cadastrado!');
      }
      await carregarMedicamentos();
      await carregarRegistrosDia();
      setVistaMed('lista');
    } catch (err) {
      setErroMed(err.response?.data?.mensagem || 'Erro ao salvar medicamento.');
    } finally {
      setSalvandoMed(false);
    }
  }

  async function handleRemoverMed(id) {
    if (!window.confirm('Remover este medicamento da lista?')) return;
    try {
      await desativarMedicamento(id);
      await carregarMedicamentos();
      await carregarRegistrosDia();
      exibirMensagem('Medicamento removido.');
    } catch {
      exibirMensagem('Erro ao remover medicamento.');
    }
  }

  function addHorarioMed() {
    setFormMed(f => ({ ...f, horarios: [...f.horarios, '08:00'] }));
  }

  function removeHorarioMed(idx) {
    setFormMed(f => ({ ...f, horarios: f.horarios.filter((_, i) => i !== idx) }));
  }

  function setHorarioMed(idx, val) {
    setFormMed(f => {
      const h = [...f.horarios];
      h[idx] = val;
      return { ...f, horarios: h };
    });
  }

  // ── RF12: Eventos externos ────────────────────────────────
  function toggleTag(tag) {
    setTagsHoje(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  async function handleSalvarEvento(e) {
    e.preventDefault();
    if (tagsHoje.length === 0) return exibirMensagem('Selecione ao menos uma tag de contexto.');
    setSalvandoEvento(true);
    try {
      const resp = await salvarEvento({ tags: tagsHoje, observacao: obsEvento });
      setEventoHoje(resp.dados);
      // Atualiza o estado local de eventos (para o gráfico) sem recarregar do servidor,
      // o que evitaria que carregarEventos() sobrescrevesse obsEvento com o valor salvo.
      setEventos(prev => {
        const outros = prev.filter(ev => ev._id !== resp.dados._id);
        return [resp.dados, ...outros];
      });
      setObsEvento('');
      exibirMensagem('Contexto do dia salvo!');
    } catch (err) {
      exibirMensagem(err.response?.data?.mensagem || 'Erro ao salvar contexto.');
    } finally {
      setSalvandoEvento(false);
    }
  }

  async function handleRemoverEvento() {
    if (!eventoHoje) return;
    if (!window.confirm('Remover o contexto de hoje?')) return;
    try {
      await removerEvento(eventoHoje._id);
      setEventos(prev => prev.filter(ev => ev._id !== eventoHoje._id));
      setEventoHoje(null);
      setTagsHoje([]);
      setObsEvento('');
      exibirMensagem('Contexto removido.');
    } catch {
      exibirMensagem('Erro ao remover contexto.');
    }
  }

  // ── Estatísticas ───────────────────────────────────────────
  const ultimo = registros[0] || null;

  const media7dias = (() => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);
    const recentes = registros.filter(r => new Date(r.dataHora) >= limite);
    if (!recentes.length) return null;
    return Math.round(recentes.reduce((s, r) => s + r.valor, 0) / recentes.length);
  })();

  const labelMedia = media7dias === null
    ? 'Sem dados nos últimos 7 dias'
    : media7dias < 70  ? 'Hipoglicemia'
    : media7dias <= 180 ? 'Dentro do alvo'
    : 'Hiperglicemia';

  const alertasVisiveis = alertas.filter(a => !alertasFechados.has(a.id));

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="dash-wrapper">
      <div className="orb orb-dash-1" />
      <div className="orb orb-dash-2" />

      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="nav-brand">
          <span className="nav-icon">💉</span>
          <span className="nav-nome">InfoGlic</span>
        </div>
        <div className="nav-direita">
          <button className="btn-horarios" onClick={() => { setFormHorarios(horarios); setModalHorarios(true); }}>
            Horários
          </button>
          <span className="nav-saudacao">
            Olá, <strong>{usuario.nome?.split(' ')[0] || 'Usuário'}</strong>
          </span>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="dash-content">
        {mensagem && <div className="toast-mensagem">{mensagem}</div>}

        {/* RF05 / RF06 – Alertas */}
        {alertasVisiveis.length > 0 && (
          <div className="alertas-lista">
            {alertasVisiveis.map(alerta => (
              <div key={alerta.id} className={`alerta-banner alerta-${alerta.tipo}`} role="alert">
                <div className="alerta-icone">
                  {alerta.tipo === 'hipo' ? '⚠' : alerta.tipo === 'hiper' ? '⚠' : '🔔'}
                </div>
                <div className="alerta-corpo">
                  <span className="alerta-titulo">{alerta.titulo}</span>
                  <span className="alerta-texto">{alerta.mensagem}</span>
                  {alerta.instrucoes.length > 0 && (
                    <ul className="alerta-instrucoes">
                      {alerta.instrucoes.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button className="alerta-fechar" onClick={() => fecharAlerta(alerta.id)} aria-label="Fechar alerta">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Cards de estatísticas */}
        <div className="stats-row">
          <div className={`stat-card ${ultimo ? `borda-${classificar(ultimo.valor)}` : ''}`}>
            <span className="stat-label">Última Medição</span>
            <span className={`stat-valor ${ultimo ? `cor-${classificar(ultimo.valor)}` : ''}`}>
              {ultimo ? `${ultimo.valor} mg/dL` : '—'}
            </span>
            <span className="stat-sub">
              {ultimo
                ? `${ultimo.estado} · ${formatarDataHora(ultimo.dataHora)}`
                : 'Nenhum registro ainda'}
            </span>
          </div>

          <div className={`stat-card ${media7dias !== null ? `borda-${classificar(media7dias)}` : ''}`}>
            <span className="stat-label">Média (7 dias)</span>
            <span className={`stat-valor ${media7dias !== null ? `cor-${classificar(media7dias)}` : ''}`}>
              {media7dias !== null ? `${media7dias} mg/dL` : '—'}
            </span>
            <span className="stat-sub">{labelMedia}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total de Registros</span>
            <span className="stat-valor">{registros.length}</span>
            <span className="stat-sub">medições registradas</span>
          </div>
        </div>

        {/* Gráfico */}
        <section className="painel painel-grafico">
          <div className="painel-topo">
            <div>
              <h2 className="painel-titulo">Histórico Glicêmico</h2>
              <p className="painel-sub">Últimas 14 medições</p>
            </div>
            <div className="grafico-legenda">
              <span className="leg-item" style={{ color: '#4ade80' }}>● Dentro do alvo (70–180)</span>
              <span className="leg-item" style={{ color: '#e02535' }}>● Hipoglicemia (&lt;70)</span>
              <span className="leg-item" style={{ color: '#f97316' }}>● Hiperglicemia (&gt;180)</span>
            </div>
          </div>
          <GraficoGlicemia registros={registros} eventos={eventos} />
          {/* RF12 – Legenda de eventos no gráfico */}
          {Object.entries(TAG_CORES).map(([tag, cor]) => (
            <span key={tag} className="leg-item leg-evento" style={{ color: cor }}>
              ● {tag}
            </span>
          ))}
        </section>

        {/* ── RF07: Medicações de Hoje ─────────────────────── */}
        <section className="painel">
          <div className="painel-topo">
            <div>
              <h2 className="painel-titulo">Medicações de Hoje</h2>
              <p className="painel-sub">
                {medicamentos.length === 0
                  ? 'Nenhum medicamento cadastrado'
                  : `${medicamentos.length} medicamento(s) programado(s)`}
              </p>
            </div>
            <button className="btn-novo" onClick={abrirModalMed}>Gerenciar</button>
          </div>

          {medicamentos.length === 0 ? (
            <div className="estado-vazio">
              <p>Cadastre seus medicamentos para acompanhar as doses diárias.</p>
              <button className="btn-novo" style={{ marginTop: '1rem' }} onClick={abrirModalMed}>
                + Adicionar medicamento
              </button>
            </div>
          ) : (
            <div className="med-lista">
              {medicamentos.map(med => (
                <div key={med._id} className="med-card">
                  <div className="med-cabecalho">
                    <div className="med-info">
                      <span className="med-nome">{med.nome}</span>
                      <span className="med-dosagem">{med.dosagem}</span>
                    </div>
                    <span className={`med-tipo-badge med-tipo-${med.tipo.toLowerCase()}`}>
                      {med.tipo}
                    </span>
                  </div>

                  <div className="med-horarios">
                    {med.horarios.sort().map(horario => {
                      const reg = getRegistroDia(med._id, horario);
                      const confirmandoEste =
                        slotConfirmando?.medId === med._id &&
                        slotConfirmando?.horario === horario;

                      return (
                        <div key={horario} className="slot-dose">
                          <span className="slot-hora">{horario}</span>

                          {reg ? (
                            <span className={`slot-status slot-${reg.status}`}>
                              {reg.status === 'tomado'  ? '✓ Tomado'  :
                               reg.status === 'pulado'  ? '— Pulado'  : '⏰ Adiado'}
                              {reg.localAplicacao && (
                                <span className="slot-local"> · {reg.localAplicacao}</span>
                              )}
                            </span>
                          ) : confirmandoEste ? (
                            <div className="slot-confirmando">
                              <select
                                className="select-local"
                                value={localSelecionado}
                                onChange={e => setLocalSelecionado(e.target.value)}
                              >
                                {LOCAIS_APLICACAO.map(l => <option key={l}>{l}</option>)}
                              </select>
                              {locaisHistorico.length > 0 && (
                                <span className="rodizio-dica">
                                  Último: {locaisHistorico[0].localAplicacao}
                                </span>
                              )}
                              <button
                                className="btn-tab btn-editar"
                                onClick={() => confirmarDose(med._id, horario, 'tomado', localSelecionado)}
                              >
                                Confirmar
                              </button>
                              <button
                                className="btn-tab btn-remover"
                                onClick={() => setSlotConfirmando(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="slot-acoes">
                              <button className="btn-dose btn-tomado"
                                onClick={() => handleDose(med._id, horario, 'tomado', med)}>
                                Tomado
                              </button>
                              <button className="btn-dose btn-pulado"
                                onClick={() => handleDose(med._id, horario, 'pulado', med)}>
                                Pular
                              </button>
                              <button className="btn-dose btn-adiado"
                                onClick={() => handleDose(med._id, horario, 'adiado', med)}>
                                Adiar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── RF12: Contexto do Dia ────────────────────────── */}
        <section className="painel">
          <div className="painel-topo">
            <div>
              <h2 className="painel-titulo">Contexto do Dia</h2>
              <p className="painel-sub">Registre fatores externos que podem afetar a glicemia</p>
            </div>
            {eventoHoje && (
              <button className="btn-remover-evento" onClick={handleRemoverEvento}>
                Limpar
              </button>
            )}
          </div>

          <form onSubmit={handleSalvarEvento} className="evento-form">
            <div className="tags-grid">
              {TAGS_EVENTOS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-btn ${tagsHoje.includes(tag) ? 'tag-ativa' : ''}`}
                  style={tagsHoje.includes(tag) ? { borderColor: TAG_CORES[tag], color: TAG_CORES[tag], background: `${TAG_CORES[tag]}22` } : {}}
                  onClick={() => toggleTag(tag)}
                >
                  <span className="tag-dot" style={{ background: TAG_CORES[tag] }} />
                  {tag}
                </button>
              ))}
            </div>

            <div className="campo-grupo campo-obs-evento">
              <label htmlFor="obs-evento">Observação <span className="label-opt">(opcional)</span></label>
              <textarea
                id="obs-evento"
                rows={2}
                maxLength={200}
                placeholder="Descreva o contexto do dia..."
                value={obsEvento}
                onChange={e => setObsEvento(e.target.value)}
              />
              <span className="contador-chars">{obsEvento.length}/200</span>
            </div>

            <div className="evento-rodape">
              {eventoHoje && (
                <span className="evento-salvo-label">
                  Salvo: {eventoHoje.tags.join(', ')}
                </span>
              )}
              <button
                type="submit"
                className="btn-salvar btn-salvar-evento"
                disabled={salvandoEvento || tagsHoje.length === 0}
              >
                {salvandoEvento ? <span className="spinner" /> : 'Salvar Contexto'}
              </button>
            </div>
          </form>
        </section>

        {/* Tabela de registros glicêmicos */}
        <section className="painel">
          <div className="painel-topo">
            <div>
              <h2 className="painel-titulo">Histórico Completo</h2>
              <p className="painel-sub">{registros.length} registro(s) encontrado(s)</p>
            </div>
            <button className="btn-novo" onClick={abrirNovo}>+ Novo Registro</button>
          </div>

          {loading ? (
            <div className="estado-info">Carregando registros...</div>
          ) : registros.length === 0 ? (
            <div className="estado-vazio">
              <p>Nenhuma medição registrada ainda.</p>
              <button className="btn-novo" style={{ marginTop: '1rem' }} onClick={abrirNovo}>
                Registrar primeira medição
              </button>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Valor</th>
                    <th>Estado</th>
                    <th>Observação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r._id}>
                      <td>{formatarDataHora(r.dataHora)}</td>
                      <td>
                        <span className={`badge badge-${classificar(r.valor)}`}>
                          {r.valor} mg/dL
                        </span>
                      </td>
                      <td>{r.estado}</td>
                      <td className="td-obs">{r.observacao || '—'}</td>
                      <td className="td-acoes">
                        <button className="btn-tab btn-editar" onClick={() => abrirEdicao(r)}>
                          Editar
                        </button>
                        <button className="btn-tab btn-remover" onClick={() => handleRemover(r._id)}>
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ── Modal: Registro glicêmico ──────────────────────── */}
      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>{editandoId ? 'Editar Registro Glicêmico' : 'Novo Registro Glicêmico'}</h3>
              <button className="modal-fechar" onClick={fecharModal} aria-label="Fechar">×</button>
            </div>

            {erroForm && (
              <div className="alerta-erro">
                <span>⚠</span> {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvar} className="modal-form" noValidate>
              <div className="campo-grupo">
                <label htmlFor="valor">Valor glicêmico (mg/dL) *</label>
                <input
                  id="valor"
                  type="number"
                  min="20"
                  max="600"
                  placeholder="Ex: 110"
                  value={form.valor}
                  onChange={e => setForm({ ...form, valor: e.target.value })}
                  required
                />
              </div>

              <div className="campo-grupo">
                <label htmlFor="dataHora">Data e Hora * <span className="label-opt">(horário de Brasília)</span></label>
                <input
                  id="dataHora"
                  type="datetime-local"
                  max={agoraBrasil()}
                  value={form.dataHora}
                  onChange={e => setForm({ ...form, dataHora: e.target.value })}
                  required
                />
              </div>

              <div className="campo-grupo">
                <label htmlFor="estado">Estado do Teste *</label>
                <select
                  id="estado"
                  value={form.estado}
                  onChange={e => setForm({ ...form, estado: e.target.value })}
                  required
                >
                  {ESTADOS.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>

              <div className="campo-grupo">
                <label htmlFor="observacao">Observação <span className="label-opt">(opcional)</span></label>
                <textarea
                  id="observacao"
                  rows={3}
                  maxLength={200}
                  placeholder="Notas adicionais sobre esta medição..."
                  value={form.observacao}
                  onChange={e => setForm({ ...form, observacao: e.target.value })}
                />
                <span className="contador-chars">{form.observacao.length}/200</span>
              </div>

              <div className="modal-rodape">
                <button type="button" className="btn-cancelar" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar" disabled={salvando}>
                  {salvando ? <span className="spinner" /> : (editandoId ? 'Salvar Alterações' : 'Registrar Medição')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: RF05 Horários de refeição ──────────────── */}
      {modalHorarios && (
        <div className="modal-overlay" onClick={() => setModalHorarios(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>Horários de Refeição</h3>
              <button className="modal-fechar" onClick={() => setModalHorarios(false)} aria-label="Fechar">×</button>
            </div>

            <form onSubmit={handleSalvarHorarios} className="modal-form" noValidate>
              <p className="horarios-descricao">
                Configure os horários das suas refeições para receber lembretes de medição no dashboard.
              </p>

              <div className="horarios-grid">
                <div className="campo-grupo">
                  <label htmlFor="h-cafe">Café da manhã</label>
                  <input
                    id="h-cafe"
                    type="time"
                    value={formHorarios.cafe || ''}
                    onChange={e => setFormHorarios({ ...formHorarios, cafe: e.target.value })}
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="h-almoco">Almoço</label>
                  <input
                    id="h-almoco"
                    type="time"
                    value={formHorarios.almoco || ''}
                    onChange={e => setFormHorarios({ ...formHorarios, almoco: e.target.value })}
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="h-jantar">Jantar</label>
                  <input
                    id="h-jantar"
                    type="time"
                    value={formHorarios.jantar || ''}
                    onChange={e => setFormHorarios({ ...formHorarios, jantar: e.target.value })}
                  />
                </div>
              </div>

              <p className="horarios-dica">
                Deixe em branco para desativar o lembrete de uma refeição.
              </p>

              <div className="modal-rodape">
                <button type="button" className="btn-cancelar" onClick={() => setModalHorarios(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar">
                  Salvar Horários
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: RF07 Gerenciar medicamentos ─────────────── */}
      {modalMed && (
        <div className="modal-overlay" onClick={() => setModalMed(false)}>
          <div className="modal-box modal-box-med" onClick={e => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>
                {vistaMed === 'lista'
                  ? 'Meus Medicamentos'
                  : editandoMedId ? 'Editar Medicamento' : 'Novo Medicamento'}
              </h3>
              <button className="modal-fechar" onClick={() => setModalMed(false)} aria-label="Fechar">×</button>
            </div>

            {/* Vista: lista */}
            {vistaMed === 'lista' && (
              <div className="modal-form">
                {medicamentos.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '.88rem', textAlign: 'center', padding: '1rem 0' }}>
                    Nenhum medicamento cadastrado ainda.
                  </p>
                ) : (
                  <div className="med-lista-modal">
                    {medicamentos.map(med => (
                      <div key={med._id} className="med-item-modal">
                        <div className="med-item-info">
                          <span className="med-nome">{med.nome}</span>
                          <span className="med-dosagem">{med.dosagem} · {med.tipo}</span>
                          <span className="med-horarios-tag">{med.horarios.join(', ')}</span>
                        </div>
                        <div className="med-item-acoes">
                          <button className="btn-tab btn-editar" onClick={() => abrirFormEditarMed(med)}>
                            Editar
                          </button>
                          <button className="btn-tab btn-remover" onClick={() => handleRemoverMed(med._id)}>
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="modal-rodape">
                  <button type="button" className="btn-cancelar" onClick={() => setModalMed(false)}>
                    Fechar
                  </button>
                  <button type="button" className="btn-salvar" onClick={abrirFormNovaMed}>
                    + Novo
                  </button>
                </div>
              </div>
            )}

            {/* Vista: formulário */}
            {vistaMed === 'form' && (
              <>
                {erroMed && (
                  <div className="alerta-erro">
                    <span>⚠</span> {erroMed}
                  </div>
                )}
                <form onSubmit={handleSalvarMed} className="modal-form" noValidate>
                  <div className="campo-grupo">
                    <label>Nome do medicamento *</label>
                    <input
                      type="text"
                      placeholder="Ex: Metformina, Insulina Glargina"
                      value={formMed.nome}
                      onChange={e => setFormMed(f => ({ ...f, nome: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label>Dosagem *</label>
                    <input
                      type="text"
                      placeholder="Ex: 500mg, 10UI"
                      value={formMed.dosagem}
                      onChange={e => setFormMed(f => ({ ...f, dosagem: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label>Tipo *</label>
                    <select
                      value={formMed.tipo}
                      onChange={e => setFormMed(f => ({ ...f, tipo: e.target.value }))}
                    >
                      <option>Oral</option>
                      <option>Insulina</option>
                      <option>Outro</option>
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label>Horários de uso *</label>
                    <div className="horarios-med-lista">
                      {formMed.horarios.map((h, idx) => (
                        <div key={idx} className="horario-med-row">
                          <input
                            type="time"
                            value={h}
                            onChange={e => setHorarioMed(idx, e.target.value)}
                          />
                          {formMed.horarios.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-horario"
                              onClick={() => removeHorarioMed(idx)}
                              aria-label="Remover horário"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="btn-add-horario" onClick={addHorarioMed}>
                        + Adicionar horário
                      </button>
                    </div>
                  </div>

                  <div className="modal-rodape">
                    <button type="button" className="btn-cancelar" onClick={() => setVistaMed('lista')}>
                      Voltar
                    </button>
                    <button type="submit" className="btn-salvar" disabled={salvandoMed}>
                      {salvandoMed ? <span className="spinner" /> : (editandoMedId ? 'Salvar' : 'Cadastrar')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
