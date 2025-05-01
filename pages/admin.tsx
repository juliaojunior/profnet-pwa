// pages/admin.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaUser, FaSyncAlt, FaMapMarkerAlt } from 'react-icons/fa';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [tituloNoticia, setTituloNoticia] = useState('');
  const [corpoNoticia, setCorpoNoticia] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace('/login');
      if (u.email !== 'juliaojunior@gmail.com') return router.replace('/');
      setUser(u);
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    });
  }, [router]);

  if (!user) return null;

  const total = users.length;
  const porEstado = users.reduce((acc, u) => {
    acc[u.state] = (acc[u.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const porRede = users.reduce((acc, u) => {
    acc[u.network] = (acc[u.network] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cores = ['#7F56D9', '#5B21B6', '#9F7AEA', '#D6BCFA'];

  const publicarNoticia = async () => {
    if (!tituloNoticia.trim() || !corpoNoticia.trim()) {
      alert('Preencha todos os campos.');
      return;
    }
    await addDoc(collection(db, 'noticias'), {
      titulo: tituloNoticia,
      corpo: corpoNoticia,
      data: new Date().toISOString(),
    });
    setTituloNoticia('');
    setCorpoNoticia('');
    setShowModal(false);
    alert('Notícia publicada com sucesso!');
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FaSyncAlt style={{ color: 'white', cursor: 'pointer' }} onClick={() => location.reload()} />
        <h1 style={{ color: 'white', flex: 1, textAlign: 'center' }}>Dashboard</h1>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
        <div style={cardStyle}><FaUser size={32} /><strong style={{ fontSize: 24 }}>{total}</strong><span>Total de usuários</span></div>
        <div style={cardStyle}><FaMapMarkerAlt size={32} /><span style={{ fontWeight: 'bold' }}>Usuários por Estado</span>{Object.entries(porEstado).map(([e, n]) => <div key={e}>{`${e} ${n}`}</div>)}</div>
        <div style={cardStyle}><span style={{ fontWeight: 'bold' }}>Usuários por Rede</span>{Object.entries(porRede).map(([r, n]) => <div key={r}>{`${r.charAt(0).toUpperCase() + r.slice(1)} ${n}`}</div>)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32 }}>
        <div style={cardStyle}>
          <span style={{ fontWeight: 'bold', marginBottom: 8 }}>Usuários por Estado</span>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={Object.entries(porEstado).map(([key, value]) => ({ name: key, value }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6B46C1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <span style={{ fontWeight: 'bold', marginBottom: 8 }}>Distribuição por Rede</span>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={Object.entries(porRede).map(([key, value]) => ({ name: key, value }))} dataKey="value" outerRadius={60}>
                {Object.entries(porRede).map((_, index) => <Cell key={index} fill={cores[index % cores.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <button style={actionButtonStyle} onClick={() => setShowModal(true)}>+ Cadastrar notícia</button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#00000088', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: '100%', maxWidth: 500 }}>
            <h2 style={{ marginBottom: 16 }}>Nova Notícia</h2>
            <input type="text" placeholder="Título" value={tituloNoticia} onChange={(e) => setTituloNoticia(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8, border: '1px solid #ccc', borderRadius: 8 }} />
            <textarea placeholder="Corpo da notícia" value={corpoNoticia} onChange={(e) => setCorpoNoticia(e.target.value)} style={{ width: '100%', height: 120, marginBottom: 16, padding: 8, border: '1px solid #ccc', borderRadius: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: 8 }}>Cancelar</button>
              <button onClick={publicarNoticia} style={{ padding: '8px 16px', background: '#6B46C1', color: 'white', border: 'none', borderRadius: 8 }}>Publicar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12 }}>
          <thead>
            <tr>
              <th style={th}>Usuário</th>
              <th style={th}>Estado</th>
              <th style={th}>Rede</th>
              <th style={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={td}>{u.name}</td>
                <td style={td}>{u.state}</td>
                <td style={td}>{u.network}</td>
                <td style={td}>
                  <button style={promoteBtn}>Promover</button>
                  <button style={deleteBtn}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <button style={backButtonStyle} onClick={() => router.push('/profile')}>
          Voltar ao Perfil
        </button>
      </div>
    </Layout>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
};

const actionButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  background: '#6B46C1',
  color: 'white',
  border: 'none',
  borderRadius: 20,
  cursor: 'pointer',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: 12,
  background: '#F3F4F6',
  color: '#4B5563',
  fontWeight: 'bold',
};

const td: React.CSSProperties = {
  padding: 12,
  borderBottom: '1px solid #E2E8F0',
};

const promoteBtn: React.CSSProperties = {
  background: '#6B46C1',
  color: 'white',
  padding: '4px 8px',
  border: 'none',
  borderRadius: 8,
  marginRight: 8,
  cursor: 'pointer',
};

const deleteBtn: React.CSSProperties = {
  background: '#E53E3E',
  color: 'white',
  padding: '4px 8px',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const backButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#EDF2F7',
  color: '#4A5568',
  border: '1px solid #CBD5E0',
  borderRadius: 8,
  cursor: 'pointer',
};
