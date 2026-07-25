function sobre(app) {
    const conteudoSobre = `
        <section class="bem-container bem-pt-xl">
            <h1 class="bem-mb-md">Sobre o PrevTempo</h1>
            <div class="bem-card bem-p-lg">
                <p class="bem-mb-md">
                    O <strong>PrevTempo</strong> é uma aplicação web moderna construída com arquitetura SPA (Single Page Application) em Vanilla JavaScript.
                </p>
                <p>
                    Nosso objetivo é fornecer informações meteorológicas rápidas, precisas e acessíveis para qualquer região.
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
