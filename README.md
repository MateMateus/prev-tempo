# PrevTempo — Aplicação de Previsão do Tempo

**PrevTempo** é uma Single Page Application (SPA) desenvolvida em **JavaScript Vanilla**, **HTML5** e **CSS3 (BEM)** para consulta e exibição de dados de previsão meteorológica em tempo real.

## 🚀 Funcionalidades

- **Navegação SPA:** Roteamento no lado do cliente (Client-Side Routing) via hash sem recarregamento da página.
- **Componentização Modular:** Organização com ES Modules (`import`/`export`).
- **Busca por CEP:** Consulta integrada à API de CEP para preenchimento de endereço e consulta climática regional.
- **Previsão do Tempo:** Consumo de APIs meteorológicas assíncronas (`async`/`await`, `fetch`).
- **Design Responsivo:** Interface construída com CSS utilizando metodologia BEM.

## 📁 Estrutura do Projeto

```
prev-tempo/
├── index.html                     # Arquivo principal da SPA
├── README.md                      # Documentação do projeto
├── src/
│   ├── css/
│   │   └── microframework.css     # Estilos da aplicação (BEM)
│   └── js/
│       ├── main.js                 # Ponto de entrada: Roteador central
│       └── components/
│           ├── navbar/             # Componente de navegação superior
│           ├── rotas/              # Mapeamento e definição de rotas
│           ├── services/           # Serviço de integração com APIs (fetch, async/await)
│           └── paginas/            # Páginas da aplicação (home, clima, previsão, sobre, contato)
```

## 🛠️ Como Executar

Como a aplicação utiliza **ES Modules** (`type="module"`), ela precisa ser executada através de um servidor web local.

### Opção 1: VS Code Live Server
Abra a pasta `prev-tempo` no VS Code, clique com o botão direito em `index.html` e selecione **Open with Live Server**.

### Opção 2: Servidor via Terminal (Python / Node)

```bash
# Com Python
python -m http.server 8000

# Ou com Node.js
npx serve .
```

Acesse `http://localhost:8000` no seu navegador.
