import React, { useState, useMemo, useDeferredValue, useEffect, memo, useCallback } from 'react';
import briefingsData from './data/briefings.json';
import researchQuestions from './data/research_questions.json';
import orchestrationBlocks from './data/orchestration.json';

const HATS = [
  { id: 'estudante', label: '🎓 Estudante/Técnico', color: 'estudante' },
  { id: 'empresario', label: '💼 Empresário/CEO', color: 'empresario' },
  { id: 'gerente', label: '🛡️ Gerente de Manutenção', color: 'gerente' },
  { id: 'mecanico', label: '🛠️ Eletricista/Mecânico', color: 'mecanico' },
  { id: 'vendedor', label: '🤝 Vendedor Consultivo', color: 'vendedor' }
];

// 1. Componente de Card Otimizado
const BriefingCard = memo(function BriefingCard({ item, onSelect }) {
  const isVideo = item.id.startsWith('V') || item.id.startsWith('N') || item.id.startsWith('M');
  const ganchoPreview = item.roteiroDidatico?.gancho || item.roteiroReels?.gancho || item.titulo;

  return (
    <div 
      className="briefing-card"
      onClick={() => onSelect(item)}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-id">{item.id}</span>
          <span style={{
            fontSize: '10px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '99px',
            background: isVideo ? 'rgba(251,146,60,0.15)' : 'rgba(56,189,248,0.15)',
            color: isVideo ? 'var(--hat-mecanico)' : 'var(--hat-estudante)'
          }}>
            {isVideo ? 'VÍDEO / REELS' : 'POST / CARROSSEL'}
          </span>
        </div>
        <h3 className="card-title">{item.titulo}</h3>
        <p className="card-preview">{ganchoPreview}</p>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-dim)' }}>
        <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>{item.grupo || 'Engenharia'}</span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Ver 4 Vias →</span>
      </div>
    </div>
  );
});

