import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '~/types/user.types';
import AdminUsuarios from './admin.usuarios';

const { getAllUsersForAdmin, updateUserById } = vi.hoisted(() => ({
  getAllUsersForAdmin: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock('~/services/user.service', () => ({ userService: { getAllUsersForAdmin, updateUserById } }));
vi.mock('~/hooks/useAuth', () => ({ useAuth: () => ({ token: 'test-token', user: null }) }));
vi.mock('~/components/Inicio/Navbar', () => ({ default: () => null }));

const user = (number: number): User => ({
  user_id: String(number),
  username: `usuario${number}`,
  name: `Nombre ${number}`,
  surname: 'Apellido',
  email: `usuario${number}@example.test`,
  profile_picture: null,
  bio: null,
  email_verified: false,
  is_moderator: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
  active_video_call: false,
});

describe('administración de usuarios paginada', () => {
  beforeEach(() => {
    getAllUsersForAdmin.mockReset().mockImplementation(async (_token: string, cursor?: string) => ({
      success: true,
      status: 200,
      message: 'OK',
      data: cursor
        ? { users: [user(100), user(101)], hasNextPage: false, nextCursor: null }
        : { users: Array.from({ length: 100 }, (_, index) => user(index + 1)), hasNextPage: true, nextCursor: 'cursor-100' },
    }));
    updateUserById.mockReset().mockResolvedValue({
      success: true,
      status: 200,
      message: 'OK',
      data: { ...user(101), name: 'Nombre editado' },
    });
  });

  it('permite buscar y editar la cuenta 101 sin perder la segunda página ni duplicar cuentas', async () => {
    render(<MemoryRouter><AdminUsuarios /></MemoryRouter>);

    fireEvent.click(await screen.findByRole('button', { name: 'Cargar más usuarios' }));
    await waitFor(() => expect(getAllUsersForAdmin).toHaveBeenCalledWith('test-token', 'cursor-100'));
    await waitFor(() => expect(screen.getAllByTitle('Editar usuario')).toHaveLength(101));

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre, usuario o email...'), {
      target: { value: 'usuario101' },
    });
    expect(screen.getAllByTitle('Editar usuario')).toHaveLength(1);
    fireEvent.click(screen.getByTitle('Editar usuario'));
    const dialog = screen.getByRole('dialog', { name: 'Editar Usuario' });
    fireEvent.change(within(dialog).getByLabelText('Nombre'), { target: { value: 'Nombre editado' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar Cambios' }));

    await waitFor(() => expect(updateUserById).toHaveBeenCalledWith('101', { name: 'Nombre editado' }, 'test-token'));
    await waitFor(() => expect(screen.getByText('Nombre editado Apellido')).toBeTruthy());
    expect(screen.getAllByTitle('Editar usuario')).toHaveLength(1);
    expect(getAllUsersForAdmin).toHaveBeenCalledTimes(2);
  });

  it('conserva la primera página y permite reintentar si falla la segunda', async () => {
    const loadPage = getAllUsersForAdmin.getMockImplementation();
    getAllUsersForAdmin.mockImplementationOnce(loadPage!)
      .mockRejectedValueOnce(new Error('Error de conexión'));

    render(<MemoryRouter><AdminUsuarios /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Cargar más usuarios' }));

    expect(await screen.findByText('Error de conexión')).toBeTruthy();
    expect(screen.getAllByTitle('Editar usuario')).toHaveLength(100);
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más usuarios' }));

    await waitFor(() => expect(screen.getAllByTitle('Editar usuario')).toHaveLength(101));
    expect(getAllUsersForAdmin).toHaveBeenNthCalledWith(3, 'test-token', 'cursor-100');
  });
});
