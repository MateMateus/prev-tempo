import buscarServicos, { buscarCoordenadasPorCidade, buscarClimaPorCoordenadas, traduzirCodigoTempo } from "../services/api.js";

/**
 * Função assíncrona responsável pela consulta por CEP e renderização visual em 3D White Glass.
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
                <div class="bem-alert__message">Buscando endereço e dados climáticos em tempo real...</div>
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
                        <div class="bem-alert__message">Não foi possível carregar os dados de clima da Open-Meteo para ${cidade}.</div>
                    </div>
                </div>
            `;
            return;
        }

        const atual = climaData.current;
        const diario = climaData.daily;
        const infoCondicao = traduzirCodigoTempo(atual.weather_code);

        // Layout Redesign 3D White Glass com cartões internos em #f8fafc e ícone 3D em alta resolução
        containerResultado.innerHTML = `
            <div class="bem-card--white-glass bem-mt-lg bem-animate-slide-up">
                <div class="bem-weather-hero">
                    <div>
                        <h2 class="bem-weather-hero__city">${cidade} - ${dadosEndereco.uf || coords.estado}</h2>
                        <div class="bem-weather-hero__subtitle">${infoCondicao.descricao} • Coordenadas: ${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°</div>
                        <div class="bem-weather-hero__temp">${atual.temperature_2m}°C</div>
                    </div>
                    <div>
                        <img src="${infoCondicao.icone}" alt="${infoCondicao.descricao}" class="bem-icon-3d" loading="lazy">
                    </div>
                </div>
                <div class="bem-p-lg">
                    <div class="bem-grid bem-grid-auto">
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Sensação Térmica</span>
                            <div class="bem-weather-subcard__value">${atual.apparent_temperature}°C</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Umidade do Ar</span>
                            <div class="bem-weather-subcard__value">${atual.relative_humidity_2m}%</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Velocidade do Vento</span>
                            <div class="bem-weather-subcard__value">${atual.wind_speed_10m} km/h</div>
                        </div>
                        <div class="bem-weather-subcard">
                            <span class="bem-weather-subcard__label">Máx / Mín do Dia</span>
                            <div class="bem-weather-subcard__value">${diario.temperature_2m_max[0]}°C / ${diario.temperature_2m_min[0]}°C</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
 * Função principal da página de Consulta de CEP e Clima.
 * 
 * @param {HTMLElement} app - Container principal da SPA
 */
async function telaClima(app) {
    const formulario = `
        <section class="bem-container bem-pt-xl bem-pb-xl">
            <h1 class="bem-mb-md">Consulta por CEP & Clima em Tempo Real</h1>
            <p class="bem-text-muted-util bem-mb-lg">
                Digite um CEP para buscar o endereço e visualizar as condições meteorológicas em um design 3D moderno.
            </p>
            <form id="form-consulta-cep" class="bem-form bem-card--white-glass bem-p-lg">
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
