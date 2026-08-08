import buscarServicos from "../services/apiCache.js";
import { buscarCoordenadasPorCidade, buscarClimaPorCoordenadas, traduzirCodigoTempo, buscarGeoJsonMunicipio, buscarGeoJsonBairro } from "../services/api.js";

// Estado local mantido durante a sessão ativa da página
let dadosClimaAtuais = null;
let instanciaMapaLeaflet = null;

/**
 * Formata a string de data (YYYY-MM-DD) para um rótulo amigável (Hoje, Amanhã, Seg, Ter...)
 */
function formatarDiaDaSemana(dateStr, index) {
    if (index === 0) return 'Hoje';
    if (index === 1) return 'Amanhã';
    const partes = dateStr.split('-');
    if (partes.length !== 3) return dateStr;
    const data = new Date(partes[0], partes[1] - 1, partes[2]);
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias[data.getDay()];
}

/**
 * Extrai a hora formatada (HH:MM) de uma string ISO 8601 (ex: "2026-07-25T06:22")
 */
function formatarHora(isoString) {
    if (!isoString) return '--:--';
    const partes = isoString.split('T');
    if (partes.length === 2) return partes[1].substring(0, 5);
    return isoString;
}

/**
 * Atualiza o mapa interativo Leaflet.js com estilo CartoDB Positron Light,
 * adicionando a demarcação REAL das fronteiras do BAIRRO (GeoJSON) com fallback para raio circular.
 */
async function atualizarMapaLeaflet(lat, lon, nomeCidade, estado = "", bairro = "") {
    if (window.instanciaMapaClima) {
        try {
            window.instanciaMapaClima.off();
            window.instanciaMapaClima.remove();
        } catch (e) {
            console.warn("Aviso ao remover mapa anterior:", e);
        }
        window.instanciaMapaClima = null;
    }

    const containerMapa = document.getElementById("mapa-clima");
    if (!containerMapa || !window.L) return;

    containerMapa.innerHTML = '';

    // Inicialização do mapa bloqueando o arraste por toque para permitir rolagem fluida no celular
    window.instanciaMapaClima = window.L.map('mapa-clima', {
        dragging: false,
        scrollWheelZoom: false,
        touchZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        tap: false
    }).setView([lat, lon], 13);
    instanciaMapaLeaflet = window.instanciaMapaClima;

    // Camada de Tiles Light Minimalista do CartoDB Positron
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(instanciaMapaLeaflet);

    const tituloPopup = bairro ? `<b>${bairro} - ${nomeCidade} / ${estado}</b>` : (estado ? `<b>${nomeCidade} / ${estado}</b>` : `<b>${nomeCidade}</b>`);
    let geoJsonResultado = null;

    // 1ª Tentativa: Busca o polígono GeoJSON do BAIRRO + CIDADE + ESTADO
    if (bairro) {
        try {
            geoJsonResultado = await buscarGeoJsonBairro(bairro, nomeCidade, estado);
        } catch (err) {
            console.warn("GeoJSON do bairro não disponível:", err);
        }
    }

    // 2ª Tentativa (Fallback): Se o bairro não retornar um polígono, busca as fronteiras do MUNICÍPIO/CIDADE
    if (!geoJsonResultado) {
        try {
            geoJsonResultado = await buscarGeoJsonMunicipio(nomeCidade, estado);
        } catch (err) {
            console.warn("GeoJSON do município não disponível:", err);
        }
    }

    let desenhouPoligono = false;

    // Renderização do Polígono (do Bairro ou do Município)
    if (geoJsonResultado && geoJsonResultado.features && geoJsonResultado.features.length > 0) {
        const geojsonLayer = window.L.geoJSON(geoJsonResultado, {
            style: {
                color: '#3b82f6',
                weight: 2,
                fillColor: '#93c5fd',
                fillOpacity: 0.25
            }
        }).addTo(instanciaMapaLeaflet);

        if (geojsonLayer && geojsonLayer.getBounds().isValid()) {
            // Pega o centro exato da demarcação do polígono obtido
            const centroPoligono = geojsonLayer.getBounds().getCenter();

            // Posiciona o pino EXATAMENTE dentro da área demarcada
            const marker = window.L.marker(centroPoligono).addTo(instanciaMapaLeaflet);
            marker.bindPopup(tituloPopup).openPopup();

            // Ajusta o zoom para enquadrar a área com o pino visível
            instanciaMapaLeaflet.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
            desenhouPoligono = true;
        }
    }

    // Fallback final (Sem L.circle): coloca o pino nas coordenadas gerais da cidade caso nenhum polígono seja retornado
    if (!desenhouPoligono) {
        const marker = window.L.marker([lat, lon]).addTo(instanciaMapaLeaflet);
        marker.bindPopup(tituloPopup).openPopup();
        instanciaMapaLeaflet.setView([lat, lon], 13);
    }
}

