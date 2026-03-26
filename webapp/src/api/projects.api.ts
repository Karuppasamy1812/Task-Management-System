import { AutoQueryKey } from '@utils';
import { BaseUrl } from '@config';
import axios from 'axios';
import type { Project } from '../lib/types';

@AutoQueryKey()
export class ProjectsApi {
  static list = async () => {
    const response = await axios.get<Project[]>(`${BaseUrl.API}/projects`);
    return response.data;
  };

  static get = async (id: string) => {
    const response = await axios.get<Project>(`${BaseUrl.API}/projects/${id}`);
    return response.data;
  };

  static create = async (data: { name: string; description: string }) => {
    const response = await axios.post<Project>(`${BaseUrl.API}/projects`, data);
    return response.data;
  };

  static update = async (id: string, data: { name: string; description: string }) => {
    const response = await axios.put<Project>(`${BaseUrl.API}/projects/${id}`, data);
    return response.data;
  };

  static delete = async (id: string) => {
    const response = await axios.delete(`${BaseUrl.API}/projects/${id}`);
    return response.data;
  };

  static addMember = async (projectId: string, data: { userId: string; role: string }) => {
    const response = await axios.post<Project>(`${BaseUrl.API}/projects/${projectId}/members`, data);
    return response.data;
  };

  static addList = async (projectId: string, data: { title: string }) => {
    const response = await axios.post<Project>(`${BaseUrl.API}/projects/${projectId}/lists`, data);
    return response.data;
  };
}
