import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    onAuthStateChanged(auth, user => {
      router.replace(user ? '/profile' : '/login');
    });
  }, [router]);
  return null;
}
