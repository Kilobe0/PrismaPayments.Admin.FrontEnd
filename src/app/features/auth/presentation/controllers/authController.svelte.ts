import { AuthService } from '../../services/AuthService';
import { AuthRepository } from '../../data/repositories/AuthRepository';
import { goto } from '$app/navigation';

interface AuthState {
  loading: boolean;
  error: string | null;
  email: string;
  password: string;
}

function createAuthController() {
  let state = $state<AuthState>({
    loading: false,
    error: null,
    email: '',
    password: ''
  });

  const service = new AuthService(new AuthRepository());

  async function login(): Promise<void> {
    state.loading = true;
    state.error = null;

    const result = await service.login(state.email, state.password);

    if (!result.ok) {
      state.error = result.failure.message;
      state.loading = false;
      return;
    }

    await goto('/dashboard');
  }

  return {
    get state() { return state; },
    login,
    setEmail(v: string) { state.email = v; },
    setPassword(v: string) { state.password = v; }
  };
}

export { createAuthController };
