import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import { listar, criar, atualizar, remover, listarMeses } from '../services/registroService';
import {
  listarMedicamentos,
  criarMedicamento,
  atualizarMedicamento,
  desativarMedicamento,
  listarRegistrosDia,
  registrarDose,
  historicoLocais,
  historicoDoses,
  listarMesesDoses,
} from '../services/medicamentoService';
import { listarEventos, listarMesesEventos, salvarEvento, removerEvento } from '../services/eventoService';
import { listarRefeicoes, listarMesesRefeicoes, criarRefeicao, atualizarRefeicao, removerRefeicao, vincularRefeicao } from '../services/refeicaoService';

const ESTADOS = ['Jejum', 'Pré-prandial', 'Pós-prandial', 'Madrugada', 'Geral'];
const HORARIOS_KEY = 'infoglic_horarios';

const LOCAIS_APLICACAO = [
  'Abdômen D', 'Abdômen E',
  'Coxa D', 'Coxa E',
  'Braço D', 'Braço E',
  'Glúteo D', 'Glúteo E',
];

const TAGS_EVENTOS = ['Estresse', 'Atividade Física', 'Doença/Febre', 'Álcool'];
const TAG_CORES = {
  'Estresse':         '#f97316',
  'Atividade Física': '#3b82f6',
  'Doença/Febre':     '#ef4444',
  'Álcool':           '#a855f7',
};

const NAV_ITENS = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'registros',
    label: 'Registros Glicêmicos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'diario',
    label: 'Diário Alimentar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
  },
  {
    id: 'medicamentos',
    label: 'Medicamentos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/>
        <circle cx="18" cy="18" r="4"/><path d="M15.5 15.5 20.5 20.5"/>
      </svg>
    ),
  },
  {
    id: 'contexto',
    label: 'Contexto do Dia',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'relatorio',
    label: 'Relatório',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

// ── Helpers ────────────────────────────────────────────────────
function classificar(valor) {
  if (valor < 70)  return 'hipo';
  if (valor <= 180) return 'normal';
  return 'hiper';
}

function corValor(valor) {
  if (valor < 70)   return '#dc2626';
  if (valor <= 180) return '#16a34a';
  return '#d97706';
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

// Gera array de páginas com reticências — ex: [1,'…',4,5,6,'…',10]
function gerarPaginas(total, atual) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const vizinhos = new Set(
    [1, total, atual, atual - 1, atual + 1].filter(p => p >= 1 && p <= total)
  );
  const ordenados = [...vizinhos].sort((a, b) => a - b);
  const resultado = [];
  for (let i = 0; i < ordenados.length; i++) {
    if (i > 0 && ordenados[i] - ordenados[i - 1] > 1) resultado.push('…');
    resultado.push(ordenados[i]);
  }
  return resultado;
}

function desvioPadrao(valores) {
  if (valores.length < 2) return 0;
  const media = valores.reduce((s, v) => s + v, 0) / valores.length;
  const variancia = valores.reduce((s, v) => s + (v - media) ** 2, 0) / (valores.length - 1);
  return Math.sqrt(variancia);
}

// ── RF06: Alertas ──────────────────────────────────────────────
function gerarAlertasGlicemia(registros) {
  if (!registros.length) return [];
  const ultimo = registros[0];
  if (ultimo.valor < 70) {
    return [{
      id: `hipo-${ultimo._id}`, tipo: 'hipo',
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
      id: `hiper-${ultimo._id}`, tipo: 'hiper',
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

// ── RF05: Lembretes ────────────────────────────────────────────
function gerarAlertasLembretes(registros, horarios) {
  const alertas = [];
  const agora = new Date();
  const hoje = agora.toLocaleString('sv-SE', { timeZone: TZ_BRASIL }).slice(0, 10);

  [{ chave: 'cafe', nome: 'Café da manhã' }, { chave: 'almoco', nome: 'Almoço' }, { chave: 'jantar', nome: 'Jantar' }]
    .forEach(({ chave, nome }) => {
      const horario = horarios[chave];
      if (!horario) return;
      const horarioRefeicao = new Date(`${hoje}T${horario}:00-03:00`);
      const limiteAlerta = new Date(horarioRefeicao.getTime() + 30 * 60 * 1000);
      if (agora < limiteAlerta) return;
      const janela = 60 * 60 * 1000;
      const temRegistro = registros.some(r => Math.abs(new Date(r.dataHora) - horarioRefeicao) <= janela);
      if (!temRegistro) {
        alertas.push({
          id: `lembrete-${chave}-${hoje}`, tipo: 'lembrete',
          titulo: `Lembrete: ${nome}`,
          mensagem: `Nenhuma medição encontrada próxima ao horário de ${nome.toLowerCase()} (${horario}).`,
          instrucoes: [],
        });
      }
    });

  const inicioDia = new Date(`${hoje}T00:00:00-03:00`);
  const fimDia    = new Date(`${hoje}T23:59:59-03:00`);
  registros
    .filter(r => r.estado === 'Pré-prandial' && new Date(r.dataHora) >= inicioDia && new Date(r.dataHora) <= fimDia)
    .forEach(pre => {
      const dtPre = new Date(pre.dataHora);
      if (agora < new Date(dtPre.getTime() + 2 * 60 * 60 * 1000)) return;
      const posExiste = registros.some(r =>
        r.estado === 'Pós-prandial' &&
        new Date(r.dataHora) > dtPre &&
        new Date(r.dataHora) <= new Date(dtPre.getTime() + 4 * 60 * 60 * 1000)
      );
      if (!posExiste) {
        alertas.push({
          id: `pos-prandial-${pre._id}`, tipo: 'lembrete',
          titulo: 'Teste Pós-Prandial Pendente',
          mensagem: `Registrou Pré-prandial às ${formatarDataHora(pre.dataHora)} e já passaram mais de 2h.`,
          instrucoes: ['Realize a medição Pós-prandial e registre-a no sistema'],
        });
      }
    });

  return alertas;
}

// ── Gráfico ─────────────────────────────────────────────────
function GraficoGlicemia({ registros, eventos }) {
  const PONTOS = 14;
  const [offset, setOffset] = useState(0);

  if (registros.length === 0) {
    return <div className="grafico-vazio">Registre sua primeira medição para ver o gráfico aqui.</div>;
  }

  const totalPag = Math.ceil(registros.length / PONTOS);
  // registros vem ordenado desc (mais recente primeiro); offset 0 = mais recentes
  const fatia = registros.slice(offset * PONTOS, offset * PONTOS + PONTOS);
  const dados = [...fatia].sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));
  const W = 600, H = 260;
  const PAD = { top: 30, right: 24, bottom: 66, left: 54 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const vals = dados.map(d => d.valor);
  const minV = Math.min(Math.min(...vals) - 15, 55);
  const maxV = Math.max(Math.max(...vals) + 15, 210);
  const rangeV = maxV - minV;
  const xPos = (i) => PAD.left + (dados.length === 1 ? innerW / 2 : (i / (dados.length - 1)) * innerW);
  const yPos = (v) => PAD.top + innerH - ((v - minV) / rangeV) * innerH;

  function curvaPath(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i];
      const offset = (c.x - p.x) / 3;
      d += ` C ${p.x + offset},${p.y} ${c.x - offset},${c.y} ${c.x},${c.y}`;
    }
    return d;
  }

  const pontos = dados.map((d, i) => ({ x: xPos(i), y: yPos(d.valor) }));
  const y70 = yPos(70), y180 = yPos(180);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const yFloor = H - PAD.bottom;

  const eventosPorDia = {}, eventoObsPorDia = {};
  (eventos || []).forEach(ev => {
    const dia = new Date(ev.dataDia).toISOString().slice(0, 10);
    eventosPorDia[dia] = ev.tags || [];
    if (ev.observacao) eventoObsPorDia[dia] = ev.observacao;
  });

  const fmtDia = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const navLabel = dados.length
    ? `${fmtDia(dados[0].dataHora)} – ${fmtDia(dados[dados.length - 1].dataHora)} · ${offset * PONTOS + 1}–${Math.min((offset + 1) * PONTOS, registros.length)} de ${registros.length}`
    : '';

  return (
    <>
    <svg viewBox={`0 0 ${W} ${H}`} className="grafico-svg" aria-label="Histórico glicêmico">
      <rect x={PAD.left} y={clamp(y70, PAD.top, yFloor)} width={innerW}
        height={Math.max(0, yFloor - clamp(y70, PAD.top, yFloor))} fill="rgba(220,38,38,0.06)" />
      <rect x={PAD.left} y={PAD.top} width={innerW}
        height={Math.max(0, clamp(y180, PAD.top, yFloor) - PAD.top)} fill="rgba(217,119,6,0.05)" />
      {[80, 120, 160, 200].map(v => {
        const y = yPos(v);
        if (y < PAD.top || y > yFloor) return null;
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD.left - 7} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
          </g>
        );
      })}
      {y70 >= PAD.top && y70 <= yFloor && (
        <>
          <line x1={PAD.left} y1={y70} x2={PAD.left + innerW} y2={y70}
            stroke="rgba(220,38,38,0.5)" strokeWidth="1" strokeDasharray="5,4" />
          <text x={PAD.left - 7} y={y70 + 4} textAnchor="end" fontSize="9" fill="#dc2626">70</text>
        </>
      )}
      {y180 >= PAD.top && y180 <= yFloor && (
        <>
          <line x1={PAD.left} y1={y180} x2={PAD.left + innerW} y2={y180}
            stroke="rgba(217,119,6,0.5)" strokeWidth="1" strokeDasharray="5,4" />
          <text x={PAD.left - 7} y={y180 + 4} textAnchor="end" fontSize="9" fill="#d97706">180</text>
        </>
      )}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={yFloor} stroke="#e2e8f0" strokeWidth="1" />
      <line x1={PAD.left} y1={yFloor} x2={PAD.left + innerW} y2={yFloor} stroke="#e2e8f0" strokeWidth="1" />
      {dados.length > 1 && (
        <path d={curvaPath(pontos)} fill="none" stroke="#1d4ed8"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {dados.map((d, i) => {
        const cx = xPos(i), cy = yPos(d.valor), cor = corValor(d.valor);
        const diaDado = dataBrasilia(d.dataHora);
        const tagsNoDia = eventosPorDia[diaDado] || [];
        const obsDia = eventoObsPorDia[diaDado] || '';
        const tooltipEvento = tagsNoDia.length ? tagsNoDia.join(', ') + (obsDia ? `\n${obsDia}` : '') : '';
        return (
          <g key={d._id}>
            <circle cx={cx} cy={cy} r="5.5" fill={cor} stroke="#ffffff" strokeWidth="1.8">
              {tooltipEvento && <title>{tooltipEvento}</title>}
            </circle>
            <text x={cx} y={cy - 11} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={cor}>{d.valor}</text>
            <text x={cx} y={yFloor + 15} textAnchor="middle" fontSize="8.5" fill="#94a3b8">
              {new Date(d.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </text>
            {tagsNoDia.map((tag, ti) => (
              <circle key={tag}
                cx={cx - ((tagsNoDia.length - 1) * 4) + ti * 8} cy={yFloor + 29}
                r="3.5" fill={TAG_CORES[tag] || '#888'} opacity="0.85">
                <title>{tag}{obsDia ? ` — ${obsDia}` : ''}</title>
              </circle>
            ))}
            {obsDia && tagsNoDia.length > 0 && (
              <text x={cx} y={yFloor + 43} textAnchor="middle" fontSize="9" fill="rgba(100,116,139,0.7)">
                <title>{obsDia}</title>✎
              </text>
            )}
          </g>
        );
      })}
    </svg>
    {totalPag > 1 && (
      <div className="paginacao">
        <button className="pag-btn" onClick={() => setOffset(o => o + 1)} disabled={offset >= totalPag - 1}>‹</button>
        {gerarPaginas(totalPag, totalPag - offset).map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="pag-reticencias">…</span>
            : <button
                key={p}
                className={`pag-btn ${p === totalPag - offset ? 'pag-btn-ativo' : ''}`}
                onClick={() => setOffset(totalPag - p)}
              >{p}</button>
        )}
        <button className="pag-btn" onClick={() => setOffset(o => o - 1)} disabled={offset === 0}>›</button>
        <span className="pag-info">{navLabel}</span>
      </div>
    )}
    </>
  );
}

// ── Constantes de formulário ───────────────────────────────────
const FORM_VAZIO = { valor: '', dataHora: '', estado: 'Jejum', observacao: '' };
const FORM_MED_VAZIO = { nome: '', dosagem: '', tipo: 'Oral', horarios: ['08:00'] };
const FORM_REF_VAZIO = { dataHora: '', carboidratos: 'media', descricao: '', foto: null };
const CARB_COR = { baixa: '#16a34a', media: '#d97706', alta: '#dc2626' };
const CARB_LABEL = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

// Gráfico: distribuição glicêmica (barras horizontais)
function GraficoDistribuicao({ registros }) {
  const hipo   = registros.filter(r => r.valor < 70).length;
  const normal = registros.filter(r => r.valor >= 70 && r.valor <= 180).length;
  const hiper  = registros.filter(r => r.valor > 180).length;
  const total  = hipo + normal + hiper;
  if (total === 0) return <div className="grafico-vazio">Sem dados suficientes.</div>;

  const barras = [
    { label: 'Hipoglicemia (<70)',   count: hipo,   cor: '#dc2626', pct: Math.round(hipo / total * 100) },
    { label: 'Normal (70–180)',       count: normal, cor: '#16a34a', pct: Math.round(normal / total * 100) },
    { label: 'Hiperglicemia (>180)', count: hiper,  cor: '#d97706', pct: Math.round(hiper / total * 100) },
  ];

  return (
    <div className="dist-wrap">
      {barras.map(b => (
        <div key={b.label} className="dist-row">
          <span className="dist-label">{b.label}</span>
          <div className="dist-track">
            <div className="dist-fill" style={{ width: `${b.pct || 0}%`, background: b.cor }} />
          </div>
          <span className="dist-count">{b.count} <small>({b.pct}%)</small></span>
        </div>
      ))}
    </div>
  );
}

// Gráfico: refeições por dia (barras verticais empilhadas por carb)
function GraficoRefeicoes({ refeicoes, refDate }) {
  const MAX_OFFSET = 3;
  const [offset, setOffset] = useState(0);

  const hoje = refDate || new Date();
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - offset * 7 - (6 - i));
    return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  });

  const dadosPorDia = dias.map(dia => {
    const do_dia = refeicoes.filter(r =>
      new Date(r.dataHora).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) === dia
    );
    return {
      dia: dia.slice(5),
      baixa: do_dia.filter(r => r.carboidratos === 'baixa').length,
      media: do_dia.filter(r => r.carboidratos === 'media').length,
      alta:  do_dia.filter(r => r.carboidratos === 'alta').length,
      total: do_dia.length,
    };
  });

  const maxTotal = Math.max(...dadosPorDia.map(d => d.total), 1);
  const H = 140, GAP = 10;
  const fmtDia = (str) => new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const navLabel = `${fmtDia(dias[0])} – ${fmtDia(dias[6])}`;

  return (
    <div className="grafico-barras-wrap">
      <div className="grafico-legenda" style={{ marginBottom: '.75rem' }}>
        <span className="leg-item" style={{ color: '#16a34a' }}>● Baixa</span>
        <span className="leg-item" style={{ color: '#d97706' }}>● Média</span>
        <span className="leg-item" style={{ color: '#dc2626' }}>● Alta</span>
      </div>
      <div className="barras-container" style={{ display: 'flex', alignItems: 'flex-end', gap: GAP, height: H + 30 }}>
        {dadosPorDia.map((d, i) => {
          const hBaixa = d.total ? (d.baixa / maxTotal) * H : 0;
          const hMedia = d.total ? (d.media / maxTotal) * H : 0;
          const hAlta  = d.total ? (d.alta  / maxTotal) * H : 0;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: H, width: '100%' }}>
                {d.alta  > 0 && <div style={{ height: hAlta,  background: '#dc2626', borderRadius: '3px 3px 0 0', opacity: .85 }} />}
                {d.media > 0 && <div style={{ height: hMedia, background: '#d97706', opacity: .85 }} />}
                {d.baixa > 0 && <div style={{ height: hBaixa, background: '#16a34a', borderRadius: d.alta === 0 && d.media === 0 ? '3px 3px 0 0' : 0, opacity: .85 }} />}
                {d.total === 0 && <div style={{ height: 3, background: '#e2e8f0', borderRadius: 3 }} />}
              </div>
              <span style={{ fontSize: '.7rem', color: offset === 0 && i === 6 ? '#1d4ed8' : '#94a3b8', fontWeight: offset === 0 && i === 6 ? 700 : 400, marginTop: 4 }}>
                {offset === 0 && i === 6 ? 'Hoje' : d.dia}
              </span>
              {d.total > 0 && <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#475569' }}>{d.total}</span>}
            </div>
          );
        })}
      </div>
      <div className="paginacao">
        <button className="pag-btn" onClick={() => setOffset(o => o + 1)} disabled={offset >= MAX_OFFSET}>‹</button>
        {Array.from({ length: MAX_OFFSET + 1 }, (_, i) => i + 1).map(p => (
          <button key={p} className={`pag-btn ${p === MAX_OFFSET + 1 - offset ? 'pag-btn-ativo' : ''}`} onClick={() => setOffset(MAX_OFFSET + 1 - p)}>{p}</button>
        ))}
        <button className="pag-btn" onClick={() => setOffset(o => o - 1)} disabled={offset === 0}>›</button>
        <span className="pag-info">{navLabel}</span>
      </div>
    </div>
  );
}

