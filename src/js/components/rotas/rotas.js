import home from '../paginas/home.js';
import clima from '../paginas/clima.js';
import previsao from '../paginas/previsao.js';
import sobre from '../paginas/sobre.js';
import contato from '../paginas/contato.js';

const roteador = [
    { ...home, titulo: 'PrevTempo - Início' },
    { ...clima, titulo: 'PrevTempo - Consulta CEP e Clima' },
    { ...previsao, titulo: 'PrevTempo - Previsão das Capitais' },
    { ...sobre, titulo: 'PrevTempo - Sobre o Projeto' },
    { ...contato, titulo: 'PrevTempo - Contato' }
];

export default roteador;

