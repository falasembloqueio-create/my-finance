import { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, LogOut, 
  LayoutGrid, List, BarChart3, User, Trash2, Lock
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from "./supabase";

// --- SEUS COMPONENTES ---
import { CardSaldo } from "./components/CardSaldo";
import { BotaoAba } from "./components/BotaoAba";
import { ProgressBar } from "./components/ProgressBar";
import Auth from "./Auth"; 

const CATEGORIAS = ["Geral", "Comida", "Lazer", "Contas", "Saúde", "Trabalho", "Investimento"];
const CORES_GRAFICO = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'extrato' | 'analise'>(
    (localStorage.getItem('minhaAba') as any) || 'inicio'
  );
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual] = useState(new Date().getFullYear());
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaCadastro, setCategoriaCadastro] = useState("Geral");

  const [metaGeral, setMetaGeral] = useState(Number(localStorage.getItem('metaGeral')) || 5000);
  const [metaComida, setMetaComida] = useState(Number(localStorage.getItem('metaComida')) || 1000);
  const [editandoMetas, setEditandoMetas] = useState(false);
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'ano'>('mes');

  const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // MONITOR DE SESSÃO
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) puxarTransacoes(); }, [user]);
  useEffect(() => { localStorage.setItem('minhaAba', abaAtiva); }, [abaAtiva]);

  const puxarTransacoes = async () => {
    const { data } = await supabase.from("financas").select("*").order("created_at", { ascending: false });
    if (data) setTransacoes(data);
  };

  const salvarTransacao = async (tipo: 'entrada' | 'saida') => {
    if (!descricao || !valor) return;
    await supabase.from("financas").insert([{ 
      descricao, valor: parseFloat(valor), tipo, categoria: categoriaCadastro, user_id: user?.id 
    }]);
    setDescricao(""); setValor(""); puxarTransacoes();
  };

  // FUNÇÃO EXCLUIR (DIA 4)
  const excluirTransacao = async (id: any) => {
    const confirmacao = window.confirm("Tem certeza que deseja apagar esse gasto?");
    
    if (confirmacao) {
      const { error } = await supabase
        .from("financas")
        .delete()
        .eq("id", id); 

      if (error) {
        alert("Erro ao apagar: " + error.message);
      } else {
        puxarTransacoes(); 
      }
    }
  }; 

  const transacoesFiltradas = transacoes.filter(t => {
    const d = new Date(t.created_at);
    const agora = new Date();
    if (periodo === 'mes') return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    if (periodo === 'trimestre') {
      const tresMesesAtras = new Date();
      tresMesesAtras.setMonth(agora.getMonth() - 3);
      return d >= tresMesesAtras;
    }
    if (periodo === 'ano') return d.getFullYear() === anoAtual;
    return false;
  });

  const totalEntradas = transacoesFiltradas.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoesFiltradas.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const dadosGrafico = CATEGORIAS.map(cat => ({
    name: cat,
    value: transacoesFiltradas.filter(t => t.tipo === 'saida' && t.categoria === cat).reduce((acc, t) => acc + t.valor, 0)
  })).filter(d => d.value > 0);

  const gastoComida = transacoesFiltradas.filter(t => t.categoria === 'Comida' && t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#8b5cf6'}}>CARREGANDO...</div>;

  if (!user) return <Auth />;

  return (
    <div style={{minHeight: '100vh', background: '#020617', color: '#e2e8f0', display: 'flex', justifyContent: 'center', paddingBottom: '100px', fontFamily: 'sans-serif'}}>
      <div style={{width: '100%', maxWidth: '400px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
        
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <div style={{background: '#0f172a', padding: '10px', borderRadius: '14px', border: '1px solid #1e293b', color: '#8b5cf6'}}><User size={20} /></div>
             <div>
               <h1 style={{fontSize: '13px', fontWeight: 'bold', color: 'white'}}>@{user?.email?.split('@')[0]}</h1>
               <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#10b981'}}><Lock size={8} /> Criptografado</div>
             </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{background: '#0f172a', border: '1px solid #1e293b', padding: '10px', borderRadius: '12px', color: '#f43f5e', cursor: 'pointer'}}><LogOut size={18} /></button>
        </header>

        <div style={{ display: 'flex', gap: '8px', background: '#0f172a', padding: '5px', borderRadius: '15px' }}>
          {(['mes', 'trimestre', 'ano'] as const).map((p) => (
            <button 
              key={p}
              onClick={() => setPeriodo(p)}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: periodo === p ? '#7c3aed' : 'transparent',
                color: periodo === p ? 'white' : '#64748b', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {p === 'mes' ? 'MÊS' : p === 'trimestre' ? '3 MESES' : 'ANO'}
            </button>
          ))}
        </div>

        {periodo === 'mes' && (
          <div style={{background: '#0f172a', padding: '15px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <button onClick={() => setMesAtual(mesAtual === 0 ? 11 : mesAtual - 1)} style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'}}><TrendingDown size={20} style={{transform: 'rotate(90deg)'}}/></button>
             <div style={{color: '#a78bfa', fontWeight: '900', fontSize: '12px'}}>{mesesNomes[mesAtual].toUpperCase()} {anoAtual}</div>
             <button onClick={() => setMesAtual(mesAtual === 11 ? 0 : mesAtual + 1)} style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'}}><TrendingUp size={20} style={{transform: 'rotate(90deg)'}}/></button>
          </div>
        )}

        {abaAtiva === 'inicio' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{display: 'flex', gap: '15px'}}>
              <CardSaldo titulo="GANHOS" valor={totalEntradas} cor="#10b981" borderCor="rgba(16,185,129,0.3)" />
              <CardSaldo titulo="GASTOS" valor={totalSaidas} cor="#f43f5e" borderCor="rgba(244,63,94,0.3)" />
            </div>

            <div style={{background: '#0f172a', padding: '40px 20px', borderRadius: '40px', border: '1px solid #1e293b', textAlign: 'center'}}>
               <p style={{color: '#64748b', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px'}}>SALDO DISPONÍVEL</p>
               <h2 style={{fontSize: '42px', fontWeight: '900', color: saldo >= 0 ? '#10b981' : '#f43f5e', margin: '10px 0'}}>R$ {saldo.toLocaleString()}</h2>
            </div>

            <div style={{background: '#0f172a', padding: '25px', borderRadius: '30px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <input style={{width: '100%', height: '45px', background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '0 15px', color: 'white'}} placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <input style={{width: '100%', height: '45px', background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '0 15px', color: 'white'}} type="number" placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} />
                <select style={{width: '100%', height: '45px', background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '0 10px', color: 'white'}} value={categoriaCadastro} onChange={(e) => setCategoriaCadastro(e.target.value)}>{CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button onClick={() => salvarTransacao('entrada')} style={{flex: 1, height: '50px', background: '#10b981', color: 'white', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}>RECEITA</button>
                <button onClick={() => salvarTransacao('saida')} style={{flex: 1, height: '50px', background: '#f43f5e', color: 'white', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer'}}>DESPESA</button>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'analise' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{background: '#0f172a', padding: '20px', borderRadius: '30px', border: '1px solid #1e293b'}}>
              <h3 style={{fontSize: '12px', fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: '20px'}}>GASTOS POR CATEGORIA</h3>
              <div style={{width: '100%', height: '220px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dadosGrafico} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                      {dadosGrafico.map((_entry, index) => <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{background: '#020617', border: '1px solid #1e293b', borderRadius: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#8b5cf6', letterSpacing: '1px' }}>METAS</h3>
                <button onClick={() => setEditandoMetas(!editandoMetas)} style={{ background: '#1e293b', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {editandoMetas ? 'SALVAR' : 'AJUSTAR'}
                </button>
              </div>

              {editandoMetas ? (
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '20px', border: '1px solid #7c3aed', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="number" value={metaGeral} onChange={(e) => { setMetaGeral(Number(e.target.value)); localStorage.setItem('metaGeral', e.target.value); }} style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '12px', borderRadius: '10px', color: 'white' }} />
                  <input type="number" value={metaComida} onChange={(e) => { setMetaComida(Number(e.target.value)); localStorage.setItem('metaComida', e.target.value); }} style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '12px', borderRadius: '10px', color: 'white' }} />
                </div>
              ) : (
                <>
                  <ProgressBar label="Geral" gasto={totalSaidas} meta={metaGeral} />
                  <ProgressBar label="Alimentação" gasto={gastoComida} meta={metaComida} />
                </>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'extrato' && (
           <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {transacoesFiltradas.map(t => (
                <div key={t.id} style={{background: '#0f172a', padding: '15px', borderRadius: '15px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                      <div style={{color: t.tipo === 'entrada' ? '#10b981' : '#f43f5e'}}>{t.tipo === 'entrada' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}</div>
                      <div>
                        <div style={{fontWeight: 'bold', fontSize: '14px', color: 'white'}}>{t.descricao}</div>
                        <div style={{fontSize: '9px', color: '#64748b'}}>{t.categoria}</div>
                      </div>
                   </div>
                   
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{fontWeight: '900', color: t.tipo === 'entrada' ? '#10b981' : '#f43f5e'}}>R$ {t.valor.toLocaleString()}</div>
                    
                    <button 
                      onClick={() => excluirTransacao(t.id)} 
                      style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '5px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                   </div>
                </div>
              ))}
           </div>
        )}

        <nav style={{position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '350px', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', border: '1px solid #1e293b', borderRadius: '25px', padding: '10px', display: 'flex', justifyContent: 'space-around', zIndex: 100}}>
           <BotaoAba ativa={abaAtiva === 'inicio'} onClick={() => setAbaAtiva('inicio')} icone={<LayoutGrid size={20}/>} label="INÍCIO" />
           <BotaoAba ativa={abaAtiva === 'extrato'} onClick={() => setAbaAtiva('extrato')} icone={<List size={20}/>} label="EXTRATO" />
           <BotaoAba ativa={abaAtiva === 'analise'} onClick={() => setAbaAtiva('analise')} icone={<BarChart3 size={20}/>} label="ANÁLISE" />
        </nav>
      </div>
    </div>
  );
}