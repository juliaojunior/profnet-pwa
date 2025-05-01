// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import styled from 'styled-components';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF } from 'react-icons/fa';
import { theme } from '../styles/theme';
import { Button, Input } from '../components/styled';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.md};
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const LoginCard = styled.div`
  background: white;
  border-radius: ${theme.rounded.lg};
  box-shadow: ${theme.shadows.xl};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 420px;
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  
  img {
    margin-bottom: ${theme.spacing.md};
  }
  
  h1 {
    font-family: ${theme.fonts.heading};
    color: ${theme.colors.text.primary};
    margin: 0;
    margin-bottom: ${theme.spacing.xs};
  }
  
  p {
    color: ${theme.colors.text.secondary};
    margin: 0;
  }
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const ForgotPassword = styled.div`
  text-align: right;
  margin-bottom: ${theme.spacing.md};
  
  a {
    color: ${theme.colors.primary};
    font-size: 0.875rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${theme.spacing.lg} 0;
  color: ${theme.colors.text.light};
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #E2E8F0;
  }
  
  span {
    padding: 0 ${theme.spacing.md};
    font-size: 0.875rem;
  }
`;

const SocialButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const SocialButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
  border-radius: ${theme.rounded.md};
  border: 1px solid #E2E8F0;
  background: white;
  cursor: pointer;
  transition: background ${theme.transitions.fast}, transform ${theme.transitions.fast};
  
  &:hover {
    background: #F8FAFC;
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 1.5rem;
  }
`;

const Footer = styled.div`
  text-align: center;
  margin-top: ${theme.spacing.lg};
  color: ${theme.colors.text.secondary};
  font-size: 0.875rem;
  
  a {
    color: ${theme.colors.primary};
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/home');
    } catch (err: any) {
      console.error(err);
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/home');
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao fazer login com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/home');
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao fazer login com Facebook. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <img src="/icons/icon-192x192.png" width={64} height={64} alt="Logo" />
          <h1>Bem-vindo de volta</h1>
          <p>Acesse sua conta para continuar</p>
        </LoginHeader>
        
        {error && (
          <div style={{ 
            background: '#FEF2F2', 
            color: '#DC2626', 
            padding: theme.spacing.md, 
            borderRadius: theme.rounded.md, 
            marginBottom: theme.spacing.md,
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        
        <LoginForm onSubmit={handleEmailLogin}>
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <ForgotPassword>
            <Link href="/reset-password">Esqueci minha senha</Link>
          </ForgotPassword>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Carregando...' : 'Entrar'}
          </Button>
        </LoginForm>
        
        <Divider><span>ou continue com</span></Divider>
        
        <SocialButtons>
          <SocialButton onClick={handleGoogleLogin} disabled={loading}>
            <FcGoogle />
          </SocialButton>
          
          <SocialButton onClick={handleFacebookLogin} disabled={loading}>
            <FaFacebookF color="#1877F2" />
          </SocialButton>
        </SocialButtons>
        
        <Footer>
          Não tem uma conta? <Link href="/signup">Cadastre-se</Link>
        </Footer>
      </LoginCard>
    </LoginContainer>
  );
}
