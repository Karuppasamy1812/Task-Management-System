import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  LayoutDashboard, FolderKanban, Plus, X, LogOut,
  ChevronDown, Loader2, PanelLeftClose, PanelLeftOpen,
  Shield, Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { cn } from '../lib/cn';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: projects } = useProjects();
  const createProject = useCreateProject();

  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createProject.mutate({ name, description }, {
      onSuccess: () => {
        toast.success('Project created');
        setOpen(false);
        setName('');
        setDescription('');
      },
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
const capitalize = (str) => {
   return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
};
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <aside className={cn(
        'flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-[60px]' : 'w-[240px]',
      )}>
        {/* Logo + Collapse */}
        <div className={cn(
          'flex items-center h-16 border-b border-gray-100 px-4 flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-between',
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-base font-bold text-gray-900">TaskBoard</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {/* Dashboard */}
          <button
            onClick={() => navigate('/')}
            title="Dashboard"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
              isActive('/')
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-gray-600 hover:bg-gray-100',
              collapsed && 'justify-center',
            )}
          >
            <LayoutDashboard size={17} className="flex-shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </button>

          {/* Projects header */}
          {!collapsed && (
            <div className="flex items-center justify-between px-3 pt-5 pb-1.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Projects
              </span>
              <button
                onClick={() => setOpen(true)}
                className="w-5 h-5 rounded-md bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 flex items-center justify-center transition"
              >
                <Plus size={12} />
              </button>
            </div>
          )}

          {collapsed && (
            <button
              onClick={() => setOpen(true)}
              title="New Project"
              className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition mt-2"
            >
              <Plus size={17} />
            </button>
          )}

          {/* Project list */}
          <div className="space-y-0.5">
            {projects?.map((p) => (
              <button
                key={p._id}
                onClick={() => navigate(`/project/${p._id}`)}
                title={capitalize(p.name)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition',
                  isActive(`/project/${p._id}`)
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100',
                  collapsed && 'justify-center',
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white',
                  isActive(`/project/${p._id}`) ? 'bg-blue-600' : 'bg-gray-300',
                )}>
                  {p.name[0].toUpperCase()}
                </div>
                {!collapsed && <span className="truncate">{capitalize(p.name)}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className={cn(
                'w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-100 transition outline-none',
                collapsed && 'justify-center',
              )}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                {!collapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{user?.name}</p>
                      <p className="text-[11px] text-gray-400 truncate capitalize">{user?.role}</p>
                    </div>
                    <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 min-w-[200px] z-50"
                side="top"
                align="start"
                sideOffset={8}
              >
                <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Mail size={10} /> {user?.email}
                  </p>
                </div>
                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 rounded-lg outline-none cursor-default">
                  <Shield size={12} className="text-blue-500" />
                  <span className="capitalize font-medium">{user?.role}</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 border-t border-gray-100" />
                <DropdownMenu.Item
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-lg cursor-pointer hover:bg-red-50 outline-none transition"
                >
                  <LogOut size={14} />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>

      {/* New Project Dialog */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-md shadow-2xl z-50 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FolderKanban size={16} className="text-blue-600" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-semibold text-gray-900">New Project</Dialog.Title>
                  <p className="text-xs text-gray-400">Create a new project workspace</p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Project name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Website Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="What is this project about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-60"
                >
                  {createProject.isPending && <Loader2 size={14} className="animate-spin" />}
                  {createProject.isPending ? 'Creating...' : 'Create Project'}
                </button>
                <Dialog.Close asChild>
                  <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition border border-gray-200">
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
