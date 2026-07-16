'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch(`${API_URL}/setup/status`);
        const data = await res.json();
        if (data.completed) {
          router.push('/login');
        } else {
          router.push('/setup');
        }
      } catch (err) {
        router.push('/setup');
      }
    };
    checkSetup();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  return null;
}