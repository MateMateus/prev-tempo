// Importa a função que gera o menu de navegação dinâmico (Navbar)
import navbar from "./components/navbar/navbar.js";
// Importa a lista de rotas da aplicação (mapeamento de URLs e funções de página)
import roteador from "./components/rotas/rotas.js";

// Inicializa a barra de navegação injetando as rotas cadastradas
navbar(roteador);

// Captura a div de montagem principal da SPA (Single Page Application)
const app = document.getElementById('app');

// Objeto 'mapaDeRotas' utilizado para transformar o Array de rotas em um Mapa de busca rápida
// Exemplo: { '#inicio': objetoRotaHome, '#clima': objetoRotaClima }
const mapaDeRotas = {};
for (const rota of roteador) {
    mapaDeRotas[rota.url] = rota;
}

// Obtém o hash atual da URL da janela (ex: '#clima') ou define '#inicio' como padrão
let hash = window.location.hash || '#inicio';

// Executa a primeira renderização assim que o script é carregado
render();

// Escuta o evento 'hashchange' que é disparado sempre que a âncora/hash da URL muda no navegador
window.addEventListener("hashchange", () => {
    // Atualiza a variável com a nova rota da URL
    hash = window.location.hash || '#inicio';
    // Re-renderiza a página correspondente ao novo hash
    render();
});

// Definição da rota de fallback para páginas não encontradas (Erro 404)
const rota404 = { 
    pagina: (container) => {
        container.innerHTML = `
            <div class="bem-container bem-text-center bem-pt-xl">
                <h2>Página não encontrada (404)</h2>
                <p>A rota acessada não existe no PrevTempo.</p>
            </div>
        `;
    }
};

// Função responsável por renderizar a página correspondente à rota atual
async function render() {
    // Busca a rota no mapa pelo hash atual; se não existir, utiliza a 'rota404'
    const rotaAtual = mapaDeRotas[hash] || rota404;
    // Executa a função da página passando o elemento container 'app'
    await rotaAtual.pagina(app);
}
