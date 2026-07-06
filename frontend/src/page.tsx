'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if setup has been completed by calling backend
    const checkSetup = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/setup/status');
        const data = await res.json();
        if (data.completed) {
          router.push('/login');
        } else {
          router.push('/setup');
        }
      } catch (err) {
        // Backend not running or error – assume not completed
        router.push('/setup');
      }
    };
    checkSetup();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  return null;
}