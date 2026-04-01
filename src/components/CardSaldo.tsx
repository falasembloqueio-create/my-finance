interface CardSaldoProps {
  titulo: string;
  valor: number;
  cor: string;
  borderCor: string;
}

export function CardSaldo({ titulo, valor, cor, borderCor }: CardSaldoProps) {
  return (
    <div style={{
      background: '#0f172a', 
      padding: '20px', 
      borderRadius: '25px', 
      border: `1px solid ${borderCor}`,
      flex: 1
    }}>
      <p style={{ color: cor, fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>{titulo}</p>
      <p style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
        R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}