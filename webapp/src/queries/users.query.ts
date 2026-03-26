import { UsersApi } from '@api/users.api';
import { queryOptions, useQuery } from '@tanstack/react-query';

export const listUsersQueryOptions = () =>
  queryOptions({
    queryKey: [UsersApi.list.key],
    queryFn: () => UsersApi.list(),
  });

export const useUsers = () => useQuery(listUsersQueryOptions());
