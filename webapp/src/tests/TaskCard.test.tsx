import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../components/TaskCard';
import type { Task } from '../lib/types';

const baseTask: Task = {
  _id: 'task1',
  title: 'Fix login bug',
  description: 'Users cannot login on mobile',
  project: 'proj1',
  listId: 'list1',
  assignees: [],
  status: 'todo',
  priority: 'high',
  order: 0,
  comments: [],
  history: [],
  labels: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={baseTask} onClick={() => {}} />);
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('renders task description', () => {
    render(<TaskCard task={baseTask} onClick={() => {}} />);
    expect(screen.getByText('Users cannot login on mobile')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<TaskCard task={baseTask} onClick={() => {}} />);
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('renders labels', () => {
    const task = { ...baseTask, labels: ['bug', 'frontend'] };
    render(<TaskCard task={task} onClick={() => {}} />);
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<TaskCard task={baseTask} onClick={onClick} />);
    fireEvent.click(screen.getByText('Fix login bug'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders assignee avatars', () => {
    const task = {
      ...baseTask,
      assignees: [
        { _id: 'u1', name: 'Alice', email: 'a@a.com', role: 'admin' as const },
        { _id: 'u2', name: 'Bob',   email: 'b@b.com', role: 'contributor' as const },
      ],
    };
    render(<TaskCard task={task} onClick={() => {}} />);
    expect(screen.getByTitle('Alice')).toBeInTheDocument();
    expect(screen.getByTitle('Bob')).toBeInTheDocument();
  });

  it('shows comment count when comments exist', () => {
    const task = {
      ...baseTask,
      comments: [
        { _id: 'c1', user: { _id: 'u1', name: 'Alice', email: 'a@a.com', role: 'admin' as const }, text: 'hello', createdAt: new Date().toISOString() },
      ],
    };
    render(<TaskCard task={task} onClick={() => {}} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows due date when provided', () => {
    const task = { ...baseTask, dueDate: '2025-12-31T00:00:00.000Z' };
    render(<TaskCard task={task} onClick={() => {}} />);
    expect(screen.getByText(/dec/i)).toBeInTheDocument();
  });

  it('shows overdue indicator for past due date on non-done task', () => {
    const task = { ...baseTask, dueDate: '2020-01-01T00:00:00.000Z', status: 'todo' as const };
    const { container } = render(<TaskCard task={task} onClick={() => {}} />);
    expect(container.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('does NOT show overdue for done task', () => {
    const task = { ...baseTask, dueDate: '2020-01-01T00:00:00.000Z', status: 'done' as const };
    const { container } = render(<TaskCard task={task} onClick={() => {}} />);
    expect(container.querySelector('.text-red-500')).not.toBeInTheDocument();
  });

  it('shows +N for more than 3 assignees', () => {
    const task = {
      ...baseTask,
      assignees: [
        { _id: 'u1', name: 'Alice', email: 'a@a.com', role: 'admin' as const },
        { _id: 'u2', name: 'Bob',   email: 'b@b.com', role: 'admin' as const },
        { _id: 'u3', name: 'Carol', email: 'c@c.com', role: 'admin' as const },
        { _id: 'u4', name: 'Dave',  email: 'd@d.com', role: 'admin' as const },
      ],
    };
    render(<TaskCard task={task} onClick={() => {}} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