/**
 * Renderiza o painel da dashboard com base no dia selecionado (index 0 a 6).
 */
function renderizarDashboard(indexSelecionado = 0) {
    const containerResultado = document.getElementById("resultado-clima");
    if (!containerResultado || !dadosClimaAtuais) return;

    const { cidade, estado, bairro, coords, climaData } = dadosClimaAtuais;
    const diario = climaData.daily;
    const atual = climaData.current;

    const dataSelecionada = diario.time[indexSelecionado];
    const rotuloDia = formatarDiaDaSemana(dataSelecionada, indexSelecionado);
    const codeWmo = diario.weather_code[indexSelecionado];
    const infoCondicao = traduzirCodigoTempo(codeWmo);

    const tempMaxDia = diario.temperature_2m_max[indexSelecionado];
    const tempMinDia = diario.temperature_2m_min[indexSelecionado];
    const sensacaoDia = diario.apparent_temperature_max ? diario.apparent_temperature_max[indexSelecionado] : atual.apparent_temperature;
    const ventoDia = diario.wind_speed_10m_max ? diario.wind_speed_10m_max[indexSelecionado] : atual.wind_speed_10m;
    const umidadeDia = atual.relative_humidity_2m;

    const horaNascerDoSol = diario.sunrise ? formatarHora(diario.sunrise[indexSelecionado]) : '--:--';
    const horaPorDoSol = diario.sunset ? formatarHora(diario.sunset[indexSelecionado]) : '--:--';
    const indiceUv = diario.uv_index_max ? diario.uv_index_max[indexSelecionado].toFixed(1) : '--';
    const probChuva = diario.precipitation_probability_max ? diario.precipitation_probability_max[indexSelecionado] : '0';

    const fallbackIcon = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sun%20behind%20cloud/3D/sun_behind_cloud_3d.png';

    let cards7DiasHtml = '';
    for (let i = 0; i < diario.time.length && i < 7; i++) {
        const diaNome = formatarDiaDaSemana(diario.time[i], i);
        const cond = traduzirCodigoTempo(diario.weather_code[i]);
        const isSelected = i === indexSelecionado ? 'bem-day-card--active' : '';

        cards7DiasHtml += `
            <div class="bem-day-card ${isSelected}" data-index="${i}">
                <div class="bem-day-card__name">${diaNome}</div>
                <img src="${cond.icone}" alt="${cond.descricao}" class="bem-icon-3d--sm bem-my-auto" loading="lazy" onerror="this.onerror=null; this.src='${fallbackIcon}'">
                <div class="bem-day-card__temp-max">${diario.temperature_2m_max[i]}°</div>
                <div class="bem-day-card__temp-min">${diario.temperature_2m_min[i]}°</div>
            </div>
        `;
    }

    const localizacaoHeader = bairro ? `${cidade} (${bairro}) - ${estado}` : `${cidade} - ${estado}`;

    containerResultado.innerHTML = `
        <div class="bem-dashboard-grid bem-animate-slide-up">
            <!-- COLUNA ESQUERDA: HERO, 7 DIAS E MAPA GEOJSON DO BAIRRO -->
            <div class="bem-flex bem-flex-col bem-gap-lg">
                <!-- HERO CARD -->
                <div class="bem-card--white-glass">
                    <div class="bem-weather-hero">
                        <div>
                            <h2 class="bem-weather-hero__city">${localizacaoHeader}</h2>
                            <div class="bem-weather-hero__subtitle">
                                Previsão para <strong>${rotuloDia}</strong> (${dataSelecionada}) • ${infoCondicao.descricao}
                            </div>
                            <div class="bem-weather-hero__temp">
                                ${indexSelecionado === 0 ? atual.temperature_2m + '°C' : tempMaxDia + '°C'}
                            </div>
                        </div>
                        <div>
                            <img src="${infoCondicao.icone}" alt="${infoCondicao.descricao}" class="bem-icon-3d" loading="lazy" onerror="this.onerror=null; this.src='${fallbackIcon}'">
                        </div>
                    </div>
                    
                    <!-- 7-DAY INTERACTIVE CARDS -->
                    <div class="bem-pt-md">
                        <h4 class="bem-mb-sm bem-font-bold">Previsão para 7 Dias (Clique para selecionar):</h4>
                        <div class="bem-day-cards-scroll">
                            ${cards7DiasHtml}
                        </div>
                    </div>
                </div>

                <!-- MAPA LEAFLET LIGHT COM DEMARCAÇÃO REAL GEOJSON DO BAIRRO -->
                <div class="bem-card--white-glass">
                    <h4 class="bem-font-bold bem-mb-sm">📍 Cobertura e Fronteiras do Bairro (GeoJSON)</h4>
                    <div id="mapa-clima" class="bem-map-container"></div>
                </div>
            </div>

            <!-- COLUNA DIREITA: PAINEL DE MÉTRICAS E DETALHES CLIMÁTICOS -->
            <div class="bem-flex bem-flex-col bem-gap-lg">
                <!-- PAINEL LATERAL DE MÉTRICAS -->
                <div class="bem-card--white-glass">
                    <h3 class="bem-card__title bem-mb-md">Métricas Meteorológicas (${rotuloDia})</h3>
                    <div class="bem-grid bem-grid-auto-2 bem-gap-md">
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Sensação Térmica</span>
                            <div class="bem-weather-subcard__value">${sensacaoDia}°C</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Umidade do Ar</span>
                            <div class="bem-weather-subcard__value">${umidadeDia}%</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Vento Máximo</span>
                            <div class="bem-weather-subcard__value">${ventoDia} km/h</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Variação Máx / Mín</span>
                            <div class="bem-weather-subcard__value bem-weather-subcard__value--sm">${tempMaxDia}° / ${tempMinDia}°</div>
                        </div>
                    </div>
                </div>

                <!-- CARD: DETALHES CLIMÁTICOS DO DIA -->
                <div class="bem-card--white-glass">
                    <h3 class="bem-card__title bem-mb-md">Detalhes & Sol (${rotuloDia})</h3>
                    <div class="bem-grid bem-grid-auto-2 bem-gap-md">
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Nascer do Sol</span>
                            <div class="bem-weather-subcard__value">☀️ ${horaNascerDoSol}</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Pôr do Sol</span>
                            <div class="bem-weather-subcard__value">🌙 ${horaPorDoSol}</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Índice UV Máx</span>
                            <div class="bem-weather-subcard__value">🛡️ ${indiceUv}</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Probab. de Chuva</span>
                            <div class="bem-weather-subcard__value">☔ ${probChuva}%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    atualizarMapaLeaflet(coords.lat, coords.lon, cidade, estado, bairro);

    const dayCards = containerResultado.querySelectorAll('.bem-day-card');
    dayCards.forEach(card => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.getAttribute('data-index'), 10);
            if (!isNaN(idx)) {
                renderizarDashboard(idx);
            }
        });
    });
}

let buscaEmAndamento = false;
let ultimoCepConsultado = "";

/**
 * Função assíncrona principal de consulta ao CEP e inicialização dos dados.
 */
async function consultarCepEClima() {
    const campocep = document.getElementById("cep");
    const containerStatus = document.getElementById("status-clima");
    const containerResultado = document.getElementById("resultado-clima");
    if (!campocep || !containerStatus || !containerResultado) return;

    const valorCep = campocep.value.replace(/\D/g, "");
    if (valorCep.length !== 8) {
        containerResultado.innerHTML = `
            <div class="bem-alert bem-alert--warning bem-mt-md">
                <span class="bem-alert__icon">⚠️</span>
                <div class="bem-alert__content">
                    <div class="bem-alert__title">CEP Inválido</div>
                    <div class="bem-alert__message">Por favor, digite um CEP válido com 8 dígitos (ex: 01001-000).</div>
                </div>
            </div>
        `;
        return;
    }

<<<<<<< HEAD
    if (buscaEmAndamento) return;
    if (valorCep === ultimoCepConsultado && containerResultado.children.length > 0) return;

    buscaEmAndamento = true;

=======
    // 1. Exibe o feedback visual de "Carregando..." no containerStatus com spinner animado
>>>>>>> 56ce5430f479bef5650157c2334a1a15806770db
    containerStatus.innerHTML = `
        <div class="bem-alert bem-alert--info bem-mt-md bem-animate-fade-in bem-flex bem-items-center bem-gap-md">
            <span class="bem-spinner bem-spinner--primary"></span>
            <div class="bem-alert__content">
                <div class="bem-alert__title">Carregando...</div>
                <div class="bem-alert__message">Buscando endereço, coordenadas e previsão de 7 dias...</div>
            </div>
        </div>
    `;
    containerResultado.innerHTML = "";

    try {
        const dadosEndereco = await buscarServicos("https://viacep.com.br/ws/", valorCep, "/json/");
        if (!dadosEndereco || dadosEndereco.erro) {
            containerResultado.innerHTML = `
                <div class="bem-card bem-card--flat bem-p-lg bem-mt-md bem-border-danger bem-animate-fade-in">
                    <div class="bem-flex bem-items-center bem-gap-md">
                        <span class="bem-text-2xl">🔍❌</span>
                        <div>
                            <h3 class="bem-text-danger bem-mb-xs">CEP não encontrado</h3>
                            <p class="bem-text-muted-util">Não encontramos informações para o CEP <strong>${valorCep}</strong>. Verifique se os números foram digitados corretamente.</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        document.getElementById("logradouro").value = dadosEndereco.logradouro || "";
        document.getElementById("bairro").value = dadosEndereco.bairro || "";
        document.getElementById("localidade").value = dadosEndereco.localidade || "";
        document.getElementById("estado").value = dadosEndereco.estado || "";

<<<<<<< HEAD
=======
        // Salva o último CEP consultado no localStorage
        localStorage.setItem("prevtempo_ultimo_cep", valorCep);

        // 4. Utiliza a cidade retornada pelo ViaCEP para obter as coordenadas de Latitude e Longitude
>>>>>>> 56ce5430f479bef5650157c2334a1a15806770db
        const cidade = dadosEndereco.localidade;
        const estadoSigla = dadosEndereco.uf || "";
        const bairro = dadosEndereco.bairro || "";
        const coords = await buscarCoordenadasPorCidade(cidade, estadoSigla);
        
        if (!coords) {
            containerResultado.innerHTML = `
                <div class="bem-alert bem-alert--warning bem-mt-md">
                    <span class="bem-alert__icon">⚠️</span>
                    <div class="bem-alert__content">
                        <div class="bem-alert__title">Endereço localizado</div>
                        <div class="bem-alert__message">Endereço preenchido, mas não encontramos coordenadas para a cidade de ${cidade}.</div>
                    </div>
                </div>
            `;
            return;
        }

        const climaData = await buscarClimaPorCoordenadas(coords.lat, coords.lon);
        if (!climaData || !climaData.current) {
            containerResultado.innerHTML = `
                <div class="bem-alert bem-alert--warning bem-mt-md">
                    <span class="bem-alert__icon">⚠️</span>
                    <div class="bem-alert__content">
                        <div class="bem-alert__title">Falha no clima</div>
                        <div class="bem-alert__message">Não foi possível carregar a previsão da Open-Meteo para ${cidade}.</div>
                    </div>
                </div>
            `;
            return;
        }

        dadosClimaAtuais = {
            cidade,
            estado: estadoSigla || coords.estado,
            bairro,
            coords,
            climaData
        };

        ultimoCepConsultado = valorCep;
        renderizarDashboard(0);
    } catch (error) {
        console.error("Erro no fluxo de consulta por CEP:", error);
        containerResultado.innerHTML = `
            <div class="bem-card bem-card--flat bem-p-lg bem-mt-md bem-border-danger bem-animate-fade-in">
                <div class="bem-flex bem-items-center bem-gap-md">
                    <span class="bem-text-2xl">🌐⚠️</span>
                    <div>
                        <h3 class="bem-text-danger bem-mb-xs">Falha na conexão com os serviços</h3>
                        <p class="bem-text-muted-util">Não foi possível obter a previsão do tempo no momento. Verifique sua conexão de internet ou tente novamente em instantes.</p>
                    </div>
                </div>
            </div>
        `;
    } finally {
        buscaEmAndamento = false;
        containerStatus.innerHTML = "";
    }
}

