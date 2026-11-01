# Problemas inseridos propositalmente

Gabarito da dinâmica. **Não entregue este arquivo aos alunos.**

São 17 problemas. O app funciona "quase" bem de propósito: tudo carrega, mas a experiência é ruim.

| # | Problema | Onde | Categoria |
|---|---|---|---|
| 1 | Sem estado de loading | todas as páginas | UX |
| 2 | `<a href>` em vez de `<Link>` (página pisca) | todas as páginas | SPA |
| 3 | Sem paginação | Criaturas, Animais, Minérios | Dados |
| 4 | Página "ao vivo" sem stream | Eventos | Dados |
| 5 | Navegação ruim, links espalhados | app inteiro | UX |
| 6 | Texto com baixo contraste | Minérios | a11y |
| 7 | Rota que crasha | Detalhe do bioma | Bug |
| 8 | Sem cache | `api.ts` | Performance |
| 9 | Sem PWA | projeto | Plataforma |
| 10 | Busca sem debounce (e race condition) | Criaturas | Performance |
| 11 | Filtros fora da URL | Criaturas, Animais, Minérios | UX |
| 12 | Formulário sem validação e sem feedback de erro | Nova criatura | Bug |
| 13 | Sem página 404 | `main.tsx` | UX |
| 14 | Apagar não atualiza a lista | Criaturas | Bug |
| 15 | `<div onClick>` como link | Criaturas, Biomas | a11y |
| 16 | Tabela não responsiva | Animais | UX |
| 17 | Dados crus (0/1, números sem formato) | Criaturas, Detalhe, Animais | UX |

---

## 1. Sem estado de loading

- **Onde:** todas as páginas (`if (!x) return null` ou listas vazias até o fetch voltar).
- **Sintoma:** a tela fica em branco ou mostra uma lista vazia até a resposta chegar. Também não há estado de erro: se a API cair, a página fica vazia para sempre.
- **Reproduzir:** DevTools > Network > *Slow 3G*, abra `/creatures`.
- **Correção esperada:** estados `loading` / `error` / `data` (skeleton ou spinner), ou uma lib como TanStack Query que já entrega isso.

## 2. `<a href>` em vez de `<Link>`

- **Onde:** todos os links (`Home.tsx`, `Creatures.tsx`, `CreatureDetail.tsx`, `Biomes.tsx`, `BiomeDetail.tsx`, `Events.tsx`) e os cards com `window.location.href`.
- **Sintoma:** cada clique recarrega a página inteira: tela pisca, o JS é baixado de novo e todo estado se perde.
- **Reproduzir:** clique em qualquer link com a aba Network aberta; aparece um novo request do documento.
- **Correção esperada:** `<Link to>` / `useNavigate()` do `react-router-dom`.

## 3. Sem paginação

- **Onde:** `Creatures.tsx`, `Animals.tsx`, `Ores.tsx` (`limit: '10'` fixo).
- **Sintoma:** a API tem 15 criaturas, 18 animais e 16 minérios, mas só os 10 primeiros aparecem. Não há aviso de que existem mais, nem como chegar neles. A resposta já traz `total`, mas ele é ignorado.
- **Reproduzir:** procure "Werebeast" sem filtro em `/creatures`: ele não aparece na lista.
- **Correção esperada:** usar `total`, `limit` e `offset` para paginar (botões ou scroll infinito) e mostrar "x de y".

## 4. Página "ao vivo" sem stream

- **Onde:** `Events.tsx`.
- **Sintoma:** a página diz "Eventos ao vivo, em tempo real", mas busca `/events/random` uma única vez. Nada muda até dar F5.
- **Correção esperada:** `EventSource('/api/events/stream')`, ouvir o evento `game`, acumular uma lista e **fechar a conexão no cleanup do `useEffect`**. Ponto extra para quem lembrar do cleanup; sem ele, os eventos duplicam ao sair e voltar.

## 5. Navegação ruim

- **Onde:** app inteiro (não há header/menu).
- **Sintoma:** os links ficam escondidos no meio de parágrafos e rodapés. Algumas páginas não têm caminho de volta:
  - Minérios e Animais não têm nenhum link de saída.
  - "Nova criatura" só é acessível por um rodapé em Criaturas, e não tem link de volta.
  - Animais só é alcançável pelo rodapé de Biomas.
  - Detalhe do bioma não volta para Biomas.
- **Correção esperada:** um layout com menu fixo (`<nav>` com `NavLink` destacando a página atual), usando uma rota pai com `<Outlet>`.

## 6. Baixo contraste

- **Onde:** `Ores.tsx` + `.ores-page` em `index.css`.
- **Sintoma:** texto `#4d4d4d` sobre fundo `#2b2b2b`, contraste de aproximadamente 1.7:1 (o WCAG AA pede 4.5:1). Quase ilegível.
- **Reproduzir:** DevTools > inspecionar o texto > o seletor de cor mostra a razão de contraste. O Lighthouse também acusa.
- **Correção esperada:** cores com contraste mínimo de 4.5:1, iguais ao resto do app.

## 7. Rota que crasha

