import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTaskModal from '../components/CreateTaskModal';
import type { User } from '../lib/types';

const mockCreateTask = { mutate: vi.fn(), isPending: false };

vi.mock('../hooks/useTasks', () => ({
  useCreateTask: () => mockCreateTask,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const members: User[] = [
  { _id: 'u1', name: 'Alice Smith', email: 'a@a.com', role: 'admin' },
  { _id: 'u2', name: 'Bob Jones',   email: 'b@b.com', role: 'contributor' },
];

const renderModal = (open = true, memberList = members) =>
  render(
    <CreateTaskModal
      projectId="proj1"
      listId="list1"
      members={memberList}
      open={open}
      onClose={vi.fn()}
    />,
  );

describe('CreateTaskModal', () => {
  beforeEach(() => mockCreateTask.mutate.mockReset());

  it('renders modal title', () => {
    renderModal();
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });

  it('renders task title input', () => {
    renderModal();
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    renderModal();
    expect(screen.getByPlaceholderText(/add more details/i)).toBeInTheDocument();
  });

  it('renders label input', () => {
    renderModal();
    expect(screen.getByPlaceholderText(/e.g. frontend/i)).toBeInTheDocument();
  });

  it('renders member assignee buttons', () => {
    renderModal();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders Create Task and Cancel buttons', () => {
    renderModal();
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls createTask.mutate with correct data on submit', async () => {
    mockCreateTask.mutate.mockImplementation((_data, opts) => opts?.onSuccess?.());
    renderModal();

    fireEvent.change(screen.getByPlaceholderText('What needs to be done?'), {
      target: { value: 'New feature' },
    });
    fireEvent.change(screen.getByPlaceholderText(/add more details/i), {
      target: { value: 'Feature description' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g. frontend/i), {
      target: { value: 'feature' },
    });

    fireEvent.submit(screen.getByPlaceholderText('What needs to be done?').closest('form')!);

    await waitFor(() => {
      expect(mockCreateTask.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New feature',
          description: 'Feature description',
          project: 'proj1',
          listId: 'list1',
          labels: ['feature'],
        }),
        expect.any(Object),
      );
    });
  });

  it('toggles assignee selection', () => {
    renderModal();
    const aliceBtn = screen.getByText('Alice');
    fireEvent.click(aliceBtn);
    expect(aliceBtn.closest('button')).toHaveClass('bg-blue-600');
    fireEvent.click(aliceBtn);
    expect(aliceBtn.closest('button')).not.toHaveClass('bg-blue-600');
  });

  it('does not render assignees section when no members', () => {
    renderModal(true, []);
    expect(screen.queryByText('Assign to')).not.toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderModal(false);
    expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
  });

  it('requires title field', () => {
    renderModal();
    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    expect(titleInput).toBeRequired();
  });
});
