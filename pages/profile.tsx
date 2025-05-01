import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // pode deixar ou remover se não usar Firebase Storage
import { updateProfile } from 'firebase/auth';


export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('');
  const [network, setNetwork] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) router.replace('/login');
      else {
        setUser(u);
        const docRef = doc(db, 'users', u.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || '');
          setEmail(data.email || '');
          setState(data.state || '');
          setNetwork(data.network || '');
        }
      }
    });
  }, [router]);



  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);

    try {
      const res = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: 'Client-ID d93758b8cc72b76', // sua Client ID
        },
        body: formData,
      });

      const data = await res.json();

      if (!data.success) throw new Error('Falha no upload Imgur');
  
      const imageUrl = data.data.link;

      // Atualiza no Firebase Auth
      await updateProfile(user, {
        photoURL: imageUrl,
      });

      // Atualiza no Firestore também
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        state,
        network,
        photoURL: imageUrl,
        updatedAt: new Date(),
      });

      alert('Foto de perfil atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      alert('Erro ao enviar imagem.');
    }

    setUploading(false);
  };

  const handleSave = async () => {
    console.log('Tentando salvar no Firestore...');
    if (!user) return;

    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      state,
      network,
      updatedAt: new Date()
    });

    alert('Informações atualizadas com sucesso!');
  };

  const handleLogout = async () => { await signOut(auth); router.push('/login'); };

  if (!user) return null;
  return (
    <Layout>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Perfil</h1>

       <div style={{ position: 'relative', width: 100, margin: '0 auto 24px' }}>
         <img
          src={user?.photoURL || 'https://www.w3schools.com/howto/img_avatar.png'}
          width={100}
          height={100}
          alt="Avatar"
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #6b46c1',
          }}
        />
        <label
          htmlFor="avatarUpload"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            background: '#6b46c1',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 3px rgba(0,0,0,0.3)',
          }}
          title="Alterar foto"
        >
          ✏️
        </label>
        <input
          id="avatarUpload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>


  
  <Input value={name} placeholder="Nome completo" onChange={e => setName(e.target.value)} />
  <Input type="email" value={email} placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
  <Select value={state} onChange={e => setState(e.target.value)}>
    <option value="">Estado</option>
    <option value="AC">Acre</option>
    <option value="AL">Alagoas</option>
    <option value="AP">Amapá</option>
    <option value="AM">Amazonas</option>
    <option value="BA">Bahia</option>
    <option value="CE">Ceará</option>
    <option value="DF">Distrito Federal</option>
    <option value="ES">Espírito Santo</option>
    <option value="GO">Goiás</option>
    <option value="MA">Maranhão</option>
    <option value="MT">Mato Grosso</option>
    <option value="MS">Mato Grosso do Sul</option>
    <option value="MG">Minas Gerais</option>
    <option value="PA">Pará</option>
    <option value="PB">Paraíba</option>
    <option value="PR">Paraná</option>
    <option value="PE">Pernambuco</option>
    <option value="PI">Piauí</option>
    <option value="RJ">Rio de Janeiro</option>
    <option value="RN">Rio Grande do Norte</option>
    <option value="RS">Rio Grande do Sul</option>
    <option value="RO">Rondônia</option>
    <option value="RR">Roraima</option>
    <option value="SC">Santa Catarina</option>
    <option value="SP">São Paulo</option>
    <option value="SE">Sergipe</option>
    <option value="TO">Tocantins</option>
  </Select>
  <Select value={network} onChange={e => setNetwork(e.target.value)}>
    <option value="">Rede</option>
    <option value="municipal">Rede Municipal</option>
    <option value="estadual">Rede Estadual</option>
    <option value="federal">Rede Federal</option>
    <option value="privada">Rede Privada</option>
  </Select>
  

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span>Senha</span>
        <Button style={{ width: 'auto', padding: '4px 8px', background: 'transparent', color: '#6b46c1', border: 'none' }} onClick={() => {/*navegar para alterar senha*/}}>
          Alterar senha
        </Button>
      </div>
      <Button onClick={handleSave}>Salvar alterações</Button>
      {user?.email === 'juliaojunior@gmail.com' && (
        <Button
          style={{ marginTop: 16, background: '#4A5568' }}
          onClick={() => router.push('/admin')}
        >
          Acessar Painel do Administrador
        </Button>
      )}

      <Button style={{ background: 'transparent', color: '#B91C1C', marginTop: 12 }} onClick={handleLogout}>
        Sair da conta
      </Button>
    </Layout>
  );
}











