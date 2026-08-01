import buscarNoMundo from "./api.js";
import { memoriaPermanente } from "./storageStrategy.js";

// Define a estrategia de armazenamento a ser utilizada pelo cache
const storage = memoriaPermanente;

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
    const timerLabel = `⏱️ Cache/API [${formataURL}]`;

    // Verifica se os dados já existem no armazenamento local
    if (storage.existe(formataURL)) {
        console.time(timerLabel);
        console.log(`📦 [CACHE] Retornando dados em cache (localStorage) para: ${formataURL}`);
        const dadosLocais = storage.buscarDadosLocal(formataURL);
        console.timeEnd(timerLabel);
        return dadosLocais;
    }

    // Se não existir no cache, realiza a requisição na rede (servidor)
    console.time(timerLabel);
    console.log(`🌐 [API] Buscando dados no servidor remoto para: ${formataURL}`);
    const resultadoDoServidor = await buscarNoMundo(url, dados, forma);

    // Salva o resultado no cache para futuras consultas se a resposta for válida
    if (resultadoDoServidor) {
        storage.salvarDadosLocal(formataURL, resultadoDoServidor);
        console.log(`💾 [CACHE] Dados armazenados no localStorage para a chave: ${formataURL}`);
    }
    console.timeEnd(timerLabel);

    return resultadoDoServidor;
}

export default buscarServicos;
