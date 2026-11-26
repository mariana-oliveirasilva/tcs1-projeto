# InkCircle

Site de avaliações de livros e mangás para a disciplina de Tecnologia de Construção de Software I (TCS1). O mesmo servidor Express entrega as páginas e a API REST. O MySQL guarda contas, sessões, obras e avaliações.

## Rodar no Windows com VS Code

Instale **Node.js 22.9 ou superior** e **MySQL Server 8.4**. O MySQL Workbench pode ser usado para executar o SQL abaixo. Com o serviço MySQL iniciado, conecte-se como administrador e execute, trocando a senha de exemplo por uma senha própria:

```sql
CREATE DATABASE IF NOT EXISTS inkcircle CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'inkcircle'@'127.0.0.1' IDENTIFIED BY 'troque-por-uma-senha';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, REFERENCES ON inkcircle.* TO 'inkcircle'@'127.0.0.1';
```

Abra a pasta que contém o `package.json` no VS Code. No PowerShell:

```powershell
Copy-Item .env.example .env
npm.cmd ci
```

No arquivo `.env`, coloque a senha usada no MySQL em `DB_PASSWORD`. Depois rode:

```powershell
npm.cmd run db:init
npm.cmd start
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). O Express responde pelo site e pela API. Mantenha esse terminal aberto durante o teste. Use **Ctrl+C** para parar.

## Demonstração pelo site

1. Clique em **Cadastrar**, crie a conta e faça login.
2. No perfil, clique em **Nova avaliação**. Avalie um livro ou mangá.
3. Volte a **Meu perfil**. A avaliação estará ali e também no feed da página inicial.
4. Edite a nota no perfil e confira o novo valor no feed.
5. Reinicie o Node com `npm.cmd start`. Abra o mesmo endereço e confira a avaliação.
6. Saia, entre com outra conta e confira que o perfil dela contém apenas as avaliações dela. A publicação da primeira conta permanece visível no feed.
7. Volte à primeira conta e exclua a avaliação pelo perfil. Atualize o feed para conferir a exclusão.

## Etapas 6 e 7

- [Etapa 6 — API REST, endpoints, requisições e respostas](docs/etapa-06.md)
- [Coleção Postman das etapas 6 e 7](docs/postman/InkCircle.postman_collection.json)
- [Etapa 7 — modelo do banco, entidades, relacionamentos e testes](docs/etapa-07.md)
- [Script de criação das tabelas](database/schema.sql)

Use `npm.cmd test` para testar as validações. Em um banco de teste já inicializado, use `npm.cmd run test:mysql` para testar o fluxo HTTP e a persistência real.

Esta versão começa com um banco MySQL vazio. Para consultar dados já cadastrados na versão anterior, mantenha a pasta antiga com o arquivo SQLite. As telas de descoberta de perfis, edição de perfil e publicação de obras autorais pertencem ao protótipo. O fluxo implementado aqui usa o cadastro, a sessão, o feed e o CRUD de avaliações.
