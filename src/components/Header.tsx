
import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          미래사회변화주도프로젝트
        </Link>
        <nav>
          <ul className="flex space-x-4">
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
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
