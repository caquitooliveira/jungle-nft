# Arquitetura

## Organização

| Pasta | Responsabilidade |
| --- | --- |
| src/pages | Telas associadas às rotas |
| src/components | Componentes da interface |
| src/components/ui | Componentes básicos reutilizáveis |
| src/lib | Autenticação, carrinho, filtros e utilitários |
| src/services | Chamadas HTTP aos endpoints da aplicação |
| src/types | Tipos e contratos em TypeScript |
| src/mocks | APIs simuladas, dados e eventos em tempo real |
| public | Imagens e worker do MSW |
| scripts | Script de otimização das imagens |
| tests/e2e | Testes de navegação e fluxos com Playwright |
| reports | Relatórios de medição |

## Rotas

O TanStack Router define as rotas em `src/router.tsx`.
A página inicial é importada diretamente.
As demais páginas usam carregamento sob demanda.

Os filtros do catálogo ficam na URL, permitindo recarregar
ou compartilhar a busca.

## Dados

Os serviços usam Axios para acessar as APIs.
O TanStack Query controla cache, carregamento, erro e atualização.

O MSW intercepta as requisições e simula o servidor.
Os dados persistidos pertencem ao navegador utilizado.

## Autenticação

O contexto de autenticação disponibiliza a sessão e as ações
de entrada, cadastro e saída.

O mock verifica senhas com PBKDF2 e mantém sessões com expiração.
Esse mecanismo serve à demonstração e não substitui um backend seguro.

## Carrinho

Um store externo fornece os itens ao React.
Carrinhos de visitante e de contas são separados.
Ao entrar, os itens do visitante são mesclados com os da conta.

## Compra

O checkout consulta o resumo calculado pelo mock.
Antes de criar o pedido, verifica novamente os valores.

Uma chave de idempotência identifica a tentativa de compra.
O pedido guarda uma cópia do resumo aceito.

A confirmação consulta o status por polling.
A finalização verifica o estoque e registra o processamento
para impedir uma segunda baixa ao recarregar o recibo.

## Tempo real

O cliente Socket.IO recebe notificações de alterações nos NFTs.
O mock implementa o handshake e as mensagens necessárias
para essa demonstração.

Eventos com versões antigas ou repetidas são ignorados.
Eventos novos invalidam as consultas afetadas.
A reconexão também provoca nova consulta dos dados.

## Verificação

Playwright testa fluxos em desktop, tablet e mobile.
Lighthouse mede desempenho, acessibilidade, boas práticas e SEO.

## Evolução para produção

Uma versão real precisaria substituir os mocks por um backend,
com autenticação, autorização e transações de estoque no servidor,
além de integração efetiva com carteiras e blockchain.