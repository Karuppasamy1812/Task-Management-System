import { ProjectsApi } from '@api/projects.api';
import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

export const listProjectsQueryOptions = () =>
  queryOptions({
    queryKey: [ProjectsApi.list.key],
    queryFn: () => ProjectsApi.list(),
    placeholderData: keepPreviousData,
  });

export const getProjectQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [ProjectsApi.get.key, id],
    queryFn: () => ProjectsApi.get(id),
    enabled: !!id,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description: string }) => ProjectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ProjectsApi.list.key] });
    },
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description: string }) =>
      ProjectsApi.update(id, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: [ProjectsApi.list.key] });
      qc.invalidateQueries({ queryKey: [ProjectsApi.get.key, v.id] });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ProjectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ProjectsApi.list.key] });
    },
  });
};

export const useAddMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role: string }) =>
      ProjectsApi.addMember(projectId, { userId, role }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: [ProjectsApi.get.key, v.projectId] });
    },
  });
};

export const useAddList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, title }: { projectId: string; title: string }) =>
      ProjectsApi.addList(projectId, { title }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: [ProjectsApi.get.key, v.projectId] });
    },
  });
};
