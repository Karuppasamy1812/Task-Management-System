import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <button onClick={() => navigate('/')} className="text-xl font-bold text-blue-600 hover:text-blue-700">
        TaskBoard
      </button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
            'hover:bg-gray-100 transition outline-none'
          )}>
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="font-medium text-gray-700">{user?.name}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{user?.role}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[160px] z-50"
            align="end" sideOffset={6}>
            <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded cursor-pointer hover:bg-gray-50 outline-none">
              <User size={14} />
              {user?.email}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 border-t border-gray-100" />
            <DropdownMenu.Item
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded cursor-pointer hover:bg-red-50 outline-none">
              <LogOut size={14} />
              Logout
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </nav>
  );
}
