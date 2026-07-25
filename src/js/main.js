import navbar from "./components/navbar/navbar.js";
import roteador from "./components/rotas/rotas.js";

navbar(roteador);
const app = document.getElementById('app');

const mapaDeRotas = {};
for (const rota of roteador) {
    mapaDeRotas[rota.url] = rota;
}

let hash = window.location.hash || '#inicio';
render();

window.addEventListener("hashchange", () => {
    hash = window.location.hash || '#inicio';
    render();
});

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

async function render() {
    const rotaAtual = mapaDeRotas[hash] || rota404;
    await rotaAtual.pagina(app);
}