- **Onde:** `BiomeDetail.tsx` (`biome.inhabitants.creatures.map`).
- **Sintoma:** abrir qualquer bioma (`/biomes/caverns`) deixa **a tela inteira em branco**. O console mostra `TypeError: Cannot read properties of undefined (reading 'creatures')`.
- **Causa:** a API devolve `creatures` e `animals` na raiz do objeto, não dentro de `inhabitants`. Como não há Error Boundary, um erro em uma página derruba o app todo.
- **Correção esperada:** usar `biome.creatures` / `biome.animals`. Ponto extra: tipar a resposta (o `any` escondeu o erro do TypeScript) e adicionar um Error Boundary (`errorElement` no React Router).

## 8. Sem cache

- **Onde:** `api.ts` + `useEffect` em cada página.
- **Sintoma:** toda visita refaz todos os requests, mesmo para dados que nunca mudam (biomas, metais, stats). Somado ao problema 2, cada clique baixa tudo de novo.
- **Reproduzir:** vá de Criaturas para o detalhe e volte; a lista é buscada de novo e pisca vazia.
- **Correção esperada:** TanStack Query / SWR (cache + `staleTime`), ou ao menos um cache simples em memória no `api.ts`.

## 9. Sem PWA

- **Onde:** projeto (não há manifest nem service worker).
- **Sintoma:** não é instalável e não abre offline. O Lighthouse > PWA reprova.
- **Correção esperada:** `vite-plugin-pwa` com `manifest` (nome, ícones, `theme_color`) e service worker para cachear os assets e as respostas de GET.

## 10. Busca sem debounce (e race condition)

- **Onde:** `Creatures.tsx` (o `useEffect` depende de `q` direto).
- **Sintoma:** um request por tecla: digitar "dragon" dispara 6 requests. As respostas não são canceladas, então uma resposta antiga pode chegar depois da nova e sobrescrever o resultado.
- **Reproduzir:** Network aberta, digite rápido no campo de busca.
- **Correção esperada:** debounce (~300ms) e `AbortController` no cleanup do `useEffect` (ou TanStack Query, que resolve os dois).

## 11. Filtros fora da URL

- **Onde:** `Creatures.tsx`, `Animals.tsx`, `Ores.tsx` (filtros em `useState`).
- **Sintoma:** filtre "Hostis" e dê F5: o filtro some. Também não dá para compartilhar o link de uma busca, e o botão voltar não volta para o filtro anterior.
- **Correção esperada:** `useSearchParams()` do React Router como fonte da verdade dos filtros.

## 12. Formulário sem validação e sem feedback de erro

- **Onde:** `NewCreature.tsx` e `post` em `api.ts`.
- **Sintoma:** sempre mostra "Criatura salva com sucesso!", mesmo quando a API responde 409 (nome repetido ou bioma inexistente) ou 422 (campos inválidos). Dá para enviar o formulário vazio.
- **Reproduzir:** cadastre "Dragon" (já existe), ou bioma "lua", ou envie vazio. A mensagem de sucesso aparece e nada é salvo.
- **Correção esperada:** `api.ts` checar `res.ok` e lançar o erro; a página mostrar a mensagem da API. No form: `required`, `type="number"` + `min` no tamanho, `<select>` de biomas vindo de `/biomes`. Depois de salvar, navegar para o detalhe da criatura.

## 13. Sem página 404

- **Onde:** `main.tsx` (não há `<Route path="*">`).
- **Sintoma:** `/qualquer-coisa` mostra uma tela vazia, sem mensagem e sem caminho de volta. O mesmo vale para `/creatures/999`, que renderiza uma página com campos vazios.
- **Correção esperada:** rota `*` com página "não encontrado" e tratamento do 404 da API no detalhe.

## 14. Apagar não atualiza a lista

- **Onde:** `Creatures.tsx` (`remove` só chama `del`).
- **Sintoma:** clique em "Apagar": a criatura é removida da API, mas continua na tela até um F5. Também não pede confirmação.
- **Correção esperada:** remover do estado (`setCreatures(cs => cs.filter(...))`) ou refazer o fetch / invalidar o cache; pedir confirmação antes.

## 15. `<div onClick>` como link

- **Onde:** cards de `Creatures.tsx` e `Biomes.tsx`.
- **Sintoma:** não recebe foco pelo Tab, não abre com Enter, leitor de tela não anuncia como link, não dá para abrir em nova aba (Ctrl/Cmd+clique, botão do meio).
- **Correção esperada:** o card ser (ou conter) um `<Link>`. O botão "Apagar" fica fora do link.

## 16. Tabela não responsiva

- **Onde:** `Animals.tsx` + `.wide-table { width: 1100px }` em `index.css`.
- **Sintoma:** no celular (DevTools > modo dispositivo, 375px) a página inteira ganha scroll horizontal.
- **Correção esperada:** `width: 100%` com um wrapper `overflow-x: auto`, ou virar cards em telas pequenas.

## 17. Dados crus

- **Onde:** `Creatures.tsx`, `CreatureDetail.tsx`, `Animals.tsx`.
- **Sintoma:** "Hostil: 1", "Domesticável: 0", "Tamanho: 25000000", produto vazio quando é `null`.
- **Correção esperada:** "Sim/Não" (ou ícone), `toLocaleString('pt-BR')` com unidade (`25.000.000 cm³`), e "nenhum" para produto `null`.

---

## Extras que bons alunos podem notar

Não foram inseridos como alvo, mas são reclamações válidas:

- O título da aba (`document.title`) nunca muda.
- Tudo é `any`; não há tipos para as respostas da API.
- Gemas existem na API mas não têm página.
