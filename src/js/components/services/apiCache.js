import buscarNoMundo from "./api.js";
import { memoriaPermanente } from "./storageStrategy.js";

// Define a estratégia de armazenamento a ser utilizada pelo cache
const storage = memoriaPermanente;

/**
 * Identifica o nome amigável do serviço com base na URL consultada.
 * 
 * @param {string} url - URL completa formatada
 * @returns {string} Rótulo limpo e legível do serviço
 */
function identificarServico(url) {
    if (url.includes('viacep.com.br')) return 'ViaCEP';
    if (url.includes('geocoding-api.open-meteo.com')) return 'Open-Meteo Geocoding';
    if (url.includes('nominatim.openstreetmap.org')) return 'Nominatim GeoJSON';
    if (url.includes('api.open-meteo.com')) return 'Open-Meteo Previsão';
    if (url.includes('rickandmortyapi.com')) return 'Rick and Morty API';

    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname.replace('www.', '');
    } catch {
        return 'Serviço HTTP';
    }
}

/**
 * Serviço assíncrono de busca com suporte a cache em localStorage.
 * 
 * @param {string} url - URL base da API
 * @param {string} dados - Parâmetro adicional (ex: CEP ou query)
 * @param {string} forma - Sufixo de formatação (ex: "/json/")
 * @returns {Promise<object|null>} Dados recuperados do cache ou obtidos via fetch da API
 */
async function buscarServicos(url, dados = "", forma = "") {
    const formataURL = `${url}${dados}${forma}`;
    const nomeServico = identificarServico(formataURL);
    const inicio = performance.now();

    // 1. Caso o dado já exista no cache (localStorage)
    if (storage.existe(formataURL)) {
        const dadosLocais = storage.buscarDadosLocal(formataURL);
        const duracao = (performance.now() - inicio).toFixed(2);
        console.log(`📦 [CACHE] ${nomeServico}: ${duracao}ms`);
        return dadosLocais;
    }

    // 2. Caso contrário, faz a busca na rede (servidor remoto)
    const resultadoDoServidor = await buscarNoMundo(url, dados, forma);
    const duracao = Math.round(performance.now() - inicio);

    if (resultadoDoServidor) {
        storage.salvarDadosLocal(formataURL, resultadoDoServidor);
    }

    console.log(`🌐 [API] ${nomeServico}: ${duracao}ms`);
    return resultadoDoServidor;
}

export default buscarServicos;
