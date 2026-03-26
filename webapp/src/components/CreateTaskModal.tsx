import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown, Tag, Calendar, AlertTriangle } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { useCreateTask } from '../hooks/useTasks';
import type { User } from '../lib/types';
import { cn } from '../lib/cn';

interface Props {
  projectId: string;
  listId: string;
  members: User[];
  open: boolean;
  onClose: () => void;
}

const priorityConfig = [
  { value: 'low',    label: 'Low',    cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'medium', label: 'Medium', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'high',   label: 'High',   cls: 'text-red-700 bg-red-50 border-red-200' },
];

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

export default function CreateTaskModal({ projectId, listId, members, open, onClose }: Props) {
  const createTask = useCreateTask(projectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [label, setLabel] = useState('');

  const reset = () => {
    setTitle(''); setDescription(''); setPriority('medium');
    setAssignees([]); setDueDate(''); setLabel('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createTask.mutate({
      title, description, project: projectId, listId,
      priority: priority as any, assignees,
      dueDate: dueDate || undefined,
      labels: label ? [label] : [],
    } as any, {
      onSuccess: () => { toast.success('Task created'); reset(); onClose(); },
    });
  };

  const toggleAssignee = (id: string) =>
    setAssignees((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-lg shadow-2xl z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">Create New Task</Dialog.Title>
              <p className="text-xs text-gray-400 mt-0.5">Add a task to this list</p>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Task title <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                placeholder="Add more details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition resize-none"
              />
            </div>

            {/* Priority + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-gray-400" /> Priority
                </label>
                <Select.Root value={priority} onValueChange={setPriority}>
                  <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none hover:border-blue-400 focus:ring-2 focus:ring-blue-500 transition">
                    <Select.Value />
                    <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <Select.Viewport className="p-1.5">
                        {priorityConfig.map((p) => (
                          <Select.Item key={p.value} value={p.value} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-50 outline-none data-[highlighted]:bg-gray-50">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', p.cls)}>{p.label}</span>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Tag size={13} className="text-gray-400" /> Label
              </label>
              <input
                type="text"
                placeholder="e.g. frontend, bug, feature"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
              />
            </div>

            {/* Assignees */}
            {members.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assign to</label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m, i) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => toggleAssignee(m._id)}
                      className={cn(
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition',
                        assignees.includes(m._id)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'text-gray-600 border-gray-200 hover:border-blue-300 bg-white',
                      )}
                    >
                      <span className={cn('w-4 h-4 rounded-full text-[9px] flex items-center justify-center text-white font-bold', avatarColors[i % avatarColors.length])}>
                        {m.name[0].toUpperCase()}
                      </span>
                      {m.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={createTask.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-60"
              >
                {createTask.isPending ? 'Creating...' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => { reset(); onClose(); }}
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
