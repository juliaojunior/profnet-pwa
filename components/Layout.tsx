// components/Layout.tsx – avatar dinâmico corrigido
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { Home, Newspaper, MessageCircle, BookText } from 'lucide-react';

/* ===== styled ===== */
const Container = styled.main`
  min-height: 100vh;
  background: #f8f9fc;
  padding-bottom: 60px;
`;
const Header = styled.header`
  background: #553c9a;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
`;
const Brand = styled.a`
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
`;
const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
`;
const Placeholder = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #553c9a;
  cursor: pointer;
`;
const UserMenu = styled.div`
  position: relative;
`;
const Dropdown = styled.div`
  position: absolute;
  top: 44px;
  right: 0;
  background: #fff;
  color: #2d3748;
  min-width: 160px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 20;
`;
const DropdownItem = styled.button<{ $danger?: boolean }>`
  width: 100%;
  padding: 10px 16px;
  background: ${({ $danger }) => ($danger ? '#fed7d7' : 'transparent')};
  border: none;
  text-align: left;
  cursor: pointer;
  &:hover {
    background: ${({ $danger }) => ($danger ? '#feb2b2' : '#edf2f7')};
  }
`;
const BottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  z-index: 10;
`;
const NavItem = styled(Link)<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: ${({ $active }) => ($active ? '#553c9a' : '#4a5568')};
  font-size: 0.7rem;
  svg {
    width: 20px;
    height: 20px;
  }
`;

/* ===== component ===== */
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useRouter();
  const [openMenu, setOpenMenu] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const initials = user?.email?.[0]?.toUpperCase() || 'U';
  const avatarSrc = user?.photoURL || '/icons/icon-192x192.png';

  return (
    <Container>
      <Header>
        <Link href="/home" legacyBehavior>
          <Brand>EduConnect</Brand>
        </Link>

        <UserMenu>
          {user ? (
            <Avatar src={avatarSrc} alt="user" onClick={() => setOpenMenu((p) => !p)} />
          ) : (
            <Placeholder onClick={() => setOpenMenu((p) => !p)}>{initials}</Placeholder>
          )}

          {openMenu && (
            <Dropdown>
              <DropdownItem as={Link} href="/profile">
                Perfil
              </DropdownItem>
              <DropdownItem $danger onClick={() => signOut(auth)}>
                Sair
              </DropdownItem>
            </Dropdown>
          )}
        </UserMenu>
      </Header>

      {children}

      <BottomNav>
        <NavItem href="/home" $active={pathname === '/home'}>
          <Home />
          Home
        </NavItem>
        <NavItem href="/noticias" $active={pathname === '/noticias'}>
          <Newspaper />
          Notícias
        </NavItem>
        <NavItem href="/mensagens" $active={pathname === '/mensagens'}>
          <MessageCircle />
          Mensagens
        </NavItem>
        <NavItem href="/gerador" $active={pathname === '/gerador'}>
          <BookText />
          Gerador
        </NavItem>
      </BottomNav>
    </Container>
  );
};
