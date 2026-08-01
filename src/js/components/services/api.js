import buscarServicos from "./apiCache.js";

/**
 * Converte os códigos numéricos da OMM (Organização Meteorológica Mundial - WMO)
 * em uma descrição textual em português e uma URL de ícone 3D em alta definição (Microsoft Fluent Emoji 3D).
 * 
 * @param {number} code - Código meteorológico retornado pela Open-Meteo
 * @returns {object} Objeto contendo a descrição e a URL do ícone 3D
 */
export function traduzirCodigoTempo(code) {
    const cdnBase = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';

    const mapaClima = {
        0: { descricao: 'Céu Limpo', icone: `${cdnBase}/Sun/3D/sun_3d.png` },
        1: { descricao: 'Predominantemente Ensolarado', icone: `${cdnBase}/Sun%20behind%20small%20cloud/3D/sun_behind_small_cloud_3d.png` },
        2: { descricao: 'Parcialmente Nublado', icone: `${cdnBase}/Sun%20behind%20cloud/3D/sun_behind_cloud_3d.png` },
        3: { descricao: 'Encoberto / Nublado', icone: `${cdnBase}/Cloud/3D/cloud_3d.png` },
        45: { descricao: 'Nevoeiro', icone: `${cdnBase}/Fog/3D/fog_3d.png` },
        48: { descricao: 'Nevoeiro com Geada', icone: `${cdnBase}/Fog/3D/fog_3d.png` },
        51: { descricao: 'Garoa Leve', icone: `${cdnBase}/Cloud%20with%20rain/3D/cloud_with_rain_3d.png` },
        53: { descricao: 'Garoa Moderada', icone: `${cdnBase}/Cloud%20with%20rain/3D/cloud_with_rain_3d.png` },
        55: { descricao: 'Garoa Densa', icone: `${cdnBase}/Cloud%20with%20rain/3D/cloud_with_rain_3d.png` },
        61: { descricao: 'Chuva Leve', icone: `${cdnBase}/Cloud%20with%20rain/3D/cloud_with_rain_3d.png` },
        63: { descricao: 'Chuva Moderada', icone: `${cdnBase}/Cloud%20with%20rain/3D/cloud_with_rain_3d.png` },
        65: { descricao: 'Chuva Forte', icone: `${cdnBase}/Cloud%20with%20rain/3D/cloud_with_rain_3d.png` },
        71: { descricao: 'Neve Leve', icone: `${cdnBase}/Snowflake/3D/snowflake_3d.png` },
        73: { descricao: 'Neve Moderada', icone: `${cdnBase}/Snowflake/3D/snowflake_3d.png` },
        75: { descricao: 'Neve Forte', icone: `${cdnBase}/Snowflake/3D/snowflake_3d.png` },
        80: { descricao: 'Pancadas de Chuva Leves', icone: `${cdnBase}/Sun%20behind%20rain%20cloud/3D/sun_behind_rain_cloud_3d.png` },
        81: { descricao: 'Pancadas de Chuva Moderadas', icone: `${cdnBase}/Sun%20behind%20rain%20cloud/3D/sun_behind_rain_cloud_3d.png` },
        82: { descricao: 'Pancadas de Chuva Violentas', icone: `${cdnBase}/Cloud%20with%20lightning%20and%20rain/3D/cloud_with_lightning_and_rain_3d.png` },
        95: { descricao: 'Tempestade', icone: `${cdnBase}/Cloud%20with%20lightning%20and%20rain/3D/cloud_with_lightning_and_rain_3d.png` },
        96: { descricao: 'Tempestade com Granizo Leve', icone: `${cdnBase}/Cloud%20with%20lightning%20and%20rain/3D/cloud_with_lightning_and_rain_3d.png` },
        99: { descricao: 'Tempestade com Granizo Forte', icone: `${cdnBase}/Cloud%20with%20lightning%20and%20rain/3D/cloud_with_lightning_and_rain_3d.png` }
    };

    return mapaClima[code] || { descricao: 'Condição Desconhecida', icone: `${cdnBase}/Thermometer/3D/thermometer_3d.png` };
}

/**
 * Função assíncrona base que realiza o fetch HTTP na API e retorna o JSON.
 * Executa a requisição real sem passar pelo cache.
 */
export async function buscarNoMundo(url, dados = "", forma = "") {
    try {
        const formataURL = `${url}${dados}${forma}`;
        const response = await fetch(formataURL);
        if (!response.ok) {
            throw new Error(`Erro na requisição HTTP: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Erro no serviço de API (buscarNoMundo):", error);
        return null;
    }
}

/**
 * Consulta a API de Geocodificação da Open-Meteo para converter o nome de uma cidade em latitude e longitude.
 * Utiliza a camada de apiCache (buscarServicos).
 */
export async function buscarCoordenadasPorCidade(cidade) {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
        const data = await buscarServicos(url);
        if (data && data.results && data.results.length > 0) {
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
 * Consulta a API do Nominatim (OpenStreetMap) para obter o polígono de fronteira GeoJSON real do município.
 * Utiliza a camada de apiCache (buscarServicos).
 */
export async function buscarGeoJsonMunicipio(cidade, estado = "") {
    try {
        const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cidade)}&state=${encodeURIComponent(estado)}&country=Brazil&polygon_geojson=1&format=geojson`;
        const data = await buscarServicos(url);
        if (data && data.features && data.features.length > 0) {
            return {
                type: "FeatureCollection",
                features: [data.features[0]]
            };
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar GeoJSON do município:", error);
        return null;
    }
}

/**
 * Consulta a API de Previsão do Tempo da Open-Meteo a partir das coordenadas geográficas.
 * Utiliza a camada de apiCache (buscarServicos).
 */
export async function buscarClimaPorCoordenadas(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,wind_speed_10m_max,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
        const data = await buscarServicos(url);
        return data;
    } catch (error) {
        console.error("Erro ao buscar clima da Open-Meteo:", error);
        return null;
    }
}

export default buscarNoMundo;
