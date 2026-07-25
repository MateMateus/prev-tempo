import buscarServicos from "../services/api.js";

async function capturacep() {
    const campocep = document.getElementById("cep");
    if (!campocep) return;

    campocep.addEventListener("blur", async (event) => {
        const valorCep = event.target.value.replace(/\D/g, "");
        if (valorCep.length === 8) {
            const dados = await buscarServicos("https://viacep.com.br/ws/", valorCep, "/json/");
            if (dados && !dados.erro) {
                document.getElementById("logradouro").value = dados.logradouro || "";
                document.getElementById("bairro").value = dados.bairro || "";
                document.getElementById("localidade").value = dados.localidade || "";
                document.getElementById("estado").value = dados.estado || "";
            }
        }
    });
}

async function telaClima(app) {
    const formulario = `
        <section class="bem-container bem-pt-xl">
            <h1 class="bem-mb-md">Consulta de Endereço & Clima Regional</h1>
            <form id="cadastroCliente" class="bem-form bem-card bem-p-lg">
                <div class="bem-form__group">
                    <label for="cep" class="bem-form__label">CEP (digite para buscar)</label>
                    <input type="text" id="cep" class="bem-form__input" placeholder="00000-000">
                </div>
                <div class="bem-form__group">
                    <label for="logradouro" class="bem-form__label">Logradouro</label>
                    <input type="text" id="logradouro" class="bem-form__input">
                </div>
                <div class="bem-form__group">
                    <label for="bairro" class="bem-form__label">Bairro</label>
                    <input type="text" id="bairro" class="bem-form__input">
                </div>
                <div class="bem-form__group">
                    <label for="localidade" class="bem-form__label">Localidade / Cidade</label>
                    <input type="text" id="localidade" class="bem-form__input">
                </div>
                <div class="bem-form__group">
                    <label for="estado" class="bem-form__label">Estado</label>
                    <input type="text" id="estado" class="bem-form__input">
                </div>
            </form>
        </section>
    `;
    app.innerHTML = formulario;
    await capturacep();
}

export default { 
    url: '#clima',
    label: 'Consulta CEP',
    pagina: telaClima
};
