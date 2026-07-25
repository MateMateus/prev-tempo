function navbar(item_menu) {
    const navbarElement = document.getElementById('navbar');
    navbarElement.innerHTML = `
        <nav class="bem-navbar">
            <a href="#inicio" class="bem-navbar__brand">☀️ PrevTempo</a>
            <input type="checkbox" id="nav-toggle" class="bem-navbar__checkbox">
            <label for="nav-toggle" class="bem-navbar__toggle">☰</label>
            <ul class="bem-navbar__menu">
                ${
                    item_menu.map((item) => {
                        return `
                            <li class="bem-navbar__item">
                                <a href="${item.url}" class="bem-navbar__link">${item.label}</a>
                            </li>
                        `;
                    }).join('')
                }
            </ul>
        </nav>
    `;
}

export default navbar;
