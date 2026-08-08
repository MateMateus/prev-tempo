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

// Armazenamento em LocalStorage (persistente entre recarregamentos e sessões com suporte a TTL)
const memoriaPermanente = {
    existe(chave, ttlMs = 0) {
        try {
            const dado = localStorage.getItem(chave);
            if (!dado) return false;
            if (ttlMs <= 0) return true;
            const parsed = JSON.parse(dado);
            if (parsed && typeof parsed === 'object' && parsed.timestamp) {
                const expirou = (Date.now() - parsed.timestamp) > ttlMs;
                if (expirou) {
                    localStorage.removeItem(chave);
                    return false;
                }
            }
            return true;
        } catch {
            return false;
        }
    },
    buscarDadosLocal(chave) {
        try {
            const dado = localStorage.getItem(chave);
            if (!dado) return null;
            const parsed = JSON.parse(dado);
            if (parsed && typeof parsed === 'object' && 'timestamp' in parsed && 'payload' in parsed) {
                return parsed.payload;
            }
            return parsed;
        } catch (error) {
            console.error("Erro ao ler do localStorage:", error);
            return null;
        }
    },
    salvarDadosLocal(chave, valor) {
        try {
            const itemComTimestamp = {
                timestamp: Date.now(),
                payload: valor
            };
            localStorage.setItem(chave, JSON.stringify(itemComTimestamp));
        } catch (error) {
            console.error("Erro ao salvar no localStorage:", error);
        }
    }
};

export { memoriaTemporaria, memoriaPermanente };
