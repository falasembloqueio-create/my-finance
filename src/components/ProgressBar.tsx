interface ProgressBarProps {
  label: string;
  gasto: number;
  meta: number;
}

export function ProgressBar({ label, gasto, meta }: ProgressBarProps) {
  const porcentagem = Math.min((gasto / meta) * 100, 100);
  
  // Lógica de cor dinâmica
  const getCor = () => {
    if (porcentagem >= 100) return '#f43f5e'; // Vermelho (Estourou)
    if (porcentagem >= 80) return '#f59e0b';  // Amarelo (Atenção)
    return '#10b981';                         // Verde (Saudável)
  };

  return (
    <div style={{ marginBottom: '20px', background: '#0f172a', padding: '15px', borderRadius: '20px', border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
        <span style={{ color: '#64748b' }}>{label.toUpperCase()}</span>
        <span style={{ color: 'white' }}>{porcentagem.toFixed(0)}%</span>
      </div>
      
      {/* Barra de Fundo */}
      <div style={{ width: '100%', height: '8px', background: '#020617', borderRadius: '10px', overflow: 'hidden' }}>
        {/* Barra de Progresso */}
        <div style={{ 
          width: `${porcentagem}%`, 
          height: '100%', 
          background: getCor(), 
          transition: 'width 0.5s ease-in-out',
          boxShadow: `0 0 10px ${getCor()}55`
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px' }}>
        <span style={{ color: '#475569' }}>Gasto: R$ {gasto.toLocaleString()}</span>
        <span style={{ color: '#475569' }}>Meta: R$ {meta.toLocaleString()}</span>
      </div>
    </div>
  );
}