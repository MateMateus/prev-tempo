async function home(app) {
    const paginaInicial = `
        <section class="bem-page-header bem-pt-xl">
            <h1 class="bem-page-header__title">Bem-vindo ao PrevTempo ☀️🌧️</h1>
            <p class="bem-page-header__subtitle bem-mb-lg">
                Sua plataforma simples e rápida para consultar a previsão do tempo e condições meteorológicas em tempo real.
            </p>
            <div class="bem-flex bem-justify-center bem-gap-md bem-mt-md">
                <a href="#clima" class="bem-btn bem-btn--primary">Consultar por CEP</a>
                <a href="#previsao" class="bem-btn bem-btn--outline">Previsão Geral</a>
            </div>
        </section>
    `;
    app.innerHTML = paginaInicial;
}

export default {
    url: '#inicio',
    label: 'Início',
    pagina: home
};
