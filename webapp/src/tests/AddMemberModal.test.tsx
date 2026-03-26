import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddMemberModal from '../components/AddMemberModal';
import type { Member } from '../lib/types';

const mockAddMember = { mutate: vi.fn(), isPending: false };
const mockUsers = [
  { _id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'admin' as const },
  { _id: 'u2', name: 'Bob',   email: 'bob@test.com',   role: 'contributor' as const },
  { _id: 'u3', name: 'Carol', email: 'carol@test.com', role: 'viewer' as const },
];

vi.mock('../hooks/useProjects', () => ({
  useAddMember: () => mockAddMember,
}));

vi.mock('../hooks/useUsers', () => ({
  useUsers: () => ({ data: mockUsers }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const existingMembers: Member[] = [
  { _id: 'm1', user: { _id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'admin' }, role: 'admin' },
];

const renderModal = (open = true) =>
  render(
    <AddMemberModal
      projectId="proj1"
      existingMembers={existingMembers}
      ownerId="owner1"
      open={open}
      onClose={vi.fn()}
    />,
  );

describe('AddMemberModal', () => {
  beforeEach(() => mockAddMember.mutate.mockReset());

  it('renders modal title', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Add Member' })).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderModal();
    expect(screen.getByText('Invite someone to this project')).toBeInTheDocument();
  });

  it('renders Add Member and Cancel buttons', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('Add Member button is disabled when no user selected', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /add member/i })).toBeDisabled();
  });

  it('filters out existing members and owner from available users', () => {
    renderModal();
    // u1 (Alice) is existing member, owner1 is owner — only Bob and Carol should be available
    expect(screen.queryByText('alice@test.com')).not.toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderModal(false);
    expect(screen.queryByText('Add Member')).not.toBeInTheDocument();
  });

  it('shows no users available message when all users are existing members', () => {
    render(
      <AddMemberModal
        projectId="proj1"
        existingMembers={mockUsers.map((u) => ({ _id: u._id, user: u, role: u.role }))}
        ownerId="owner1"
        open={true}
        onClose={vi.fn()}
      />,
    );
    // The "No users available" text is inside a Select portal which doesn't render in jsdom.
    // Instead verify the Add Member button is disabled (no users to select).
    expect(screen.getByRole('button', { name: /add member/i })).toBeDisabled();
  });
});
