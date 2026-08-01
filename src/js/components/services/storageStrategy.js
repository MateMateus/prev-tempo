/**
 * Estratégia de Armazenamento para Caches do PrevTempo / App Livros
 */

// Armazenamento em memória RAM (volátil durante a sessão da página)
const mapa = new Map();

const memoriaTemporaria = {
    existe(chave) {
        return mapa.has(chave);
    },
    buscarDadosLocal(chave) {
        return mapa.get(chave);
    },
    salvarDadosLocal(chave, valor) {
        mapa.set(chave, valor);
    }
};

// Armazenamento em LocalStorage (persistente entre recarregamentos e sessões)
const memoriaPermanente = {
    existe(chave) {
        return localStorage.getItem(chave) !== null;
    },
    buscarDadosLocal(chave) {
        try {
            const dado = localStorage.getItem(chave);
            return dado ? JSON.parse(dado) : null;
        } catch (error) {
            console.error("Erro ao ler do localStorage:", error);
            return null;
        }
    },
    salvarDadosLocal(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (error) {
            console.error("Erro ao salvar no localStorage:", error);
        }
    }
};

export { memoriaTemporaria, memoriaPermanente };
