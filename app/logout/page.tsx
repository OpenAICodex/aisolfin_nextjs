"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    supabaseBrowser.auth.signOut().then(() => {
      router.replace('/login');
    });
  }, [router]);
  return <p className="p-4">Abmelden…</p>;
}