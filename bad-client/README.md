# Dwarf Fortress Wiki (client)

Front-end em Vite + React + TypeScript que consome a Dwarf Fortress API.

## Rodando

1. Suba a API (na raiz do projeto):

   ```bash
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. Suba o front (nesta pasta):

   ```bash
   npm install
   npm run dev
   ```

3. Abra http://localhost:5173

O Vite repassa tudo que começa com `/api` para `http://localhost:8000` (veja `vite.config.ts`).
A documentação da API fica em http://localhost:8000/docs.

## Sua missão

Este front funciona, mas tem vários problemas de experiência, acessibilidade, performance e bugs.
Encontre o máximo que conseguir, explique por que cada um é um problema e corrija.
