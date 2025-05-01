// pages/_app.tsx
import { useEffect } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap');
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  html, body {
    font-family: ${theme.fonts.body};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text.primary};
    scroll-behavior: smooth;
  }
  
  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    transition: color ${theme.transitions.fast};
    
    &:hover {
      color: ${theme.colors.secondary};
    }
  }
`;

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Registrar o service worker para PWA
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function() {
        navigator.serviceWorker.register("/sw.js").then(
          function(registration) {
            console.log("Service Worker registrado com sucesso:", registration.scope);
          },
          function(err) {
            console.log("Falha ao registrar Service Worker:", err);
          }
        );
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>EduConnect - Rede Social para Professores</title>
        <meta name="description" content="Plataforma educacional para comunicação e recursos para professores" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#4361EE" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

export default MyApp;
