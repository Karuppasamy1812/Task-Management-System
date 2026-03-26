export {
  listProjectsQueryOptions,
  getProjectQueryOptions,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useAddMember,
  useAddList,
} from '@queries/projects.query';

import { useQuery } from '@tanstack/react-query';
import { listProjectsQueryOptions, getProjectQueryOptions } from '@queries/projects.query';

export const useProjects = () => useQuery(listProjectsQueryOptions());
export const useProject = (id: string) => useQuery(getProjectQueryOptions(id));
