import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown, Send, Trash2, Save, Clock, MessageSquare, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { toast } from 'sonner';
import type { Task, User } from '../lib/types';
import { useUpdateTask, useAddComment, useDeleteTask } from '../hooks/useTasks';
import { emitTyping } from '../queries/tasks.query';
import { getSocket } from '../lib/socket';
import { cn } from '../lib/cn';

interface Props {
  task: Task;
  projectId: string;
  open: boolean;
  onClose: () => void;
  users: User[];
}

const priorityConfig = {
  low:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  high:   { cls: 'bg-red-50 text-red-700 border-red-200' },
};

const statusConfig = {
  'todo':        { cls: 'bg-gray-100 text-gray-600',       label: 'To Do' },
  'in-progress': { cls: 'bg-blue-50 text-blue-700',        label: 'In Progress' },
  'review':      { cls: 'bg-violet-50 text-violet-700',    label: 'In Review' },
  'done':        { cls: 'bg-emerald-50 text-emerald-700',  label: 'Done' },
};

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

export default function TaskModal({ task, projectId, open, onClose, users: _users }: Props) {
  const updateTask = useUpdateTask(projectId);
  const addComment = useAddComment(projectId);
  const deleteTask = useDeleteTask(projectId);
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for other users typing in this task's comment box
  useEffect(() => {
    if (!open) return;
    const socket = getSocket();
    const onTyping = ({ taskId, userName }: { taskId: string; userName: string }) => {
      if (taskId !== task._id) return;
      setTypingUsers((prev) => prev.includes(userName) ? prev : [...prev, userName]);
      setTimeout(() => setTypingUsers((prev) => prev.filter((u) => u !== userName)), 3000);
    };
    socket.on('typing', onTyping);
    return () => { socket.off('typing', onTyping); };
  }, [open, task._id]);

  const handleSave = () => {
    updateTask.mutate({ taskId: task._id, title, description, priority, status } as any, {
      onSuccess: () => toast.success('Task updated'),
    });
  };

  const handleComment = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment.mutate({ taskId: task._id, text: comment }, {
      onSuccess: () => { setComment(''); toast.success('Comment added'); },
    });
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>, userName: string) => {
    setComment(e.target.value);
    if (!e.target.value.trim()) return;
    emitTyping(projectId, task._id, userName);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { typingTimeout.current = null; }, 2000);
  };

  const handleDelete = () => {
    deleteTask.mutate(task._id, {
      onSuccess: () => { toast.success('Task deleted'); onClose(); },
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl z-50 animate-in fade-in zoom-in-95">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border', priorityConfig[task.priority].cls)}>
                {task.priority}
              </div>
              <div className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold', statusConfig[task.status].cls)}>
                {statusConfig[task.status].label}
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition flex-shrink-0 ml-3">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Tabs */}
          <Tabs.Root defaultValue="details" className="flex flex-col flex-1 min-h-0">
            <Tabs.List className="flex border-b border-gray-100 px-6 flex-shrink-0">
              {[
                { value: 'details',  label: 'Details',                          icon: CheckCircle2 },
                { value: 'comments', label: `Comments (${task.comments.length})`, icon: MessageSquare },
                { value: 'history',  label: `History (${task.history.length})`,   icon: Activity },
              ].map((t) => (
                <Tabs.Trigger
                  key={t.value}
                  value={t.value}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium outline-none transition"
                >
                  <t.icon size={14} />
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Details Tab */}
            <Tabs.Content value="details" forceMount className="flex-1 overflow-y-auto p-6 space-y-5 data-[state=inactive]:hidden">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Add a description..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-gray-400" /> Status
                  </label>
                  <Select.Root value={status} onValueChange={(v) => setStatus(v as Task['status'])}>
                    <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none hover:border-blue-400 transition">
                      <Select.Value />
                      <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        <Select.Viewport className="p-1.5">
                          {Object.entries(statusConfig).map(([val, cfg]) => (
                            <Select.Item key={val} value={val} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 outline-none data-[highlighted]:bg-gray-50">
                              <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', cfg.cls)}>
                                <Select.ItemText>{cfg.label}</Select.ItemText>
                              </span>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-gray-400" /> Priority
                  </label>
                  <Select.Root value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
                    <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none hover:border-blue-400 transition">
                      <Select.Value />
                      <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        <Select.Viewport className="p-1.5">
                          {Object.entries(priorityConfig).map(([val, cfg]) => (
                            <Select.Item key={val} value={val} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 outline-none data-[highlighted]:bg-gray-50">
                              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', cfg.cls)}>
                                <Select.ItemText>{val}</Select.ItemText>
                              </span>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assignees</label>
                {task.assignees.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">No assignees</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {task.assignees.map((a, i) => (
                      <div key={a._id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full pl-1 pr-3 py-1">
                        <div className={`w-5 h-5 rounded-full ${avatarColors[i % avatarColors.length]} text-white text-[9px] flex items-center justify-center font-bold`}>
                          {a.name[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{a.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Labels */}
              {task.labels.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Labels</label>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((l, i) => (
                      <span key={i} className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-full font-medium">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={updateTask.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-60"
                >
                  <Save size={14} />
                  {updateTask.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteTask.isPending}
                  className="flex items-center gap-2 text-red-500 border border-red-200 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </Tabs.Content>

            {/* Comments Tab */}
            <Tabs.Content value="comments" forceMount className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 data-[state=inactive]:hidden">
              {typingUsers.length > 0 && (
                <p className="text-xs text-blue-500 animate-pulse">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </p>
              )}
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => handleCommentChange(e, _users[0]?.name ?? 'Someone')}
                  placeholder="Write a comment..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>

              <div className="space-y-3">
                {task.comments.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  [...task.comments].reverse().map((c) => (
                    <div key={c._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {c.user.name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{c.user.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </Tabs.Content>

            {/* History Tab */}
            <Tabs.Content value="history" forceMount className="flex-1 overflow-y-auto p-6 data-[state=inactive]:hidden">
              {task.history.length === 0 ? (
                <div className="text-center py-10">
                  <Activity size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...task.history].reverse().map((h, i) => (
                    <div key={h._id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        {h.user?.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{h.user?.name}</span>
                          {' '}<span className="text-gray-500">{h.action}</span>
                          {h.from && h.to && (
                            <span className="inline-flex items-center gap-1 ml-1">
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{h.from}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{h.to}</span>
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(h.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
