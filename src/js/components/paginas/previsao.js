const cidadesExemplo = [
    {
        cidade: 'São Paulo, SP',
        temperatura: '24°C',
        condicao: 'Ensolarado',
        umidade: '65%',
        icone: '☀️'
    },
    {
        cidade: 'Rio de Janeiro, RJ',
        temperatura: '29°C',
        condicao: 'Parcialmente Nublado',
        umidade: '70%',
        icone: 'Partly Cloudy ⛅'
    },
    {
        cidade: 'Curitiba, PR',
        temperatura: '18°C',
        condicao: 'Chuva Fina',
        umidade: '85%',
        icone: '🌧️'
    },
    {
        cidade: 'Belo Horizonte, MG',
        temperatura: '26°C',
        condicao: 'Céu Limpo',
        umidade: '60%',
        icone: '🌤️'
    }
];

function previsao(app) {
    // Variável local limpa a cada execução para evitar duplicação no DOM ao navegar
    let cardClima = `
        <section class="bem-container bem-pt-xl">
            <h1 class="bem-mb-md">Previsão do Tempo Regional</h1>
            <div class="bem-grid-auto">
    `;

    for (let i = 0; i < cidadesExemplo.length; i++) {
        cardClima += `
            <div class="bem-card">
                <div class="bem-card__header">
                    <h3 class="bem-card__title">${cidadesExemplo[i].cidade}</h3>
                </div>
                <div class="bem-card__body">
                    <div class="bem-text-2xl bem-mb-sm">${cidadesExemplo[i].icone} ${cidadesExemplo[i].temperatura}</div>
                    <p><strong>Condição:</strong> ${cidadesExemplo[i].condicao}</p>
                    <p><strong>Umidade:</strong> ${cidadesExemplo[i].umidade}</p>
                </div>
            </div>
        `;
    }

    cardClima += `
            </div>
        </section>
    `;

    app.innerHTML = cardClima;
}

export default {
    url: '#previsao',
    label: 'Previsão',
    pagina: previsao
};