/**
 * Função para buscar o clima atual utilizando a API nativa de Geolocalização do navegador.
 */
async function consultarClimaPorGeolocalizacao() {
    const containerStatus = document.getElementById("status-clima");
    const containerResultado = document.getElementById("resultado-clima");
    if (!containerStatus || !containerResultado) return;

    if (!navigator.geolocation) {
        containerResultado.innerHTML = `
            <div class="bem-alert bem-alert--warning bem-mt-md">
                <span class="bem-alert__icon">⚠️</span>
                <div class="bem-alert__content">
                    <div class="bem-alert__title">Geolocalização indisponível</div>
                    <div class="bem-alert__message">Seu navegador não suporta geolocalização.</div>
                </div>
            </div>
        `;
        return;
    }

    containerStatus.innerHTML = `
        <div class="bem-alert bem-alert--info bem-mt-md bem-animate-fade-in">
            <span class="bem-alert__icon">⏳</span>
            <div class="bem-alert__content">
                <div class="bem-alert__title">Obtendo localização...</div>
                <div class="bem-alert__message">Aguardando permissão de GPS para identificar sua posição...</div>
            </div>
        </div>
    `;
    containerResultado.innerHTML = "";

    navigator.geolocation.getCurrentPosition(async (posicao) => {
        const { latitude, longitude } = posicao.coords;
        try {
            const climaData = await buscarClimaPorCoordenadas(latitude, longitude);
            if (!climaData || !climaData.current) throw new Error("Falha ao buscar dados climáticos");

            const atual = climaData.current;
            const diario = climaData.daily;
            const infoCondicao = traduzirCodigoTempo(atual.weather_code);

            containerResultado.innerHTML = `
                <div class="bem-card bem-mt-lg bem-animate-slide-up">
                    <div class="bem-card__header bem-flex bem-justify-between bem-items-center">
                        <div>
                            <h2 class="bem-card__title">Sua Localização Atual 📍</h2>
                            <span class="bem-card__subtitle">Coordenadas: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°</span>
                        </div>
                        <div class="bem-text-2xl">${infoCondicao.icone}</div>
                    </div>
                    <div class="bem-card__body">
                        <div class="bem-grid bem-grid-auto">
                            <div class="bem-card bem-card--flat bem-p-md bem-text-center">
                                <span class="bem-text-muted-util bem-text-sm">Temperatura Atual</span>
                                <div class="bem-text-2xl bem-font-bold bem-text-primary">${atual.temperature_2m}°C</div>
                            </div>
                            <div class="bem-card bem-card--flat bem-p-md bem-text-center">
                                <span class="bem-text-muted-util bem-text-sm">Sensação Térmica</span>
                                <div class="bem-text-2xl bem-font-bold">${atual.apparent_temperature}°C</div>
                            </div>
                            <div class="bem-card bem-card--flat bem-p-md bem-text-center">
                                <span class="bem-text-muted-util bem-text-sm">Condição do Tempo</span>
                                <div class="bem-font-medium">${infoCondicao.descricao}</div>
                            </div>
                            <div class="bem-card bem-card--flat bem-p-md bem-text-center">
                                <span class="bem-text-muted-util bem-text-sm">Umidade do Ar</span>
                                <div class="bem-font-medium">${atual.relative_humidity_2m}%</div>
                            </div>
                            <div class="bem-card bem-card--flat bem-p-md bem-text-center">
                                <span class="bem-text-muted-util bem-text-sm">Velocidade do Vento</span>
                                <div class="bem-font-medium">${atual.wind_speed_10m} km/h</div>
                            </div>
                            <div class="bem-card bem-card--flat bem-p-md bem-text-center">
                                <span class="bem-text-muted-util bem-text-sm">Máx / Mín do Dia</span>
                                <div class="bem-font-medium">${diario.temperature_2m_max[0]}°C / ${diario.temperature_2m_min[0]}°C</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            containerResultado.innerHTML = `
                <div class="bem-alert bem-alert--danger bem-mt-md">
                    <span class="bem-alert__icon">❌</span>
                    <div class="bem-alert__content">
                        <div class="bem-alert__title">Erro no Clima Local</div>
                        <div class="bem-alert__message">Não foi possível consultar os dados de clima da sua localização.</div>
                    </div>
                </div>
            `;
        } finally {
            containerStatus.innerHTML = "";
        }
    }, (erro) => {
        containerStatus.innerHTML = "";
        containerResultado.innerHTML = `
            <div class="bem-alert bem-alert--warning bem-mt-md">
                <span class="bem-alert__icon">⚠️</span>
                <div class="bem-alert__content">
                    <div class="bem-alert__title">Permissão Negada</div>
                    <div class="bem-alert__message">Não foi possível acessar a localização. Verifique as permissões do seu navegador.</div>
                </div>
            </div>
        `;
    });
}

/**
 * Função da página de Consulta de CEP & Dashboard de Clima.
 * 
 * @param {HTMLElement} app - Container de montagem principal da SPA
 */
async function telaClima(app) {
    const formulario = `
        <div class="bem-clima-page" id="clima-container">
            <section class="bem-page-header">
                <h1 class="bem-page-header__title">Dashboard de Clima em Tempo Real & Previsão 7 Dias</h1>
                <p class="bem-page-header__subtitle bem-mb-lg">
                    Digite um CEP para explorar a previsão completa da sua cidade com mapa minimalista light e detalhes do sol.
                </p>
                <form id="form-consulta-cep" class="bem-form bem-card--white-glass bem-form--centered bem-clima-form">
                    <div class="bem-form__group">
                        <label for="cep" class="bem-form__label bem-form__label--required">CEP</label>
                        <div class="bem-clima-input-wrap">
                            <input type="text" id="cep" class="bem-form__input" placeholder="Ex: 01001-000" maxlength="9" required autocomplete="off">
                            <button type="submit" id="btn-buscar-cep" class="bem-btn bem-btn--primary bem-btn--search-cep">Buscar</button>
                        </div>
                    </div>
                    <div class="bem-grid bem-grid-auto bem-mt-md">
                        <div class="bem-form__group">
                            <label for="logradouro" class="bem-form__label">Logradouro</label>
                            <input type="text" id="logradouro" class="bem-form__input" readonly>
                        </div>
                        <div class="bem-form__group">
                            <label for="bairro" class="bem-form__label">Bairro</label>
                            <input type="text" id="bairro" class="bem-form__input" readonly>
                        </div>
                        <div class="bem-form__group">
                            <label for="localidade" class="bem-form__label">Cidade</label>
                            <input type="text" id="localidade" class="bem-form__input" readonly>
                        </div>
                        <div class="bem-form__group">
                            <label for="estado" class="bem-form__label">Estado</label>
                            <input type="text" id="estado" class="bem-form__input" readonly>
                        </div>
                    </div>
                </form>
                <div id="status-clima"></div>
                <div id="resultado-clima"></div>
            </section>
        </div>
    `;
    app.innerHTML = formulario;

    const formCep = document.getElementById("form-consulta-cep");
    const campoCep = document.getElementById("cep");
    const btnGeo = document.getElementById("btn-geo");

    if (campoCep) {
        // Máscara dinâmica de CEP: 00000-000
        campoCep.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "");
            if (val.length > 8) val = val.substring(0, 8);
            if (val.length > 5) {
                e.target.value = val.substring(0, 5) + "-" + val.substring(5);
            } else {
                e.target.value = val;
            }
        });

        // Busca automática quando clica fora (blur)
        campoCep.addEventListener("blur", () => {
            const val = campoCep.value.replace(/\D/g, "");
            if (val.length === 8 && val !== ultimoCepConsultado) {
                consultarCepEClima();
            }
        });
    }

    if (formCep) {
        formCep.addEventListener("submit", (e) => {
            e.preventDefault();
            consultarCepEClima();
        });
    }
    if (btnGeo) {
        btnGeo.addEventListener("click", consultarClimaPorGeolocalizacao);
    }

    // Carrega automaticamente a última busca armazenada no localStorage se existir
    const ultimoCepSalvo = localStorage.getItem("prevtempo_ultimo_cep");
    if (ultimoCepSalvo && campoCep) {
        campoCep.value = ultimoCepSalvo;
        consultarCepEClima();
    }
}

export default { 
    url: '#clima',
    label: 'Consulta CEP',
    pagina: telaClima
};
