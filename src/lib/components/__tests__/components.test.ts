import { describe, it } from 'vitest';

describe('INFRA-01: DataTable renderiza colunas e linhas', () => {
  it.todo('renderiza cabeçalhos de coluna corretamente');
  it.todo('renderiza linhas de dados passadas via prop');
});

describe('INFRA-02: Pagination controla página atual', () => {
  it.todo('emite evento de mudança de página ao clicar');
  it.todo('desabilita botão anterior na primeira página');
});

describe('INFRA-03: StatusBadge exibe cor correta por status', () => {
  it.todo('status ACTIVE exibe badge verde');
  it.todo('status SUSPENDED exibe badge vermelho');
});

describe('INFRA-04: ConfirmDialog aguarda confirmação do usuário', () => {
  it.todo('abre ao chamar open()');
  it.todo('emite evento confirm ao clicar em confirmar');
});

describe('INFRA-05: Toast notificações aparecem e somem', () => {
  it.todo('toast de sucesso aparece com mensagem correta');
  it.todo('toast desaparece após duração configurada');
});

describe('INFRA-06: error boundary captura erros de renderização', () => {
  it.todo('+error.svelte global renderiza mensagem de erro');
});

describe('INFRA-07: formatação de moeda BRL', () => {
  it.todo('Intl.NumberFormat pt-BR formata 1000 como R$ 1.000,00');
});

describe('INFRA-08: Filters emite valores de filtro corretamente', () => {
  it.todo('mudança de filtro emite evento com valores atuais');
});
