function sobre(app) {
    const conteudoSobre = `
        <section class="bem-page-header bem-pt-xl">
            <h1 class="bem-page-header__title">Sobre o PrevTempo</h1>
            <p class="bem-page-header__subtitle bem-mb-lg">
                Conheça a tecnologia e o propósito por trás da nossa plataforma meteorológica.
            </p>
            <div class="bem-card--white-glass bem-p-lg bem-form--centered bem-text-center">
                <p class="bem-mb-md">
                    O <strong>PrevTempo</strong> é uma aplicação web moderna construída com arquitetura SPA (Single Page Application) em Vanilla JavaScript.
                </p>
                <p>
                    Nosso objetivo é fornecer informações meteorológicas rápidas, precisas e acessíveis com um design elegante e interativo.
                </p>
            </div>
        </section>
    `;
    app.innerHTML = conteudoSobre;
}

export default {
    url: '#sobre',
    label: 'Sobre',
    pagina: sobre
};
