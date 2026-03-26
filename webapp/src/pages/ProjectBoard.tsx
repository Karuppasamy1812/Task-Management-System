import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ArrowLeft, Plus, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProject, useAddList } from '../hooks/useProjects';
import { useTasks, useUpdateTask } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';
import AddMemberModal from '../components/AddMemberModal';
import type { Task, User } from '../lib/types';
import { cn } from '../lib/cn';

function DroppableList({ listId, children }: { listId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: listId });
  return (
    <div ref={setNodeRef} className={cn('min-h-[60px] space-y-2 transition-colors rounded-lg p-1', isOver && 'bg-blue-50')}>
      {children}
    </div>
  );
}

function DraggableTask({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task._id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn('transition-opacity', isDragging && 'opacity-40')}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}

export default function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: pLoading } = useProject(id!);
  const { data: tasks, isLoading: tLoading } = useTasks(id!);
  const { data: allUsers } = useUsers();
  const { user } = useAuth();
  const updateTask = useUpdateTask(id!);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createForList, setCreateForList] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [showNewList, setShowNewList] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const addList = useAddList();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const isAdmin = useMemo(() => {
    if (!project || !user) return false;
    return project.owner._id === user._id || project.members.some((m) => m.user._id === user._id && m.role === 'admin');
  }, [project, user]);

  const isContributor = useMemo(() => {
    if (isAdmin) return true;
    if (!project || !user) return false;
    return project.members.some((m) => m.user._id === user._id && m.role === 'contributor');
  }, [project, user, isAdmin]);

  const memberUsers: User[] = useMemo(() => {
    if (!project) return [];
    return [project.owner, ...project.members.map((m) => m.user)];
  }, [project]);

  const tasksByList = useMemo(() => {
    const map: Record<string, Task[]> = {};
    project?.lists.forEach((l) => { map[l._id] = []; });
    tasks?.forEach((t) => { if (map[t.listId]) map[t.listId].push(t); });
    return map;
  }, [project, tasks]);

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks?.find((t) => t._id === e.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const task = tasks?.find((t) => t._id === active.id);
    if (task && task.listId !== over.id) {
      updateTask.mutate({ taskId: task._id, listId: over.id as string } as any, {
        onSuccess: () => toast.success('Task moved'),
      });
    }
  };

  if (pLoading || tLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );
  if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

const capitalize = (str) => {
   return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
};

  return (
    <Tooltip.Provider>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <ArrowLeft size={17} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{capitalize(project.name)}</h1>
              {project.description && <p className="text-sm text-gray-400 mt-0.5">{project.description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {memberUsers.slice(0, 5).map((m, i) => (
                <Tooltip.Root key={m._id}>
                  <Tooltip.Trigger asChild>
                    <div className={`w-8 h-8 rounded-full text-white text-xs flex items-center justify-center border-2 border-white font-bold cursor-default ${
                      ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500'][i % 5]
                    }`}>
                      {m.name[0].toUpperCase()}
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg" sideOffset={5}>
                      {capitalize(m.name)}
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
              {memberUsers.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center border-2 border-white font-semibold">
                  +{memberUsers.length - 5}
                </div>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition font-medium text-gray-700 shadow-sm"
              >
                <UserPlus size={14} className="text-blue-600" /> Add Member
              </button>
            )}
          </div>
        </div>

        {/* Board */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6">
            {project.lists.sort((a, b) => a.order - b.order).map((list) => (
              <div key={list._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 min-w-[300px] w-[300px] flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-gray-800">{list.title}</h3>
                  <span className="text-xs bg-white text-gray-500 px-2.5 py-1 rounded-full border border-gray-200 font-medium">
                    {tasksByList[list._id]?.length ?? 0}
                  </span>
                </div>

                <DroppableList listId={list._id}>
                  {tasksByList[list._id]?.sort((a, b) => a.order - b.order).map((task) => (
                    <DraggableTask key={task._id} task={task} onClick={() => setSelectedTask(task)} />
                  ))}
                </DroppableList>

                {isContributor && (
                  <button
                    onClick={() => setCreateForList(list._id)}
                    className="w-full mt-3 flex items-center gap-1.5 justify-center text-sm text-gray-400 hover:text-blue-600 hover:bg-white border border-dashed border-gray-200 hover:border-blue-300 rounded-xl py-2.5 transition"
                  >
                    <Plus size={14} /> Add task
                  </button>
                )}
              </div>
            ))}

            {isAdmin && (
              <div className="min-w-[300px] w-[300px] flex-shrink-0">
                {showNewList ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                    <input
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="List name..."
                      autoFocus
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newListTitle.trim()) {
                          addList.mutate({ projectId: id!, title: newListTitle });
                          setNewListTitle(''); setShowNewList(false);
                        }
                        if (e.key === 'Escape') setShowNewList(false);
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (newListTitle.trim()) { addList.mutate({ projectId: id!, title: newListTitle }); setNewListTitle(''); setShowNewList(false); }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                      >
                        Add List
                      </button>
                      <button onClick={() => setShowNewList(false)} className="text-gray-500 text-sm px-4 py-2 rounded-xl hover:bg-gray-200 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewList(true)}
                    className="w-full flex items-center gap-2 border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-2xl p-4 text-sm text-gray-400 hover:text-blue-600 transition"
                  >
                    <Plus size={16} /> Add list
                  </button>
                )}
              </div>
            )}
          </div>

          <DragOverlay>
            {activeTask && <div className="rotate-2 opacity-90"><TaskCard task={activeTask} onClick={() => {}} /></div>}
          </DragOverlay>
        </DndContext>

        {/* Modals */}
        {selectedTask && (
          <TaskModal task={selectedTask} projectId={id!} open={!!selectedTask} onClose={() => setSelectedTask(null)} users={allUsers ?? []} />
        )}
        <CreateTaskModal projectId={id!} listId={createForList ?? ''} members={memberUsers}
          open={!!createForList} onClose={() => setCreateForList(null)} />
        <AddMemberModal projectId={id!} existingMembers={project.members} ownerId={project.owner._id}
          open={showAddMember} onClose={() => setShowAddMember(false)} />
      </div>
    </Tooltip.Provider>
  );
}
