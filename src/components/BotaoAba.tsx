import type { ReactNode } from "react"; // Adicionamos a palavra 'type' aqui

interface BotaoAbaProps {
  ativa: boolean;
  onClick: () => void;
  icone: ReactNode;
  label: string;
}

export function BotaoAba({ ativa, onClick, icone, label }: BotaoAbaProps) {
  return (
    <button 
      onClick={onClick} 
      style={{
        background: ativa ? '#7c3aed' : 'none', 
        border: 'none', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '15px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '4px', 
        cursor: 'pointer',
        transition: '0.3s'
      }}
    >
      {icone}
      <span style={{ fontSize: '8px', fontWeight: 'bold' }}>{label}</span>
    </button>
  );
}