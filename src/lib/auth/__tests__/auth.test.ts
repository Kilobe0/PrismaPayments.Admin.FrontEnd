import { describe, it, expect } from 'vitest';

describe('AUTH-01: login com email/senha', () => {
  it.todo('form action POST para /api/v1/auth/admin/login retorna tokens');
  it.todo('form action escreve cookie HttpOnly access_token após login');
});

describe('AUTH-02: tokens persistidos (cookie HttpOnly + sessionStorage)', () => {
  it.todo('cookie access_token é HttpOnly e não acessível por JS');
  it.todo('sessionStorage contém prisma_admin_access_token após login');
});

describe('AUTH-03: refresh transparente com fila de concorrência', () => {
  it.todo('401 dispara refresh e re-executa requisição original');
  it.todo('múltiplos 401 concorrentes disparam apenas um refresh');
});

describe('AUTH-04: rotas admin redirecionam sem cookie', () => {
  it.todo('hook redireciona para /login quando cookie ausente');
  it.todo('hook permite acesso quando cookie presente');
});

describe('AUTH-05: role extraído do JWT e disponível globalmente', () => {
  it.todo('decodeJwtPayload extrai campo role do payload');
  it.todo('getAdminRole retorna null quando sem token');
});

describe('AUTH-06: logout limpa tokens e redireciona', () => {
  it.todo('logout remove cookie access_token');
  it.todo('logout remove sessionStorage entries');
});
