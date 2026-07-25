import buscarServicos, { buscarCoordenadasPorCidade, buscarClimaPorCoordenadas, traduzirCodigoTempo } from "../services/api.js";

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
 * Atualiza o mapa interativo Leaflet.js com estilo Light Minimalista (CartoDB Positron)
 * e adiciona um círculo translúcido destacando a zona de demarcação do bairro do CEP.
 */
function atualizarMapaLeaflet(lat, lon, nomeCidade) {
    const containerMapa = document.getElementById("mapa-clima");
    if (!containerMapa || !window.L) return;

    if (instanciaMapaLeaflet) {
        instanciaMapaLeaflet.remove();
        instanciaMapaLeaflet = null;
    }

    instanciaMapaLeaflet = window.L.map('mapa-clima').setView([lat, lon], 13);

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(instanciaMapaLeaflet);

    window.L.marker([lat, lon]).addTo(instanciaMapaLeaflet)
        .bindPopup(`<b>${nomeCidade}</b><br>Coordenadas: ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`)
        .openPopup();

    window.L.circle([lat, lon], {
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.25,
        radius: 1200
    }).addTo(instanciaMapaLeaflet);
}

/**
 * Renderiza o painel da dashboard com base no dia selecionado (index 0 a 6).
 */
function renderizarDashboard(indexSelecionado = 0) {
    const containerResultado = document.getElementById("resultado-clima");
    if (!containerResultado || !dadosClimaAtuais) return;

    const { cidade, estado, coords, climaData } = dadosClimaAtuais;
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

    containerResultado.innerHTML = `
        <div class="bem-dashboard-grid bem-animate-slide-up">
            <!-- COLUNA ESQUERDA: HERO, 7 DIAS E MAPA LIGHT -->
            <div class="bem-flex bem-flex-col bem-gap-lg">
                <!-- HERO CARD -->
                <div class="bem-card--white-glass">
                    <div class="bem-weather-hero">
                        <div>
                            <h2 class="bem-weather-hero__city">${cidade} - ${estado}</h2>
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

                <!-- MAPA LEAFLET LIGHT MINIMALISTA COM ZONA DE DEMARCAÇÃO -->
                <div class="bem-card--white-glass">
                    <h4 class="bem-font-bold bem-mb-sm">📍 Localização & Cobertura do Bairro (Mapa Minimalista Light)</h4>
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
                            <div class="bem-weather-subcard__value">${tempMaxDia}° / ${tempMinDia}°</div>
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

    atualizarMapaLeaflet(coords.lat, coords.lon, cidade);

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
                    <div class="bem-alert__message">Por favor, digite um CEP válido com 8 dígitos.</div>
                </div>
            </div>
        `;
        return;
    }

    containerStatus.innerHTML = `
        <div class="bem-alert bem-alert--info bem-mt-md bem-animate-fade-in">
            <span class="bem-alert__icon">⏳</span>
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
                <div class="bem-alert bem-alert--danger bem-mt-md">
                    <span class="bem-alert__icon">❌</span>
                    <div class="bem-alert__content">
                        <div class="bem-alert__title">CEP não encontrado</div>
                        <div class="bem-alert__message">Não encontramos informações para o CEP informado.</div>
                    </div>
                </div>
            `;
            return;
        }

        document.getElementById("logradouro").value = dadosEndereco.logradouro || "";
        document.getElementById("bairro").value = dadosEndereco.bairro || "";
        document.getElementById("localidade").value = dadosEndereco.localidade || "";
        document.getElementById("estado").value = dadosEndereco.estado || "";

        const cidade = dadosEndereco.localidade;
        const coords = await buscarCoordenadasPorCidade(cidade);
        
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
            estado: dadosEndereco.uf || coords.estado,
            coords,
            climaData
        };

        renderizarDashboard(0);
    } catch (error) {
        console.error("Erro no fluxo de consulta por CEP:", error);
        containerResultado.innerHTML = `
            <div class="bem-alert bem-alert--danger bem-mt-md">
                <span class="bem-alert__icon">🚨</span>
                <div class="bem-alert__content">
                    <div class="bem-alert__title">Erro Inesperado</div>
                    <div class="bem-alert__message">Ocorreu um erro ao processar sua solicitação. Tente novamente.</div>
                </div>
            </div>
        `;
    } finally {
        containerStatus.innerHTML = "";
    }
}

/**
 * Função da página de Consulta de CEP & Dashboard de Clima.
 * 
 * @param {HTMLElement} app - Container de montagem principal da SPA
 */
async function telaClima(app) {
    const formulario = `
        <section class="bem-page-header bem-pt-xl">
            <h1 class="bem-page-header__title">Dashboard de Clima em Tempo Real & Previsão 7 Dias</h1>
            <p class="bem-page-header__subtitle bem-mb-lg">
                Digite um CEP para explorar a previsão completa da sua cidade com mapa minimalista light, zona de demarcação e detalhes do sol.
            </p>
            <form id="form-consulta-cep" class="bem-form bem-card--white-glass bem-form--centered">
                <div class="bem-form__group">
                    <label for="cep" class="bem-form__label bem-form__label--required">CEP</label>
                    <div class="bem-flex bem-gap-sm">
                        <input type="text" id="cep" class="bem-form__input" placeholder="Ex: 01001000" maxlength="9" required>
                        <button type="button" id="btn-buscar-cep" class="bem-btn bem-btn--primary">Buscar</button>
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
    `;
    app.innerHTML = formulario;

    const campoCep = document.getElementById("cep");
    const btnBuscar = document.getElementById("btn-buscar-cep");

    if (campoCep) {
        campoCep.addEventListener("blur", consultarCepEClima);
    }
    if (btnBuscar) {
        btnBuscar.addEventListener("click", consultarCepEClima);
    }
}

export default { 
    url: '#clima',
    label: 'Consulta CEP',
    pagina: telaClima
};
