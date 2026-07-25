/**
 * Converte os códigos numéricos da OMM (Organização Meteorológica Mundial - WMO)
 * em uma descrição textual em português e um emoji ilustrativo.
 * 
 * @param {number} code - Código meteorológico retornado pela Open-Meteo
 * @returns {object} Objeto contendo a descrição e o emoji do clima
 */
export function traduzirCodigoTempo(code) {
    // Dicionário de tradução dos códigos OMM/WMO
    const mapaClima = {
        0: { descricao: 'Céu Limpo', icone: '☀️' },
        1: { descricao: 'Predominantemente Ensolarado', icone: '🌤️' },
        2: { descricao: 'Parcialmente Nublado', icone: '⛅' },
        3: { descricao: 'Encoberto / Nublado', icone: '☁️' },
        45: { descricao: 'Nevoeiro', icone: '🌫️' },
        48: { descricao: 'Nevoeiro com Geada', icone: '🌫️' },
        51: { descricao: 'Garoa Leve', icone: '🌧️' },
        53: { descricao: 'Garoa Moderada', icone: '🌧️' },
        55: { descricao: 'Garoa Densa', icone: '🌧️' },
        61: { descricao: 'Chuva Leve', icone: '🌧️' },
        63: { descricao: 'Chuva Moderada', icone: '🌧️' },
        65: { descricao: 'Chuva Forte', icone: '🌧️' },
        71: { descricao: 'Neve Leve', icone: '❄️' },
        73: { descricao: 'Neve Moderada', icone: '❄️' },
        75: { descricao: 'Neve Forte', icone: '❄️' },
        80: { descricao: 'Pancadas de Chuva Leves', icone: '🌦️' },
        81: { descricao: 'Pancadas de Chuva Moderadas', icone: '🌦️' },
        82: { descricao: 'Pancadas de Chuva Violentas', icone: '⛈️' },
        95: { descricao: 'Tempestade', icone: '⛈️' },
        96: { descricao: 'Tempestade com Granizo Leve', icone: '⛈️' },
        99: { descricao: 'Tempestade com Granizo Forte', icone: '⛈️' }
    };

    // Retorna a tradução encontrada ou uma resposta padrão caso o código seja desconhecido
    return mapaClima[code] || { descricao: 'Condição Desconhecida', icone: '🌡️' };
}

/**
 * Serviço assíncrono genérico para realizar requisições HTTP GET utilizando a API Fetch nativa.
 * 
 * @param {string} url - URL base do endpoint
 * @param {string} dados - Parâmetro adicional (ex: CEP)
 * @param {string} forma - Sufixo do formato da URL (ex: "/json/")
 * @returns {Promise<object|null>} Retorna os dados em JSON ou null em caso de erro
 */
async function buscarServicos(url, dados = "", forma = "") {
    try {
        // Interpola os fragmentos para compor a URL final da requisição
        const formataURL = `${url}${dados}${forma}`;
        // Executa a requisição assíncrona HTTP GET
        const response = await fetch(formataURL);
        
        // Verifica se a resposta do servidor retornou com status HTTP de sucesso (200-299)
        if (!response.ok) {
            throw new Error(`Erro na requisição HTTP: ${response.status}`);
        }
        
        // Converte o corpo da resposta em um objeto JavaScript (JSON)
        const result = await response.json();
        return result;
    } catch (error) {
        // Captura e exibe qualquer erro ocorrido durante a requisição no console do navegador
        console.error("Erro no serviço de API:", error);
        return null;
    }
}

/**
 * Consulta a API de Geocodificação da Open-Meteo para converter o nome de uma cidade em latitude e longitude.
 * 
 * @param {string} cidade - Nome da cidade a ser consultada (ex: "São Paulo")
 * @returns {Promise<object|null>} Retorna { lat, lon, nome, estado } ou null se não encontrar
 */
export async function buscarCoordenadasPorCidade(cidade) {
    try {
        // encodeURIComponent garante que caracteres especiais/acentos sejam codificados corretamente na URL
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Falha na geocodificação");
        
        const data = await res.json();
        // Se houver resultados no array da resposta, extrai os dados do primeiro resultado
        if (data.results && data.results.length > 0) {
            return {
                lat: data.results[0].latitude,
                lon: data.results[0].longitude,
                nome: data.results[0].name,
                estado: data.results[0].admin1 || ""
            };
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar coordenadas:", error);
        return null;
    }
}

/**
 * Consulta a API de Previsão do Tempo da Open-Meteo a partir das coordenadas geográficas.
 * 
 * @param {number} lat - Latitude da localização
 * @param {number} lon - Longitude da localização
 * @returns {Promise<object|null>} Dados meteorológicos detalhados (temperatura, umidade, vento, etc.)
 */
export async function buscarClimaPorCoordenadas(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Falha ao buscar dados de clima");
        
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Erro ao buscar clima da Open-Meteo:", error);
        return null;
    }
}

export default buscarServicos;
