
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';

export function HomeClient() {
  const [greeting, setGreeting] = useState('');
  const { user } = useUser();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bonjour');
    } else if (hour < 18) {
      setGreeting('Bon après-midi');
    } else {
      setGreeting('Bonsoir');
    }
  }, []);

  if (!greeting) {
    return <span>Bienvenue !</span>
  }

  const displayName = user?.displayName?.split(' ')[0];

  return <span>{greeting}{displayName ? `, ${displayName}` : ''} !</span>;
}

    

    