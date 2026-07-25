async function contato(app) {
    const paginaContato = `
        <section class="bem-page-header bem-pt-xl">
            <h1 class="bem-page-header__title">Fale Conosco</h1>
            <p class="bem-page-header__subtitle bem-mb-lg">
                Envie sua mensagem ou sugestão para a equipe do PrevTempo.
            </p>
            <form class="bem-card--white-glass bem-p-lg bem-form bem-form--centered" id="formulario-de-contato">
                <div class="bem-form__group">
                    <label for="assunto" class="bem-form__label">Assunto</label>
                    <input type="text" name="assunto" id="assunto" class="bem-form__input" required placeholder="Digite o assunto">
                </div>
                <div class="bem-form__group">
                    <label for="email" class="bem-form__label">E-mail</label>
                    <input type="email" name="email" id="email" class="bem-form__input" required placeholder="seu@email.com">
                </div>
                <div class="bem-form__group">
                    <label for="mensagem" class="bem-form__label">Mensagem</label>
                    <textarea class="bem-form__textarea" name="mensagem" id="mensagem" cols="30" rows="5" required placeholder="Escreva sua mensagem aqui..."></textarea>
                </div>
                <button type="submit" class="bem-btn bem-btn--primary bem-mt-sm">Enviar Mensagem</button>
            </form>
            <ul id="lista_de_contatos" class="bem-mt-lg bem-form--centered"></ul>
        </section>
    `;

    app.innerHTML = paginaContato;
    await capturarFormulario();
}

async function capturarFormulario() {
    const formulario = document.getElementById('formulario-de-contato');
    if (!formulario) return;

    formulario.addEventListener("submit", function (event) {
        event.preventDefault();
        const lista = document.getElementById('lista_de_contatos');
        const li = document.createElement('li');
        li.className = "bem-card--white-glass bem-p-md bem-mb-sm";
        
        const assunto = document.getElementById('assunto').value;
        const email = document.getElementById('email').value;
        const mensagem = document.getElementById('mensagem').value;

        li.innerHTML = `
            <strong>Assunto:</strong> ${assunto} <br>
            <strong>E-mail:</strong> ${email} <br>
            <strong>Mensagem:</strong> ${mensagem}
        `;
        lista.appendChild(li);

        formulario.reset();
    });
}

export default {
    url: '#contato',
    label: 'Contato',
    pagina: contato
};