// Helpers visuais (Desktop & TDAH Friendly)
const ModalSection = ({ time, title, content, color, icon, highlight = false }) => (
  <div style={{ 
    background: highlight ? `${color}15` : 'var(--panel-bg)', 
    borderLeft: `4px solid ${color}`, 
    padding: '16px 20px', 
    borderRadius: '0 8px 8px 0',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
      {time && (
        <span style={{ 
          background: `${color}20`, 
          color: color, 
          padding: '4px 10px', 
          borderRadius: '6px', 
          fontSize: '11px', 
          fontWeight: 800,
          letterSpacing: '0.5px'
        }}>
          ⏳ {time}
        </span>
      )}
      <span style={{ fontSize: '13px', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span> {title}
      </span>
    </div>
    <div style={{ 
      fontSize: highlight ? '15px' : '14px', 
      fontWeight: highlight ? 700 : 500,
      lineHeight: 1.6, 
      color: highlight ? '#ffffff' : '#e2e8f0', 
      whiteSpace: 'pre-wrap' 
    }}>
      {content}
    </div>
  </div>
);

const CopyBlock = ({ label, content, onCopy, color }) => (
  <div style={{ background: '#020617', border: `1px solid var(--border-color)`, borderTop: `4px solid ${color}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
      📝 {label}
    </div>
    <div style={{ background: '#0f1420', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#f8fafc', flex: 1 }}>
      {content}
    </div>
    <button 
      onClick={() => onCopy(content, label)}
      style={{ marginTop: '16px', background: color, color: '#000', border: 0, padding: '10px 16px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', width: '100%' }}
    >
      📋 Copiar Texto
    </button>
  </div>
);

const InfoCard = ({ icon, text, color }) => (
  <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '12px', padding: '16px', color: color, fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
    <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span> 
    <span style={{ lineHeight: 1.5 }}>{text}</span>
  </div>
);

const BriefingModal = memo(function BriefingModal({ item, onClose, triggerToast }) {
  const [modalTab, setModalTab] = useState('didatico');
  const [modalHat, setModalHat] = useState('estudante');
  const [teleprompter, setTeleprompter] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const copyToClipboard = useCallback((text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    triggerToast(`✓ ${label} copiado com sucesso!`);
  }, [triggerToast]);

  const currentPersona = useMemo(() => {
    if (!item || !item.chapeus) return null;
    const hatsObj = item.chapeus;
    return hatsObj[modalHat] || hatsObj.estudante || hatsObj.empresario || hatsObj.gerente || hatsObj.mecanico || hatsObj.vendedor || item;
  }, [item, modalHat]);

  if (!item) return null;

  return (
    <div className="modal-overlay animate-fade" onClick={onClose} style={{ backdropFilter: 'blur(4px)' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '1100px', width: '95vw', padding: '32px', borderRadius: '16px' }}>
        
        {/* HEADER DO MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-accent)', lineHeight: 1 }}>{item.id}</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-main)', background: 'var(--color-accent-glow)', border: '1px solid var(--color-accent)', padding: '4px 10px', borderRadius: '99px', textTransform: 'uppercase' }}>
                {item.grupo || 'Engenharia'}
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{item.titulo}</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button
              onClick={() => setTeleprompter(!teleprompter)}
              style={{
                background: teleprompter ? '#10b981' : 'var(--bg-dark)',
                color: teleprompter ? '#000' : '#fff',
                border: teleprompter ? 'none' : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
              📺 {teleprompter ? 'Modo Leitura' : 'Teleprompter'}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'var(--color-accent)', border: 0, color: '#fff', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '16px' }}>
              ✕
            </button>
          </div>
        </div>

        {/* TABS NAVEGAÇÃO */}
        {!teleprompter && (
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', overflowX: 'auto' }}>
            {[
              { id: 'didatico', icon: '🎓', label: 'Roteiro Didático', color: '#38bdf8' },
              { id: 'reels', icon: '📱', label: 'Reels (0-60s)', color: '#fb7185' },
              { id: 'original', icon: '📄', label: 'Briefing Original', color: '#a855f7' },
              { id: 'chapeus', icon: '🎩', label: '5 Personas', color: '#e11d48' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setModalTab(tab.id)}
                style={{
                  background: modalTab === tab.id ? `${tab.color}15` : 'transparent',
                  color: modalTab === tab.id ? tab.color : 'var(--color-text-muted)',
                  border: `1px solid ${modalTab === tab.id ? tab.color : 'transparent'}`,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease-in-out'
                }}>
                <span style={{ fontSize: '16px' }}>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* CONTEÚDO */}
        {teleprompter ? (
          <div className="teleprompter-box" style={{ padding: '40px' }}>
             <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-accent)', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              📺 GRAVAÇÃO · MODO: {modalTab}
            </div>
            <div style={{ fontSize: '26px', lineHeight: 1.6, maxWidth: '800px', margin: '0 auto' }}>
              {modalTab === 'didatico' && (
                <>
                  <p style={{ marginBottom: '32px', color: '#fff', fontWeight: 900 }}>{item.roteiroDidatico?.gancho}</p>
                  <p style={{ marginBottom: '32px', color: '#cbd5e1' }}>{item.roteiroDidatico?.explicacao}</p>
                  <p style={{ color: '#38bdf8', fontWeight: 900 }}>{item.roteiroDidatico?.proximoPasso}</p>
                </>
              )}
              {modalTab === 'reels' && (
                <>
                  <p style={{ marginBottom: '32px', color: '#fff', fontWeight: 900 }}>{item.roteiroReels?.gancho}</p>
                  <p style={{ marginBottom: '32px', color: '#cbd5e1' }}>{item.roteiroReels?.conflitoVisual}</p>
                  <p style={{ marginBottom: '32px', color: '#cbd5e1' }}>{item.roteiroReels?.viradaTecnica}</p>
                  <p style={{ color: '#fb7185', fontWeight: 900 }}>{item.roteiroReels?.cta}</p>
                </>
              )}
              {modalTab === 'original' && (
                <>
                  <p style={{ marginBottom: '32px', color: '#cbd5e1' }}>{item.roteiroOriginal?.briefing}</p>
                  <p style={{ color: '#a855f7', fontWeight: 900 }}>Normas: {item.roteiroOriginal?.normas}</p>
                </>
              )}
              {modalTab === 'chapeus' && (
                <>
                  <p style={{ marginBottom: '32px', color: '#fff', fontWeight: 900 }}>{currentPersona?.gancho || currentPersona?.angulo}</p>
                  <p style={{ marginBottom: '32px', color: '#cbd5e1' }}>{currentPersona?.desenvolvimento || currentPersona?.explicacao}</p>
                  <p style={{ color: '#e11d48', fontWeight: 900 }}>{currentPersona?.cta}</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
            {/* LADO ESQUERDO: O ROTEIRO EM SI */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {modalTab === 'didatico' && (
                <>
                  <ModalSection time="0-5s" icon="🎯" title="Gancho Curioso" content={item.roteiroDidatico?.gancho} color="#38bdf8" highlight={true} />
                  <ModalSection time="5-40s" icon="📖" title="Explicação e Analogia" content={item.roteiroDidatico?.explicacao} color="#38bdf8" />
                  <ModalSection time="40-60s" icon="🚀" title="Próximo Passo Consultivo" content={item.roteiroDidatico?.proximoPasso} color="#38bdf8" highlight={true} />
                </>
              )}

              {modalTab === 'reels' && (
                <>
                  <ModalSection time="0-3s" icon="🪝" title="Hook de Impacto" content={item.roteiroReels?.gancho} color="#fb7185" highlight={true} />
                  <ModalSection time="3-15s" icon="👀" title="Conflito Visual" content={item.roteiroReels?.conflitoVisual} color="#fb7185" />
                  <ModalSection time="15-45s" icon="⚡" title="Virada Técnica" content={item.roteiroReels?.viradaTecnica} color="#fb7185" />
                  <ModalSection time="45-60s" icon="📢" title="Chamada de Ação" content={item.roteiroReels?.cta} color="#fb7185" highlight={true} />
                </>
              )}

              {modalTab === 'original' && (
                <>
                  <ModalSection icon="🏢" title="Briefing Institucional" content={item.roteiroOriginal?.briefing} color="#a855f7" />
                  <ModalSection icon="⚖️" title="Evidências Normativas" content={item.roteiroOriginal?.normas} color="#a855f7" highlight={true} />
                </>
              )}

              {modalTab === 'chapeus' && (
                <>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
                    {HATS.map(h => (
                      <button
                        key={h.id}
                        onClick={() => setModalHat(h.id)}
                        style={{
                          background: modalHat === h.id ? `var(--hat-${h.id})` : 'var(--bg-dark)',
                          color: modalHat === h.id ? '#000' : '#fff',
                          border: `1px solid ${modalHat === h.id ? 'transparent' : 'var(--border-color)'}`,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s'
                        }}>
                        {h.label}
                      </button>
                    ))}
                  </div>

                  {typeof currentPersona === 'string' ? (
                    <ModalSection icon="💬" title="Visão" content={currentPersona} color="var(--color-accent)" />
                  ) : (
                    <>
                      <ModalSection time="0-5s" icon="🧲" title="Gancho Persuasivo" content={currentPersona?.gancho} color="var(--color-accent)" highlight={true} />
                      <ModalSection time="5-40s" icon="🧠" title="Desenvolvimento" content={currentPersona?.desenvolvimento || currentPersona?.explicacao} color="var(--color-accent)" />
                      <ModalSection time="40-60s" icon="🚀" title="CTA" content={currentPersona?.cta} color="var(--color-accent)" highlight={true} />
                    </>
                  )}
                </>
              )}
            </div>

            {/* LADO DIREITO: INFORMAÇÕES DE APOIO E COPY */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {modalTab === 'didatico' && (
                <>
                  <InfoCard icon="💡" text={item.roteiroDidatico?.metafora} color="#38bdf8" />
                  {item.roteiroDidatico?.guiaCenas && (
                    <InfoCard icon="📹" text={item.roteiroDidatico?.guiaCenas} color="#94a3b8" />
                  )}
                  <div style={{ flex: 1 }}>
                    <CopyBlock label="Legenda Didática" content={item.roteiroDidatico?.legendaPronta} onCopy={copyToClipboard} color="#38bdf8" />
                  </div>
                </>
              )}
              {modalTab === 'reels' && (
                <CopyBlock label="Legenda Nativa do Reels" content={item.roteiroReels?.legenda} onCopy={copyToClipboard} color="#fb7185" />
              )}
              {modalTab === 'original' && (
                <CopyBlock label="Legenda do Briefing" content={item.roteiroOriginal?.legenda} onCopy={copyToClipboard} color="#a855f7" />
              )}
              {modalTab === 'chapeus' && (
                <>
                  {typeof currentPersona !== 'string' && currentPersona?.angulo && (
                    <InfoCard icon="🎯" text={`Posicionamento: ${currentPersona.angulo}`} color="var(--color-accent)" />
                  )}
                  {typeof currentPersona !== 'string' && currentPersona?.legenda && (
                    <div style={{ flex: 1 }}>
                      <CopyBlock label="Copy da Persona" content={currentPersona.legenda} onCopy={copyToClipboard} color="var(--color-accent)" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Componente Principal
export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);
  
  const [selectedType, setSelectedType] = useState('all');
  const [activeSection, setActiveSection] = useState('grid');
  const [displayCount, setDisplayCount] = useState(24);
  const [modalItem, setModalItem] = useState(null);
  const [toast, setToast] = useState('');

  // Filtros da Pesquisa com Gestor
  const [researchSearch, setResearchSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const triggerToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const handleSelectCard = useCallback((item) => {
    setModalItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalItem(null);
  }, []);

  const filteredBriefings = useMemo(() => {
    const query = deferredSearch.toLowerCase().trim();
    return briefingsData.filter(item => {
      const isVideo = item.tipo === 'video' || item.tipo === 'Reels/Shorts' || item.id.startsWith('V') || item.id.startsWith('N') || item.id.startsWith('M');
      const matchesType = (selectedType === 'all') || (selectedType === 'video' && isVideo) || (selectedType === 'post' && !isVideo) || (selectedType === 'top20' && item.top20);

      if (!matchesType) return false;
      if (!query) return true;

      const fullText = (item.id + ' ' + item.titulo + ' ' + (item.grupo || '') + ' ' + (item.tipo || '')).toLowerCase();
      return fullText.includes(query);
    });
  }, [deferredSearch, selectedType]);

  const visibleBriefings = useMemo(() => {
    return filteredBriefings.slice(0, displayCount);
  }, [filteredBriefings, displayCount]);

  const stats = useMemo(() => {
    const videos = briefingsData.filter(i => i.id.startsWith('V') || i.id.startsWith('N') || i.id.startsWith('M')).length;
    const posts = briefingsData.filter(i => i.id.startsWith('P')).length;
    return { videos: videos || 113, posts: posts || 99, total: briefingsData.length || 212 };
  }, []);

  // Filtro de Perguntas com Gestor
  const filteredResearchQuestions = useMemo(() => {
    const query = researchSearch.toLowerCase().trim();
    return researchQuestions.filter(q => {
      const matchesCategory = selectedCategory === 'Todas' || q.categoria === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      const full = (q.pergunta + ' ' + q.resposta + ' ' + q.categoria).toLowerCase();
      return full.includes(query);
    });
  }, [researchSearch, selectedCategory]);

  const researchCategories = useMemo(() => {
    return [
      { name: 'Todas', count: researchQuestions.length },
      { name: 'Infra & Painéis', count: researchQuestions.filter(q => q.categoria === 'Infra & Painéis').length },
      { name: 'Automação & Redes', count: researchQuestions.filter(q => q.categoria === 'Automação & Redes').length },
      { name: 'Normas & Segurança', count: researchQuestions.filter(q => q.categoria === 'Normas & Segurança').length },
      { name: 'Manutenção & Operação', count: researchQuestions.filter(q => q.categoria === 'Manutenção & Operação').length }
    ];
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 200,
          background: '#10b981',
          color: '#000',
          fontWeight: 800,
          padding: '12px 24px',
          borderRadius: '99px',
          boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
          fontSize: '14px'
        }}>
          {toast}
        </div>
      )}

      {/* Header Corrigido & Responsivo */}
      <header className="glass-nav">
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div className="brand-badge">⚡ Tecnovolt B2B Editorial Platform</div>
              <h1 style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2, marginTop: '4px' }}>
                Estratégia, Didática & Estrutura de Conteúdo Completa
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                212 Briefings industriais organizados por Roteiros Didáticos, Reels de Retenção, Roteiros Originais e 5 Chapéus de Persona.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', color: 'var(--color-accent)', display: 'block', lineHeight: 1 }}>{stats.videos}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Vídeos</span>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', color: 'var(--color-accent)', display: 'block', lineHeight: 1 }}>{stats.posts}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Posts</span>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', color: 'var(--color-accent)', display: 'block', lineHeight: 1 }}>{stats.total}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Briefings</span>
              </div>
            </div>
          </div>

          {/* Navigation Section Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px', overflowX: 'auto' }}>
            <button 
              onClick={() => setActiveSection('grid')}
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: activeSection === 'grid' ? '3px solid var(--color-accent)' : '3px solid transparent',
                color: activeSection === 'grid' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                padding: '10px 18px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}>
              📚 Acervo Completo ({filteredBriefings.length})
            </button>
            <button 
              onClick={() => setActiveSection('direcao')}
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: activeSection === 'direcao' ? '3px solid var(--color-accent)' : '3px solid transparent',
                color: activeSection === 'direcao' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                padding: '10px 18px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}>
              📌 Direção Estratégica & Ata
            </button>
            <button 
              onClick={() => setActiveSection('orquestracao')}
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: activeSection === 'orquestracao' ? '3px solid var(--color-accent)' : '3px solid transparent',
                color: activeSection === 'orquestracao' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                padding: '10px 18px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}>
              ⚙️ Orquestração (B01–B17)
            </button>
            <button 
              onClick={() => setActiveSection('pesquisa')}
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: activeSection === 'pesquisa' ? '3px solid var(--color-accent)' : '3px solid transparent',
                color: activeSection === 'pesquisa' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                padding: '10px 18px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}>
              📋 Pesquisa com Gestor (29 Perguntas)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="app-container">
        {activeSection === 'grid' && (
          <div>
            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '16px 0 24px' }}>
              <input
                type="text"
                placeholder="Buscar por título, ID, norma, perrengue de campo..."
                value={searchInput}
                onChange={e => { setSearchInput(e.target.value); setDisplayCount(24); }}
                style={{
                  flex: 1,
                  minWidth: '280px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <select
                value={selectedType}
                onChange={e => { setSelectedType(e.target.value); setDisplayCount(24); }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px'
                }}>
                <option value="all">Todos os formatos (212)</option>
                <option value="top20">⭐ Seleção Especial: Top 20 Melhores</option>
                <option value="video">Vídeos / Reels (113)</option>
                <option value="post">Posts / Carrosséis (99)</option>
              </select>
            </div>

            {/* Briefings Grid */}
            <div className="cards-grid">
              {visibleBriefings.map(item => (
                <BriefingCard
                  key={item.id}
                  item={item}
                  onSelect={handleSelectCard}
                />
              ))}
            </div>

            {/* Carregar Mais */}
            {displayCount < filteredBriefings.length && (
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <button
                  onClick={() => setDisplayCount(prev => prev + 24)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    padding: '12px 32px',
                    borderRadius: '99px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                  ⚡ Carregar Mais Pautas ({filteredBriefings.length - displayCount} restantes)
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: Direção Estratégica & Ata de Alinhamento (Formatado com Cards) */}
        {activeSection === 'direcao' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    📌 Direção Estratégica & Ata de Alinhamento
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Ata da reunião de direcionamento com diretoria e engenharia Tecnovolt (Agosto/2026)
                  </p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText("Direção Estratégica Tecnovolt: Foco em elétrica industrial, indústrias, armazéns de grãos e agroindústrias em Goiás. Leonardo assume os conteúdos de autoridade.");
                    triggerToast("✓ Diretrizes copiadas para a área de transferência!");
                  }}
                  style={{ background: 'var(--color-accent)', color: '#fff', border: 0, padding: '10px 18px', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                  📋 Copiar Diretrizes
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '16px' }}>
                <div style={{ background: '#090d16', border: '1px solid var(--border-color)', borderTop: '4px solid var(--color-accent)', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎯 Diretrizes Principais
                  </h3>
                  <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.7 }}>
                    <li><strong>Foco de Atuação:</strong> Elétrica industrial, automação de alta complexidade, armazéns de grãos, usinas e agroindústrias.</li>
                    <li><strong>Porta-Voz Oficial:</strong> Leonardo assume os conteúdos de autoridade técnica.</li>
                    <li><strong>Tom de Voz:</strong> Autoridade técnica sem arrogância ou lições de moral primárias.</li>
                    <li><strong>Zero AI-Slop:</strong> Proibido o uso de chavões publicitários genéricos.</li>
                  </ul>
                </div>

                <div style={{ background: '#090d16', border: '1px solid var(--border-color)', borderTop: '4px solid #38bdf8', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    👥 Público Prioritário (Centro-Oeste)
                  </h3>
                  <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.7 }}>
                    <li><strong>Indústrias e Usinas:</strong> Químicas, farmacêuticas, alimentícias e sucroalcooleiras.</li>
                    <li><strong>Agroindústria & Grãos:</strong> Armazéns, silos e plantas de processamento de grãos em Goiás, MT e DF.</li>
                    <li><strong>Decisores Chave:</strong> Gerentes de Manutenção, Diretores de Operação, Engenheiros de Planta e Compras.</li>
                  </ul>
                </div>

                <div style={{ background: '#090d16', border: '1px solid var(--border-color)', borderTop: '4px solid #fb7185', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🛣️ As 4 Vias de Conteúdo
                  </h3>
                  <ol style={{ paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.7 }}>
                    <li><strong>Roteiro Didático:</strong> Analogia prática, explicação sem rodeios e próximo passo.</li>
                    <li><strong>Reels Alta Retenção:</strong> Hook 0-3s, Conflito 3-15s, Virada 15-45s, CTA 45-60s.</li>
                    <li><strong>Briefing Institucional:</strong> Evidências normativas NBR/NR e base documental.</li>
                    <li><strong>5 Chapéus de Persona:</strong> Estudante, Empresário, Gerente, Mecânico, Vendedor.</li>
                  </ol>
                </div>

                <div style={{ background: '#090d16', border: '1px solid var(--border-color)', borderTop: '4px solid #a855f7', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚖️ Regras de Gate Editorial
                  </h3>
                  <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.7 }}>
                    <li><strong>Nota Mínima 3/5:</strong> Especificidade, Utilidade, Evidência e Coerência Comercial.</li>
                    <li><strong>Veto Imediato:</strong> Risco de AI-slop acima de 2 resulta em retorno imediato para reescrita.</li>
                    <li><strong>Rastreabilidade:</strong> Todo dado de mercado deve citar fonte, mês e ano.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Orquestração Editorial em 17 Blocos (B01 a B17) */}
        {activeSection === 'orquestracao' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  ⚙️ Orquestração Editorial em 17 Blocos (B01 a B17)
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Divisão estratégica de investigação e escrita por núcleos de pauta com Gate de Revisão Independente.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                {orchestrationBlocks.map(block => (
                  <div key={block.id} style={{ background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-accent)' }}>{block.id}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '99px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                          {block.status}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>{block.tema}</h4>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '10px' }}>IDs: {block.videos}</p>
                      <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>{block.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Pesquisa com Gestor (29 Perguntas de Campo - COMPLETO) */}
        {activeSection === 'pesquisa' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    📌 Pesquisa com Gestor (29 Perguntas)
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Respostas estruturadas do cliente sobre diferenciais, dores, infraestrutura, automação e objetivos.
                  </p>
                </div>
              </div>

              {/* Filtros e Busca de Perguntas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="🔍 Pesquisar em perguntas e respostas..."
                  value={researchSearch}
                  onChange={e => setResearchSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px 18px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />

                {/* Categories Pills */}
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {researchCategories.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      style={{
                        background: selectedCategory === cat.name ? 'var(--color-accent)' : '#090d16',
                        color: selectedCategory === cat.name ? '#fff' : 'var(--color-text-muted)',
                        border: `1px solid ${selectedCategory === cat.name ? 'var(--color-accent)' : 'var(--border-color)'}`,
                        borderRadius: '99px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}>
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de Perguntas e Respostas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredResearchQuestions.length === 0 ? (
                  <div style={{ textAlignment: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    Nenhuma pergunta encontrada para os termos pesquisados.
                  </div>
                ) : (
                  filteredResearchQuestions.map(item => (
                    <div key={item.id} style={{ background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '99px' }}>
                          📋 Pergunta {item.id} de 29
                        </span>
                        <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '99px' }}>
                          {item.categoria}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '16px', lineHeight: 1.4 }}>
                        {item.pergunta}
                      </h3>
                      <div style={{ background: '#0f1420', borderLeft: '4px solid var(--color-accent)', borderRadius: '0 8px 8px 0', padding: '16px 20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                          💬 Resposta do Cliente (Transcrição / Insights de Campo)
                        </div>
                        <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6 }}>
                          {item.resposta}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL ISOLADO */}
      <BriefingModal
        item={modalItem}
        onClose={handleCloseModal}
        triggerToast={triggerToast}
      />
    </div>
  );
}
