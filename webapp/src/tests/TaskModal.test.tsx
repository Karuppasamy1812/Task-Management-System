import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskModal from '../components/TaskModal';
import type { Task } from '../lib/types';

const mockUpdateTask = { mutate: vi.fn(), isPending: false };
const mockAddComment = { mutate: vi.fn(), isPending: false };
const mockDeleteTask = { mutate: vi.fn(), isPending: false };

vi.mock('../hooks/useTasks', () => ({
  useUpdateTask: () => mockUpdateTask,
  useAddComment: () => mockAddComment,
  useDeleteTask: () => mockDeleteTask,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const baseTask: Task = {
  _id: 'task1',
  title: 'Fix login bug',
  description: 'Users cannot login',
  project: 'proj1',
  listId: 'list1',
  assignees: [{ _id: 'u1', name: 'Alice', email: 'a@a.com', role: 'admin' }],
  status: 'todo',
  priority: 'high',
  order: 0,
  comments: [
    { _id: 'c1', user: { _id: 'u1', name: 'Alice', email: 'a@a.com', role: 'admin' }, text: 'First comment', createdAt: new Date().toISOString() },
  ],
  history: [
    { _id: 'h1', user: { _id: 'u1', name: 'Alice', email: 'a@a.com', role: 'admin' }, action: 'created task', createdAt: new Date().toISOString() },
  ],
  labels: ['bug'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const renderModal = (task = baseTask, open = true) =>
  render(<TaskModal task={task} projectId="proj1" open={open} onClose={vi.fn()} users={[]} />);

describe('TaskModal', () => {
  beforeEach(() => {
    mockUpdateTask.mutate.mockReset();
    mockAddComment.mutate.mockReset();
    mockDeleteTask.mutate.mockReset();
  });

  it('renders priority badge in header', () => {
    renderModal();
    expect(screen.getAllByText('high').length).toBeGreaterThanOrEqual(1);
  });

  it('renders status badge in header', () => {
    renderModal();
    expect(screen.getAllByText('To Do').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Details tab by default', () => {
    renderModal();
    expect(screen.getByDisplayValue('Fix login bug')).toBeInTheDocument();
  });

  it('renders Comments tab with count', () => {
    renderModal();
    expect(screen.getByText('Comments (1)')).toBeInTheDocument();
  });

  it('renders History tab with count', () => {
    renderModal();
    expect(screen.getByText('History (1)')).toBeInTheDocument();
  });

  it('shows assignee name in details', () => {
    renderModal();
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
  });

  it('shows label in details', () => {
    renderModal();
    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  it('calls updateTask.mutate on Save Changes click', () => {
    renderModal();
    fireEvent.click(screen.getByText('Save Changes'));
    expect(mockUpdateTask.mutate).toHaveBeenCalledTimes(1);
  });

  it('calls deleteTask.mutate on Delete click', () => {
    renderModal();
    fireEvent.click(screen.getByText('Delete'));
    expect(mockDeleteTask.mutate).toHaveBeenCalledTimes(1);
  });

  it('shows comment text in Comments tab', () => {
    renderModal();
    expect(screen.getByText('First comment')).toBeInTheDocument();
  });

  it('shows history action in History tab', () => {
    renderModal();
    expect(screen.getByText('created task')).toBeInTheDocument();
  });

  it('calls addComment.mutate when comment submitted', () => {
    renderModal();
    const input = screen.getByPlaceholderText('Write a comment...');
    fireEvent.change(input, { target: { value: 'New comment' } });
    fireEvent.submit(input.closest('form')!);
    expect(mockAddComment.mutate).toHaveBeenCalledWith(
      { taskId: 'task1', text: 'New comment' },
      expect.any(Object),
    );
  });

  it('does not submit empty comment', () => {
    renderModal();
    const input = screen.getByPlaceholderText('Write a comment...');
    fireEvent.submit(input.closest('form')!);
    expect(mockAddComment.mutate).not.toHaveBeenCalled();
  });

  it('shows empty state when no comments', () => {
    renderModal({ ...baseTask, comments: [] });
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('shows empty state when no history', () => {
    renderModal({ ...baseTask, history: [] });
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderModal(baseTask, false);
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });
});
