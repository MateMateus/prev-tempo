export function traduzirCodigoTempo(code) {
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

    return mapaClima[code] || { descricao: 'Condição Desconhecida', icone: '🌡️' };
}

async function buscarServicos(url, dados = "", forma = "") {
    try {
        const formataURL = `${url}${dados}${forma}`;
        const response = await fetch(formataURL);
        if (!response.ok) {
            throw new Error(`Erro na requisição HTTP: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Erro no serviço de API:", error);
        return null;
    }
}

export async function buscarCoordenadasPorCidade(cidade) {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Falha na geocodificação");
        const data = await res.json();
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
