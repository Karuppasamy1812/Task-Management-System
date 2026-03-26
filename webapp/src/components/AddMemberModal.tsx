import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown, UserPlus, Shield, Eye, Edit3 } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { useAddMember } from '../hooks/useProjects';
import { useUsers } from '../hooks/useUsers';
import type { Member } from '../lib/types';

interface Props {
  projectId: string;
  existingMembers: Member[];
  ownerId: string;
  open: boolean;
  onClose: () => void;
}

const roleConfig = [
  { value: 'admin',       label: 'Admin',       desc: 'Full project access',     icon: Shield,  cls: 'text-red-600' },
  { value: 'contributor', label: 'Contributor', desc: 'Can create & edit tasks', icon: Edit3,   cls: 'text-blue-600' },
  { value: 'viewer',      label: 'Viewer',      desc: 'Read-only access',        icon: Eye,     cls: 'text-gray-600' },
];

export default function AddMemberModal({ projectId, existingMembers, ownerId, open, onClose }: Props) {
  const { data: users } = useUsers();
  const addMember = useAddMember();
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('contributor');

  const existingIds = new Set([ownerId, ...existingMembers.map((m) => m.user._id)]);
  const available = users?.filter((u) => !existingIds.has(u._id)) ?? [];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    addMember.mutate({ projectId, userId: selectedUser, role }, {
      onSuccess: () => { toast.success('Member added successfully'); setSelectedUser(''); onClose(); },
    });
  };

  const selectedRoleConfig = roleConfig.find((r) => r.value === role);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-sm shadow-2xl z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <UserPlus size={16} className="text-blue-600" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-gray-900">Add Member</Dialog.Title>
                <p className="text-xs text-gray-400">Invite someone to this project</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* User select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Select user</label>
              <Select.Root value={selectedUser} onValueChange={setSelectedUser}>
                <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 outline-none hover:border-blue-400 focus:ring-2 focus:ring-blue-500 transition">
                  <Select.Value placeholder="Choose a team member..." />
                  <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden w-[var(--radix-select-trigger-width)]">
                    <Select.Viewport className="p-1.5 max-h-48">
                      {available.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-gray-400 text-center">No users available to add</div>
                      ) : (
                        available.map((u) => (
                          <Select.Item
                            key={u._id}
                            value={u._id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 outline-none data-[highlighted]:bg-blue-50"
                          >
                            <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                              {u.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <Select.ItemText>
                                <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                              </Select.ItemText>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            </div>
                          </Select.Item>
                        ))
                      )}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Role select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Assign role</label>
              <Select.Root value={role} onValueChange={setRole}>
                <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 outline-none hover:border-blue-400 focus:ring-2 focus:ring-blue-500 transition">
                  <div className="flex items-center gap-2">
                    {selectedRoleConfig && (
                      <selectedRoleConfig.icon size={14} className={selectedRoleConfig.cls} />
                    )}
                    <Select.Value />
                  </div>
                  <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden w-[var(--radix-select-trigger-width)]">
                    <Select.Viewport className="p-1.5">
                      {roleConfig.map((r) => (
                        <Select.Item
                          key={r.value}
                          value={r.value}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 outline-none data-[highlighted]:bg-gray-50"
                        >
                          <r.icon size={15} className={r.cls} />
                          <div>
                            <Select.ItemText>
                              <p className="text-sm font-medium text-gray-800">{r.label}</p>
                            </Select.ItemText>
                            <p className="text-xs text-gray-400">{r.desc}</p>
                          </div>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={!selectedUser || addMember.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addMember.isPending ? 'Adding...' : 'Add Member'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
