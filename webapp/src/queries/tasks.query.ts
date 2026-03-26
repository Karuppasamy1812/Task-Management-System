import { TasksApi } from '@api/tasks.api';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import type { Task } from '../lib/types';

export const listTasksQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: [TasksApi.listByProject.key, projectId],
    queryFn: () => TasksApi.listByProject(projectId),
    enabled: !!projectId,
  });

export const useTasks = (projectId: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();
    socket.emit('join-project', projectId);

    const upsert = (task: Task) =>
      qc.setQueryData<Task[]>([TasksApi.listByProject.key, projectId], (old = []) => {
        const idx = old.findIndex((t) => t._id === task._id);
        return idx >= 0 ? old.map((t) => (t._id === task._id ? task : t)) : [...old, task];
      });

    const remove = (taskId: string) =>
      qc.setQueryData<Task[]>([TasksApi.listByProject.key, projectId], (old = []) =>
        old.filter((t) => t._id !== taskId),
      );

    // task-moved: another user dragged a task to a different list
    const onTaskMoved = ({ taskId, toList }: { taskId: string; fromList: string; toList: string; order: number }) =>
      qc.setQueryData<Task[]>([TasksApi.listByProject.key, projectId], (old = []) =>
        old.map((t) => (t._id === taskId ? { ...t, listId: toList } : t)),
      );

    socket.on('task-created', upsert);
    socket.on('task-updated', upsert);
    socket.on('task-deleted', remove);
    socket.on('task-moved', onTaskMoved);

    return () => {
      socket.emit('leave-project', projectId);
      socket.off('task-created', upsert);
      socket.off('task-updated', upsert);
      socket.off('task-deleted', remove);
      socket.off('task-moved', onTaskMoved);
    };
  }, [projectId, qc]);

  return useQuery(listTasksQueryOptions(projectId));
};

export const useCreateTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => TasksApi.create(data),
    onSuccess: (task: Task) => {
      qc.setQueryData<Task[]>([TasksApi.listByProject.key, projectId], (old = []) => [...old, task]);
      getSocket().emit('task-created', { projectId, task });
    },
  });
};

export const useUpdateTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string } & Partial<Task>) =>
      TasksApi.update(taskId, data),
    onSuccess: (task: Task, variables) => {
      qc.setQueryData<Task[]>([TasksApi.listByProject.key, projectId], (old = []) =>
        old.map((t) => (t._id === task._id ? task : t)),
      );
      // If the update was a list change (drag-drop), emit task-moved so other
      // clients update the column without a full task-updated payload.
      if (variables.listId) {
        const prev = qc.getQueryData<Task[]>([TasksApi.listByProject.key, projectId])
          ?.find((t) => t._id === task._id);
        getSocket().emit('task-moved', {
          projectId,
          taskId: task._id,
          fromList: prev?.listId ?? '',
          toList: variables.listId,
          order: task.order,
        });
      } else {
        getSocket().emit('task-updated', { projectId, task });
      }
    },
  });
};

export const useDeleteTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => TasksApi.delete(taskId),
    onSuccess: (_, taskId) => {
      qc.setQueryData<Task[]>([TasksApi.listByProject.key, projectId], (old = []) =>
        old.filter((t) => t._id !== taskId),
      );
      getSocket().emit('task-deleted', { projectId, taskId });
    },
  });
};

export const useAddComment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
      TasksApi.addComment(taskId, { text }),
    onSuccess: (task: Task) => {
      qc.setQueryData<Task[]>([TasksApi.listByProject.key, projectId], (old = []) =>
        old.map((t) => (t._id === task._id ? task : t)),
      );
      getSocket().emit('task-updated', { projectId, task });
    },
  });
};

// Emit a typing event so other users see a live indicator on the task card.
export const emitTyping = (projectId: string, taskId: string, userName: string) =>
  getSocket().emit('typing', { projectId, taskId, userName });
