import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';
import { useAuthStore } from '@/store/authStore';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    // Reset store and mocks
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      render(<Login />);

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render MBO logo', () => {
      render(<Login />);

      expect(screen.getByText('MBO')).toBeInTheDocument();
    });

    it('should have empty inputs initially', () => {
      render(<Login />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('Form Interaction', () => {
    it('should update email input value', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password input value', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'secret123');

      expect(passwordInput).toHaveValue('secret123');
    });

    it('should require email to submit', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('should require password to submit', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
    });
  });

  describe('Login Flow', () => {
    it('should show loading state during login', async () => {
      const user = userEvent.setup();

      // Set loading state manually to verify UI reflects it
      useAuthStore.setState({ isLoading: true });
      render(<Login />);

      // Button should show loading state text
      expect(screen.getByRole('button')).toHaveTextContent(/signing in/i);

      // And button should be disabled
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should call login API with credentials', async () => {
      const user = userEvent.setup();
      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for authentication
      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.accessToken).toBe('mock-access-token');
      });
    });

    it('should navigate after successful login', async () => {
      const user = userEvent.setup();
      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('should set user data after successful login', async () => {
      const user = userEvent.setup();
      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.user).not.toBeNull();
        expect(state.user?.email).toBe('test@example.com');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error from store', () => {
      useAuthStore.setState({ error: 'Invalid credentials' });
      render(<Login />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should disable inputs while loading', async () => {
      useAuthStore.setState({ isLoading: true });
      render(<Login />);

      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });

    it('should disable submit button while loading', () => {
      useAuthStore.setState({ isLoading: true });
      render(<Login />);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
