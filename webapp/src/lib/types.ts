export type User = {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'contributor' | 'viewer';
};

export type Member = {
  _id: string;
  user: User;
  role: 'admin' | 'contributor' | 'viewer';
};

export type List = {
  _id: string;
  title: string;
  order: number;
};

export type Project = {
  _id: string;
  name: string;
  description: string;
  owner: User;
  members: Member[];
  lists: List[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
};

export type HistoryEntry = {
  _id: string;
  user: User;
  action: string;
  from?: string;
  to?: string;
  createdAt: string;
};

export type Task = {
  _id: string;
  title: string;
  description: string;
  project: string;
  listId: string;
  assignees: User[];
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  order: number;
  comments: Comment[];
  history: HistoryEntry[];
  labels: string[];
  createdAt: string;
  updatedAt: string;
};
