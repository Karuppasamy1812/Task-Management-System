import { AutoQueryKey } from '@utils';
import { BaseUrl } from '@config';
import axios from 'axios';
import type { User } from '../lib/types';

@AutoQueryKey()
export class UsersApi {
  static list = async () => {
    const response = await axios.get<User[]>(`${BaseUrl.API}/users`);
    return response.data;
  };
}
