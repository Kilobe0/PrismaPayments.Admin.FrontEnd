import { describe, it } from 'vitest';

describe('RBAC-01: role disponível globalmente após login', () => {
  it.todo('adminRole do JWT está acessível no layout data após SSR');
  it.todo('adminRole persiste entre navegações de página');
});

describe('RBAC-02: menus condicionais por role', () => {
  it.todo('VIEWER não vê itens de menu restritos a ADMIN+');
  it.todo('SUPER_ADMIN vê todos os itens de menu');
});

describe('RBAC-03: rotas protegidas por role redirecionam', () => {
  it.todo('acesso a rota ADMIN+ com role VIEWER redireciona para /dashboard');
  it.todo('acesso a rota SUPER_ADMIN com role ADMIN redireciona');
});

describe('RBAC-04: hasPermission retorna valor correto', () => {
  it.todo('SUPER_ADMIN tem permissão para qualquer role requerida');
  it.todo('VIEWER não tem permissão para ADMIN');
});
