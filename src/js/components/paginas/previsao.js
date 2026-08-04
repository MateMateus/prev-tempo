import { buscarClimaPorCoordenadas, traduzirCodigoTempo } from "../services/api.js";

// Lista estática com as coordenadas das principais capitais brasileiras para consulta rápida
const capitais = [
    { nome: 'São Paulo', uf: 'SP', lat: -23.5505, lon: -46.6333 },
    { nome: 'Rio de Janeiro', uf: 'RJ', lat: -22.9068, lon: -43.1729 },
    { nome: 'Curitiba', uf: 'PR', lat: -25.4284, lon: -49.2733 },
    { nome: 'Brasília', uf: 'DF', lat: -15.7801, lon: -47.9292 },
    { nome: 'Salvador', uf: 'BA', lat: -12.9714, lon: -38.5014 },
    { nome: 'Manaus', uf: 'AM', lat: -3.1190, lon: -60.0217 }
];

/**
 * Função assíncrona da página de Previsão de Capitais.
 * Demonstra o uso de requisições paralelas com resiliência a falhas individuais.
 * 
 * @param {HTMLElement} app - Container de montagem da SPA
 */
async function previsao(app) {
    // 1. Exibe estado de carregamento temporário na tela enquanto as promessas são processadas
    app.innerHTML = `
        <section class="bem-container bem-pt-xl">
            <h1 class="bem-mb-md">Previsão em Tempo Real - Capitais</h1>
            <div class="bem-alert bem-alert--info bem-flex bem-items-center bem-gap-md">
                <span class="bem-spinner bem-spinner--primary"></span>
                <div class="bem-alert__content">
                    <div class="bem-alert__title">Carregando capitais...</div>
                    <div class="bem-alert__message">Obtendo os dados meteorológicos ao vivo da Open-Meteo API.</div>
                </div>
            </div>
        </section>
    `;

    // 2. Mapeia o array de capitais gerando uma lista (array) de Promessas assíncronas
    const promessasCapitais = capitais.map(async (cidade) => {
        const clima = await buscarClimaPorCoordenadas(cidade.lat, cidade.lon);
        if (!clima || !clima.current) {
            throw new Error(`Dados indisponíveis para ${cidade.nome}`);
        }
        return { ...cidade, clima };
    });

    // PONTO TÉCNICO CHAVE: Promise.allSettled()
    // Diferente de Promise.all() (que rejeita imediatamente se UMA ÚNICA requisição falhar),
    // Promise.allSettled() aguarda a conclusão de TODAS as promessas e retorna o status de cada uma:
    // - { status: 'fulfilled', value: data } para requisições bem-sucedidas
    // - { status: 'rejected', reason: error } para requisições que falharam
    // Isso garante que uma falha em São Paulo, por exemplo, não impeça a exibição do clima de Curitiba ou Rio de Janeiro!
    const resultados = await Promise.allSettled(promessasCapitais);

    // 3. Declaração da variável 'cardClima' NO ESCOPO LOCAL da função.
    // Isso evita o acúmulo de HTML e duplicação de cards no DOM ao navegar repetidas vezes para esta rota.
    let cardClima = `
        <section class="bem-container bem-pt-xl bem-pb-xl">
            <h1 class="bem-mb-md">Previsão Meteorológica ao Vivo - Capitais</h1>
            <p class="bem-text-muted-util bem-mb-lg">
                Acompanhe o clima atualizado em tempo real nas principais capitais brasileiras via Open-Meteo.
            </p>
            <div class="bem-grid-auto">
    `;

    // 4. Itera sobre os resultados resolvidos por Promise.allSettled
    for (let i = 0; i < resultados.length; i++) {
        const res = resultados[i];
        const cidadeOriginal = capitais[i];

        // Se a promessa específica foi cumprida com sucesso (fulfilled)
        if (res.status === 'fulfilled' && res.value && res.value.clima) {
            const data = res.value;
            const atual = data.clima.current;
            const diario = data.clima.daily;
            const condicao = traduzirCodigoTempo(atual.weather_code);

            cardClima += `
                <div class="bem-card bem-animate-fade-in">
                    <div class="bem-card__header bem-flex bem-justify-between bem-items-center">
                        <div>
                            <h3 class="bem-card__title">${data.nome} - ${data.uf}</h3>
                            <span class="bem-card__subtitle">${condicao.descricao}</span>
                        </div>
                        <div class="bem-text-2xl">${condicao.icone}</div>
                    </div>
                    <div class="bem-card__body">
                        <div class="bem-text-2xl bem-font-bold bem-text-primary bem-mb-sm">${atual.temperature_2m}°C</div>
                        <p><strong>Sensação:</strong> ${atual.apparent_temperature}°C</p>
                        <p><strong>Umidade:</strong> ${atual.relative_humidity_2m}%</p>
                        <p><strong>Vento:</strong> ${atual.wind_speed_10m} km/h</p>
                    </div>
                    <div class="bem-card__footer bem-text-sm bem-text-muted-util">
                        Máx: ${diario.temperature_2m_max[0]}°C | Mín: ${diario.temperature_2m_min[0]}°C
                    </div>
                </div>
            `;
        } else {
            // Tratamento gracioso individual: exibe um card de alerta apenas para a cidade que falhou
            cardClima += `
                <div class="bem-card bem-card--flat bem-p-md bem-border-primary">
                    <h3 class="bem-card__title bem-text-danger">${cidadeOriginal.nome} - ${cidadeOriginal.uf}</h3>
                    <p class="bem-text-sm bem-mt-sm">Não foi possível carregar o clima para esta cidade no momento.</p>
                </div>
            `;
        }
    }

    cardClima += `
            </div>
        </section>
    `;

    // 5. Injeta o HTML final gerado no container da aplicação
    app.innerHTML = cardClima;
}

export default {
    url: '#previsao',
    label: 'Previsão Capitais',
    pagina: previsao
};
