async function buscarServicos(url, dados = "", forma = "") {
    try {
        const formataURL = `${url}${dados}${forma}`;
        const response = await fetch(formataURL);
        if (!response.ok) {
            throw new Error(`Erro na requisição HTTP: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Erro no serviço de API:", error);
        return null;
    }
}

export default buscarServicos;
