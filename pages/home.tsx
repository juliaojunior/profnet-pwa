// pages/home.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Layout } from '../components/Layout';
import styled from 'styled-components';
import { FaUser, FaNewspaper, FaComments, FaLightbulb, FaBullhorn } from 'react-icons/fa';
import { theme } from '../styles/theme';

const WelcomeHeader = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  
  h1 {
    font-family: ${theme.fonts.heading};
    font-weight: 700;
    color: ${theme.colors.text.primary};
    margin-bottom: ${theme.spacing.sm};
  }
  
  p {
    color: ${theme.colors.text.secondary};
    max-width: 600px;
    margin: 0 auto;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: ${theme.spacing.lg};
  max-width: 1000px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  background: ${theme.colors.cardBg};
  border-radius: ${theme.rounded.lg};
  overflow: hidden;
  box-shadow: ${theme.shadows.md};
  transition: transform ${theme.transitions.default}, box-shadow ${theme.transitions.default};
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${theme.shadows.lg};
  }
`;

const CardHeader = styled.div<{ bgColor: string }>`
  background-color: ${props => props.bgColor};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
`;

const CardIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: ${theme.spacing.sm};
`;

const CardContent = styled.div`
  padding: ${theme.spacing.lg};
  
  h3 {
    margin: 0;
    margin-bottom: ${theme.spacing.sm};
    font-family: ${theme.fonts.heading};
  }
  
  p {
    color: ${theme.colors.text.secondary};
    margin: 0;
    font-size: 0.9rem;
  }
`;

const AnnouncementBanner = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
  border-radius: ${theme.rounded.md};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  color: white;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  
  .icon {
    font-size: 2rem;
  }
  
  .content {
    flex: 1;
    
    h3 {
      margin: 0;
      margin-bottom: ${theme.spacing.xs};
    }
    
    p {
      margin: 0;
      opacity: 0.9;
    }
  }
`;

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setLoading(false);
        setUserName(user.displayName || user.email?.split('@')[0] || 'Professor');
      }
    });
  }, [router]);

  if (loading) return null;

  const handleCardClick = (route: string) => {
    router.push(route);
  };

  return (
    <Layout>
      <WelcomeHeader>
        <h1>Bem-vindo, {userName}!</h1>
        <p>Sua plataforma para desenvolvimento profissional e colaboração com outros educadores.</p>
      </WelcomeHeader>
      
      <AnnouncementBanner>
        <div className="icon">
          <FaBullhorn />
        </div>
        <div className="content">
          <h3>Novidades!</h3>
          <p>Temos novo conteúdo no gerador pedagógico. Experimente criar planos de aula interativos.</p>
        </div>
      </AnnouncementBanner>

      <CardGrid>
        <FeatureCard onClick={() => handleCardClick('/profile')}>
          <CardHeader bgColor={theme.colors.primary}>
            <CardIcon>
              <FaUser />
            </CardIcon>
          </CardHeader>
          <CardContent>
            <h3>Perfil</h3>
            <p>Gerencie suas informações e preferências de conta</p>
          </CardContent>
        </FeatureCard>
        
        <FeatureCard onClick={() => handleCardClick('/noticias')}>
          <CardHeader bgColor="#3B82F6">
            <CardIcon>
              <FaNewspaper />
            </CardIcon>
          </CardHeader>
          <CardContent>
            <h3>Notícias</h3>
            <p>Acompanhe as últimas atualizações e novidades educacionais</p>
          </CardContent>
        </FeatureCard>
        
        <FeatureCard onClick={() => handleCardClick('/mensagens')}>
          <CardHeader bgColor="#10B981">
            <CardIcon>
              <FaComments />
            </CardIcon>
          </CardHeader>
          <CardContent>
            <h3>Mensagens</h3>
            <p>Interaja com outros professores e compartilhe experiências</p>
          </CardContent>
        </FeatureCard>
        
        <FeatureCard onClick={() => handleCardClick('/gerador')}>
          <CardHeader bgColor="#F59E0B">
            <CardIcon>
              <FaLightbulb />
            </CardIcon>
          </CardHeader>
          <CardContent>
            <h3>Gerador</h3>
            <p>Crie planos de aula, atividades e recursos pedagógicos com IA</p>
          </CardContent>
        </FeatureCard>
      </CardGrid>
    </Layout>
  );
}
