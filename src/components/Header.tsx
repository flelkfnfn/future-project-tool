
'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/supabase-provider';
import { User } from '@supabase/supabase-js';

const Header = () => {
  const router = useRouter();
  const { supabase, session } = useSupabase(); // Get session from context
  const [user, setUser] = useState<User | null>(null); // Keep user state for convenience
  // const [isApproved, setIsApproved] = useState<boolean | null>(null); // Temporarily remove isApproved logic

  useEffect(() => {
  setUser(session?.user ?? null); // session?.user는 User | undefined
}, [session]); // Depend on session from context

  // Temporarily remove redirect logic for unapproved users
  // useEffect(() => {
  //   if (user && isApproved === false && router.pathname !== '/access-denied' && router.pathname !== '/login') {
  //     router.push('/access-denied');
  //   }
  // }, [user, isApproved, router]);

  const handleLogout: () => Promise<void> = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          미래사회변화주도프로젝트
        </Link>
        <nav className="flex items-center space-x-4">
          <ul className="flex space-x-4">
            {/* Only show navigation links if user is logged in (temporarily remove isApproved check) */}
            {user && (
              <>
                <li>
                  <Link href="/projects" className="hover:text-gray-300">
                    프로젝트
                  </Link>
                </li>
                <li>
                  <Link href="/notices" className="hover:text-gray-300">
                    공지사항
                  </Link>
                </li>
                <li>
                  <Link href="/ideas" className="hover:text-gray-300">
                    아이디어 모음
                  </Link>
                </li>
                <li>
                  <Link href="/calendar" className="hover:text-gray-300">
                    캘린더
                  </Link>
                </li>
                <li>
                  <Link href="/files" className="hover:text-gray-300">
                    파일 공유
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div className="ml-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">
                로그인 / 회원가입
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
