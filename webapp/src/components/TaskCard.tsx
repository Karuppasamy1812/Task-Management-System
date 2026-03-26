import { MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Task } from '../lib/types';
import { getSocket } from '../lib/socket';
import { cn } from '../lib/cn';

interface Props {
  task: Task;
  onClick: () => void;
}

const priorityConfig = {
  low:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  medium: { cls: 'bg-amber-50 text-amber-700 border-amber-100',       dot: 'bg-amber-500' },
  high:   { cls: 'bg-red-50 text-red-700 border-red-100',             dot: 'bg-red-500' },
};

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];

export default function TaskCard({ task, onClick }: Props) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const cfg = priorityConfig[task.priority];
  const [isTyping, setIsTyping] = useState(false);

  // Show a live dot when any other user is typing a comment on this task
  useEffect(() => {
    const socket = getSocket();
    let timer: ReturnType<typeof setTimeout>;
    const onTyping = ({ taskId }: { taskId: string }) => {
      if (taskId !== task._id) return;
      setIsTyping(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsTyping(false), 3000);
    };
    socket.on('typing', onTyping);
    return () => { socket.off('typing', onTyping); clearTimeout(timer); };
  }, [task._id]);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-xl p-3.5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
    >
      {/* Typing indicator */}
      {isTyping && (
        <div className="flex items-center gap-1 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="text-[10px] text-blue-400 ml-0.5">typing...</span>
        </div>
      )}

      {/* Priority + Labels */}
      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
        <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border', cfg.cls)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {task.priority}
        </span>
        {task.labels.slice(0, 2).map((l, i) => (
          <span key={i} className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full font-medium">
            {l}
          </span>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 leading-snug transition">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        {/* Assignees */}
        <div className="flex -space-x-1.5">
          {task.assignees.length === 0 ? (
            <span className="text-[10px] text-gray-300">Unassigned</span>
          ) : (
            <>
              {task.assignees.slice(0, 3).map((a, i) => (
                <div
                  key={a._id}
                  title={a.name}
                  className={`w-5 h-5 rounded-full ${avatarColors[i % avatarColors.length]} text-white text-[9px] flex items-center justify-center border-2 border-white font-bold`}
                >
                  {a.name[0].toUpperCase()}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[9px] flex items-center justify-center border-2 border-white">
                  +{task.assignees.length - 3}
                </div>
              )}
            </>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2.5">
          {task.comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
              <MessageSquare size={10} /> {task.comments.length}
            </span>
          )}
          {task.dueDate && (
            <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', isOverdue ? 'text-red-500' : 'text-gray-400')}>
              {isOverdue ? <AlertCircle size={10} /> : <Calendar size={10} />}
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
