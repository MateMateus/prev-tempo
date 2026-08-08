/**
 * Componente Footer Global
 * Renderiza o rodapé da aplicação SPA.
 * 
 * @param {HTMLElement} container - Elemento HTML onde o footer será inserido (ou retorna a string HTML)
 */
export function footer(container) {
    const anoAtual = new Date().getFullYear();
    const html = `
        <div class="bem-container bem-text-center">
            <p class="bem-text-muted-util bem-text-sm">
                &copy; ${anoAtual} <strong>PrevTempo</strong>. Todos os direitos reservados.
            </p>
            <p class="bem-text-muted-util bem-text-xs bem-mt-xs">
                Desenvolvido com JavaScript Vanilla, HTML5 e CSS (BEM). Dados meteorológicos fornecidos por Open-Meteo & ViaCEP.
            </p>
        </div>
    `;

    if (container) {
        container.className = "bem-footer";
        container.innerHTML = html;
    }
    return html;
}

export default footer;