// Gráfico: adesão a medicamentos (barras por dia)
function GraficoAdesao({ dosesHistorico, refDate }) {
  const MAX_OFFSET = 3;
  const [offset, setOffset] = useState(0);

  const hoje = refDate || new Date();
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - offset * 7 - (6 - i));
    return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  });

  const dadosPorDia = dias.map(dia => {
    const dosDia = dosesHistorico.filter(r =>
      new Date(r.dataDia).toISOString().slice(0, 10) === dia
    );
    return {
      dia: dia.slice(5),
      tomado: dosDia.filter(r => r.status === 'tomado').length,
      pulado: dosDia.filter(r => r.status === 'pulado').length,
      adiado: dosDia.filter(r => r.status === 'adiado').length,
      total:  dosDia.length,
    };
  });

  const maxTotal = Math.max(...dadosPorDia.map(d => d.total), 1);
  const H = 140;
  const fmtDia = (str) => new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const navLabel = `${fmtDia(dias[0])} – ${fmtDia(dias[6])}`;

  return (
    <div className="grafico-barras-wrap">
      <div className="grafico-legenda" style={{ marginBottom: '.75rem' }}>
        <span className="leg-item" style={{ color: '#16a34a' }}>● Tomado</span>
        <span className="leg-item" style={{ color: '#94a3b8' }}>● Pulado</span>
        <span className="leg-item" style={{ color: '#d97706' }}>● Adiado</span>
      </div>
      <div className="barras-container" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: H + 30 }}>
        {dadosPorDia.map((d, i) => {
          const ehHoje = offset === 0 && i === 6;
          const hTomado = d.total ? (d.tomado / maxTotal) * H : 0;
          const hPulado = d.total ? (d.pulado / maxTotal) * H : 0;
          const hAdiado = d.total ? (d.adiado / maxTotal) * H : 0;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: H, width: '100%', border: ehHoje ? '2px solid #1d4ed8' : 'none', borderRadius: 6, overflow: 'hidden' }}>
                {d.adiado > 0 && <div style={{ height: hAdiado, background: '#d97706', opacity: .85 }} />}
                {d.pulado > 0 && <div style={{ height: hPulado, background: '#94a3b8', opacity: .85 }} />}
                {d.tomado > 0 && <div style={{ height: hTomado, background: '#16a34a', opacity: .85 }} />}
                {d.total  === 0 && <div style={{ height: 3, background: '#e2e8f0' }} />}
              </div>
              <span style={{ fontSize: '.7rem', color: ehHoje ? '#1d4ed8' : '#94a3b8', fontWeight: ehHoje ? 700 : 400, marginTop: 4 }}>
                {ehHoje ? 'Hoje' : d.dia}
              </span>
            </div>
          );
        })}
      </div>
      <div className="paginacao">
        <button className="pag-btn" onClick={() => setOffset(o => o + 1)} disabled={offset >= MAX_OFFSET}>‹</button>
        {Array.from({ length: MAX_OFFSET + 1 }, (_, i) => i + 1).map(p => (
          <button key={p} className={`pag-btn ${p === MAX_OFFSET + 1 - offset ? 'pag-btn-ativo' : ''}`} onClick={() => setOffset(MAX_OFFSET + 1 - p)}>{p}</button>
        ))}
        <button className="pag-btn" onClick={() => setOffset(o => o - 1)} disabled={offset === 0}>›</button>
        <span className="pag-info">{navLabel}</span>
      </div>
    </div>
  );
}

// Gráfico: frequência de tags de eventos (barras horizontais)
function GraficoEventos({ eventos, refDate }) {
  const MAX_OFFSET = 3;
  const [offset, setOffset] = useState(0);

  const TAGS  = ['Estresse', 'Atividade Física', 'Doença/Febre', 'Álcool'];
  const CORES = { 'Estresse': '#f97316', 'Atividade Física': '#3b82f6', 'Doença/Febre': '#ef4444', 'Álcool': '#a855f7' };

  const hoje = refDate || new Date();
  const fimPeriodo   = new Date(hoje); fimPeriodo.setDate(fimPeriodo.getDate() - offset * 7);
  const inicioPeriodo = new Date(fimPeriodo); inicioPeriodo.setDate(inicioPeriodo.getDate() - 6);
  inicioPeriodo.setHours(0, 0, 0, 0); fimPeriodo.setHours(23, 59, 59, 999);

  const eventosSemana = eventos.filter(e => {
    const dt = new Date(e.dataDia);
    return dt >= inicioPeriodo && dt <= fimPeriodo;
  });

  const contagens = TAGS.map(tag => ({
    tag, cor: CORES[tag],
    count: eventosSemana.filter(e => (e.tags || []).includes(tag)).length,
  }));
  const maxCount = Math.max(...contagens.map(c => c.count), 1);

  const fmtDia   = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const navLabel = `${fmtDia(inicioPeriodo)} – ${fmtDia(fimPeriodo)}`;

  if (eventos.length === 0) return <div className="grafico-vazio">Nenhum contexto registrado ainda.</div>;

  return (
    <div className="dist-wrap">
      {contagens.map(c => (
        <div key={c.tag} className="dist-row">
          <span className="dist-label" style={{ color: c.cor, fontWeight: 600 }}>{c.tag}</span>
          <div className="dist-track">
            <div className="dist-fill" style={{ width: `${(c.count / maxCount) * 100}%`, background: c.cor }} />
          </div>
          <span className="dist-count">{c.count} {c.count === 1 ? 'dia' : 'dias'}</span>
        </div>
      ))}
      <div className="paginacao">
        <button className="pag-btn" onClick={() => setOffset(o => o + 1)} disabled={offset >= MAX_OFFSET}>‹</button>
        {Array.from({ length: MAX_OFFSET + 1 }, (_, i) => i + 1).map(p => (
          <button key={p} className={`pag-btn ${p === MAX_OFFSET + 1 - offset ? 'pag-btn-ativo' : ''}`} onClick={() => setOffset(MAX_OFFSET + 1 - p)}>{p}</button>
        ))}
        <button className="pag-btn" onClick={() => setOffset(o => o - 1)} disabled={offset === 0}>›</button>
        <span className="pag-info">{navLabel}</span>
      </div>
    </div>
  );
}

// Retorna o último dia do mês para ancorar os gráficos semanais em meses passados
function refDateDoMes(mes) {
  const d = new Date();
  const atual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (mes === atual) return undefined;
  const [ano, mesNum] = mes.split('-').map(Number);
  return new Date(ano, mesNum, 0);
}

