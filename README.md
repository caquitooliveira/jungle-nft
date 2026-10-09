# Kurio — Marketplace de NFTs

Aplicação desenvolvida para o desafio técnico de Frontend da Jungle Gaming.

Permite explorar NFTs, filtrar o catálogo, gerenciar favoritos e carteiras, autenticar usuários e realizar compras simuladas.

## Tecnologias

- React e TypeScript
- Vite
- TanStack Router e TanStack Query
- Axios
- Tailwind CSS e componentes shadcn/ui
- Socket.IO
- Mock Service Worker (MSW)
- Playwright

## Executar localmente

Com uma versão do Node.js compatível com o Vite 8 instalada:

```bash
npm ci
```

Copie `.env.example` para `.env`. No PowerShell:

```powershell
Copy-Item .env.example .env
```

O arquivo deve conter:

```env
VITE_ENABLE_MOCKS=true
```

Inicie a aplicação:

```bash
npm run dev
```

Abra o endereço informado pelo terminal.

## Contas de demonstração

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Caio | caio@kurio.test | Kurio123! |
| Ana | ana@kurio.test | Kurio123! |

Também é possível cadastrar uma nova conta.

## Funcionalidades

- Catálogo com busca, filtros, ordenação e paginação na URL.
- Detalhes dos NFTs com seleção de edição e quantidade.
- Carrinho persistente, separado por conta.
- Mesclagem do carrinho de visitante ao entrar.
- Cadastro, login, recuperação da sessão e logout.
- Perfil, carteiras salvas e favoritos.
- Resumo da compra com validação de preço e estoque.
- Cupom de demonstração: `KURIO10`.
- Recuperação de tentativas de compra por chave de idempotência.
- Confirmação do pedido e baixa de estoque sem repetição.
- Atualizações de preço e estoque via Socket.IO.
- Imagens WebP e carregamento das páginas sob demanda.

## Validação

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes abrangem catálogo, filtros, atualizações em tempo real,
autenticação e compra, nos tamanhos desktop, tablet e mobile.

Última execução: 24 testes aprovados.

Para abrir o relatório:

```bash
npx playwright show-report
```

## Build e preview

```bash
npm run build
npm run preview
```

## Lighthouse

Última medição local da página inicial em modo mobile:

| Categoria | Nota |
| --- | --- |
| Performance | 80 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

Resultado de uma execução, sujeito a variações da máquina e do ambiente.
A meta de desempenho 90 ainda não foi atingida nesta medição.

## Publicação na Vercel

- Framework: Vite.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Variável de ambiente: `VITE_ENABLE_MOCKS=true`.
- O arquivo `vercel.json` configura o acesso direto às rotas.

## Limitações da demonstração

As APIs são simuladas pelo MSW e os dados ficam no navegador.
Não existe servidor de autenticação ou pagamento real.

As compras não enviam transações à blockchain.
As opções de carteira representam dados do checkout, sem conexão
real com extensões de carteira.

Login social, recuperação de senha e consulta no Etherscan
estão indisponíveis nesta demonstração.

## Uso de IA

Utilizei IA como apoio na implementação, investigação de erros,
configuração dos mocks Socket.IO, testes e otimização.
As alterações foram revisadas e verificadas durante o desenvolvimento.

## Arquitetura

Consulte `ARCHITECTURE.md`.