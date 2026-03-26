import { AuthApi, type LoginPayload, type RegisterPayload } from '@api/auth.api';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from '../lib/socket';

export const meQueryOptions = () =>
  queryOptions({
    queryKey: [AuthApi.me.key],
    queryFn: () => AuthApi.me(),
    staleTime: Infinity,
    retry: false,
  });

export const useMe = (enabled: boolean) =>
  useQuery({
    ...meQueryOptions(),
    enabled,
    select: (data) => {
      const s = getSocket();
      if (!s.connected) s.connect();
      return data;
    },
  });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginPayload) => AuthApi.login(data),
    onSuccess: (data) => {
      qc.setQueryData([AuthApi.me.key], data.user);
      const s = getSocket();
      s.auth = { token: data.token };
      s.connect();
    },
  });
};

export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterPayload) => AuthApi.register(data),
    onSuccess: (data) => {
      qc.setQueryData([AuthApi.me.key], data.user);
      const s = getSocket();
      s.auth = { token: data.token };
      s.connect();
    },
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => AuthApi.logout(),
    onSettled: () => {
      qc.clear();
      disconnectSocket();
    },
  });
};