function MesNav({ mes, setMes, mesesComDados }) {
  const [ano, mesNum] = mes.split('-').map(Number);
  const label = new Date(ano, mesNum - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  function irAnterior() {
    const d = new Date(ano, mesNum - 2);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  function irProximo() {
    const d = new Date(ano, mesNum);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const ehAtual = (() => {
    const d = new Date();
    return mes === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const anteriorBloqueado = mesesComDados ? !mesesComDados.some(m => m < mes) : false;

  return (
    <div className="lateral-mes-cab">
      <button className="lateral-mes-btn" onClick={irAnterior} disabled={anteriorBloqueado} title="Mês anterior">‹</button>
      <span className="lateral-mes-titulo">{label}</span>
      <button className="lateral-mes-btn" onClick={irProximo} disabled={ehAtual} title="Próximo mês">›</button>
    </div>
  );
}

function comprimirFoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 600;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Componente principal ───────────────────────────────────────
export default function Dashboard() {
  // Navegação
  const [secaoAtiva, setSecaoAtiva] = useState('visao-geral');
  const [sidebarAberta, setSidebarAberta] = useState(false);

  // Registros glicêmicos
  const [registros, setRegistros]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId]   = useState(null);
  const [form, setForm]               = useState(FORM_VAZIO);
  const [salvando, setSalvando]       = useState(false);
  const [erroForm, setErroForm]       = useState('');
  const [mensagem, setMensagem]       = useState('');
  const [mesAtual, setMesAtual]       = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [paginaAtual, setPaginaAtual]           = useState(1);
  const [mesesComRegistros, setMesesComRegistros] = useState(null); // null = ainda carregando

  // RF05 / RF06
  const [alertas, setAlertas]                 = useState([]);
  const [alertasFechados, setAlertasFechados] = useState(new Set());
  const [horarios, setHorarios]               = useState(() => {
    try { return JSON.parse(localStorage.getItem(HORARIOS_KEY) || '{}'); } catch { return {}; }
  });
  const [modalHorarios, setModalHorarios] = useState(false);
  const [formHorarios, setFormHorarios]   = useState(horarios);

  // RF07
  const [medicamentos, setMedicamentos]         = useState([]);
  const [registrosDia, setRegistrosDia]         = useState([]);
  const [slotConfirmando, setSlotConfirmando]   = useState(null);
  const [localSelecionado, setLocalSelecionado] = useState(LOCAIS_APLICACAO[0]);
  const [locaisHistorico, setLocaisHistorico]   = useState([]);
  const [modalMed, setModalMed]                 = useState(false);
  const [vistaMed, setVistaMed]                 = useState('lista');
  const [editandoMedId, setEditandoMedId]       = useState(null);
  const [formMed, setFormMed]                   = useState(FORM_MED_VAZIO);
  const [erroMed, setErroMed]                   = useState('');
  const [salvandoMed, setSalvandoMed]           = useState(false);

  // RF12
  const [eventos, setEventos]               = useState([]);
  const [eventoHoje, setEventoHoje]         = useState(null);
  const [tagsHoje, setTagsHoje]             = useState([]);
  const [obsEvento, setObsEvento]           = useState('');
  const [salvandoEvento, setSalvandoEvento] = useState(false);

  // Navegação de mês por seção
  const mesPadrao = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const [mesRefeicao,    setMesRefeicao]    = useState(mesPadrao);
  const [mesMedicamento, setMesMedicamento] = useState(mesPadrao);
  const [mesContexto,    setMesContexto]    = useState(mesPadrao);
  const [mesesComRefeicoes,    setMesesComRefeicoes]    = useState(null);
  const [mesesComMedicamentos, setMesesComMedicamentos] = useState(null);
  const [mesesComContexto,     setMesesComContexto]     = useState(null);

  // RF08
  const [refeicoes, setRefeicoes]             = useState([]);
  const [modalRef, setModalRef]               = useState(false);
  const [editandoRefId, setEditandoRefId]     = useState(null);
  const [formRef, setFormRef]                 = useState(FORM_REF_VAZIO);
  const [fotoPreview, setFotoPreview]         = useState(null);
  const [salvandoRef, setSalvandoRef]         = useState(false);
  const [erroRef, setErroRef]                 = useState('');
  const [vinculandoRefId, setVinculandoRefId] = useState(null);

  // Histórico de doses (medicamentos)
  const [dosesHistorico, setDosesHistorico] = useState([]);

  // RF10 – Relatório
  const [periodoRelatorio, setPeriodoRelatorio] = useState(30);
  const [dadosRelatorio,   setDadosRelatorio]   = useState(null);
  const [carregandoRel,    setCarregandoRel]    = useState(false);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  // ── Loaders ───────────────────────────────────────────────
  const carregarRegistros = useCallback(async () => {
    try {
      const r = await listar(mesAtual);
      setRegistros(r.dados || []);
      setPaginaAtual(1);
    }
    catch { setMensagem('Erro ao carregar registros.'); }
    finally { setLoading(false); }
  }, [mesAtual]);

  const carregarMesesComRegistros = useCallback(async () => {
    try { const r = await listarMeses(); setMesesComRegistros(r.dados || []); } catch {}
  }, []);

  const carregarMedicamentos = useCallback(async () => {
    try { const r = await listarMedicamentos(); setMedicamentos(r.dados || []); } catch {}
  }, []);

  const carregarRegistrosDia = useCallback(async () => {
    try { const r = await listarRegistrosDia(); setRegistrosDia(r.dados || []); } catch {}
  }, []);

  const carregarEventos = useCallback(async () => {
    try {
      const r = await listarEventos(mesContexto);
      const lista = r.dados || [];
      setEventos(lista);
      // Atualiza eventoHoje só quando o mês carregado é o atual
      if (mesContexto === mesPadrao()) {
        const hoje = dataBrasilia();
        const evt = lista.find(e => new Date(e.dataDia).toISOString().slice(0, 10) === hoje);
        if (evt) { setEventoHoje(evt); setTagsHoje(evt.tags || []); setObsEvento(evt.observacao || ''); }
        else { setEventoHoje(null); setTagsHoje([]); setObsEvento(''); }
      }
    } catch {}
  }, [mesContexto]);

  const carregarMesesComContexto = useCallback(async () => {
    try { const r = await listarMesesEventos(); setMesesComContexto(r.dados || []); } catch {}
  }, []);

  const carregarRefeicoes = useCallback(async () => {
    try { const r = await listarRefeicoes(mesRefeicao); setRefeicoes(r.dados || []); } catch {}
  }, [mesRefeicao]);

  const carregarMesesComRefeicoes = useCallback(async () => {
    try { const r = await listarMesesRefeicoes(); setMesesComRefeicoes(r.dados || []); } catch {}
  }, []);

  const carregarDosesHistorico = useCallback(async () => {
    try { const r = await historicoDoses(mesMedicamento); setDosesHistorico(r.dados || []); } catch {}
  }, [mesMedicamento]);

  const carregarMesesComMedicamentos = useCallback(async () => {
    try { const r = await listarMesesDoses(); setMesesComMedicamentos(r.dados || []); } catch {}
  }, []);

  const carregarDadosRelatorio = useCallback(async (dias) => {
    setCarregandoRel(true);
    try {
      const fim = new Date();
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - dias + 1);
      inicio.setHours(0, 0, 0, 0);

      const meses = new Set();
      const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
      while (cursor <= fim) {
        meses.add(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const [todosRegs, todasRefs, todasDoses] = await Promise.all([
        Promise.all([...meses].map(m => listar(m).then(r => r.dados || []))).then(a => a.flat()),
        Promise.all([...meses].map(m => listarRefeicoes(m).then(r => r.dados || []))).then(a => a.flat()),
        Promise.all([...meses].map(m => historicoDoses(m).then(r => r.dados || []))).then(a => a.flat()),
      ]);

      const regsNoPeriodo = todosRegs.filter(r => new Date(r.dataHora) >= inicio && new Date(r.dataHora) <= fim);
      const refsNoPeriodo = todasRefs.filter(r => new Date(r.dataHora) >= inicio && new Date(r.dataHora) <= fim);
      const dosesNoPeriodo = todasDoses.filter(d => {
        const dia = new Date(d.dataDia);
        return dia >= inicio && dia <= fim;
      });

      const valores = regsNoPeriodo.map(r => r.valor);
      const media = valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : 0;
      const dp = desvioPadrao(valores);
      const tir = valores.length
        ? Math.round((valores.filter(v => v >= 70 && v <= 180).length / valores.length) * 100)
        : 0;
      const hipos = regsNoPeriodo.filter(r => r.valor < 70).sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
      const hipers = regsNoPeriodo.filter(r => r.valor > 180).length;

      // Correlações alimentares: refeições vinculadas a pós-prandial
      const correlacoes = refsNoPeriodo
        .filter(r => r.registroVinculado)
        .map(r => {
          const reg = typeof r.registroVinculado === 'object' ? r.registroVinculado : regsNoPeriodo.find(g => g._id === r.registroVinculado);
          return reg ? { refeicao: r, glicemia: reg } : null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.refeicao.dataHora) - new Date(a.refeicao.dataHora));

      // Aderência a medicamentos
      const totalDoses = dosesNoPeriodo.length;
      const tomadas = dosesNoPeriodo.filter(d => d.status === 'tomado').length;
      const puladas = dosesNoPeriodo.filter(d => d.status === 'pulado').length;
      const aderencia = totalDoses ? Math.round((tomadas / totalDoses) * 100) : null;

      setDadosRelatorio({
        periodo: { inicio, fim, dias },
        registros: regsNoPeriodo,
        glicemia: { media, dp, tir, total: valores.length, hipos, hipers },
        correlacoes,
        medicamentos: { totalDoses, tomadas, puladas, aderencia },
        geradoEm: new Date(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoRel(false);
    }
  }, []);

  useEffect(() => {
    carregarRegistros(); carregarMedicamentos(); carregarRegistrosDia();
    carregarEventos(); carregarRefeicoes(); carregarDosesHistorico();
    carregarMesesComRegistros(); carregarMesesComRefeicoes();
    carregarMesesComMedicamentos(); carregarMesesComContexto();
  }, [
    carregarRegistros, carregarMedicamentos, carregarRegistrosDia,
    carregarEventos, carregarRefeicoes, carregarDosesHistorico,
    carregarMesesComRegistros, carregarMesesComRefeicoes,
    carregarMesesComMedicamentos, carregarMesesComContexto,
  ]);

  useEffect(() => {
    setAlertas([...gerarAlertasGlicemia(registros), ...gerarAlertasLembretes(registros, horarios)]);
    setAlertasFechados(new Set());
  }, [registros, horarios]);

  useEffect(() => {
    if (secaoAtiva === 'relatorio') carregarDadosRelatorio(periodoRelatorio);
  }, [secaoAtiva, periodoRelatorio, carregarDadosRelatorio]);

  // ── Handlers: registros glicêmicos ───────────────────────
  function abrirNovo() {
    setEditandoId(null); setForm({ ...FORM_VAZIO, dataHora: agoraBrasil() });
    setErroForm(''); setModalAberto(true);
  }
  function abrirEdicao(r) {
    setEditandoId(r._id);
    setForm({ valor: r.valor, dataHora: paraInputBrasil(r.dataHora), estado: r.estado, observacao: r.observacao || '' });
    setErroForm(''); setModalAberto(true);
  }
  function fecharModal() { setModalAberto(false); setEditandoId(null); setErroForm(''); }

  async function handleSalvar(e) {
    e.preventDefault();
    const valorNum = Number(form.valor);
    if (!form.valor || !form.dataHora || !form.estado) return setErroForm('Preencha todos os campos obrigatórios.');
    if (isNaN(valorNum) || valorNum < 20 || valorNum > 600) return setErroForm('Valor deve estar entre 20 e 600 mg/dL.');
    if (form.dataHora > agoraBrasil()) return setErroForm('Não é permitido registrar datas futuras.');
    setSalvando(true); setErroForm('');
    try {
      const dados = { ...form, valor: valorNum, dataHora: form.dataHora + ':00-03:00' };
      if (editandoId) {
        const resp = await atualizar(editandoId, dados);
        setRegistros(prev => prev.map(r => r._id === editandoId ? resp.dados : r));
        exibirMensagem('Registro atualizado!');
      } else {
        const resp = await criar(dados);
        setRegistros(prev =>
          [resp.dados, ...prev].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
        );
        exibirMensagem('Medição registrada!');
      }
      fecharModal();
      carregarMesesComRegistros();
    } catch (err) { setErroForm(err.response?.data?.mensagem || 'Erro ao salvar.'); }
    finally { setSalvando(false); }
  }

  async function handleRemover(id) {
    if (!window.confirm('Deseja remover este registro permanentemente?')) return;
    try {
      await remover(id);
      setRegistros(prev => prev.filter(r => r._id !== id));
      exibirMensagem('Registro removido.');
      carregarMesesComRegistros();
    }
    catch { exibirMensagem('Erro ao remover registro.'); }
  }

  function exibirMensagem(texto) { setMensagem(texto); setTimeout(() => setMensagem(''), 4000); }

  function logout() { localStorage.removeItem('token'); localStorage.removeItem('usuario'); window.location.href = '/login'; }

  function fecharAlerta(id) { setAlertasFechados(prev => new Set([...prev, id])); }

  function handleSalvarHorarios(e) {
    e.preventDefault();
    localStorage.setItem(HORARIOS_KEY, JSON.stringify(formHorarios));
    setHorarios(formHorarios); setModalHorarios(false); exibirMensagem('Horários salvos!');
  }

  // ── RF07: handlers ────────────────────────────────────────
  function getRegistroDia(medId, horario) {
    return registrosDia.find(r => r.medicamento?._id === medId && r.horarioProgramado === horario);
  }

  async function handleDose(medId, horario, status, med) {
    if (status === 'tomado' && med.tipo === 'Insulina') {
      const hist = await historicoLocais(medId).catch(() => ({ dados: [] }));
      setLocaisHistorico(hist.dados || []);
      setLocalSelecionado(LOCAIS_APLICACAO[0]);
      setSlotConfirmando({ medId, horario }); return;
    }
    await confirmarDose(medId, horario, status, '');
  }

  async function confirmarDose(medId, horario, status, local) {
    try {
      await registrarDose({ medicamentoId: medId, horarioProgramado: horario, status, localAplicacao: local });
      setSlotConfirmando(null); await carregarRegistrosDia();
      exibirMensagem(status === 'tomado' ? 'Dose registrada!' : status === 'pulado' ? 'Dose pulada.' : 'Dose adiada.');
    } catch (err) { exibirMensagem(err.response?.data?.mensagem || 'Erro ao registrar dose.'); }
  }

  function abrirModalMed() { setVistaMed('lista'); setEditandoMedId(null); setFormMed(FORM_MED_VAZIO); setErroMed(''); setModalMed(true); }
  function abrirFormNovaMed() { setEditandoMedId(null); setFormMed(FORM_MED_VAZIO); setErroMed(''); setVistaMed('form'); }
  function abrirFormEditarMed(med) {
    setEditandoMedId(med._id);
    setFormMed({ nome: med.nome, dosagem: med.dosagem, tipo: med.tipo, horarios: [...med.horarios] });
    setErroMed(''); setVistaMed('form');
  }

  async function handleSalvarMed(e) {
    e.preventDefault();
    const horariosLimpos = formMed.horarios.filter(h => h.trim() !== '');
    if (!formMed.nome || !formMed.dosagem || horariosLimpos.length === 0)
      return setErroMed('Preencha nome, dosagem e ao menos um horário.');
    setSalvandoMed(true); setErroMed('');
    try {
      const dados = { ...formMed, horarios: horariosLimpos };
      if (editandoMedId) { await atualizarMedicamento(editandoMedId, dados); exibirMensagem('Medicamento atualizado!'); }
      else { await criarMedicamento(dados); exibirMensagem('Medicamento cadastrado!'); }
      await carregarMedicamentos(); await carregarRegistrosDia(); setVistaMed('lista');
    } catch (err) { setErroMed(err.response?.data?.mensagem || 'Erro ao salvar medicamento.'); }
    finally { setSalvandoMed(false); }
  }

  async function handleRemoverMed(id) {
    if (!window.confirm('Remover este medicamento?')) return;
    try { await desativarMedicamento(id); await carregarMedicamentos(); await carregarRegistrosDia(); exibirMensagem('Medicamento removido.'); }
    catch { exibirMensagem('Erro ao remover medicamento.'); }
  }

  function addHorarioMed() { setFormMed(f => ({ ...f, horarios: [...f.horarios, '08:00'] })); }
  function removeHorarioMed(idx) { setFormMed(f => ({ ...f, horarios: f.horarios.filter((_, i) => i !== idx) })); }
  function setHorarioMed(idx, val) { setFormMed(f => { const h = [...f.horarios]; h[idx] = val; return { ...f, horarios: h }; }); }

  // ── RF12: handlers ────────────────────────────────────────
  function toggleTag(tag) { setTagsHoje(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); }

  async function handleSalvarEvento(e) {
    e.preventDefault();
    if (tagsHoje.length === 0) return exibirMensagem('Selecione ao menos uma tag.');
    setSalvandoEvento(true);
    try {
      const resp = await salvarEvento({ tags: tagsHoje, observacao: obsEvento });
      setEventoHoje(resp.dados);
      setEventos(prev => { const outros = prev.filter(ev => ev._id !== resp.dados._id); return [resp.dados, ...outros]; });
      setObsEvento(''); exibirMensagem('Contexto do dia salvo!');
    } catch (err) { exibirMensagem(err.response?.data?.mensagem || 'Erro ao salvar contexto.'); }
    finally { setSalvandoEvento(false); }
  }

  async function handleRemoverEvento() {
    if (!eventoHoje || !window.confirm('Remover o contexto de hoje?')) return;
    try {
      await removerEvento(eventoHoje._id);
      setEventos(prev => prev.filter(ev => ev._id !== eventoHoje._id));
      setEventoHoje(null); setTagsHoje([]); setObsEvento(''); exibirMensagem('Contexto removido.');
    } catch { exibirMensagem('Erro ao remover contexto.'); }
  }

  // ── RF08: handlers ────────────────────────────────────────
  function abrirNovaRefeicao() {
    setEditandoRefId(null); setFormRef({ ...FORM_REF_VAZIO, dataHora: agoraBrasil() });
    setFotoPreview(null); setErroRef(''); setModalRef(true);
  }
  function abrirEdicaoRefeicao(ref) {
    setEditandoRefId(ref._id);
    setFormRef({ dataHora: paraInputBrasil(ref.dataHora), carboidratos: ref.carboidratos, descricao: ref.descricao || '', foto: ref.foto || null });
    setFotoPreview(ref.foto || null); setErroRef(''); setModalRef(true);
  }
  function fecharModalRef() { setModalRef(false); setEditandoRefId(null); setFotoPreview(null); setErroRef(''); }

  async function handleFotoChange(e) {
    const file = e.target.files[0]; if (!file) return;
    try { const c = await comprimirFoto(file); setFotoPreview(c); setFormRef(f => ({ ...f, foto: c })); }
    catch { setErroRef('Não foi possível processar a imagem.'); }
  }

  async function handleSalvarRefeicao(e) {
    e.preventDefault();
    if (!formRef.dataHora || !formRef.carboidratos) return setErroRef('Preencha data/hora e estimativa de carboidratos.');
    setSalvandoRef(true); setErroRef('');
    try {
      const dados = { ...formRef, dataHora: formRef.dataHora + ':00-03:00' };
      if (editandoRefId) { await atualizarRefeicao(editandoRefId, dados); exibirMensagem('Refeição atualizada!'); }
      else { await criarRefeicao(dados); exibirMensagem('Refeição registrada!'); }
      fecharModalRef(); carregarRefeicoes();
    } catch (err) { setErroRef(err.response?.data?.mensagem || 'Erro ao salvar refeição.'); }
    finally { setSalvandoRef(false); }
  }

  async function handleRemoverRefeicao(id) {
    if (!window.confirm('Remover esta refeição?')) return;
    try { await removerRefeicao(id); exibirMensagem('Refeição removida.'); carregarRefeicoes(); }
    catch { exibirMensagem('Erro ao remover refeição.'); }
  }

  async function handleVincularRefeicao(refId, registroId) {
    try {
      const resp = await vincularRefeicao(refId, registroId || null);
      setRefeicoes(prev => prev.map(r => r._id === refId ? resp.dados : r));
      setVinculandoRefId(null); exibirMensagem(registroId ? 'Teste glicêmico vinculado!' : 'Vínculo removido.');
    } catch (err) { exibirMensagem(err.response?.data?.mensagem || 'Erro ao vincular.'); }
  }

  // ── Navegação de mês ─────────────────────────────────────
  const REGISTROS_POR_PAGINA = 10;

  function labelMes() {
    const [ano, mes] = mesAtual.split('-').map(Number);
    return new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }
  function irMesAnterior() {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const d = new Date(ano, mes - 2);
    setMesAtual(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  function irProximoMes() {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const d = new Date(ano, mes);
    setMesAtual(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  function ehMesAtual() {
    const d = new Date();
    return mesAtual === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  function ehMesAnteriorBloqueado() {
    if (!mesesComRegistros) return false;
    return !mesesComRegistros.some(m => m < mesAtual);
  }

  const totalPaginas       = Math.ceil(registros.length / REGISTROS_POR_PAGINA);
  const registrosPaginados = registros.slice(
    (paginaAtual - 1) * REGISTROS_POR_PAGINA,
    paginaAtual * REGISTROS_POR_PAGINA
  );

  // ── Estatísticas ──────────────────────────────────────────
  const ultimo = registros[0] || null;
  const media7dias = (() => {
    const limite = new Date(); limite.setDate(limite.getDate() - 7);
    const recentes = registros.filter(r => new Date(r.dataHora) >= limite);
    if (!recentes.length) return null;
    return Math.round(recentes.reduce((s, r) => s + r.valor, 0) / recentes.length);
  })();
  const labelMedia = media7dias === null ? 'Sem dados nos últimos 7 dias'
    : media7dias < 70 ? 'Hipoglicemia' : media7dias <= 180 ? 'Dentro do alvo' : 'Hiperglicemia';
  const alertasVisiveis = alertas.filter(a => !alertasFechados.has(a.id));
  const tituloSecao = NAV_ITENS.find(i => i.id === secaoAtiva)?.label || '';

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="dash-layout">

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className={`dash-sidebar ${sidebarAberta ? 'sidebar-aberta' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">💉</span>
          <span className="sidebar-logo-nome">InfoGlic</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITENS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${secaoAtiva === item.id ? 'nav-item-ativo' : ''}`}
              onClick={() => { setSecaoAtiva(item.id); setSidebarAberta(false); }}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </button>
          ))}

          <div className="sidebar-divisor" />

          <button
            className="nav-item"
            onClick={() => { setFormHorarios(horarios); setModalHorarios(true); setSidebarAberta(false); }}
          >
            <span className="nav-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M19.07 4.93l-2.83 2.83"/>
                <path d="M4.93 19.07l2.83-2.83"/><circle cx="12" cy="12" r="10"/>
              </svg>
            </span>
            <span className="nav-item-label">Horários de Refeição</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-usuario">
            <div className="usuario-avatar">
              {(usuario.nome?.[0] || 'U').toUpperCase()}
            </div>
            <div className="usuario-info">
              <span className="usuario-nome">{usuario.nome?.split(' ')[0] || 'Usuário'}</span>
              <span className="usuario-tipo">{usuario.tipoDiabetes || 'Paciente'}</span>
            </div>
          </div>
          <button className="btn-sair" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div className="sidebar-overlay" onClick={() => setSidebarAberta(false)} />
      )}

      {/* ── Área principal ───────────────────────────────── */}
      <div className="dash-main">

        {/* Top bar */}
        <header className="dash-topbar">
          <button className="btn-menu" onClick={() => setSidebarAberta(!sidebarAberta)} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 className="topbar-titulo">{tituloSecao}</h1>
          <div className="topbar-direita">
            {alertasVisiveis.length > 0 && (
              <span className="alerta-badge">{alertasVisiveis.length}</span>
            )}
          </div>
        </header>

        <main className="dash-content">
          {mensagem && <div className="toast-mensagem">{mensagem}</div>}

          {/* Alertas — topo apenas na visão geral; demais seções mostram na lateral */}
          {secaoAtiva === 'visao-geral' && alertasVisiveis.length > 0 && (
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
                        {alerta.instrucoes.map((inst, i) => <li key={i}>{inst}</li>)}
                      </ul>
                    )}
                  </div>
                  <button className="alerta-fechar" onClick={() => fecharAlerta(alerta.id)} aria-label="Fechar">×</button>
                </div>
              ))}
            </div>
          )}

          {/* ── Seção: Visão Geral ──────────────────────── */}
          {secaoAtiva === 'visao-geral' && (
            <>
              <div className="stats-row">
                <div className={`stat-card ${ultimo ? `borda-${classificar(ultimo.valor)}` : ''}`}>
                  <span className="stat-label">Última Medição</span>
                  <span className={`stat-valor ${ultimo ? `cor-${classificar(ultimo.valor)}` : ''}`}>
                    {ultimo ? `${ultimo.valor} mg/dL` : '—'}
                  </span>
                  <span className="stat-sub">
                    {ultimo ? `${ultimo.estado} · ${formatarDataHora(ultimo.dataHora)}` : 'Nenhum registro ainda'}
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

              <section className="painel">
                <div className="painel-topo">
                  <div>
                    <h2 className="painel-titulo">Histórico Glicêmico</h2>
                    <p className="painel-sub">{registros.length} medição(ões) em {labelMes()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                    <div className="grafico-legenda">
                      <span className="leg-item" style={{ color: '#16a34a' }}>● Normal (70–180)</span>
                      <span className="leg-item" style={{ color: '#dc2626' }}>● Hipo (&lt;70)</span>
                      <span className="leg-item" style={{ color: '#d97706' }}>● Hiper (&gt;180)</span>
                    </div>
                    <div className="mes-nav">
                      <button className="mes-nav-btn" onClick={irMesAnterior} disabled={ehMesAnteriorBloqueado()} title="Mês anterior">‹</button>
                      <span className="mes-nav-label">{labelMes()}</span>
                      <button className="mes-nav-btn" onClick={irProximoMes} disabled={ehMesAtual()} title="Próximo mês">›</button>
                    </div>
                  </div>
                </div>
                <GraficoGlicemia key={mesAtual} registros={registros} eventos={eventos} />
                <div style={{ marginTop: '.5rem', display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                  {Object.entries(TAG_CORES).map(([tag, cor]) => (
                    <span key={tag} className="leg-item leg-evento" style={{ color: cor }}>● {tag}</span>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ── Seção: Registros Glicêmicos ────────────── */}
          {secaoAtiva === 'registros' && (
            <div className="secao-grade">
            <div className="secao-principal">

            {/* Stats de registros */}
            <div className="stats-row">
              <div className={`stat-card ${ultimo ? `borda-${classificar(ultimo.valor)}` : ''}`}>
                <span className="stat-label">Última Medição</span>
                <span className={`stat-valor ${ultimo ? `cor-${classificar(ultimo.valor)}` : ''}`}>
                  {ultimo ? `${ultimo.valor} mg/dL` : '—'}
                </span>
                <span className="stat-sub">{ultimo ? `${ultimo.estado} · ${formatarDataHora(ultimo.dataHora)}` : 'Nenhum registro'}</span>
              </div>
              <div className={`stat-card ${media7dias !== null ? `borda-${classificar(media7dias)}` : ''}`}>
                <span className="stat-label">Média (7 dias)</span>
                <span className={`stat-valor ${media7dias !== null ? `cor-${classificar(media7dias)}` : ''}`}>
                  {media7dias !== null ? `${media7dias} mg/dL` : '—'}
                </span>
                <span className="stat-sub">{labelMedia}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">No Alvo (7 dias)</span>
                <span className="stat-valor cor-normal">
                  {(() => {
                    const lim = new Date(); lim.setDate(lim.getDate() - 7);
                    const rec = registros.filter(r => new Date(r.dataHora) >= lim);
                    if (!rec.length) return '—';
                    const norm = rec.filter(r => r.valor >= 70 && r.valor <= 180).length;
                    return `${Math.round(norm / rec.length * 100)}%`;
                  })()}
                </span>
                <span className="stat-sub">medições dentro do alvo</span>
              </div>
            </div>

            {/* Gráfico linha + distribuição */}
            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Tendência Glicêmica</h2>
                  <p className="painel-sub">{registros.length} medição(ões) em {labelMes()}</p>
                </div>
                <div className="grafico-legenda">
                  <span className="leg-item" style={{ color: '#16a34a' }}>● Normal</span>
                  <span className="leg-item" style={{ color: '#dc2626' }}>● Hipo</span>
                  <span className="leg-item" style={{ color: '#d97706' }}>● Hiper</span>
                </div>
              </div>
              <GraficoGlicemia key={mesAtual} registros={registros} eventos={eventos} />
            </section>

            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Distribuição por Faixa</h2>
                  <p className="painel-sub">Medições de {labelMes()}</p>
                </div>
              </div>
              <GraficoDistribuicao registros={registros} />
            </section>

            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Histórico de Registros</h2>
                  <p className="painel-sub">{registros.length} registro(s) em {labelMes()}</p>
                </div>
                <button className="btn-novo" onClick={abrirNovo}>+ Novo</button>
              </div>
              {loading ? (
                <div className="estado-info">Carregando registros...</div>
              ) : registros.length === 0 ? (
                <div className="estado-vazio">
                  <p>Nenhuma medição registrada em {labelMes()}.</p>
                  {ehMesAtual() && (
                    <button className="btn-novo" style={{ marginTop: '1rem' }} onClick={abrirNovo}>
                      Registrar primeira medição
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="tabela-scroll">
                    <table className="tabela">
                      <thead>
                        <tr>
                          <th>Data / Hora</th><th>Valor</th><th>Estado</th>
                          <th>Observação</th><th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrosPaginados.map(r => (
                          <tr key={r._id}>
                            <td>{formatarDataHora(r.dataHora)}</td>
                            <td><span className={`badge badge-${classificar(r.valor)}`}>{r.valor} mg/dL</span></td>
                            <td>{r.estado}</td>
                            <td className="td-obs">{r.observacao || '—'}</td>
                            <td className="td-acoes">
                              <button className="btn-tab btn-editar" onClick={() => abrirEdicao(r)}>Editar</button>
                              <button className="btn-tab btn-remover" onClick={() => handleRemover(r._id)}>Remover</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPaginas > 1 && (
                    <div className="paginacao">
                      <button
                        className="pag-btn"
                        onClick={() => setPaginaAtual(p => p - 1)}
                        disabled={paginaAtual === 1}
                      >‹</button>

                      {gerarPaginas(totalPaginas, paginaAtual).map((p, i) =>
                        p === '…'
                          ? <span key={`e${i}`} className="pag-reticencias">…</span>
                          : <button
                              key={p}
                              className={`pag-btn ${p === paginaAtual ? 'pag-btn-ativo' : ''}`}
                              onClick={() => setPaginaAtual(p)}
                            >{p}</button>
                      )}

                      <button
                        className="pag-btn"
                        onClick={() => setPaginaAtual(p => p + 1)}
                        disabled={paginaAtual === totalPaginas}
                      >›</button>

                      <span className="pag-info">
                        {(paginaAtual - 1) * REGISTROS_POR_PAGINA + 1}–{Math.min(paginaAtual * REGISTROS_POR_PAGINA, registros.length)} de {registros.length}
                      </span>
                    </div>
                  )}
                </>
              )}
            </section>
            </div>
            <aside className="secao-lateral">
              <div className="lateral-card">
                <div className="lateral-mes-cab">
                  <button className="lateral-mes-btn" onClick={irMesAnterior} disabled={ehMesAnteriorBloqueado()} title="Mês anterior">‹</button>
                  <span className="lateral-mes-titulo">{labelMes()}</span>
                  <button className="lateral-mes-btn" onClick={irProximoMes} disabled={ehMesAtual()} title="Próximo mês">›</button>
                </div>
                {registros.length === 0 ? (
                  <p className="lateral-vazio">Nenhuma medição<br />em {labelMes()}</p>
                ) : (
                  <div className="lateral-resumo">
                    <div className="lateral-stat">
                      <span className="lateral-stat-val">{registros.length}</span>
                      <span className="lateral-stat-lbl">medições no mês</span>
                    </div>
                    <div className="lateral-stat">
                      <span className="lateral-stat-val lateral-stat-val--md">
                        {Math.round(registros.reduce((s, r) => s + r.valor, 0) / registros.length)} mg/dL
                      </span>
                      <span className="lateral-stat-lbl">glicemia média</span>
                    </div>
                    <div className="lateral-dist">
                      {[
                        { label: 'Normal', cor: '#16a34a', cnt: registros.filter(r => classificar(r.valor) === 'normal').length },
                        { label: 'Hiper',  cor: '#d97706', cnt: registros.filter(r => classificar(r.valor) === 'hiper').length },
                        { label: 'Hipo',   cor: '#dc2626', cnt: registros.filter(r => classificar(r.valor) === 'hipo').length },
                      ].map(({ label, cor, cnt }) => (
                        <div key={label} className="lateral-dist-row">
                          <span className="lateral-dist-dot" style={{ background: cor }} />
                          <span className="lateral-dist-label">{label}</span>
                          <span className="lateral-dist-count">{cnt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {alertasVisiveis.length > 0 && (
                <div className="lateral-alertas">
                  {alertasVisiveis.map(alerta => (
                    <div key={alerta.id} className={`lateral-alerta lateral-alerta-${alerta.tipo}`} role="alert">
                      <div className="lateral-alerta-topo">
                        <span className="lateral-alerta-icone">
                          {alerta.tipo === 'hipo' || alerta.tipo === 'hiper' ? '⚠' : '🔔'}
                        </span>
                        <span className="lateral-alerta-titulo">{alerta.titulo}</span>
                        <button className="alerta-fechar" onClick={() => fecharAlerta(alerta.id)} aria-label="Fechar">×</button>
                      </div>
                      <p className="lateral-alerta-texto">{alerta.mensagem}</p>
                    </div>
                  ))}
                </div>
              )}
            </aside>
            </div>
          )}

          {/* ── Seção: Diário Alimentar ─────────────────── */}
          {secaoAtiva === 'diario' && (
            <div className="secao-grade">
            <div className="secao-principal">

            {/* Stats do diário */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">Refeições</span>
                <span className="stat-valor">{refeicoes.length}</span>
                <span className="stat-sub">em {new Date(...mesRefeicao.split('-').map((v,i)=>i===1?v-1:+v)).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</span>
              </div>
              <div className="stat-card borda-normal">
                <span className="stat-label">Carb Baixa</span>
                <span className="stat-valor cor-normal">
                  {refeicoes.length ? `${Math.round(refeicoes.filter(r => r.carboidratos === 'baixa').length / refeicoes.length * 100)}%` : '—'}
                </span>
                <span className="stat-sub">refeições com baixo carb</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Com Foto</span>
                <span className="stat-valor">
                  {refeicoes.length ? `${Math.round(refeicoes.filter(r => r.foto).length / refeicoes.length * 100)}%` : '—'}
                </span>
                <span className="stat-sub">refeições fotografadas</span>
              </div>
            </div>

            {/* Gráfico de carboidratos por dia */}
            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Refeições por Dia</h2>
                  <p className="painel-sub">Distribuição de carboidratos — semanas do mês</p>
                </div>
              </div>
              <GraficoRefeicoes key={mesRefeicao} refeicoes={refeicoes} refDate={refDateDoMes(mesRefeicao)} />
            </section>

            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Diário Alimentar</h2>
                  <p className="painel-sub">{refeicoes.length} refeição(ões) · associe ao teste pós-prandial</p>
                </div>
                <button className="btn-novo" onClick={abrirNovaRefeicao}>+ Refeição</button>
              </div>
              {refeicoes.length === 0 ? (
                <div className="estado-vazio">
                  <p>Nenhuma refeição registrada. Registre sua primeira refeição para correlacionar com a glicemia.</p>
                  <button className="btn-novo" style={{ marginTop: '1rem' }} onClick={abrirNovaRefeicao}>
                    + Registrar refeição
                  </button>
                </div>
              ) : (
                <div className="ref-lista">
                  {refeicoes.map(ref => {
                    const posVinculados = registros.filter(r =>
                      r.estado === 'Pós-prandial' &&
                      new Date(r.dataHora) > new Date(ref.dataHora) &&
                      new Date(r.dataHora) - new Date(ref.dataHora) <= 4 * 60 * 60 * 1000
                    );
                    const vinculando = vinculandoRefId === ref._id;
                    return (
                      <div key={ref._id} className="ref-card">
                        {ref.foto && <img src={ref.foto} alt="Foto do prato" className="ref-foto" />}
                        <div className="ref-corpo">
                          <div className="ref-linha-topo">
                            <span className="ref-hora">
                              {new Date(ref.dataHora).toLocaleString('pt-BR', {
                                timeZone: TZ_BRASIL, day: '2-digit', month: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            <span className="ref-carb-badge"
                              style={{ background: `${CARB_COR[ref.carboidratos]}18`, color: CARB_COR[ref.carboidratos], border: `1px solid ${CARB_COR[ref.carboidratos]}50` }}>
                              Carb: {CARB_LABEL[ref.carboidratos]}
                            </span>
                          </div>
                          {ref.descricao && <p className="ref-descricao">{ref.descricao}</p>}
                          {ref.registroVinculado ? (
                            <div className="ref-vinculo">
                              <span className="ref-vinculo-label">Pós-prandial vinculado:</span>
                              <span className={`badge badge-${classificar(ref.registroVinculado.valor)}`}>
                                {ref.registroVinculado.valor} mg/dL
                              </span>
                              <button className="ref-desvincular" onClick={() => handleVincularRefeicao(ref._id, null)}>×</button>
                            </div>
                          ) : vinculando ? (
                            <div className="ref-vinculo-select">
                              <select className="select-local" defaultValue=""
                                onChange={e => e.target.value && handleVincularRefeicao(ref._id, e.target.value)}>
                                <option value="" disabled>Selecione o teste pós-prandial...</option>
                                {posVinculados.map(r => (
                                  <option key={r._id} value={r._id}>
                                    {new Date(r.dataHora).toLocaleTimeString('pt-BR', { timeZone: TZ_BRASIL, hour: '2-digit', minute: '2-digit' })} — {r.valor} mg/dL
                                  </option>
                                ))}
                              </select>
                              <button className="btn-tab btn-remover" onClick={() => setVinculandoRefId(null)}>Cancelar</button>
                            </div>
                          ) : posVinculados.length > 0 ? (
                            <button className="ref-btn-vincular" onClick={() => setVinculandoRefId(ref._id)}>
                              Vincular teste pós-prandial
                            </button>
                          ) : (
                            <span className="ref-sem-pos">Nenhum teste pós-prandial nas 4h seguintes</span>
                          )}
                        </div>
                        <div className="ref-acoes">
                          <button className="btn-tab btn-editar" onClick={() => abrirEdicaoRefeicao(ref)}>Editar</button>
                          <button className="btn-tab btn-remover" onClick={() => handleRemoverRefeicao(ref._id)}>Remover</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            </div>
            <aside className="secao-lateral">
              <div className="lateral-card">
                <MesNav mes={mesRefeicao} setMes={(m) => { setMesRefeicao(m); }} mesesComDados={mesesComRefeicoes} />
                {refeicoes.length === 0 ? (
                  <p className="lateral-vazio">Nenhuma refeição<br />registrada este mês</p>
                ) : (
                  <div className="lateral-resumo">
                    <div className="lateral-stat">
                      <span className="lateral-stat-val">{refeicoes.length}</span>
                      <span className="lateral-stat-lbl">refeições no mês</span>
                    </div>
                    <div className="lateral-dist">
                      {[
                        { label: 'Carb baixo',    cor: '#16a34a', cnt: refeicoes.filter(r => r.carboidratos === 'baixa').length },
                        { label: 'Carb moderado', cor: '#d97706', cnt: refeicoes.filter(r => r.carboidratos === 'media').length },
                        { label: 'Carb alto',     cor: '#dc2626', cnt: refeicoes.filter(r => r.carboidratos === 'alta').length },
                      ].map(({ label, cor, cnt }) => (
                        <div key={label} className="lateral-dist-row">
                          <span className="lateral-dist-dot" style={{ background: cor }} />
                          <span className="lateral-dist-label">{label}</span>
                          <span className="lateral-dist-count">{cnt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {alertasVisiveis.length > 0 && (
                <div className="lateral-alertas">
                  {alertasVisiveis.map(alerta => (
                    <div key={alerta.id} className={`lateral-alerta lateral-alerta-${alerta.tipo}`} role="alert">
                      <div className="lateral-alerta-topo">
                        <span className="lateral-alerta-icone">
                          {alerta.tipo === 'hipo' || alerta.tipo === 'hiper' ? '⚠' : '🔔'}
                        </span>
                        <span className="lateral-alerta-titulo">{alerta.titulo}</span>
                        <button className="alerta-fechar" onClick={() => fecharAlerta(alerta.id)} aria-label="Fechar">×</button>
                      </div>
                      <p className="lateral-alerta-texto">{alerta.mensagem}</p>
                    </div>
                  ))}
                </div>
              )}
            </aside>
            </div>
          )}

          {/* ── Seção: Medicamentos ─────────────────────── */}
          {secaoAtiva === 'medicamentos' && (
            <div className="secao-grade">
            <div className="secao-principal">

            {/* Stats de medicamentos */}
            {(() => {
              const totalSlots = medicamentos.reduce((a, m) => a + m.horarios.length, 0);
              const tomadoHoje = registrosDia.filter(r => r.status === 'tomado').length;
              const pct = totalSlots > 0 ? Math.round(tomadoHoje / totalSlots * 100) : null;
              return (
                <div className="stats-row">
                  <div className="stat-card borda-normal">
                    <span className="stat-label">Adesão Hoje</span>
                    <span className="stat-valor cor-normal">{pct !== null ? `${pct}%` : '—'}</span>
                    <span className="stat-sub">doses tomadas no dia</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Tomadas Hoje</span>
                    <span className="stat-valor">{tomadoHoje}</span>
                    <span className="stat-sub">de {totalSlots} programadas</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Medicamentos</span>
                    <span className="stat-valor">{medicamentos.length}</span>
                    <span className="stat-sub">cadastrados</span>
                  </div>
                </div>
              );
            })()}

            {/* Gráfico de adesão */}
            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Adesão por Dia</h2>
                  <p className="painel-sub">Doses registradas — semanas do mês</p>
                </div>
              </div>
              <GraficoAdesao key={mesMedicamento} dosesHistorico={dosesHistorico} refDate={refDateDoMes(mesMedicamento)} />
            </section>

            {/* Histórico de doses */}
            {dosesHistorico.length > 0 && (
              <section className="painel">
                <div className="painel-topo">
                  <div>
                    <h2 className="painel-titulo">Histórico de Doses</h2>
                    <p className="painel-sub">{dosesHistorico.length} registro(s) no mês</p>
                  </div>
                </div>
                <div className="tabela-scroll tabela-scroll--historico">
                  <table className="tabela">
                    <thead>
                      <tr><th>Data</th><th>Medicamento</th><th>Horário</th><th>Status</th><th>Local</th></tr>
                    </thead>
                    <tbody>
                      {dosesHistorico.slice(0, 30).map(d => (
                        <tr key={d._id}>
                          <td>{new Date(d.dataDia).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })}</td>
                          <td>{d.medicamento?.nome || '—'}</td>
                          <td>{d.horarioProgramado}</td>
                          <td>
                            <span className={`badge badge-${d.status === 'tomado' ? 'normal' : d.status === 'pulado' ? 'hipo' : 'hiper'}`}>
                              {d.status === 'tomado' ? '✓ Tomado' : d.status === 'pulado' ? '— Pulado' : '⏰ Adiado'}
                            </span>
                          </td>
                          <td>{d.localAplicacao || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Medicações de Hoje</h2>
                  <p className="painel-sub">
                    {medicamentos.length === 0 ? 'Nenhum medicamento cadastrado' : `${medicamentos.length} medicamento(s) programado(s)`}
                  </p>
                </div>
                <button className="btn-novo" onClick={abrirModalMed}>Gerenciar</button>
              </div>
              {medicamentos.length === 0 ? (
                <div className="estado-vazio">
                  <p>Cadastre seus medicamentos para acompanhar as doses diárias.</p>
                  <button className="btn-novo" style={{ marginTop: '1rem' }} onClick={abrirModalMed}>+ Adicionar medicamento</button>
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
                        <span className={`med-tipo-badge med-tipo-${med.tipo.toLowerCase()}`}>{med.tipo}</span>
                      </div>
                      <div className="med-horarios">
                        {med.horarios.sort().map(horario => {
                          const reg = getRegistroDia(med._id, horario);
                          const confirmandoEste = slotConfirmando?.medId === med._id && slotConfirmando?.horario === horario;
                          return (
                            <div key={horario} className="slot-dose">
                              <span className="slot-hora">{horario}</span>
                              {reg ? (
                                <span className={`slot-status slot-${reg.status}`}>
                                  {reg.status === 'tomado' ? '✓ Tomado' : reg.status === 'pulado' ? '— Pulado' : '⏰ Adiado'}
                                  {reg.localAplicacao && <span className="slot-local"> · {reg.localAplicacao}</span>}
                                </span>
                              ) : confirmandoEste ? (
                                <div className="slot-confirmando">
                                  <select className="select-local" value={localSelecionado} onChange={e => setLocalSelecionado(e.target.value)}>
                                    {LOCAIS_APLICACAO.map(l => <option key={l}>{l}</option>)}
                                  </select>
                                  {locaisHistorico.length > 0 && <span className="rodizio-dica">Último: {locaisHistorico[0].localAplicacao}</span>}
                                  <button className="btn-tab btn-editar" onClick={() => confirmarDose(med._id, horario, 'tomado', localSelecionado)}>Confirmar</button>
                                  <button className="btn-tab btn-remover" onClick={() => setSlotConfirmando(null)}>Cancelar</button>
                                </div>
                              ) : (
                                <div className="slot-acoes">
                                  <button className="btn-dose btn-tomado" onClick={() => handleDose(med._id, horario, 'tomado', med)}>Tomado</button>
                                  <button className="btn-dose btn-pulado" onClick={() => handleDose(med._id, horario, 'pulado', med)}>Pular</button>
                                  <button className="btn-dose btn-adiado" onClick={() => handleDose(med._id, horario, 'adiado', med)}>Adiar</button>
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
            </div>
            <aside className="secao-lateral">
              <div className="lateral-card">
                <MesNav mes={mesMedicamento} setMes={setMesMedicamento} mesesComDados={mesesComMedicamentos} />
                {dosesHistorico.length === 0 ? (
                  <p className="lateral-vazio">Nenhuma dose<br />registrada este mês</p>
                ) : (() => {
                  const tomado = dosesHistorico.filter(d => d.status === 'tomado').length;
                  const pulado = dosesHistorico.filter(d => d.status === 'pulado').length;
                  const adiado = dosesHistorico.filter(d => d.status === 'adiado').length;
                  const pct = Math.round(tomado / dosesHistorico.length * 100);
                  return (
                    <div className="lateral-resumo">
                      <div className="lateral-stat">
                        <span className="lateral-stat-val">{pct}%</span>
                        <span className="lateral-stat-lbl">adesão no mês</span>
                      </div>
                      <div className="lateral-stat">
                        <span className="lateral-stat-val lateral-stat-val--md">{dosesHistorico.length}</span>
                        <span className="lateral-stat-lbl">doses registradas</span>
                      </div>
                      <div className="lateral-dist">
                        {[
                          { label: 'Tomadas', cor: '#16a34a', cnt: tomado },
                          { label: 'Puladas', cor: '#94a3b8', cnt: pulado },
                          { label: 'Adiadas', cor: '#d97706', cnt: adiado },
                        ].map(({ label, cor, cnt }) => (
                          <div key={label} className="lateral-dist-row">
                            <span className="lateral-dist-dot" style={{ background: cor }} />
                            <span className="lateral-dist-label">{label}</span>
                            <span className="lateral-dist-count">{cnt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              {alertasVisiveis.length > 0 && (
                <div className="lateral-alertas">
                  {alertasVisiveis.map(alerta => (
                    <div key={alerta.id} className={`lateral-alerta lateral-alerta-${alerta.tipo}`} role="alert">
                      <div className="lateral-alerta-topo">
                        <span className="lateral-alerta-icone">
                          {alerta.tipo === 'hipo' || alerta.tipo === 'hiper' ? '⚠' : '🔔'}
                        </span>
                        <span className="lateral-alerta-titulo">{alerta.titulo}</span>
                        <button className="alerta-fechar" onClick={() => fecharAlerta(alerta.id)} aria-label="Fechar">×</button>
                      </div>
                      <p className="lateral-alerta-texto">{alerta.mensagem}</p>
                    </div>
                  ))}
                </div>
              )}
            </aside>
            </div>
          )}

          {/* ── Seção: Contexto do Dia ──────────────────── */}
          {secaoAtiva === 'contexto' && (
            <div className="secao-grade">
            <div className="secao-principal">

            {/* Stats de contexto */}
            {(() => {
              const diasComContexto = eventos.length;
              const contagem = {};
              eventos.forEach(e => (e.tags || []).forEach(t => { contagem[t] = (contagem[t] || 0) + 1; }));
              const tagMaisFrequente = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
              return (
                <div className="stats-row">
                  <div className="stat-card">
                    <span className="stat-label">Dias com Contexto</span>
                    <span className="stat-valor">{diasComContexto}</span>
                    <span className="stat-sub">no mês selecionado</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Tag Mais Frequente</span>
                    <span className="stat-valor" style={{ fontSize: '1.1rem' }}>{tagMaisFrequente?.[0] || '—'}</span>
                    <span className="stat-sub">{tagMaisFrequente ? `${tagMaisFrequente[1]} dias registrados` : 'nenhuma tag ainda'}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Hoje</span>
                    <span className="stat-valor" style={{ fontSize: '1.1rem' }}>{eventoHoje ? '✓ Registrado' : '—'}</span>
                    <span className="stat-sub">{eventoHoje ? eventoHoje.tags.join(', ') : 'sem contexto registrado'}</span>
                  </div>
                </div>
              );
            })()}

            {/* Gráfico de frequência de tags */}
            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Frequência de Fatores</h2>
                  <p className="painel-sub">Dias com cada fator registrado — semanas do mês</p>
                </div>
              </div>
              <GraficoEventos key={mesContexto} eventos={eventos} refDate={refDateDoMes(mesContexto)} />
            </section>

            {/* Histórico de contextos */}
            {eventos.filter(e => {
              const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
              return new Date(e.dataDia).toISOString().slice(0, 10) !== hoje;
            }).length > 0 && (
              <section className="painel">
                <div className="painel-topo">
                  <div>
                    <h2 className="painel-titulo">Histórico de Contextos</h2>
                    <p className="painel-sub">{eventos.length} registro(s) no mês</p>
                  </div>
                </div>
                <div className="tabela-scroll tabela-scroll--historico">
                  <table className="tabela">
                    <thead>
                      <tr><th>Data</th><th>Fatores</th><th>Observação</th></tr>
                    </thead>
                    <tbody>
                      {eventos
                        .filter(e => {
                          const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
                          return new Date(e.dataDia).toISOString().slice(0, 10) !== hoje;
                        })
                        .slice(0, 20)
                        .map(e => (
                          <tr key={e._id}>
                            <td>{new Date(e.dataDia).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                                {(e.tags || []).map(t => (
                                  <span key={t} className="badge" style={{ background: `${TAG_CORES[t]}18`, color: TAG_CORES[t], border: `1px solid ${TAG_CORES[t]}50`, fontSize: '.72rem' }}>{t}</span>
                                ))}
                              </div>
                            </td>
                            <td className="td-obs">{e.observacao || '—'}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="painel">
              <div className="painel-topo">
                <div>
                  <h2 className="painel-titulo">Contexto do Dia</h2>
                  <p className="painel-sub">Registre fatores externos que podem afetar a glicemia</p>
                </div>
                {eventoHoje && (
                  <button className="btn-remover-evento" onClick={handleRemoverEvento}>Limpar</button>
                )}
              </div>
              <form onSubmit={handleSalvarEvento} className="evento-form">
                <div className="tags-grid">
                  {TAGS_EVENTOS.map(tag => (
                    <button key={tag} type="button"
                      className={`tag-btn ${tagsHoje.includes(tag) ? 'tag-ativa' : ''}`}
                      style={tagsHoje.includes(tag) ? { borderColor: TAG_CORES[tag], color: TAG_CORES[tag], background: `${TAG_CORES[tag]}18` } : {}}
                      onClick={() => toggleTag(tag)}>
                      <span className="tag-dot" style={{ background: TAG_CORES[tag] }} />
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="campo-grupo campo-obs-evento">
                  <label htmlFor="obs-evento">Observação <span className="label-opt">(opcional)</span></label>
                  <textarea id="obs-evento" rows={2} maxLength={200}
                    placeholder="Descreva o contexto do dia..."
                    value={obsEvento} onChange={e => setObsEvento(e.target.value)} />
                  <span className="contador-chars">{obsEvento.length}/200</span>
                </div>
                <div className="evento-rodape">
                  {eventoHoje && <span className="evento-salvo-label">Salvo: {eventoHoje.tags.join(', ')}</span>}
                  <button type="submit" className="btn-salvar btn-salvar-evento"
                    disabled={salvandoEvento || tagsHoje.length === 0}>
                    {salvandoEvento ? <span className="spinner" /> : 'Salvar Contexto'}
                  </button>
                </div>
              </form>
            </section>
            </div>
            <aside className="secao-lateral">
              <div className="lateral-card">
                <MesNav mes={mesContexto} setMes={setMesContexto} mesesComDados={mesesComContexto} />
                {(() => {
                  const contagem = {};
                  eventos.forEach(e => (e.tags || []).forEach(t => { contagem[t] = (contagem[t] || 0) + 1; }));
                  const entradas = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
                  return (
                    <div className="lateral-resumo">
                      <div className="lateral-stat">
                        <span className="lateral-stat-val">{eventos.length}</span>
                        <span className="lateral-stat-lbl">eventos no mês</span>
                      </div>
                      {entradas.length > 0 ? (
                        <div className="lateral-dist">
                          {entradas.map(([tag, cnt]) => (
                            <div key={tag} className="lateral-dist-row">
                              <span className="lateral-dist-dot" style={{ background: TAG_CORES[tag] || '#94a3b8' }} />
                              <span className="lateral-dist-label">{tag}</span>
                              <span className="lateral-dist-count">{cnt}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="lateral-vazio">Nenhum fator<br />registrado</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              {alertasVisiveis.length > 0 && (
                <div className="lateral-alertas">
                  {alertasVisiveis.map(alerta => (
                    <div key={alerta.id} className={`lateral-alerta lateral-alerta-${alerta.tipo}`} role="alert">
                      <div className="lateral-alerta-topo">
                        <span className="lateral-alerta-icone">
                          {alerta.tipo === 'hipo' || alerta.tipo === 'hiper' ? '⚠' : '🔔'}
                        </span>
                        <span className="lateral-alerta-titulo">{alerta.titulo}</span>
                        <button className="alerta-fechar" onClick={() => fecharAlerta(alerta.id)} aria-label="Fechar">×</button>
                      </div>
                      <p className="lateral-alerta-texto">{alerta.mensagem}</p>
                    </div>
                  ))}
                </div>
              )}
            </aside>
            </div>
          )}

          {/* ── RF10: Relatório ─────────────────────────────── */}
          {secaoAtiva === 'relatorio' && (
            <div className="relatorio-wrapper">
              <div className="relatorio-topo no-print">
                <h2 className="relatorio-titulo">Relatório de Saúde Glicêmica</h2>
                <div className="relatorio-acoes">
                  <div className="relatorio-periodo-btns">
                    {[7, 15, 30, 90].map(d => (
                      <button
                        key={d}
                        className={`periodo-btn ${periodoRelatorio === d ? 'periodo-btn-ativo' : ''}`}
                        onClick={() => setPeriodoRelatorio(d)}
                      >
                        {d} dias
                      </button>
                    ))}
                  </div>
                  <button className="btn-imprimir" onClick={() => window.print()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Imprimir / PDF
                  </button>
                </div>
              </div>

              {carregandoRel && (
                <div className="relatorio-carregando">
                  <span className="spinner" /> Gerando relatório...
                </div>
              )}

              {!carregandoRel && dadosRelatorio && (() => {
                const { periodo, glicemia, correlacoes, medicamentos: med } = dadosRelatorio;
                const fmtData = d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ_BRASIL });
                const fmtDH  = d => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ_BRASIL });

                return (
                  <div className="relatorio-corpo">
                    {/* Cabeçalho impresso */}
                    <div className="relatorio-cabecalho-print print-only">
                      <h1>InfoGlic – Relatório de Saúde Glicêmica</h1>
                      <p>Paciente: <strong>{usuario.nome || '—'}</strong> &nbsp;|&nbsp; Período: <strong>{fmtData(periodo.inicio)} a {fmtData(periodo.fim)}</strong></p>
                      <p>Gerado em: {fmtDH(dadosRelatorio.geradoEm)}</p>
                    </div>

                    {/* Período */}
                    <div className="relatorio-periodo-info no-print">
                      <span>Período: <strong>{fmtData(periodo.inicio)}</strong> a <strong>{fmtData(periodo.fim)}</strong></span>
                      <span className="relatorio-gerado">Gerado em {fmtDH(dadosRelatorio.geradoEm)}</span>
                    </div>

                    {/* Resumo glicêmico */}
                    <section className="rel-secao">
                      <h3 className="rel-secao-titulo">Resumo Glicêmico</h3>
                      {glicemia.total === 0 ? (
                        <p className="rel-vazio">Nenhum registro glicêmico no período selecionado.</p>
                      ) : (
                        <>
                          <div className="rel-stats-grid">
                            <div className="rel-stat-card">
                              <span className="rel-stat-val">{Math.round(glicemia.media)}</span>
                              <span className="rel-stat-unid">mg/dL</span>
                              <span className="rel-stat-lbl">Média glicêmica</span>
                            </div>
                            <div className="rel-stat-card">
                              <span className="rel-stat-val">{Math.round(glicemia.dp)}</span>
                              <span className="rel-stat-unid">mg/dL</span>
                              <span className="rel-stat-lbl">Desvio padrão</span>
                            </div>
                            <div className={`rel-stat-card ${glicemia.tir >= 70 ? 'rel-stat-ok' : glicemia.tir >= 50 ? 'rel-stat-alerta' : 'rel-stat-critico'}`}>
                              <span className="rel-stat-val">{glicemia.tir}%</span>
                              <span className="rel-stat-lbl">Tempo no Alvo<br />(70–180 mg/dL)</span>
                            </div>
                            <div className="rel-stat-card">
                              <span className="rel-stat-val">{glicemia.total}</span>
                              <span className="rel-stat-lbl">Medições realizadas</span>
                            </div>
                            <div className={`rel-stat-card ${glicemia.hipos.length === 0 ? 'rel-stat-ok' : 'rel-stat-critico'}`}>
                              <span className="rel-stat-val">{glicemia.hipos.length}</span>
                              <span className="rel-stat-lbl">Episódios de<br />hipoglicemia</span>
                            </div>
                            <div className={`rel-stat-card ${glicemia.hipers === 0 ? 'rel-stat-ok' : glicemia.hipers <= 5 ? 'rel-stat-alerta' : 'rel-stat-critico'}`}>
                              <span className="rel-stat-val">{glicemia.hipers}</span>
                              <span className="rel-stat-lbl">Episódios de<br />hiperglicemia</span>
                            </div>
                          </div>

                          {/* Barra TIR */}
                          <div className="rel-tir-barra-wrap">
                            <div className="rel-tir-legenda">
                              <span className="rel-tir-dot" style={{ background: '#dc2626' }} />Abaixo do alvo ({Math.round((glicemia.hipos.length / glicemia.total) * 100)}%)
                              <span className="rel-tir-dot" style={{ background: '#16a34a', marginLeft: '1rem' }} />No alvo ({glicemia.tir}%)
                              <span className="rel-tir-dot" style={{ background: '#d97706', marginLeft: '1rem' }} />Acima do alvo ({Math.round((glicemia.hipers / glicemia.total) * 100)}%)
                            </div>
                            <div className="rel-tir-barra">
                              <div className="rel-tir-seg rel-tir-hipo" style={{ width: `${Math.round((glicemia.hipos.length / glicemia.total) * 100)}%` }} />
                              <div className="rel-tir-seg rel-tir-normal" style={{ width: `${glicemia.tir}%` }} />
                              <div className="rel-tir-seg rel-tir-hiper" style={{ width: `${Math.round((glicemia.hipers / glicemia.total) * 100)}%` }} />
                            </div>
                          </div>
                        </>
                      )}
                    </section>

                    {/* Episódios de hipoglicemia */}
                    {glicemia.hipos.length > 0 && (
                      <section className="rel-secao">
                        <h3 className="rel-secao-titulo">Episódios de Hipoglicemia (&lt;70 mg/dL)</h3>
                        <div className="tabela-scroll tabela-scroll--historico">
                          <table className="tabela">
                            <thead>
                              <tr>
                                <th>Data/Hora</th>
                                <th>Valor</th>
                                <th>Estado</th>
                                <th>Observação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {glicemia.hipos.map(r => (
                                <tr key={r._id}>
                                  <td>{fmtDH(r.dataHora)}</td>
                                  <td><span className="badge badge-hipo">{r.valor} mg/dL</span></td>
                                  <td>{r.estado}</td>
                                  <td>{r.observacao || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* Correlações alimentares */}
                    <section className="rel-secao">
                      <h3 className="rel-secao-titulo">Correlações Alimentares (Pós-prandial vinculado)</h3>
                      {correlacoes.length === 0 ? (
                        <p className="rel-vazio">Nenhuma refeição vinculada a teste pós-prandial no período.</p>
                      ) : (
                        <div className="tabela-scroll tabela-scroll--historico">
                          <table className="tabela">
                            <thead>
                              <tr>
                                <th>Data/Hora</th>
                                <th>Carboidratos</th>
                                <th>Glicemia pós</th>
                                <th>Classificação</th>
                                <th>Descrição</th>
                              </tr>
                            </thead>
                            <tbody>
                              {correlacoes.map(({ refeicao, glicemia: g }) => (
                                <tr key={refeicao._id}>
                                  <td>{fmtDH(refeicao.dataHora)}</td>
                                  <td>
                                    <span className={`badge carb-${refeicao.carboidratos}`}>
                                      {refeicao.carboidratos === 'baixa' ? 'Baixa' : refeicao.carboidratos === 'media' ? 'Média' : 'Alta'}
                                    </span>
                                  </td>
                                  <td>{g.valor} mg/dL</td>
                                  <td>
                                    <span className={`badge badge-${classificar(g.valor)}`}>
                                      {g.valor < 70 ? 'Hipoglicemia' : g.valor <= 180 ? 'Normal' : 'Hiperglicemia'}
                                    </span>
                                  </td>
                                  <td>{refeicao.descricao || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    {/* Aderência a medicamentos */}
                    <section className="rel-secao">
                      <h3 className="rel-secao-titulo">Aderência aos Medicamentos</h3>
                      {med.totalDoses === 0 ? (
                        <p className="rel-vazio">Nenhum registro de dose no período.</p>
                      ) : (
                        <div className="rel-med-resumo">
                          <div className="rel-stat-card rel-stat-card--med">
                            <span className="rel-stat-val">{med.totalDoses}</span>
                            <span className="rel-stat-lbl">Doses programadas</span>
                          </div>
                          <div className={`rel-stat-card rel-stat-card--med ${med.aderencia >= 80 ? 'rel-stat-ok' : med.aderencia >= 60 ? 'rel-stat-alerta' : 'rel-stat-critico'}`}>
                            <span className="rel-stat-val">{med.aderencia}%</span>
                            <span className="rel-stat-lbl">Aderência</span>
                          </div>
                          <div className="rel-stat-card rel-stat-card--med rel-stat-ok">
                            <span className="rel-stat-val">{med.tomadas}</span>
                            <span className="rel-stat-lbl">Tomadas</span>
                          </div>
                          <div className="rel-stat-card rel-stat-card--med rel-stat-critico">
                            <span className="rel-stat-val">{med.puladas}</span>
                            <span className="rel-stat-lbl">Puladas</span>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* Aviso legal */}
                    <div className="rel-aviso-legal">
                      <strong>Aviso:</strong> Este relatório tem caráter informativo e não substitui a avaliação de um profissional de saúde.
                      Consulte sempre seu médico ou equipe de saúde antes de tomar decisões baseadas nestes dados.
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </main>
      </div>

      {/* ── Modais ─────────────────────────────────────── */}

      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>{editandoId ? 'Editar Registro Glicêmico' : 'Novo Registro Glicêmico'}</h3>
              <button className="modal-fechar" onClick={fecharModal} aria-label="Fechar">×</button>
            </div>
            {erroForm && <div className="alerta-erro"><span>⚠</span> {erroForm}</div>}
            <form onSubmit={handleSalvar} className="modal-form" noValidate>
              <div className="campo-grupo">
                <label htmlFor="valor">Valor glicêmico (mg/dL) *</label>
                <input id="valor" type="number" min="20" max="600" placeholder="Ex: 110"
                  value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} required />
              </div>
              <div className="campo-grupo">
                <label htmlFor="dataHora">Data e Hora * <span className="label-opt">(horário de Brasília)</span></label>
                <input id="dataHora" type="datetime-local" max={agoraBrasil()}
                  value={form.dataHora} onChange={e => setForm({ ...form, dataHora: e.target.value })} required />
              </div>
              <div className="campo-grupo">
                <label htmlFor="estado">Estado do Teste *</label>
                <select id="estado" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} required>
                  {ESTADOS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
              <div className="campo-grupo">
                <label htmlFor="observacao">Observação <span className="label-opt">(opcional)</span></label>
                <textarea id="observacao" rows={3} maxLength={200} placeholder="Notas adicionais..."
                  value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} />
                <span className="contador-chars">{form.observacao.length}/200</span>
              </div>
              <div className="modal-rodape">
                <button type="button" className="btn-cancelar" onClick={fecharModal}>Cancelar</button>
                <button type="submit" className="btn-salvar" disabled={salvando}>
                  {salvando ? <span className="spinner" /> : (editandoId ? 'Salvar Alterações' : 'Registrar Medição')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalHorarios && (
        <div className="modal-overlay" onClick={() => setModalHorarios(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>Horários de Refeição</h3>
              <button className="modal-fechar" onClick={() => setModalHorarios(false)} aria-label="Fechar">×</button>
            </div>
            <form onSubmit={handleSalvarHorarios} className="modal-form" noValidate>
              <p className="horarios-descricao">
                Configure os horários das suas refeições para receber lembretes de medição.
              </p>
              <div className="horarios-grid">
                <div className="campo-grupo">
                  <label htmlFor="h-cafe">Café da manhã</label>
                  <input id="h-cafe" type="time" value={formHorarios.cafe || ''}
                    onChange={e => setFormHorarios({ ...formHorarios, cafe: e.target.value })} />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="h-almoco">Almoço</label>
                  <input id="h-almoco" type="time" value={formHorarios.almoco || ''}
                    onChange={e => setFormHorarios({ ...formHorarios, almoco: e.target.value })} />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="h-jantar">Jantar</label>
                  <input id="h-jantar" type="time" value={formHorarios.jantar || ''}
                    onChange={e => setFormHorarios({ ...formHorarios, jantar: e.target.value })} />
                </div>
              </div>
              <p className="horarios-dica">Deixe em branco para desativar o lembrete da refeição.</p>
              <div className="modal-rodape">
                <button type="button" className="btn-cancelar" onClick={() => setModalHorarios(false)}>Cancelar</button>
                <button type="submit" className="btn-salvar">Salvar Horários</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalRef && (
        <div className="modal-overlay" onClick={fecharModalRef}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>{editandoRefId ? 'Editar Refeição' : 'Nova Refeição'}</h3>
              <button className="modal-fechar" onClick={fecharModalRef} aria-label="Fechar">×</button>
            </div>
            {erroRef && <div className="alerta-erro"><span>⚠</span> {erroRef}</div>}
            <form onSubmit={handleSalvarRefeicao} className="modal-form" noValidate>
              <div className="campo-grupo">
                <label htmlFor="ref-dataHora">Data e Hora *</label>
                <input id="ref-dataHora" type="datetime-local" max={agoraBrasil()}
                  value={formRef.dataHora} onChange={e => setFormRef(f => ({ ...f, dataHora: e.target.value }))} required />
              </div>
              <div className="campo-grupo">
                <label htmlFor="ref-carb">Estimativa de Carboidratos *</label>
                <select id="ref-carb" value={formRef.carboidratos}
                  onChange={e => setFormRef(f => ({ ...f, carboidratos: e.target.value }))} required>
                  <option value="baixa">Baixa (saladas, proteínas, verduras)</option>
                  <option value="media">Média (arroz, pão, legumes)</option>
                  <option value="alta">Alta (massas, doces, refrigerante)</option>
                </select>
              </div>
              <div className="campo-grupo">
                <label htmlFor="ref-foto">Foto do Prato <span className="label-opt">(opcional)</span></label>
                <input id="ref-foto" type="file" accept="image/*" className="ref-input-foto" onChange={handleFotoChange} />
                {fotoPreview && (
                  <div className="ref-foto-preview-wrap">
                    <img src={fotoPreview} alt="Preview" className="ref-foto-preview" />
                    <button type="button" className="ref-foto-remover"
                      onClick={() => { setFotoPreview(null); setFormRef(f => ({ ...f, foto: null })); }}>
                      Remover foto
                    </button>
                  </div>
                )}
              </div>
              <div className="campo-grupo">
                <label htmlFor="ref-desc">Descrição <span className="label-opt">(opcional)</span></label>
                <textarea id="ref-desc" rows={2} maxLength={200}
                  placeholder="Ex: Almoço com arroz integral, frango grelhado e salada..."
                  value={formRef.descricao} onChange={e => setFormRef(f => ({ ...f, descricao: e.target.value }))} />
                <span className="contador-chars">{formRef.descricao.length}/200</span>
              </div>
              <div className="modal-rodape">
                <button type="button" className="btn-cancelar" onClick={fecharModalRef}>Cancelar</button>
                <button type="submit" className="btn-salvar" disabled={salvandoRef}>
                  {salvandoRef ? <span className="spinner" /> : (editandoRefId ? 'Salvar' : 'Registrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalMed && (
        <div className="modal-overlay" onClick={() => setModalMed(false)}>
          <div className="modal-box modal-box-med" onClick={e => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>{vistaMed === 'lista' ? 'Meus Medicamentos' : editandoMedId ? 'Editar Medicamento' : 'Novo Medicamento'}</h3>
              <button className="modal-fechar" onClick={() => setModalMed(false)} aria-label="Fechar">×</button>
            </div>
            {vistaMed === 'lista' && (
              <div className="modal-form">
                {medicamentos.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '.88rem', textAlign: 'center', padding: '1rem 0' }}>
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
                          <button className="btn-tab btn-editar" onClick={() => abrirFormEditarMed(med)}>Editar</button>
                          <button className="btn-tab btn-remover" onClick={() => handleRemoverMed(med._id)}>Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="modal-rodape">
                  <button type="button" className="btn-cancelar" onClick={() => setModalMed(false)}>Fechar</button>
                  <button type="button" className="btn-salvar" onClick={abrirFormNovaMed}>+ Novo</button>
                </div>
              </div>
            )}
            {vistaMed === 'form' && (
              <>
                {erroMed && <div className="alerta-erro"><span>⚠</span> {erroMed}</div>}
                <form onSubmit={handleSalvarMed} className="modal-form" noValidate>
                  <div className="campo-grupo">
                    <label>Nome do medicamento *</label>
                    <input type="text" placeholder="Ex: Metformina, Insulina Glargina"
                      value={formMed.nome} onChange={e => setFormMed(f => ({ ...f, nome: e.target.value }))} required />
                  </div>
                  <div className="campo-grupo">
                    <label>Dosagem *</label>
                    <input type="text" placeholder="Ex: 500mg, 10UI"
                      value={formMed.dosagem} onChange={e => setFormMed(f => ({ ...f, dosagem: e.target.value }))} required />
                  </div>
                  <div className="campo-grupo">
                    <label>Tipo *</label>
                    <select value={formMed.tipo} onChange={e => setFormMed(f => ({ ...f, tipo: e.target.value }))}>
                      <option>Oral</option><option>Insulina</option><option>Outro</option>
                    </select>
                  </div>
                  <div className="campo-grupo">
                    <label>Horários de uso *</label>
                    <div className="horarios-med-lista">
                      {formMed.horarios.map((h, idx) => (
                        <div key={idx} className="horario-med-row">
                          <input type="time" value={h} onChange={e => setHorarioMed(idx, e.target.value)} />
                          {formMed.horarios.length > 1 && (
                            <button type="button" className="btn-remove-horario"
                              onClick={() => removeHorarioMed(idx)} aria-label="Remover horário">×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="btn-add-horario" onClick={addHorarioMed}>+ Adicionar horário</button>
                    </div>
                  </div>
                  <div className="modal-rodape">
                    <button type="button" className="btn-cancelar" onClick={() => setVistaMed('lista')}>Voltar</button>
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
