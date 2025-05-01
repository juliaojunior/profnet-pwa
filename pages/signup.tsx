import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState('');
  const [network, setNetwork] = useState('');
  const handleSignup = async () => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: name });
    
     // 🔹 salvar dados no Firestore
    await setDoc(doc(db, 'users', userCred.user.uid), {
      name,
      email,
      state,
      network,
      createdAt: new Date()
    });

    router.push('/profile');
  };
  return (
    <Layout>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Criar Conta</h1>
      <Input placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} />
      <Input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
      <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
      <Select value={state} onChange={e => setState(e.target.value)}>
        <option value="">Estado</option>
        {/* adicionar opções de estados aqui */}
      </Select>
      <Select value={network} onChange={e => setNetwork(e.target.value)}>
        <option value="">Selecione sua rede</option>
        <option value="publica">Rede Pública</option>
        <option value="privada">Rede Privada</option>
      </Select>
      <Button onClick={handleSignup}>Cadastrar</Button>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        Já tem conta? <Link href="/login">Entrar</Link>
      </div>
    </Layout>
  );
}
