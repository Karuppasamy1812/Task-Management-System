 import { BaseUrl } from '@config';
import axios from 'axios';
import type { Task } from '../lib/types';
import { AutoQueryKey } from '@utils';

@AutoQueryKey()
export class TasksApi {
  static listByProject = async (projectId: string) => {
    const response = await axios.get<Task[]>(`${BaseUrl.API}/tasks/project/${projectId}`);
    return response.data;
  };

  static create = async (data: Partial<Task>) => {
    const response = await axios.post<Task>(`${BaseUrl.API}/tasks`, data);
    return response.data;
  };

  static update = async (taskId: string, data: Partial<Task>) => {
    const response = await axios.put<Task>(`${BaseUrl.API}/tasks/${taskId}`, data);
    return response.data;
  };

  static delete = async (taskId: string) => {
    const response = await axios.delete(`${BaseUrl.API}/tasks/${taskId}`);
    return response.data;
  };

  static addComment = async (taskId: string, data: { text: string }) => {
    const response = await axios.post<Task>(`${BaseUrl.API}/tasks/${taskId}/comments`, data);
    return response.data;
  };
}
