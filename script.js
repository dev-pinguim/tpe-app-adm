// TPE Suzano — Script Principal v6.4.6

const API_URL = "https://script.google.com/macros/s/AKfycbzKn4WUAvN_VOzHmf2Wh2jmw3XLXVpyxfDOWYV_K0ilgKCdIDUnXbHAwf3wvLAH6oNHvA/exec";

let contatosDB = [];
let designacoesSalvas = {};
let atualizacoesDB = [];
let excluidos = [];
function eAdmin() { return adminToken.length === 36; }
let adminToken = '';
let currentSelecaoId = '';
let currentSelecaoDia = '';
let currentSelecaoTurno = '';
let filtroSexoSelecao = '';

let cloudContatosSnapshot = '';

function debounce(fn, delay = 120) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

const nomesDias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const padraoSemanal = {
    "Segunda": [{ local: "Praça dos Correios", turnos: ["09h às 12h", "12h às 15h", "15h às 17h"] }],
    "Terça": [{ local: "Estação CPTM (Terminal)", turnos: ["09h às 12h", "12h às 15h", "15h às 17h"] }],
    "Quarta": [{ local: "Praça da Igreja", turnos: ["09h às 12h", "12h às 15h", "15h às 17h"] }],
    "Quinta": [{ local: "Estação CPTM (Centro)", turnos: ["09h às 12h", "12h às 15h", "15h às 17h"] }],
    "Sexta": [{ local: "Hospital Santa Casa", turnos: ["09h às 12h", "12h às 15h", "15h às 18h", "18h às 20h"] }],
    "Sábado": [
        { local: "Parque Max Feffer", turnos: ["09h às 11h", "11h às 13h", "13h às 15h", "15h às 17h"] },
        { local: "Estação CPTM (Centro)", turnos: ["09h às 11h", "11h às 13h", "13h às 15h", "15h às 17h"] },
        { local: "Feira Miguel Badra", turnos: ["08h às 10h", "10h às 12h", "12h às 14h"] }
    ],
    "Domingo": [
        { local: "Parque Max Feffer", turnos: ["09h às 11h", "11h às 13h", "13h às 15h", "15h às 17h"] },
        { local: "Hospital Santa Casa", turnos: ["09h às 11h"] },
        { local: "Feira Dona Benta", turnos: ["08h às 10h", "10h às 12h", "12h às 14h"] }
    ]
};

const fdsMapping = {
    "Manhã (08h às 13h)": ["08h às 10h", "09h às 11h", "10h às 12h", "11h às 13h"],
    "Tarde (12h às 17h)": ["12h às 14h", "13h às 15h", "15h às 17h"]
};

let dataHoje = new Date();
let dataHomeVisao = new Date(dataHoje.getFullYear(), dataHoje.getMonth(), 1);
let dataFocoGerador = new Date(2026, 3, 1);

const SVG_CHECK = `<svg class="inline-icon" style="color:var(--primary);" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const SVG_PIN = `<svg class="inline-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
const SVG_CLOCK = `<svg class="inline-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const SVG_USER = `<svg class="inline-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

function localLink(nomeLocal) {
    const loc = locaisCache.find(l => l.nome === nomeLocal);
    if (loc) {
        return `<button class="local-link-btn" onclick="abrirLocalModal('${loc.id}')">${SVG_PIN}${nomeLocal}</button>`;
    }
    return `${SVG_PIN} ${nomeLocal}`;
}


function getWaIcon() {
    return `<svg class="wa-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
}

function formatarNome(nomeStr) {
    if (!nomeStr || nomeStr === "Vazio") return "Vazio";
    let c = contatosDB.find(x => x.nome === nomeStr);
    let nomeLimpo = nomeStr.replace(/\s*\([^)]+\)/g, '').trim();
    let cong = (c && c.congregacao && c.congregacao.trim() !== "Outros") ? c.congregacao.trim() : extrairCongregacaoDoNome(nomeStr);

    if (!cong || cong === "Outros") return nomeLimpo;
    return `${nomeLimpo} <span class="cong-badge">(${cong})</span>`;
}

function mostrarLoading(mostrar, texto = "Carregando...") {
    const overlay = document.getElementById('loadingOverlay');
    document.getElementById('loadingText').textContent = texto;
    overlay.style.display = mostrar ? 'flex' : 'none';
}

function mostrarModalInfoCustom(htmlContent, showButton = true, autoCloseSeconds = 0) {
    const modal = document.getElementById('modalGenericInfo');
    const body = document.getElementById('modalGenericBody');
    const footer = document.getElementById('modalGenericFooter');

    body.innerHTML = htmlContent;
    footer.style.display = showButton ? 'flex' : 'none';
    modal.classList.add('active');
    const box = modal.querySelector('.modal-box');
    if (box) box.scrollTop = 0;
    body.scrollTop = 0;

    if (autoCloseSeconds > 0) {
        setTimeout(() => {
            modal.classList.remove('active');
        }, autoCloseSeconds * 1000);
    }
}

function toggleSenha(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('svg');
    if (input.type === 'password') {
        input.type = 'text';
        icon.style.color = 'var(--primary)';
    } else {
        input.type = 'password';
        icon.style.color = 'var(--text-muted)';
    }
}


function _migrarHorarioSexta(designacoes) {
    let alterou = false;
    Object.keys(designacoes).forEach(chaveMes => {
        const mes = designacoes[chaveMes];
        Object.keys(mes).forEach(dia => {
            if (!Array.isArray(mes[dia])) return;
            mes[dia].forEach(turno => {
                if (turno.local === 'Hospital Santa Casa' && turno.horario === '15h às 17h') {
                    turno.horario = '15h às 18h';
                    alterou = true;
                }
            });
        });
    });
    return alterou;
}

async function carregarDadosDaNuvem() {
    const cacheContatos = localStorage.getItem('tpe_contatos');
    const cacheDesignacoes = localStorage.getItem('tpe_designacoes');
    const cacheAtualizacoes = localStorage.getItem('tpe_atualizacoes');
    const cacheExcluidos = localStorage.getItem('tpe_excluidos');

    const cacheLocais = localStorage.getItem('tpe_locais_cache');

    if (cacheContatos && cacheDesignacoes) {
        contatosDB = JSON.parse(cacheContatos);
        designacoesSalvas = JSON.parse(cacheDesignacoes);
        atualizacoesDB = cacheAtualizacoes ? JSON.parse(cacheAtualizacoes) : [];
        excluidos = cacheExcluidos ? JSON.parse(cacheExcluidos) : [];
        if (cacheLocais) locaisCache = JSON.parse(cacheLocais);

        if (_migrarHorarioSexta(designacoesSalvas)) {
            localStorage.setItem('tpe_designacoes', JSON.stringify(designacoesSalvas));
        }

        popularCongregacoes();
        filtrarContatos();
        renderizarHome();
        console.log("App carregado via cache local (Instantâneo)");
    } else {
        mostrarLoading(true, "Primeiro acesso: baixando dados...");
    }

    try {
        let res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "getDados" }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let data = JSON.parse(await res.text());

        if (data.status === "error") throw new Error(data.message);

        contatosDB = (data.contatos || []).filter(c => c && c.nome);
        designacoesSalvas = data.designacoes || {};
        _migrarHorarioSexta(designacoesSalvas);
        atualizacoesDB = (data.atualizacoes || []).filter(a => a && a.nome);
        excluidos = (data.excluidos || []).filter(e => e && e.nome);
        if (Array.isArray(data.locais)) {
            locaisCache = data.locais;
            try { localStorage.setItem('tpe_locais_cache', JSON.stringify(locaisCache)); } catch (e) { }
        }

        localStorage.setItem('tpe_contatos', JSON.stringify(contatosDB));
        localStorage.setItem('tpe_designacoes', JSON.stringify(designacoesSalvas));
        localStorage.setItem('tpe_atualizacoes', JSON.stringify(atualizacoesDB));
        localStorage.setItem('tpe_excluidos', JSON.stringify(excluidos));

        cloudContatosSnapshot = JSON.stringify(contatosDB);

        popularCongregacoes();
        filtrarContatos();
        renderizarHome();
        if (eAdmin()) renderizarListaDisponibilidade();

        const paginaAtual = document.querySelector('.page.active');
        if (paginaAtual && paginaAtual.id === 'pageEstatisticas') {
            renderizarVisaoGeral();
        }

    } catch (erro) {
        console.error("Erro ao atualizar dados da nuvem:", erro);
        if (!cacheContatos) {
            mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro de Conexão</h3><p>Verifique sua internet.</p>');
        }
    }
    mostrarLoading(false);
}


async function _executarSyncContatos() {
    localStorage.setItem('tpe_contatos', JSON.stringify(contatosDB));
    mostrarLoading(true, "Sincronizando...");
    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "syncContatos", contatos: contatosDB, token: adminToken }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        cloudContatosSnapshot = JSON.stringify(contatosDB);
    } catch (e) { console.error("Erro na sincronização"); }
    mostrarLoading(false);
}

async function guardarContatosNaNuvem() {
    if (!eAdmin()) return;

    localStorage.setItem('tpe_contatos', JSON.stringify(contatosDB));
    cloudContatosSnapshot = JSON.stringify(contatosDB);

    renderizarListaDisponibilidade();
    popularCongregacoes();
    filtrarContatos();

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "syncContatos", contatos: contatosDB, token: adminToken }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    }).then(res => res.json()).then(data => {
        if (data.status !== "success") console.error("Erro no background sync:", data.message);
    }).catch(e => console.error("Falha silenciosa ao sincronizar contatos:", e));
}

async function guardarDesignacoesNaNuvem() {
    if (!eAdmin()) return;

    localStorage.setItem('tpe_designacoes', JSON.stringify(designacoesSalvas));
    mostrarLoading(true, "Salvando...");

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "syncDesignacoes",
                designacoes: designacoesSalvas,
                token: adminToken
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
    } catch (e) {
        console.error("Erro na sincronização:", e);
        mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro ao Salvar</h3><p style="margin-top:10px;">Não foi possível salvar na nuvem. Verifique sua conexão e tente novamente.</p>');
    }

    mostrarLoading(false);
}

async function guardarAtualizacoesNaNuvem() {
    if (!eAdmin()) return;
    mostrarLoading(true, "Atualizando sistema...");
    try { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "syncAtualizacoes", atualizacoes: atualizacoesDB, token: adminToken }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } }); } catch (e) { }
    mostrarLoading(false);
}

function fecharModalWelcome() {
    fecharModal('modalGenericInfo');
}

function abrirLogin() {
    if (eAdmin()) {
        mostrarModalInfoCustom(`
            <h3 style="color:var(--danger); margin-bottom:15px;">Encerrar Sessão?</h3>
            <p style="margin-bottom: 25px; color:var(--text-main); font-size:0.95rem;">Deseja realmente sair da área administrativa?</p>
            <div style="display:flex; gap:15px; justify-content:center;">
                <button class="btn-action btn-outline" style="width:50%;" onclick="fecharModal('modalGenericInfo')">Cancelar</button>
                <button class="btn-danger" style="width:50%;" onclick="confirmarLogout()">Sair</button>
            </div>
        `, false);
    } else {
        const input = document.getElementById('inputSenha');
        input.value = "";
        input.type = 'password';
        const toggleBtn = document.querySelector('.pass-toggle svg');
        if (toggleBtn) toggleBtn.style.color = 'var(--text-muted)';
        abrirModal('modalLogin');
        setTimeout(() => {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 320);
    }
}

function confirmarLogout() {
    adminToken = '';
    try {
        sessionStorage.removeItem('tpe_admin_token');
        localStorage.removeItem('tpe_last_activity');
    } catch (e) { }
    document.querySelectorAll('.admin-only-btn').forEach(el => el.classList.add('admin-only'));
    fecharMenuAdmin();

    const btnDesk = document.getElementById('btnAdminLoginDesktop');
    if (btnDesk) {
        if (!window.REQUER_LOGIN_ADM) {
            btnDesk.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Administração`;
            btnDesk.classList.remove('logout');
        }
    }

    const btnMobHead = document.getElementById('btnAdminLoginHeaderMobile');
    if (btnMobHead && !window.REQUER_LOGIN_ADM) {
        btnMobHead.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    }

    abrirPagina('pageHome', document.querySelector('.nav-btn'));
    fecharModal('modalGenericInfo');
    mostrarModalInfoCustom('<svg class="icon-svg" style="width:40px;height:40px;color:var(--primary);margin-bottom:15px;" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg><h3 style="color:var(--primary-dark);">Sessão Encerrada</h3>', true, 3);

    // indexadm.html: a sessão é obrigatória — força novo login em seguida.
    if (window.REQUER_LOGIN_ADM) {
        setTimeout(exigirLoginObrigatorio, 3200);
    }
}

async function fazerLogin() {
    const pass = document.getElementById('inputSenha').value;
    if (!pass) { mostrarModalInfoCustom('<h3 style="color:var(--danger);">Aviso</h3><p style="margin-top:10px;">Digite a senha.</p>'); return; }

    mostrarLoading(true, "Verificando...");
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "login", senha: pass }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = JSON.parse(await res.text());
        if (data.status !== 'ok') {
            mostrarLoading(false);
            mostrarModalInfoCustom('<h3 style="color:var(--danger);">Acesso Negado</h3><p style="margin-top:10px;">Credenciais inválidas.</p>');
            return;
        }
        mostrarLoading(false);
        fecharModal('modalLogin');
        _ativarSessaoAdmin(data.token);
        try {
            sessionStorage.setItem('tpe_admin_token', data.token);
            _refreshAtividadeAdmin();
        } catch (e) { }

        if (window.REQUER_LOGIN_ADM) {
            // indexadm.html: login é obrigatório de início. Os dados só são
            // carregados da nuvem depois que a senha é validada com sucesso,
            // e o usuário já é levado direto para a tela de início/menu.
            carregarDadosDaNuvem();
            abrirPagina('pageMenuAdm', null);
        } else {
            const htmlWelcome = `
        <svg class="icon-svg" style="width:50px;height:50px;color:var(--primary);margin-bottom:20px;" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
        <h2 style="color:var(--primary-dark);">Bem-vindo!</h2>
        <p style="margin-top:15px;color:var(--text-main);font-size:1.05rem;font-weight:500;margin-bottom:25px;">Área administrativa do TPE.</p>
        <button id="btnWelcomeOk" class="btn-action" style="width:100%;" onclick="fecharModalWelcome()">OK</button>
    `;
            mostrarModalInfoCustom(htmlWelcome, false, 0);
        }
    } catch (e) {
        mostrarLoading(false);
        mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro de Conexão</h3><p style="margin-top:10px;">Não foi possível verificar suas credenciais.</p>');
    }
}

function _ativarSessaoAdmin(token) {
    adminToken = token;
    document.querySelectorAll('.admin-only-btn').forEach(el => el.classList.remove('admin-only'));

    const logoutIcon = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;

    const btnDesk = document.getElementById('btnAdminLoginDesktop');
    if (btnDesk) { btnDesk.innerHTML = `${logoutIcon} Sair da Sessão`; btnDesk.classList.add('logout'); }

    const btnMobHead = document.getElementById('btnAdminLoginHeaderMobile');
    if (btnMobHead) btnMobHead.innerHTML = logoutIcon;

    renderizarListaDisponibilidade();
}

const _SESSAO_MAX_MS = 24 * 60 * 60 * 1000;

function _refreshAtividadeAdmin() {
    try { localStorage.setItem('tpe_last_activity', Date.now().toString()); } catch (e) { }
}

function _restaurarSessaoAdmin() {
    try {
        const token = sessionStorage.getItem('tpe_admin_token');
        if (!token) return;
        const ultimaAtividade = parseInt(localStorage.getItem('tpe_last_activity') || '0', 10);
        if ((Date.now() - ultimaAtividade) > _SESSAO_MAX_MS) {
            sessionStorage.removeItem('tpe_admin_token');
            localStorage.removeItem('tpe_last_activity');
            return;
        }
        _ativarSessaoAdmin(token);
        _refreshAtividadeAdmin();
    } catch (e) { }
}

setInterval(() => {
    if (!eAdmin()) return;
    const ultimaAtividade = parseInt(localStorage.getItem('tpe_last_activity') || '0', 10);
    if ((Date.now() - ultimaAtividade) > _SESSAO_MAX_MS) {
        confirmarLogout();
        mostrarModalInfoCustom('<h3 style="color:var(--warning);">Sessão Expirada</h3><p style="margin-top:10px;">Você foi desconectado por inatividade.</p>', true, 5);
    }
}, 60 * 1000);
function getCongregacao(c) {
    if (!c) return "Outros";
    if (c.congregacao && c.congregacao.trim()) return c.congregacao.trim();
    return extrairCongregacaoDoNome(c.nome);
}
function extrairCongregacaoDoNome(nome) {
    if (!nome || typeof nome !== 'string') return "Outros";
    const match = String(nome).match(/\(([^)]+)\)/);
    return match ? match[1].trim() : "Outros";
}
function extrairCongregacao(nome) { return extrairCongregacaoDoNome(nome); }
function removerAcentos(txt) {
    if (!txt) return '';
    return String(txt).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function limparTelefone(tel) {
    if (!tel) return '';
    return String(tel).replace(/\D/g, '');
}
function mascaraTelefone(event) {
    let input = event.target;
    let val = input.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 2) val = '(' + val.substring(0, 2) + ') ' + val.substring(2);
    if (val.length > 10) val = val.substring(0, 10) + '-' + val.substring(10);
    else if (val.length > 9) val = val.substring(0, 9) + '-' + val.substring(9);
    input.value = val;
}

function formatarData(data) { return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`; }
function formatarChaveMes(ano, mes) { return `${ano}-${mes}`; }

function getInitials(nome) {
    if (!nome || typeof nome !== 'string') return "?";
    const parts = nome.trim().split(' ').filter(p => !p.startsWith('('));
    if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0]) return parts[0].substring(0, 2).toUpperCase();
    return "?";
}

const pageTitles = { pageMenuAdm: "Área Administrativa", pageHome: (window.REQUER_LOGIN_ADM ? "Designações" : "Início"), pageAtualizacao: "Disponibilidades", pageDesignacoes: "Escalas", pageDisponibilidades: "Perfis", pageContatos: "Contatos", pageEstatisticas: "Estatísticas", pageLocais: "Locais", pageEditarLocais: "Editar Locais" };

// indexadm.html: retorna à tela de início/menu administrativo (hub).
// Inofensivo em index.html (público), pois lá não existe #pageMenuAdm nem
// botões com a classe .btn-voltar-menu-adm.
function voltarMenuAdm() {
    abrirPagina('pageMenuAdm', null);
}

const pageScrollPositions = {};

function abrirPagina(id, btn) {
    const paginaAtiva = document.querySelector('.page.active');
    if (paginaAtiva) {
        pageScrollPositions[paginaAtiva.id] = paginaAtiva.scrollTop;
        paginaAtiva.classList.remove('active');
    }

    requestAnimationFrame(() => {
        const novaPagina = document.getElementById(id);
        novaPagina.classList.add('active');
        novaPagina.scrollTop = pageScrollPositions[id] || 0;

        document.querySelectorAll('.nav-btn, .b-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.nav-btn[data-page="' + id + '"], .b-nav-btn[data-page="' + id + '"]').forEach(b => b.classList.add('active'));
        if (btn && !btn.getAttribute('data-page')) {
            btn.classList.add('active');
        }

        document.getElementById('topbarTitle').textContent = pageTitles[id] || 'TPE Suzano';

        // indexadm.html: mostra o botão "voltar" em qualquer página, exceto na
        // própria tela de início/menu (não há necessidade de voltar pra ela mesma).
        const emMenuAdm = (id === 'pageMenuAdm');
        document.querySelectorAll('.btn-voltar-menu-adm').forEach(el => {
            el.style.display = emMenuAdm ? 'none' : 'flex';
        });

        if (id === 'pageHome') { document.getElementById('pageHome').scrollTop = 0; renderizarHome(); }
        if (id === 'pageAtualizacao') {
            document.getElementById('buscaAtualizar').value = '';
            document.getElementById('listaBuscaAtualizacao').innerHTML = '';
            document.getElementById('listaBuscaAtualizacao').style.display = 'none';
            document.getElementById('formAtualizacao').style.display = 'none';
        }
        if (id === 'pageContatos') { document.getElementById('pageContatos').scrollTop = 0; filtrarContatos(); }
        if (id === 'pageDisponibilidades') { document.getElementById('pageDisponibilidades').scrollTop = 0; popularCongregacoes(); renderizarListaDisponibilidade(); }
        const isEscalas = (id === 'pageDesignacoes');
        // topbar desktop
        const topbarNav = document.getElementById('topbarEscalasNav');
        const topbarTitle = document.getElementById('topbarTitle');
        if (topbarNav) topbarNav.style.display = isEscalas ? 'flex' : 'none';
        if (topbarTitle) topbarTitle.style.display = isEscalas ? 'none' : '';
        // topbar mobile
        const mobileNav = document.getElementById('mobileEscalasNav');
        const mobileBrand = document.querySelector('.mobile-brand');
        if (mobileNav) mobileNav.style.display = isEscalas ? 'flex' : 'none';
        if (mobileBrand) mobileBrand.style.display = isEscalas ? 'none' : '';

        if (id === 'pageDesignacoes') {
            const _prox = new Date();
            _prox.setDate(1);
            _prox.setMonth(_prox.getMonth() + 1);
            dataFocoGerador = _prox;
            renderizarCalendarioGerador();
        }
        if (id === 'pageEstatisticas') inicializarEstatisticas();
        if (id === 'pageLocais') renderizarLocaisPublico();
        if (id === 'pageEditarLocais') renderizarLocaisAdmin();
    });
}

function fecharModal(id) { document.getElementById(id).classList.remove('active'); }

function abrirModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('active');
    const box = modal.querySelector('.modal-box');
    const body = modal.querySelector('.modal-body');
    if (box) box.scrollTop = 0;
    if (body) body.scrollTop = 0;
}

function preencherCheckboxes(c, checkboxClass) {
    document.querySelectorAll('.' + checkboxClass).forEach(chk => {
        const dia = chk.getAttribute('data-dia');
        const val = chk.value;
        if (c.disp && c.disp[dia]) {
            if (dia === "Sábado" || dia === "Domingo") {
                const mappedSlots = fdsMapping[val] || [];
                if (mappedSlots.some(slot => c.disp[dia].includes(slot))) chk.checked = true;
            } else {
                if (c.disp[dia].includes(val)) chk.checked = true;
            }
        }
    });
}

function extrairDisponibilidades(checkboxClass) {
    let novaDisp = { "Segunda": [], "Terça": [], "Quarta": [], "Quinta": [], "Sexta": [], "Sábado": [], "Domingo": [] };
    let fdsSets = { "Sábado": new Set(), "Domingo": new Set() };

    document.querySelectorAll('.' + checkboxClass + ':checked').forEach(chk => {
        const dia = chk.getAttribute('data-dia');
        const val = chk.value;
        if (dia === "Sábado" || dia === "Domingo") {
            const mappedSlots = fdsMapping[val] || [];
            mappedSlots.forEach(slot => fdsSets[dia].add(slot));
        } else {
            novaDisp[dia].push(val);
        }
    });

    novaDisp["Sábado"] = Array.from(fdsSets["Sábado"]);
    novaDisp["Domingo"] = Array.from(fdsSets["Domingo"]);
    return novaDisp;
}

function filtrarBuscaAtualizacao() {
    const termo = removerAcentos(document.getElementById('buscaAtualizar').value.trim());
    const ul = document.getElementById('listaBuscaAtualizacao');
    document.getElementById('formAtualizacao').style.display = 'none';

    if (termo.length < 2) { ul.innerHTML = ''; ul.style.display = 'none'; return; }

    const filtrados = contatosDB.filter(c => c && c.nome && removerAcentos(c.nome).includes(termo));

    if (filtrados.length > 0) {
        ul.style.display = 'block';
        ul.innerHTML = filtrados.map(c => `
            <li class="list-item" onclick="abrirFormAtualizacao('${c.nome.replace(/'/g, "\\'")}')">
                <div class="item-info">
                    <div class="item-avatar">${getInitials(c.nome)}</div>
                    <div>
                        <div class="item-name" style="margin:0; display:flex; align-items:center; flex-wrap:wrap; gap:4px;">${formatarNome(c.nome)}</div>
                        <div class="item-sub">Toque para atualizar</div>
                    </div>
                </div>
            </li>`).join('');
    } else {
        ul.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.9rem;">Nenhum nome encontrado.</p>';
        ul.style.display = 'block';
    }
}

function abrirFormAtualizacao(nome) {
    document.getElementById('listaBuscaAtualizacao').innerHTML = '';
    document.getElementById('listaBuscaAtualizacao').style.display = 'none';
    document.getElementById('buscaAtualizar').value = nome;

    const c = contatosDB.find(x => x.nome === nome);
    if (!c) return;

    const tituloElement = document.getElementById('tituloAtualizacaoNome');
    tituloElement.innerHTML = formatarNome(c.nome);
    tituloElement.setAttribute('data-nome-real', c.nome);

    document.getElementById('attTelefone').value = c.telefone;

    const attCong = document.getElementById('attCongregacao');
    if (attCong) attCong.value = getCongregacao(c);

    document.getElementById('attObservacoes').value = c.observacoes || "";

    construirGridHorarios('gridDisponibilidadesAtualizacao', 'chk-disp-user');
    preencherCheckboxes(c, 'chk-disp-user');

    document.getElementById('formAtualizacao').style.display = 'block';
}

async function enviarSolicitacaoAtualizacao() {
    const nomeReal = document.getElementById('tituloAtualizacaoNome').getAttribute('data-nome-real') || document.getElementById('buscaAtualizar').value;

    const telefone = document.getElementById('attTelefone').value;
    const observacoes = document.getElementById('attObservacoes').value;

    const attCong = document.getElementById('attCongregacao');
    const congregacao = attCong ? attCong.value : "Outros";

    let novaDisp = extrairDisponibilidades('chk-disp-user');

    mostrarLoading(true, "Enviando solicitação...");
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "solicitarAtualizacao",
                nome: nomeReal,
                telefone: telefone,
                observacoes: observacoes,
                disp: novaDisp,
                congregacao: congregacao
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        mostrarLoading(false);

        const msgWa = encodeURIComponent("Olá irmão! Atualizei meu perfil no TPE Suzano, por gentileza, solicito que seja verificado!");
        const waLink = `https://wa.me/5511978756527?text=${msgWa}`;

        const htmlSucesso = `
            <svg class="icon-svg" style="width:50px;height:50px;color:var(--primary);margin-bottom:20px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <h3 style="color:var(--primary-dark);">Solicitação Enviada!</h3>
            <p style="margin: 15px 0 25px; color:var(--text-main); line-height:1.5;">Sua solicitação de atualização foi enviada. Por gentileza, <strong>solicite a verificação</strong> com o irmão responsável clicando abaixo:</p>
            
            <div class="list-item" style="text-align:left; border-color:var(--primary); background:var(--primary-light);">
                <div class="item-info">
                    <div class="item-avatar">JC</div>
                    <div>
                        <div class="item-name" style="margin:0;">João Carlos <span class="cong-badge">(Colorado)</span></div>
                        <div class="item-sub">(11) 97875-6527</div>
                    </div>
                </div>
                <a href="${waLink}" target="_blank" class="wa-btn">${getWaIcon()}</a>
            </div>
        `;
        mostrarModalInfoCustom(htmlSucesso, true);
        abrirPagina('pageHome', document.querySelector('.b-nav-btn'));
    } catch (e) {
        mostrarLoading(false);
        mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro</h3><p style="margin-top:10px;">Não foi possível enviar sua solicitação. Tente novamente.</p>');
    }
}

function abrirModalListaAtualizacoes() {
    const ul = document.getElementById('ulListaPendentes');
    ul.innerHTML = atualizacoesDB.map((a, index) => `
        <div class="list-item" style="border-left: 3px solid var(--warning);" onclick="abrirModalComparacao(${index})">
            <div class="item-info">
                <div class="item-avatar" style="background:var(--warning-pale); color:#8a6000;">${getInitials(a.nome)}</div>
                <div><div class="item-name" style="margin:0;">${a.nome}</div><div class="item-sub">Aguardando revisão...</div></div>
            </div>
        </div>`).join('');
    abrirModal('modalListaAtualizacoes');
}

function formatarTurnosLista(dispObj) {
    let html = '';
    for (let dia in dispObj) {
        if (dispObj[dia] && dispObj[dia].length > 0) {
            html += `<li><strong>${dia}:</strong> ${dispObj[dia].join(', ')}</li>`;
        }
    }
    return html || '<li>Nenhum turno selecionado.</li>';
}

function abrirModalComparacao(indexA) {
    fecharModal('modalListaAtualizacoes');
    const newD = atualizacoesDB[indexA];
    const oldD = contatosDB.find(c => c.nome === newD.nome);

    if (!oldD) return mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro</h3><p style="margin-top:10px;">Perfil original não encontrado.</p>');

    document.getElementById('compIndexPendente').value = indexA;
    document.getElementById('compNomePessoa').textContent = oldD.nome;

    document.getElementById('compOldTel').textContent = oldD.telefone || 'Vazio';
    document.getElementById('compOldCong').textContent = getCongregacao(oldD);
    document.getElementById('compOldObs').textContent = oldD.observacoes || 'Nenhuma';
    document.getElementById('compOldTurnos').innerHTML = formatarTurnosLista(oldD.disp);

    document.getElementById('compNewTel').textContent = newD.telefone || 'Vazio';
    document.getElementById('compNewCong').textContent = newD.congregacao || 'Não informada';
    document.getElementById('compNewObs').textContent = newD.observacoes || 'Nenhuma';
    document.getElementById('compNewTurnos').innerHTML = formatarTurnosLista(newD.disp);

    abrirModal('modalComparacao');
}

async function aprovarAtualizacao() {
    const indexA = parseInt(document.getElementById('compIndexPendente').value);
    const newD = atualizacoesDB[indexA];
    const dbIndex = contatosDB.findIndex(c => c.nome === newD.nome);

    if (dbIndex !== -1) {
        contatosDB[dbIndex].telefone = newD.telefone;
        if (newD.congregacao) contatosDB[dbIndex].congregacao = newD.congregacao
        contatosDB[dbIndex].observacoes = newD.observacoes;
        contatosDB[dbIndex].disp = newD.disp;

        atualizacoesDB.splice(indexA, 1);
        fecharModal('modalComparacao');

        mostrarLoading(true, "Aprovando no sistema...");
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "syncContatos", contatos: contatosDB, token: adminToken }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "syncAtualizacoes", atualizacoes: atualizacoesDB, token: adminToken }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        mostrarLoading(false);

        renderizarListaDisponibilidade();
        filtrarContatos();
        mostrarModalInfoCustom('<svg class="icon-svg" style="width:40px;height:40px;color:var(--primary);margin-bottom:15px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg><h3>Perfil Atualizado</h3>', true, 3);
    }
}

async function rejeitarAtualizacao() {
    fecharModal('modalComparacao');
    mostrarModalInfoCustom(`
        <h3 style="color:var(--danger);">Recusar Atualização?</h3>
        <p style="margin: 15px 0 25px; color:var(--text-main);">Deseja realmente apagar esta solicitação? Os dados originais não serão alterados.</p>
        <div style="display:flex; gap:15px; justify-content:center;">
            <button class="btn-action btn-outline" onclick="fecharModal('modalGenericInfo')">Cancelar</button>
            <button class="btn-danger" onclick="confirmarRejeicao(${document.getElementById('compIndexPendente').value})">Sim, Recusar</button>
        </div>
    `, false);
}

async function confirmarRejeicao(indexA) {
    fecharModal('modalGenericInfo');
    atualizacoesDB.splice(indexA, 1);
    await guardarAtualizacoesNaNuvem();
    renderizarListaDisponibilidade();
    mostrarModalInfoCustom('<h3>Solicitação Apagada</h3>', true, 3);
}

function getUltimaDesignacao(nome) {
    let ultima = 0;
    for (let chave of Object.keys(designacoesSalvas)) {
        let mesData = designacoesSalvas[chave];
        let [ano, mes] = chave.split('-');
        for (let dia of Object.keys(mesData)) {
            // CORREÇÃO: Ignorar chaves de override "_ov_"
            if (dia === '_fechado' || String(dia).startsWith('_ov_')) continue;
            if (!mesData[dia]) continue;

            mesData[dia].forEach(t => {
                if (t.i1 === nome || t.i2 === nome) {
                    let dataDesig = new Date(ano, mes, dia).getTime();
                    if (dataDesig > ultima) ultima = dataDesig;
                }
            });
        }
    }
    return ultima;
}

function getDesignadosRascunho() {
    let designados = new Set();
    document.querySelectorAll('.custom-select').forEach(el => {
        let val = el.getAttribute('data-value');
        if (val) designados.add(val);
    });
    return designados;
}

function obterHistorico(nomePessoa) {
    let hist = [];
    const mesesChaves = Object.keys(designacoesSalvas).sort().reverse();
    for (let chave of mesesChaves) {
        const mes = designacoesSalvas[chave];
        // CORREÇÃO: Filtra "_fechado" e também as chaves que começam com "_ov_"
        const diasStr = Object.keys(mes).filter(k => k !== "_fechado" && !String(k).startsWith("_ov_"));
        const dias = diasStr.map(Number).sort((a, b) => b - a);

        for (let dia of dias) {
            if (!mes[dia]) continue; // Prevenção de segurança
            mes[dia].forEach(turno => {
                if (turno.i1 === nomePessoa || turno.i2 === nomePessoa) {
                    const [anoStr, mesStr] = chave.split('-');
                    const dataF = `${String(dia).padStart(2, '0')}/${String(parseInt(mesStr) + 1).padStart(2, '0')}/${anoStr}`;
                    hist.push(`${SVG_CHECK} <span>${dataF}</span> — ${turno.local} (${turno.horario})`);
                }
            });
            if (hist.length >= 3) return hist;
        }
    }
    return hist;
}

function renderizarHome() {
    document.getElementById('txtDataHoje').textContent = formatarData(dataHoje);
    renderizarCalendarioHome();
    renderizarDesignacoesHoje();
}

function mudarMesHome(delta) {
    dataHomeVisao.setMonth(dataHomeVisao.getMonth() + delta);
    renderizarCalendarioHome();
    document.getElementById('buscaHome').value = '';
    document.getElementById('listaBuscaHome').innerHTML = '';
    document.getElementById('listaBuscaHome').style.display = 'none';
    document.getElementById('cardDesignacoesHome').style.display = 'none';
}

function filtrarBuscaHome() {
    const termo = removerAcentos(document.getElementById('buscaHome').value.trim());
    const ul = document.getElementById('listaBuscaHome');
    const cardDesignacoes = document.getElementById('cardDesignacoesHome');

    cardDesignacoes.style.display = 'none';

    if (termo.length < 2) { ul.innerHTML = ''; ul.style.display = 'none'; return; }

    const filtrados = contatosDB.filter(c => c && c.nome && removerAcentos(c.nome).includes(termo));

    if (filtrados.length > 0) {
        ul.style.display = 'block';
        ul.innerHTML = filtrados.map(c => `
            <li class="list-item" style="padding: 10px 15px; margin-bottom:5px;" onclick="mostrarDesignacoesHome('${c.nome.replace(/'/g, "\\'")}')">
                <div class="item-info" style="gap:10px;">
                    <div class="item-avatar" style="width:30px; height:30px; font-size:0.8rem;">${getInitials(c.nome)}</div>
                    <div class="item-name" style="margin:0; font-size:0.9rem;">${formatarNome(c.nome)}</div>
                </div>
            </li>`).join('');
    } else {
        ul.innerHTML = '<p style="text-align:center; padding:10px; color:var(--text-muted); font-size:0.8rem;">Nenhum nome encontrado.</p>';
        ul.style.display = 'block';
    }
}


function mostrarDesignacoesHome(nome) {
    document.getElementById('listaBuscaHome').innerHTML = '';
    document.getElementById('listaBuscaHome').style.display = 'none';
    document.getElementById('buscaHome').value = nome;

    const card = document.getElementById('cardDesignacoesHome');
    let encontrouHtml = "";

    const chavesMeses = Object.keys(designacoesSalvas).sort((a, b) => {
        const [anoA, mesA] = a.split('-').map(Number);
        const [anoB, mesB] = b.split('-').map(Number);
        return new Date(anoA, mesA) - new Date(anoB, mesB);
    });

    chavesMeses.forEach(chaveMes => {
        const [ano, mes] = chaveMes.split('-').map(Number);
        const dataFoco = new Date(ano, mes, 1);

        if (dataFoco < new Date(dataHomeVisao.getFullYear(), dataHomeVisao.getMonth(), 1)) return;

        const designacoesMes = designacoesSalvas[chaveMes] || {};
        if (designacoesMes._fechado === true || designacoesMes._fechado === "true") {
            let itensMes = "";

            Object.keys(designacoesMes).forEach(dia => {
                if (dia === "_fechado" || String(dia).startsWith("_ov_")) return;
                if (!designacoesMes[dia]) return;

                designacoesMes[dia].forEach(t => {
                    if (t.i1 === nome || t.i2 === nome) {
                        const dataObj = new Date(ano, mes, dia);
                        const diaSemana = nomesDias[dataObj.getDay()];
                        const parceiro = (t.i1 === nome) ? (t.i2 || "Vazio") : (t.i1 || "Vazio");
                        const dataFormatada = formatarData(dataObj);

                        itensMes += `
                            <div class="turno-card" style="border-left: 4px solid var(--primary); background: white; margin-bottom: 12px;">
                                <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                    <strong style="color:var(--text-main); font-size:0.85rem;">${dia} de ${mesesNomes[mes]} (${diaSemana})</strong>
                                    <span style="font-size:0.75rem; background: var(--primary-light); color: var(--primary-dark); padding: 2px 8px; border-radius: 10px; font-weight:700;">${t.horario}</span>
                                </div>
                                <div style="font-size:0.8rem; color:var(--text-muted); display:flex; flex-direction:column; gap:4px;">
                                    <span>${localLink(t.local)}</span>
                                    <span style="margin-top:2px; font-weight:600; color:var(--primary-dark);">${SVG_USER} Parceiro(a): ${formatarNome(parceiro)}</span>
                                </div>
                                
                                ${!window.REQUER_LOGIN_ADM ? `
                                <div style="display: flex; gap: 8px; margin-top: 12px; border-top: 1px solid var(--border); padding-top: 10px;">
                                    <button class="btn-small" style="background: var(--bg-color); color: var(--text-main); border: 1px solid var(--border); flex: 1;" 
                                        onclick="gerarLembreteCalendario('${dataFormatada}', '${t.horario}', '${t.local}')">
                                        📅 Calendário
                                    </button>
                                    ${parceiro !== "Vazio" ? `
                                    <button class="btn-small" style="background: #25D366; color: white; border: none; flex: 1;" 
                                        onclick="notificarParceiro('${parceiro.replace(/'/g, "\\'")}', '${dataFormatada}', '${t.horario}', '${t.local}')">
                                        ${getWaIcon()} WhatsApp
                                    </button>` : ''}
                                </div>` : ''}
                                ${eAdmin() ? `
                                <div style="margin-top:8px;">
                                    <button class="btn-small" style="width:100%;background:var(--primary-dark);color:white;border:none;font-size:0.8rem;"
                                        onclick="gerarCardSlot('${dataFormatada}','${diaSemana}','${t.horario}','${t.local.replace(/'/g, "\\'").replace(/"/g, '\\"')}')">
                                        🎴 Card do Slot
                                    </button>
                                </div>` : ''}
                            </div>`;
                    }
                });
            });

            if (itensMes) {
                encontrouHtml += `<div class="section-title" style="margin-top:20px; color: var(--primary-dark);">${mesesNomes[mes]} de ${ano}</div>${itensMes}`;
            }
        }
    });

    card.style.display = 'block';
    if (encontrouHtml) {
        card.innerHTML = `<div class="section-title">Minhas Designações</div>` + encontrouHtml;
    } else {
        card.innerHTML = `<div class="section-title">${nome}</div><p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding: 20px;">Nenhuma designação encontrada para os próximos meses.</p>`;
    }
}

function gerarLembreteCalendario(dataStr, horarioStr, local) {
    const [dia, mes, ano] = dataStr.split('/');
    const horaInicio = parseInt(horarioStr.split('h')[0]);
    const horaFim = horaInicio + 2;

    const pad = (n) => String(n).padStart(2, '0');
    const dtStart = `${ano}${mes}${dia}T${pad(horaInicio)}0000`;
    const dtEnd = `${ano}${mes}${dia}T${pad(horaFim)}0000`;

    const uid = `tpe-${ano}${mes}${dia}-${horaInicio}@suzano`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TPE Suzano//PT',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtStart}Z`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:TPE: ${local}`,
        `DESCRIPTION:Designação de Testemunho Público Especial em Suzano.`,
        `LOCATION:${local}, Suzano - SP`,
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Lembrete: Designação TPE em 30 minutos',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TPE_${dia}-${mes}-${ano}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function gerarCardSlot(dataStr, diaSemana, horario, local) {
    const W = 1080;

    const topoH = 118;
    const logoBoxY = 160;
    const logoBoxH = 220;
    const firstBlocoY = logoBoxY + logoBoxH + 80;
    const lineGap = 195;
    const labelH = 0;
    const valorOffY = 85;
    const paddingBottom = 100;

    const lastY = firstBlocoY + lineGap * 2 + valorOffY;
    const H = lastY + paddingBottom;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#E8821A';
    ctx.fillRect(0, 0, W, topoH);
    ctx.font = 'bold 54px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u26a0  VAGA EM ABERTO', W / 2, topoH / 2);

    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, topoH, W, H - topoH);

    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.roundRect(52, logoBoxY, W - 104, logoBoxH, 18);
    ctx.fill();

    const szFont = 148;
    ctx.font = 'bold ' + szFont + 'px Arial, sans-serif';
    const wTPE = ctx.measureText('TPE').width;
    ctx.font = '300 ' + szFont + 'px Arial, sans-serif';
    const wSuz = ctx.measureText('Suzano').width;
    const barW = 7, barH = 120, gap = 28;
    const totalW = wTPE + gap + barW + gap + wSuz;
    const startX = (W - totalW) / 2;
    const textY = logoBoxY + logoBoxH / 2 + 52;

    ctx.font = 'bold ' + szFont + 'px Arial, sans-serif';
    ctx.fillStyle = '#1a3a2e';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('TPE', startX, textY);

    const barX = startX + wTPE + gap;
    ctx.fillStyle = '#128C7E';
    ctx.fillRect(barX, logoBoxY + (logoBoxH - barH) / 2, barW, barH);

    ctx.font = '300 ' + szFont + 'px Arial, sans-serif';
    ctx.fillStyle = '#1a3a2e';
    ctx.fillText('Suzano', barX + barW + gap, textY);

    function bloco(emoji, label, valor, yPos, sepBottom) {
        ctx.font = '400 38px Arial, sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji + '  ' + label, W / 2, yPos);
        ctx.font = 'bold 70px Arial, sans-serif';
        ctx.fillStyle = '#1a2e2b';
        ctx.fillText(valor, W / 2, yPos + valorOffY);
        if (sepBottom) {
            ctx.fillStyle = '#d8d8d8';
            ctx.fillRect(W / 2 - 220, yPos + 140, 440, 2);
        }
    }

    bloco('\uD83D\uDCC5', 'DATA', dataStr + ' (' + diaSemana + ')', firstBlocoY, true);
    bloco('\u23F0', 'HORÁRIO', horario, firstBlocoY + lineGap, true);
    bloco('\uD83D\uDCCD', 'LOCAL', local, firstBlocoY + lineGap * 2, false);

    canvas.toBlob(async (blob) => {
        const nomeArq = 'TPE_Slot_' + dataStr.replace(/\//g, '-') + '.png';
        const url = URL.createObjectURL(blob);
        const canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([blob], nomeArq, { type: 'image/png' })] }));
        mostrarModalInfoCustom(
            '<h3 style="color:var(--primary-dark);margin-bottom:14px;">Card do Slot</h3>' +
            '<img src="' + url + '" style="width:100%;border-radius:12px;margin-bottom:16px;box-shadow:0 4px 16px rgba(0,0,0,0.12);" />' +
            (canShare ? '<button class="btn-action" style="width:100%;margin-bottom:10px;background:#25D366;color:white;border:none;" onclick="compartilharCardBlob(\'' + url + '\',\'' + nomeArq + '\')">' + getWaIcon() + ' Compartilhar</button>' : '') +
            '<a href="' + url + '" download="' + nomeArq + '" style="display:block;text-decoration:none;"><button class="btn-action btn-outline" style="width:100%;">&#8659; Baixar imagem</button></a>',
            true
        );
    }, 'image/png');
}

async function compartilharCardBlob(url, nomeArq) {
    try {
        const blob = await (await fetch(url)).blob();
        await navigator.share({ files: [new File([blob], nomeArq, { type: 'image/png' })], title: 'TPE Suzano' });
    } catch (e) { }
}

function notificarParceiro(nomeParceiro, data, horario, local) {
    const parceiroObj = contatosDB.find(c => c.nome === nomeParceiro);
    if (!parceiroObj || !parceiroObj.telefone) {
        mostrarModalInfoCustom('<h3>Erro</h3><p>Não foi possível encontrar o telefone do parceiro.</p>');
        return;
    }

    const tel = limparTelefone(parceiroObj.telefone);
    const saudacao = (new Date().getHours() < 12) ? "Bom dia" : (new Date().getHours() < 18 ? "Boa tarde" : "Boa noite");

    const mensagem = encodeURIComponent(`Olá ${nomeParceiro}, ${saudacao.toLowerCase()}! Tudo bem?\nVi aqui que fomos designados para o TPE:\n\n*• Data:* ${data}\n*• Horário:* ${horario}\n*• Local:* ${local}\n\nPodemos confirmar?`);

    window.open(`https://wa.me/55${tel}?text=${mensagem}`, '_blank');
}

function renderizarCalendarioHome() {
    const ano = dataHomeVisao.getFullYear();
    const mes = dataHomeVisao.getMonth();
    const chaveMes = formatarChaveMes(ano, mes);

    document.getElementById('labelMesHome').textContent = `${mesesNomes[mes]} ${ano}`;
    const grid = document.getElementById('gridCalendarioHome');

    let gridHtml = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => `<div class="cal-day-name">${d}</div>`).join('');

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) { gridHtml += `<div class="cal-cell empty"></div>`; }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        let cellClass = "cal-cell";
        if (dia === dataHoje.getDate() && mes === dataHoje.getMonth() && ano === dataHoje.getFullYear()) cellClass += " today";

        gridHtml += `<div class="${cellClass}" onclick="abrirModalDiaHome(${ano}, ${mes}, ${dia})">${dia}</div>`;
    }
    grid.innerHTML = gridHtml;
}

function abrirModalDiaHome(ano, mes, dia) {
    const chaveMes = formatarChaveMes(ano, mes);
    const diaDaSemana = nomesDias[new Date(ano, mes, dia).getDay()];
    document.getElementById('modalDiaTitle').textContent = `${dia} de ${mesesNomes[mes]} (${diaDaSemana})`;
    const content = document.getElementById('modalDiaContent');

    const mesFechado = designacoesSalvas[chaveMes] && (designacoesSalvas[chaveMes]._fechado === true || designacoesSalvas[chaveMes]._fechado === "true");
    const turnosSalvos = (mesFechado && designacoesSalvas[chaveMes][dia]) ? designacoesSalvas[chaveMes][dia] : [];

    if (turnosSalvos.length === 0) {
        content.innerHTML = `<div style="text-align:center; padding:40px 20px; color:var(--text-muted);"><svg class="icon-svg" style="width:40px;height:40px;margin-bottom:15px;opacity:0.4;" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><p>Nenhuma designação.</p></div>`;
    } else {
        content.innerHTML = renderizarTurnosPorLocal(turnosSalvos);
    }
    abrirModal('modalDiaHome');
}

function renderizarTurnosPorLocal(turnos) {
    const grupos = [];
    const indexMap = {};
    turnos.forEach(t => {
        const local = t.local || "Local não informado";
        if (indexMap[local] === undefined) {
            indexMap[local] = grupos.length;
            grupos.push({ local, turnos: [] });
        }
        grupos[indexMap[local]].turnos.push(t);
    });

    return grupos.map(g => {
        const linhasTurnos = g.turnos.map((t, i) => `
            <div class="turno-por-local-row" style="${i > 0 ? 'border-top: 1px solid rgba(18,140,126,0.10); margin-top:10px; padding-top:10px;' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">${SVG_CLOCK} ${t.horario}</span>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    <span class="irmao-badge">${SVG_USER} ${formatarNome(t.i1)}</span>
                    <span class="irmao-badge">${SVG_USER} ${formatarNome(t.i2)}</span>
                </div>
            </div>`).join('');

        return `
            <div class="local-group-card">
                <div class="local-group-header">
                    ${localLink(g.local)}
                </div>
                <div class="local-group-body">
                    ${linhasTurnos}
                </div>
            </div>`;
    }).join('');
}

function renderizarDesignacoesHoje() {
    const container = document.getElementById('listaDesignacoesHoje');
    const chaveMes = formatarChaveMes(dataHoje.getFullYear(), dataHoje.getMonth());
    const dia = dataHoje.getDate();

    const mesFechado = designacoesSalvas[chaveMes] && (designacoesSalvas[chaveMes]._fechado === true || designacoesSalvas[chaveMes]._fechado === "true");
    const turnosHoje = (mesFechado && designacoesSalvas[chaveMes][dia]) ? designacoesSalvas[chaveMes][dia] : [];

    if (turnosHoje.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px 20px; color:var(--text-muted); margin-top:20px;"><svg class="icon-svg" style="width:40px;height:40px;margin-bottom:15px;opacity:0.4;" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><p style="font-size:0.9rem;">Nenhuma designação para hoje.</p></div>`;
        return;
    }

    container.innerHTML = renderizarTurnosPorLocal(turnosHoje);
}

function mudarMesGerador(delta) {
    dataFocoGerador.setMonth(dataFocoGerador.getMonth() + delta);
    renderizarCalendarioGerador();
}

async function fecharMesAtual() {
    if (!confirm("Ao publicar o mês, as escalas ficarão visíveis para todos. Prosseguir?")) return;
    const chaveMes = formatarChaveMes(dataFocoGerador.getFullYear(), dataFocoGerador.getMonth());
    if (!designacoesSalvas[chaveMes]) designacoesSalvas[chaveMes] = {};
    designacoesSalvas[chaveMes]._fechado = true;
    await guardarDesignacoesNaNuvem();
    renderizarCalendarioGerador();
}

async function reabrirMesAtual() {
    if (!confirm("Ao reabrir, as escalas vão SUMIR da tela Inicial enquanto você edita. Confirmar?")) return;
    const chaveMes = formatarChaveMes(dataFocoGerador.getFullYear(), dataFocoGerador.getMonth());
    if (!designacoesSalvas[chaveMes]) return;
    designacoesSalvas[chaveMes]._fechado = false;
    await guardarDesignacoesNaNuvem();
    renderizarCalendarioGerador();
}

function _atualizarTopbarEscalas(mes, ano, mesFechado) {
    const label = `${mesesNomes[mes]} / ${ano}`;
    const statusHTML = mesFechado ? `${SVG_CHECK} Publicado` : `⏳ Rascunho`;
    const statusClass = mesFechado ? 'mes-status published' : 'mes-status draft';
    ['topbarMesLabel','mobileTopbarMesLabel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = label;
    });
    ['topbarStatusMes','mobileTopbarStatusMes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.innerHTML = statusHTML; el.className = statusClass; }
    });
}

function renderizarCalendarioGerador() {
    const grid = document.getElementById('gridCalendarioGerador');
    const ano = dataFocoGerador.getFullYear();
    const mes = dataFocoGerador.getMonth();
    const chaveMes = formatarChaveMes(ano, mes);

    const mesFechado = designacoesSalvas[chaveMes] && (designacoesSalvas[chaveMes]._fechado === true || designacoesSalvas[chaveMes]._fechado === "true");
    _atualizarTopbarEscalas(mes, ano, mesFechado);

    const btnFecharMes = document.getElementById('btnFecharMesGerador');
    if (btnFecharMes) {
        if (mesFechado) {
            btnFecharMes.innerHTML = "🔓 Reabrir para Edição";
            btnFecharMes.className = 'btn-action btn-outline';
            btnFecharMes.style.color = "var(--warning)"; btnFecharMes.style.borderColor = "var(--warning)";
            btnFecharMes.onclick = reabrirMesAtual;
        } else {
            btnFecharMes.innerHTML = `${SVG_CHECK} Publicar Mês`;
            btnFecharMes.className = 'btn-action';
            btnFecharMes.style.color = "white"; btnFecharMes.style.borderColor = "transparent";
            btnFecharMes.onclick = fecharMesAtual;
        }
    }

    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    let htmlEscalas = '';

    for (let diaMes = 1; diaMes <= diasNoMes; diaMes++) {
        const dataLoop = new Date(ano, mes, diaMes);
        const diaSemanaTXT = nomesDias[dataLoop.getDay()];
        const locaisDoDia = padraoSemanal[diaSemanaTXT];

        if (locaisDoDia && locaisDoDia.length > 0) {
            const semCurto = diaSemanaTXT.substring(0, 3);
            const locaisParaDia = obterLocaisParaDia(diaSemanaTXT, diaMes, chaveMes, locaisDoDia);

            let locaisHTML = '';
            locaisParaDia.forEach((localInfo, locIdx) => {
                const localNome = localInfo.local;

                const nomesLocaisDisponiveis = locaisCache.map(l => l.nome);
                const opcoesLocais = nomesLocaisDisponiveis.length > 0
                    ? nomesLocaisDisponiveis.map(n =>
                        `<option value="${n}" ${n === localNome ? 'selected' : ''}>${n}</option>`).join('')
                    : `<option value="${localNome}" selected>${localNome}</option>`;
                const localSelectorId = `localSel_${diaMes}_${locIdx}`;

                let turnosHTML = '';
                localInfo.turnos.forEach((turno, turIdx) => {
                    let preSelect1 = "", preSelect2 = "";
                    if (designacoesSalvas[chaveMes] && designacoesSalvas[chaveMes][diaMes]) {
                        const turnoSalvo = designacoesSalvas[chaveMes][diaMes].find(t => t.local === localNome && t.horario === turno);
                        if (turnoSalvo) { preSelect1 = turnoSalvo.i1; preSelect2 = turnoSalvo.i2; }
                    }
                    let c1 = preSelect1 ? contatosDB.find(c => c.nome === preSelect1) : null;
                    let c2 = preSelect2 ? contatosDB.find(c => c.nome === preSelect2) : null;
                    let hasObs1 = c1?.observacoes?.trim() || '';
                    let hasObs2 = c2?.observacoes?.trim() || '';
                    let txt1 = _renderSlotHTML(preSelect1, hasObs1 || null);
                    let txt2 = _renderSlotHTML(preSelect2, hasObs2 || null);
                    let class1 = `custom-select ${preSelect1 ? 'has-value' : ''} ${hasObs1 ? 'has-obs' : ''}`;
                    let class2 = `custom-select ${preSelect2 ? 'has-value' : ''} ${hasObs2 ? 'has-obs' : ''}`;

                    const selIdBase = `sel_${diaMes}_${locIdx}_${turIdx}`;
                    turnosHTML += `<div class="turno-row">
                        <div class="turno-label">${SVG_CLOCK} ${turno}</div>
                        <div class="designacao-selects">
                            <div class="${class1}" id="${selIdBase}_1" data-local="${localNome}" data-horario="${turno}" data-value="${preSelect1}" onclick="abrirModalSelecao(this.id, '${diaSemanaTXT}')">${txt1}</div>
                            <div class="${class2}" id="${selIdBase}_2" data-local="${localNome}" data-horario="${turno}" data-value="${preSelect2}" onclick="abrirModalSelecao(this.id, '${diaSemanaTXT}')">${txt2}</div>
                        </div>
                    </div>`;
                });

                locaisHTML += `<div class="local-box" data-loc-idx="${locIdx}" data-dia="${diaMes}">
                    <div class="local-title-row">
                        <div class="local-title">${localLink(localNome)}</div>
                        <select class="local-override-select" id="${localSelectorId}"
                            data-dia="${diaMes}" data-loc-idx="${locIdx}"
                            onchange="trocarLocalDia(this)"
                            title="Trocar local para este dia">
                            ${opcoesLocais}
                        </select>
                    </div>
                    ${turnosHTML}
                </div>`;
            });

            const estaSalvo = designacoesSalvas[chaveMes] && designacoesSalvas[chaveMes][diaMes] !== undefined;
            const btnClass = `btn-small ${estaSalvo ? 'saved' : ''}`;
            const btnText = estaSalvo ? `${SVG_CHECK} Salvo` : `💾 Salvar`;
            const diaFormatado = String(diaMes).padStart(2, '0');
            let diaSemanaExibicao = diaSemanaTXT;
            if (diaSemanaTXT !== "Sábado" && diaSemanaTXT !== "Domingo") diaSemanaExibicao += "-feira";

            htmlEscalas += `<div class="dia-card" id="cardDia_${diaMes}">
                <div class="dia-header">
                    <span class="dia-titulo"><svg class="icon-svg" style="width:18px;height:18px;" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${diaFormatado}/${String(mes + 1).padStart(2, '0')} — ${diaSemanaExibicao}</span>
                    <div class="dia-acoes">
                        <button class="btn-small btn-auto-designar" id="btnAutoDia_${diaMes}" title="Designar automaticamente" onclick="designarDiaAutomatico(${diaMes})"><svg class="inline-icon" style="margin:0;width:14px;height:14px;" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Auto</button>
                        <button class="${btnClass}" id="btnSaveDia_${diaMes}" onclick="salvarDiaEscala(${diaMes})">${btnText}</button>
                        <button class="btn-small danger" onclick="limparDiaEscala(${diaMes})"><svg class="inline-icon" style="margin:0;" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                    </div>
                </div>
                <div class="locais-wrapper">${locaisHTML}</div>
            </div>`;
        }
    }
    grid.innerHTML = htmlEscalas;
}

function rolarParaDia(dia) {
    const el = document.getElementById(`cardDia_${dia}`);
    const container = document.getElementById('pageDesignacoes');
    fecharCalendarioPopup();
    if (el && container) {
        const isMobile = window.innerWidth <= 860;
        const paddingTop = isMobile ? 10 : 28;
        const posicao = el.offsetTop - paddingTop;
        container.scrollTo({ top: posicao, behavior: 'smooth' });
    }
}

function abrirModalSelecao(idElemento, diaSemana) {
    currentSelecaoId = idElemento;
    currentSelecaoDia = diaSemana;
    const el = document.getElementById(idElemento);
    currentSelecaoTurno = el.getAttribute('data-horario');

    document.getElementById('lblInfoSelecao').innerHTML = `📌 ${diaSemana} · <span>${currentSelecaoTurno}</span>`;

    limparBuscaSelecao(false);
    renderizarListaSelecao();

    abrirModal('modalSelecao');
    if (window.innerWidth > 860) {
        setTimeout(() => {
            const inputBusca = document.getElementById('buscaSelecao');
            if (inputBusca) inputBusca.focus();
        }, 300);
    }
}

function limparBuscaSelecao(renderizar = true) {
    document.getElementById('buscaSelecao').value = '';
    document.getElementById('clearSelecao').style.display = 'none';
    filtroSexoSelecao = '';
    document.querySelectorAll('.filtro-sexo-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('filtroSexoTodos')?.classList.add('active');
    if (renderizar) renderizarListaSelecao();
}

function filtrarListaSelecao() {
    const input = document.getElementById('buscaSelecao').value;
    document.getElementById('clearSelecao').style.display = input.length > 0 ? 'flex' : 'none';
    renderizarListaSelecao();
}

function setFiltroSexo(sexo) {
    filtroSexoSelecao = sexo;
    document.querySelectorAll('.filtro-sexo-btn').forEach(b => b.classList.remove('active'));
    const ids = { '': 'filtroSexoTodos', 'M': 'filtroSexoM', 'F': 'filtroSexoF' };
    document.getElementById(ids[sexo])?.classList.add('active');
    renderizarListaSelecao();
}

function renderizarListaSelecao() {
    const termo = removerAcentos(document.getElementById('buscaSelecao').value.trim());

    let arrFiltrados = contatosDB.filter(c => c.disp && c.disp[currentSelecaoDia] && c.disp[currentSelecaoDia].includes(currentSelecaoTurno));

    if (filtroSexoSelecao) {
        arrFiltrados = arrFiltrados.filter(c => c.sexo === filtroSexoSelecao);
    }

    if (termo) {
        arrFiltrados = arrFiltrados.filter(c => removerAcentos(c.nome).includes(termo));
    }

    let designadosMes = getDesignadosRascunho();

    let mapeados = arrFiltrados.map(c => {
        return { c: c, ultima: getUltimaDesignacao(c.nome), jaDesignado: designadosMes.has(c.nome) };
    });

    mapeados.sort((a, b) => {
        if (a.jaDesignado && !b.jaDesignado) return 1;
        if (!a.jaDesignado && b.jaDesignado) return -1;
        if (a.ultima !== b.ultima) return a.ultima - b.ultima;
        return a.c.nome.localeCompare(b.c.nome);
    });

    const ul = document.getElementById('listaSelecaoNomes');
    let htmlOpcoes = '';

    mapeados.forEach(item => {
        let c = item.c;
        let temObs = c.observacoes && c.observacoes.trim() !== "";
        let bgStyle = item.jaDesignado ? "border-left: 4px solid var(--danger); background: var(--danger-pale);" : (temObs ? "border-left: 4px solid var(--warning); background: var(--warning-pale);" : "");

        let badgeGenero = `<span style="font-size:0.7rem; font-weight:700; background:var(--bg-color); border-radius:4px; padding:2px 6px;">${c.sexo === 'F' ? 'F' : 'M'}</span>`;
        let strUltima = item.ultima === 0 ? "Nunca escalado" : "Última: " + formatarData(new Date(item.ultima));
        let nomeSeguro = c.nome.replace(/'/g, "\\'");
        let obsSegura = c.observacoes ? c.observacoes.replace(/"/g, '&quot;') : '';
        let obsHtml = temObs ? `<button class="btn-obs" data-obs="${obsSegura}" onclick="event.stopPropagation(); mostrarObsPopup(this.getAttribute('data-obs'))">OBS</button>` : "";

        htmlOpcoes += `
            <div class="list-item" style="${bgStyle}" onclick="selecionarPublicador('${currentSelecaoId}', '${nomeSeguro}')">
                <div class="item-info">
                    <div>
                        <div class="item-name" style="margin:0; display:flex; align-items:center; gap:8px; flex-wrap: wrap;">${formatarNome(c.nome)} ${badgeGenero}</div>
                        <div class="item-sub">${strUltima}</div>
                    </div>
                </div>
                ${obsHtml}
            </div>`;
    });

    if (mapeados.length === 0) {
        htmlOpcoes += `<p style="text-align:center; padding: 20px; color:var(--text-muted); font-size:0.85rem;">Nenhum publicador disponível encontrado.</p>`;
    }

    ul.innerHTML = htmlOpcoes;
}

function _renderSlotHTML(nome, obs) {
    if (!nome) return 'Selecionar publicador...';
    const nomeFormatado = formatarNome(nome);
    const obsBtn = obs ? `<button class="btn-obs-slot" onclick="event.stopPropagation();mostrarObsPopup(this.dataset.obs)" data-obs="${obs.replace(/"/g, '&quot;')}">OBS</button>` : '';
    return `<span class="slot-nome-txt">${nomeFormatado}</span>${obsBtn}`;
}

function selecionarPublicador(idElemento, nome) {
    const el = document.getElementById(idElemento);
    el.setAttribute('data-value', nome);

    if (!nome) {
        el.innerHTML = 'Selecionar publicador...'; el.className = 'custom-select';
    } else {
        let c = contatosDB.find(x => x.nome === nome);
        let temObs = c && c.observacoes && c.observacoes.trim() !== "";
        el.innerHTML = _renderSlotHTML(nome, temObs ? c.observacoes.trim() : null);
        el.className = 'custom-select has-value ' + (temObs ? 'has-obs' : '');
    }
    fecharModal('modalSelecao');
}

function mostrarObsPopup(texto) {
    document.getElementById('textoObsPopup').innerText = texto;
    abrirModal('modalObs');
}

async function salvarDiaEscala(diaMes) {
    const chaveMes = formatarChaveMes(dataFocoGerador.getFullYear(), dataFocoGerador.getMonth());
    if (!designacoesSalvas[chaveMes]) designacoesSalvas[chaveMes] = {};

    const divsDoDia = document.querySelectorAll(`#cardDia_${diaMes} .custom-select`);
    let arrayTurnosSalvos = [];

    for (let i = 0; i < divsDoDia.length; i += 2) {
        const s1 = divsDoDia[i]; const s2 = divsDoDia[i + 1];
        let v1 = s1.getAttribute('data-value') || "";
        let v2 = s2.getAttribute('data-value') || "";
        if (v1 || v2) arrayTurnosSalvos.push({ local: s1.getAttribute('data-local'), horario: s1.getAttribute('data-horario'), i1: v1, i2: v2 });
    }

    const overrideSelects = document.querySelectorAll(`#cardDia_${diaMes} .local-override-select`);
    const locaisOverride = Array.from(overrideSelects).map(sel => sel.value);

    if (arrayTurnosSalvos.length > 0) {
        designacoesSalvas[chaveMes][diaMes] = arrayTurnosSalvos;
        if (locaisOverride.length > 0) designacoesSalvas[chaveMes][`_ov_${diaMes}`] = locaisOverride;
        else delete designacoesSalvas[chaveMes][`_ov_${diaMes}`];
    } else {
        delete designacoesSalvas[chaveMes][diaMes];
        delete designacoesSalvas[chaveMes][`_ov_${diaMes}`];
    }

    localStorage.setItem('tpe_designacoes', JSON.stringify(designacoesSalvas));

    const btn = document.getElementById(`btnSaveDia_${diaMes}`);
    btn.disabled = true;
    btn.className = 'btn-small';
    btn.innerHTML = `⏳ Salvando...`;

    mostrarLoading(true, "Salvando dia na nuvem...");
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "syncDesignacoes",
                designacoes: designacoesSalvas,
                token: adminToken
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        btn.className = 'btn-small saved';
        btn.innerHTML = `${SVG_CHECK} Salvo na Nuvem`;
    } catch (e) {
        console.error("Erro ao salvar escala:", e);
        btn.className = 'btn-small danger';
        btn.innerHTML = `⚠️ Erro ao salvar`;
        mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro ao Salvar</h3><p style="margin-top:10px;">Não foi possível salvar na nuvem. Verifique sua conexão e tente novamente.</p>');
    } finally {
        btn.disabled = false;
        mostrarLoading(false);
    }
}

async function limparDiaEscala(diaMes) {
    if (!confirm("Tem certeza que deseja limpar as seleções deste dia?")) return;
    const chaveMes = formatarChaveMes(dataFocoGerador.getFullYear(), dataFocoGerador.getMonth());
    document.querySelectorAll(`#cardDia_${diaMes} .custom-select`).forEach(sel => { sel.setAttribute('data-value', ''); sel.innerHTML = 'Selecionar publicador...'; sel.className = 'custom-select'; });
    if (designacoesSalvas[chaveMes] && designacoesSalvas[chaveMes][diaMes]) {
        delete designacoesSalvas[chaveMes][diaMes];
        delete designacoesSalvas[chaveMes][`_ov_${diaMes}`];
        await guardarDesignacoesNaNuvem();
    }

    const btn = document.getElementById(`btnSaveDia_${diaMes}`);
    btn.className = 'btn-small'; btn.innerHTML = `💾 Salvar`;

    const pageEl = document.getElementById('pageDesignacoes');
    const scrollY = pageEl.scrollTop;
    renderizarCalendarioGerador();
    pageEl.scrollTop = scrollY;
}


function limparBuscaContatos() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.value = '';
    filtrarContatos();
}

function filtrarContatos() {
    const input = document.getElementById('searchInput');
    // indexadm.html: a página de Contatos foi removida, então esses elementos
    // não existem mais nesse contexto — retorna silenciosamente sem erro.
    if (!input) return;
    const termo = removerAcentos(input.value);
    const clearBtn = document.getElementById('clearContatos');

    if (clearBtn) clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';

    let filtrados = contatosDB.filter(c => removerAcentos(c.nome).includes(termo) || limparTelefone(c.telefone).includes(termo));
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome));

    const ul = document.getElementById('listaContatos');
    document.getElementById('contadorContatos').textContent = `${filtrados.length} de ${contatosDB.length} contatos`;

    let htmlContatos = '';
    filtrados.forEach(c => {
        htmlContatos += `
        <div class="list-item">
            <div class="item-info">
                <div class="item-avatar ${c.sexo === 'F' ? 'female' : ''}">${getInitials(c.nome)}</div>
                <div><div class="item-name" style="margin:0;">${formatarNome(c.nome)}</div><div class="item-sub">${c.telefone}</div></div>
            </div>
            <a href="https://wa.me/55${limparTelefone(c.telefone)}" target="_blank" class="wa-btn">${getWaIcon()}</a>
        </div>`;
    });
    ul.innerHTML = htmlContatos;
}
const filtrarContatosDebounced = debounce(filtrarContatos, 100);

function renderizarListaDisponibilidade() {
    const banner = document.getElementById('bannerAtualizacoes');
    if (eAdmin() && atualizacoesDB.length > 0) {
        document.getElementById('qtdAtualizacoes').textContent = atualizacoesDB.length;
        banner.style.display = 'block';
    } else { banner.style.display = 'none'; }

    const termo = removerAcentos(document.getElementById('buscaDisp').value);
    const cong = document.getElementById('congregacaoSelect').value;
    let filtrados = contatosDB.filter(c => { return removerAcentos(c.nome).includes(termo) && (cong === "" || getCongregacao(c) === cong); });
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome));

    const ul = document.getElementById('listaDisponibilidade');
    let htmlDisp = '';
    filtrados.forEach((c) => {
        let originalIndex = contatosDB.findIndex(dbItem => dbItem.nome === c.nome);
        let turnosResumo = Object.values(c.disp || {}).flat().length;
        let tagObs = (c.observacoes && c.observacoes.trim() !== "") ? '<span style="font-size:0.65rem; background:var(--warning-pale); color:#8a6000; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid var(--warning); margin-left:6px;">⚠️ Obs</span>' : '';
        htmlDisp += `
        <div class="list-item" onclick="abrirModalEditar(${originalIndex})">
            <div class="item-info">
                <div class="item-avatar ${c.sexo === 'F' ? 'female' : ''}">${getInitials(c.nome)}</div>
                <div><div class="item-name" style="margin:0; display:flex; align-items:center; gap: 4px; flex-wrap: wrap;">${formatarNome(c.nome)} ${tagObs}</div><div class="item-sub">${turnosResumo} turnos disponíveis</div></div>
            </div>
        </div>`;
    });
    ul.innerHTML = htmlDisp;
}

function popularCongregacoes() {
    const selectHome = document.getElementById('congregacaoSelect');
    const selectEdit = document.getElementById('editCongregacao');
    const selectAtt = document.getElementById('attCongregacao');

    const unicas = new Set();
    contatosDB.forEach(c => unicas.add(getCongregacao(c)));

    let htmlOptions = '<option value="">Todas Congregações / Outros</option>';
    Array.from(unicas).sort().forEach(cong => htmlOptions += `<option value="${cong}">${cong}</option>`);

    if (selectHome) selectHome.innerHTML = htmlOptions;

    let htmlSelects = '';
    Array.from(unicas).sort().forEach(cong => htmlSelects += `<option value="${cong}">${cong}</option>`);

    if (selectEdit) selectEdit.innerHTML = htmlSelects;
    if (selectAtt) selectAtt.innerHTML = htmlSelects;
}

function obterHorariosPossiveisDoDia(dia) {
    const locais = padraoSemanal[dia]; const todosTurnos = [];
    locais.forEach(l => { l.turnos.forEach(t => { if (!todosTurnos.includes(t)) todosTurnos.push(t); }) });
    return todosTurnos;
}

function construirGridHorarios(containerId, checkboxClass) {
    const container = document.getElementById(containerId);
    let htmlGrid = '';
    const diasOrdenados = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    diasOrdenados.forEach(dia => {
        let htmlHorarios = '';
        if (dia === "Sábado" || dia === "Domingo") {
            const periodos = ["Manhã (08h às 13h)", "Tarde (12h às 17h)"];
            htmlHorarios = periodos.map(p => `<label><input type="checkbox" class="${checkboxClass}" data-dia="${dia}" value="${p}"> ${p}</label>`).join('');
        } else {
            const horarios = obterHorariosPossiveisDoDia(dia);
            htmlHorarios = horarios.map(h => `<label><input type="checkbox" class="${checkboxClass}" data-dia="${dia}" value="${h}"> ${h}</label>`).join('');
        }
        htmlGrid += `<div class="disp-day"><span class="day-title">${dia}</span><div class="disp-hours">${htmlHorarios}</div></div>`;
    });
    container.innerHTML = htmlGrid;
}

function abrirModalNovoContato() {
    document.getElementById('modalTitle').innerHTML = "Novo Contato"; document.getElementById('editIndex').value = "-1";
    document.getElementById('editNome').value = ""; document.getElementById('editTelefone').value = ""; document.getElementById('editObservacoes').value = "";
    document.getElementById('editCongregacao').value = "";
    document.getElementById('boxHistorico').style.display = 'none';
    construirGridHorarios('gridDisponibilidades', 'chk-disp-admin');
    document.getElementById('btnExcluir').style.display = 'none'; abrirModal('modalContato');
}

function abrirModalEditar(index) {
    const c = contatosDB[index]; document.getElementById('modalTitle').innerHTML = "Editar Perfil"; document.getElementById('editIndex').value = index;
    document.getElementById('editNome').value = c.nome; document.getElementById('editTelefone').value = c.telefone; document.getElementById('editSexo').value = c.sexo; document.getElementById('editObservacoes').value = c.observacoes || "";
    document.getElementById('editCongregacao').value = getCongregacao(c);
    document.getElementById('boxHistorico').style.display = 'block';
    const hist = obterHistorico(c.nome); document.getElementById('listaHistorico').innerHTML = hist.length > 0 ? hist.join('') : "Sem designações recentes.";

    construirGridHorarios('gridDisponibilidades', 'chk-disp-admin');
    preencherCheckboxes(c, 'chk-disp-admin');

    document.getElementById('btnExcluir').style.display = 'inline-flex'; abrirModal('modalContato');
}

async function salvarContato() {
    const index = parseInt(document.getElementById('editIndex').value);
    const nome = document.getElementById('editNome').value;
    const telefone = document.getElementById('editTelefone').value;
    const sexo = document.getElementById('editSexo').value;
    const observacoes = document.getElementById('editObservacoes').value;
    const congregacao = document.getElementById('editCongregacao').value.trim() || extrairCongregacaoDoNome(nome);

    let novaDisp = extrairDisponibilidades('chk-disp-admin');
    if (!nome) return mostrarModalInfoCustom('<h3>Aviso</h3><p style="margin-top:10px;">Preencha o nome!</p>');

    if (index === -1) contatosDB.push({ nome, telefone, sexo, observacoes, congregacao, disp: novaDisp });
    else contatosDB[index] = { ...contatosDB[index], nome, telefone, sexo, observacoes, congregacao, disp: novaDisp };

    fecharModal('modalContato');

    guardarContatosNaNuvem();

    mostrarModalInfoCustom('<h3>Perfil Salvo</h3>', true, 2);
}


async function excluirContato() {
    const index = document.getElementById('editIndex').value;
    const contato = contatosDB[index];

    fecharModal('modalContato');

    mostrarModalInfoCustom(`
        <h3 style="color:var(--danger); margin-bottom:10px;">Excluir Perfil?</h3>
        <p style="margin-bottom: 20px; color:var(--text-main); font-size:0.9rem;">
            Deseja realmente excluir <strong>${contato.nome}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div style="text-align:left; margin-bottom:20px;">
            <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:8px;">Motivo da Exclusão:</label>
            <textarea id="motivoExclusao" rows="3" placeholder="Ex: Mudou-se, solicitou saída, etc..." style="margin-bottom:0; background:white; border:1px solid var(--danger-pale);"></textarea>
        </div>
        <div style="display:flex; gap:15px; justify-content:center;">
            <button class="btn-action btn-outline" style="flex:1;" onclick="fecharModal('modalGenericInfo')">Cancelar</button>
            <button class="btn-danger" style="flex:1;" onclick="confirmarExclusao(${index})">Confirmar Exclusão</button>
        </div>
    `, false);

    setTimeout(() => document.getElementById('motivoExclusao').focus(), 300);
}

async function confirmarExclusao(index) {
    const motivo = document.getElementById('motivoExclusao').value.trim();
    if (!motivo) {
        alert("Por favor, informe o motivo da exclusão.");
        return;
    }

    const contato = contatosDB[index];
    fecharModal('modalGenericInfo');
    mostrarLoading(true, "Registrando exclusão...");

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "registrarExclusao",
                nome: contato.nome,
                telefone: contato.telefone,
                congregacao: getCongregacao(contato),
                motivo: motivo,
                token: adminToken
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        contatosDB.splice(index, 1);
        await guardarContatosNaNuvem();

        renderizarListaDisponibilidade();
        filtrarContatos();

        mostrarModalInfoCustom('<h3 style="color:var(--primary-dark);">Perfil Excluído com Sucesso</h3>', true, 3);
    } catch (e) {
        mostrarLoading(false);
        mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro</h3><p>Não foi possível completar a exclusão.</p>');
    }
}

// ── indexadm.html: acesso administrativo obrigatório ──────────────────────
// Quando window.REQUER_LOGIN_ADM está ativo (definido no HTML antes deste
// script), a senha é exigida logo na abertura da página, em vez de apenas
// quando o botão de cadeado era clicado (botão esse que foi extinto).
function exigirLoginObrigatorio() {
    const input = document.getElementById('inputSenha');
    if (input) { input.value = ''; input.type = 'password'; }
    abrirModal('modalLogin');
    setTimeout(() => { if (input) input.focus(); }, 300);
}

function _iniciarAcessoAdministrativo() {
    try {
        const token = sessionStorage.getItem('tpe_admin_token');
        const ultimaAtividade = parseInt(localStorage.getItem('tpe_last_activity') || '0', 10);
        if (token && (Date.now() - ultimaAtividade) <= _SESSAO_MAX_MS) {
            _ativarSessaoAdmin(token);
            _refreshAtividadeAdmin();
            carregarDadosDaNuvem();
            return;
        }
    } catch (e) { }
    exigirLoginObrigatorio();
}

window.onload = () => {
    if (window.REQUER_LOGIN_ADM) {
        _iniciarAcessoAdministrativo();
    } else {
        _restaurarSessaoAdmin();
        carregarDadosDaNuvem();
    }
    const ajustarSpacer = () => {
        const banner = document.getElementById('updateBannerMobile');
        const spacer = document.querySelector('.banner-spacer');
        if (banner && spacer) {
            const h = banner.offsetHeight;
            if (h > 0) spacer.style.height = h + 'px';
        }
    };
    ajustarSpacer();
    window.addEventListener('resize', ajustarSpacer);
};
function toggleMenuAdmin() {
    const overlay = document.getElementById('adminMenuOverlay');
    const panel = document.getElementById('adminMenuPanel');
    const gear = document.getElementById('btnNavGear');
    const isOpen = panel.classList.contains('open');
    if (isOpen) fecharMenuAdmin();
    else {
        overlay.classList.add('open');
        panel.classList.add('open');
        if (gear) gear.classList.add('menu-open');
    }
}

function fecharMenuAdmin() {
    document.getElementById('adminMenuOverlay')?.classList.remove('open');
    document.getElementById('adminMenuPanel')?.classList.remove('open');
    document.getElementById('btnNavGear')?.classList.remove('menu-open');
}

function adminMenuNav(pageId) {
    fecharMenuAdmin();
    document.querySelectorAll('.b-nav-btn').forEach(b => b.classList.remove('active'));
    abrirPagina(pageId, null);
}

let locaisCache = [];

async function carregarLocaisDaNuvem() {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getLocais' }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = JSON.parse(await res.text());
        if (data.status === 'success' && Array.isArray(data.locais)) {
            locaisCache = data.locais;
            try { localStorage.setItem('tpe_locais_cache', JSON.stringify(locaisCache)); } catch (e) { }
        }
    } catch (e) {
        try {
            const cached = localStorage.getItem('tpe_locais_cache');
            if (cached) locaisCache = JSON.parse(cached);
        } catch (e2) { }
        if (!locaisCache.length) locaisCache = obterSeed();
    }
}

function obterSeed() {
    return [{
        id: 'local_seed_1',
        nome: 'Hospital Santa Casa',
        endereco: 'R. Kaneji Kodama, 1459 - Vila Figueira, Suzano - SP, 08676-410',
        mapsLink: 'https://maps.app.goo.gl/mFtjkJNwFFznhixC8',
        mapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d384.4421616410969!2d-46.30614102841311!3d-23.552246520644168!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce709f47bb4837%3A0xf44d6b1f49b13952!2sPronto%20Socorro%20-%20Hospital%20Municipal%20de%20Suzano!5e0!3m2!1spt-BR!2sbr!4v1775405202168!5m2!1spt-BR!2sbr',
        apoioNome: 'Casa do irmão Hiroki',
        apoioEndereco: 'R. Adélino Matias, 169 - Jardim Lincoln, Suzano - SP, 08676-270',
        apoioMapsLink: 'https://maps.app.goo.gl/9XYkJL9973LN5Pdb8',
        apoioMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.5053546316467!2d-46.30711892391467!3d-23.55028696118693!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce70a1dbd835d1%3A0x286c3da7c823d65c!2sR.%20Ad%C3%A9lino%20Matias%2C%20169%20-%20Jardim%20Lincoln%2C%20Suzano%20-%20SP%2C%2008676-270!5e0!3m2!1spt-BR!2sbr!4v1775405321929!5m2!1spt-BR!2sbr'
    }];
}

function renderizarLocaisPublico() {
    const container = document.getElementById('listaLocaisPublico');
    const empty = document.getElementById('locaisEmptyState');
    if (!container) return;

    if (!locaisCache.length) {
        container.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        return;
    }
    if (empty) empty.style.display = 'none';

    container.innerHTML = `<div class="locais-grid">${locaisCache.map(loc => `
        <div class="local-name-card" onclick="abrirLocalModal('${loc.id}')">
            <div class="local-name-card-icon">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div class="local-name-card-text">
                <div class="local-name-card-nome">${escHtml(loc.nome)}</div>
                ${loc.apoioNome ? `<div class="local-name-card-hint">Apoio: ${escHtml(loc.apoioNome)}</div>` : ''}
            </div>
            <svg class="local-name-card-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>`).join('')
        }</div>`;
}

function abrirLocalModal(id) {
    const loc = locaisCache.find(l => l.id === id);
    if (!loc) return;

    document.getElementById('modalLocalNome').innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        ${escHtml(loc.nome)}`;

    let html = '';

    if (loc.endereco) {
        html += `
        <p class="ml-section-label">📍 Local de Trabalho</p>
        <div class="ml-address-row">
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span class="ml-address-text">${escHtml(loc.endereco)}</span>
        </div>`;
    }
    if (loc.mapsLink) {
        html += `<a class="ml-maps-btn" href="${loc.mapsLink}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            Abrir Rota no Maps
        </a>`;
    }
    if (loc.mapsEmbed) {
        html += `<div class="ml-embed"><iframe src="${loc.mapsEmbed}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
    }

    if (loc.apoioNome || loc.apoioEndereco) {
        html += `<hr class="ml-divider"><div class="ml-apoio-block">
            <div class="ml-apoio-chip">🏠 Ponto de Apoio</div>
            <div class="ml-apoio-titulo">
                <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                ${loc.apoioNome ? escHtml(loc.apoioNome) : ''}
            </div>`;
        if (loc.apoioEndereco) {
            html += `<div class="ml-address-row">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span class="ml-address-text">${escHtml(loc.apoioEndereco)}</span>
            </div>`;
        }
        if (loc.apoioMapsLink) {
            html += `<a class="ml-maps-btn" href="${loc.apoioMapsLink}" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                Abrir Rota no Maps
            </a>`;
        }
        if (loc.apoioMapsEmbed) {
            html += `<div class="ml-embed"><iframe src="${loc.apoioMapsEmbed}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
        }
        html += `</div>`;
    }

    document.getElementById('modalLocalBody').innerHTML = html;
    abrirModal('modalLocalDetalhe');
}

function renderizarLocaisAdmin() {
    const container = document.getElementById('listaLocaisAdmin');
    if (!container) return;

    if (!locaisCache.length) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px 0;">Nenhum local cadastrado.</p>';
        return;
    }
    container.innerHTML = locaisCache.map(loc => `
        <div class="local-admin-item">
            <div class="local-admin-item-info">
                <div class="local-admin-item-nome">${escHtml(loc.nome)}</div>
                ${loc.endereco ? `<div class="local-admin-item-end">${escHtml(loc.endereco)}</div>` : ''}
            </div>
            <div class="local-admin-actions">
                <button class="local-admin-btn edit" onclick="editarLocal('${loc.id}')" title="Editar">
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="local-admin-btn del" onclick="excluirLocal('${loc.id}')" title="Excluir">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4h6v2"></path></svg>
                </button>
            </div>
        </div>`).join('');
}

async function salvarLocal() {
    const id = document.getElementById('editLocalId').value.trim() || ('local_' + Date.now());
    const nome = document.getElementById('editLocalNome').value.trim();
    const end = document.getElementById('editLocalEndereco').value.trim();
    const maps = document.getElementById('editLocalMaps').value.trim();
    const embed = extrairSrcEmbed(document.getElementById('editLocalEmbed').value.trim());
    const apoioN = document.getElementById('editApoioNome').value.trim();
    const apoioE = document.getElementById('editApoioEndereco').value.trim();
    const apoioM = document.getElementById('editApoioMaps').value.trim();
    const apoioEm = extrairSrcEmbed(document.getElementById('editApoioEmbed').value.trim());

    if (!nome) {
        mostrarModalInfoCustom('<h3 style="color:var(--danger);">Aviso</h3><p style="margin-top:10px;">O nome do local é obrigatório.</p>');
        return;
    }

    const obj = {
        id, nome, endereco: end, mapsLink: maps, mapsEmbed: embed,
        apoioNome: apoioN, apoioEndereco: apoioE, apoioMapsLink: apoioM, apoioMapsEmbed: apoioEm
    };

    mostrarLoading(true, 'Salvando local...');
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'salvarLocal', token: adminToken, local: obj }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = JSON.parse(await res.text());
        mostrarLoading(false);

        if (data.status === 'success') {
            const idx = locaisCache.findIndex(l => l.id === id);
            if (idx >= 0) locaisCache[idx] = obj; else locaisCache.push(obj);
            try { localStorage.setItem('tpe_locais_cache', JSON.stringify(locaisCache)); } catch (e) { }

            fecharFormLocal();
            renderizarLocaisAdmin();
            mostrarModalInfoCustom('<h3 style="color:var(--primary-dark);">Local salvo!</h3>', true, 2);
        } else {
            mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro</h3><p style="margin-top:8px;">' + (data.message || 'Não foi possível salvar.') + '</p>');
        }
    } catch (e) {
        mostrarLoading(false);
        mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro de conexão</h3><p style="margin-top:8px;">Verifique sua internet e tente novamente.</p>');
    }
}

function excluirLocal(id) {
    mostrarModalInfoCustom(`
        <h3 style="color:var(--danger);margin-bottom:15px;">Excluir Local?</h3>
        <p style="margin-bottom:25px;color:var(--text-main);font-size:0.95rem;">Esta ação não pode ser desfeita.</p>
        <div style="display:flex;gap:15px;justify-content:center;">
            <button class="btn-action btn-outline" style="width:50%;" onclick="fecharModal('modalGenericInfo')">Cancelar</button>
            <button class="btn-danger" style="width:50%;" onclick="confirmarExcluirLocal('${id}')">Excluir</button>
        </div>`, false);
}

async function confirmarExcluirLocal(id) {
    fecharModal('modalGenericInfo');
    mostrarLoading(true, 'Excluindo...');
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'excluirLocal', token: adminToken, id }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = JSON.parse(await res.text());
        mostrarLoading(false);
        if (data.status === 'success') {
            locaisCache = locaisCache.filter(l => l.id !== id);
            try { localStorage.setItem('tpe_locais_cache', JSON.stringify(locaisCache)); } catch (e) { }
            renderizarLocaisAdmin();
            mostrarModalInfoCustom('<h3 style="color:var(--primary-dark);">Local excluído.</h3>', true, 2);
        } else {
            mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro</h3><p style="margin-top:8px;">' + (data.message || 'Não foi possível excluir.') + '</p>');
        }
    } catch (e) {
        mostrarLoading(false);
        mostrarModalInfoCustom('<h3 style="color:var(--danger);">Erro de conexão</h3>');
    }
}

function abrirFormLocal(id) {
    limparFormLocal();
    const titulo = document.getElementById('formLocalTitulo');
    if (titulo) titulo.innerHTML = `<svg class="inline-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> Novo Local`;

    if (id) {
        const loc = locaisCache.find(l => l.id === id);
        if (loc) {
            document.getElementById('editLocalId').value = loc.id;
            document.getElementById('editLocalNome').value = loc.nome || '';
            document.getElementById('editLocalEndereco').value = loc.endereco || '';
            document.getElementById('editLocalMaps').value = loc.mapsLink || '';
            document.getElementById('editLocalEmbed').value = loc.mapsEmbed || '';
            document.getElementById('editApoioNome').value = loc.apoioNome || '';
            document.getElementById('editApoioEndereco').value = loc.apoioEndereco || '';
            document.getElementById('editApoioMaps').value = loc.apoioMapsLink || '';
            document.getElementById('editApoioEmbed').value = loc.apoioMapsEmbed || '';
            if (titulo) titulo.innerHTML = `<svg class="inline-icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Editar Local`;
        }
    }

    document.getElementById('painelListaLocais').style.display = 'none';
    document.getElementById('painelFormLocal').style.display = 'block';
    document.getElementById('pageEditarLocais').scrollTop = 0;
}

function fecharFormLocal() {
    document.getElementById('painelFormLocal').style.display = 'none';
    document.getElementById('painelListaLocais').style.display = 'block';
    limparFormLocal();
    document.getElementById('pageEditarLocais').scrollTop = 0;
}

function editarLocal(id) {
    abrirFormLocal(id);
}

function limparFormLocal() {
    ['editLocalId', 'editLocalNome', 'editLocalEndereco', 'editLocalMaps', 'editLocalEmbed',
        'editApoioNome', 'editApoioEndereco', 'editApoioMaps', 'editApoioEmbed'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
}

function extrairSrcEmbed(texto) {
    if (!texto) return '';
    const m = texto.match(/src="([^"]+)"/);
    return m ? m[1] : texto;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const padraoLocalSemanal = {
    "Segunda": "Praça dos Correios",
    "Terça": "Estação CPTM (Terminal)",
    "Quarta": "Praça da Igreja",
    "Quinta": "Estação CPTM (Centro)",
    "Sexta": "Hospital Santa Casa"
};

let localOverrides = {};

function obterLocaisParaDia(diaSemanaTXT, diaMes, chaveMes, locaisPadrao) {
    return locaisPadrao.map((localInfo, locIdx) => {
        const savedOverride = designacoesSalvas[chaveMes]?.[`_ov_${diaMes}`]?.[locIdx];
        if (savedOverride) return { local: savedOverride, turnos: localInfo.turnos };
        const chave = `${chaveMes}-${diaMes}-${locIdx}`;
        const memOverride = localOverrides[chave];
        if (memOverride) return { local: memOverride, turnos: localInfo.turnos };
        return localInfo;
    });
}

let _scrollHeaderFn = null;
let _scrollLastY = 0;

function toggleCalendarioPopup() {
    const popup = document.getElementById('calPopup');
    const overlay = document.getElementById('calPopupOverlay');
    if (!popup) return;
    const isOpen = popup.classList.contains('active');
    if (isOpen) {
        fecharCalendarioPopup();
    } else {
        _renderizarCalendarioPopup();
        popup.classList.add('active');
        overlay.classList.add('active');
    }
}

function fecharCalendarioPopup() {
    const popup = document.getElementById('calPopup');
    const overlay = document.getElementById('calPopupOverlay');
    if (popup) popup.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function _renderizarCalendarioPopup() {
    const ano = dataFocoGerador.getFullYear();
    const mes = dataFocoGerador.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const titulo = document.getElementById('calPopupTitulo');
    if (titulo) titulo.textContent = `${mesesNomes[mes]} / ${ano}`;

    const grid = document.getElementById('calPopupGrid');
    if (!grid) return;

    // Headers dos dias da semana
    const semLabels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = semLabels.map(d => `<div class="cal-popup-day-label">${d}</div>`).join('');

    // Offset do primeiro dia
    const primeiroDia = new Date(ano, mes, 1).getDay();
    for (let i = 0; i < primeiroDia; i++) {
        html += `<div></div>`;
    }

    const chaveMes = formatarChaveMes(ano, mes);
    for (let d = 1; d <= diasNoMes; d++) {
        const dataLoop = new Date(ano, mes, d);
        const diaSemana = nomesDias[dataLoop.getDay()];
        const temEscala = padraoSemanal[diaSemana] && padraoSemanal[diaSemana].length > 0;
        const temDados = designacoesSalvas[chaveMes] && designacoesSalvas[chaveMes][d];
        const isHoje = (dataLoop.toDateString() === new Date().toDateString());

        if (temEscala) {
            const cls = `cal-popup-day has-escala${temDados ? ' has-dados' : ''}${isHoje ? ' is-hoje' : ''}`;
            html += `<button class="${cls}" onclick="rolarParaDia(${d})" title="${diaSemana}">${d}</button>`;
        } else {
            const cls = `cal-popup-day${isHoje ? ' is-hoje' : ''}`;
            html += `<div class="${cls} no-escala">${d}</div>`;
        }
    }
    grid.innerHTML = html;
}

function trocarLocalDia(selectEl) {
    const diaMes = parseInt(selectEl.getAttribute('data-dia'));
    const locIdx = parseInt(selectEl.getAttribute('data-loc-idx'));
    const novoLocal = selectEl.value;
    const chaveMes = formatarChaveMes(dataFocoGerador.getFullYear(), dataFocoGerador.getMonth());
    const chave = `${chaveMes}-${diaMes}-${locIdx}`;

    localOverrides[chave] = novoLocal;

    const localBox = selectEl.closest('.local-box');
    if (localBox) {
        localBox.querySelectorAll('.custom-select').forEach(sel => {
            sel.setAttribute('data-local', novoLocal);
        });
        const titleDiv = localBox.querySelector('.local-title');
        if (titleDiv) titleDiv.innerHTML = localLink(novoLocal);
    }
}


// ========================
// AUTO-DESIGNAÇÃO AUTOMÁTICA
// ========================

/**
 * Retorna o histórico de parceiros de uma pessoa.
 * Map: nomeParceiro -> quantas vezes foram designados juntos (em todos os meses).
 */
function getHistoricoParceiros(nome) {
    const parceiros = new Map();
    for (let chave of Object.keys(designacoesSalvas)) {
        const mesData = designacoesSalvas[chave];
        for (let dia of Object.keys(mesData)) {
            if (dia === '_fechado' || String(dia).startsWith('_ov_')) continue;
            if (!mesData[dia]) continue;
            mesData[dia].forEach(t => {
                if (t.i1 === nome && t.i2 && t.i2.trim()) {
                    parceiros.set(t.i2, (parceiros.get(t.i2) || 0) + 1);
                }
                if (t.i2 === nome && t.i1 && t.i1.trim()) {
                    parceiros.set(t.i1, (parceiros.get(t.i1) || 0) + 1);
                }
            });
        }
    }
    return parceiros;
}

/**
 * Retorna o Set de todos os nomes já designados no mês atual.
 * Inclui designações salvas + rascunho atual visível no DOM.
 * Exclui os selects do dia específico para não bloquear a própria execução.
 */
function getAtribuidosMes(chaveMes, diaAtual) {
    const atribuidos = new Set();

    // 1. Designações já salvas no mês
    const mesData = designacoesSalvas[chaveMes];
    if (mesData) {
        for (let dia of Object.keys(mesData)) {
            if (dia === '_fechado' || String(dia).startsWith('_ov_')) continue;
            if (String(dia) === String(diaAtual)) continue; // ignora o próprio dia (será sobrescrito)
            if (!mesData[dia]) continue;
            mesData[dia].forEach(t => {
                if (t.i1 && t.i1.trim()) atribuidos.add(t.i1);
                if (t.i2 && t.i2.trim()) atribuidos.add(t.i2);
            });
        }
    }

    // 2. Rascunho atual no DOM (outros dias ainda não salvos)
    document.querySelectorAll('#gridCalendarioGerador .custom-select').forEach(el => {
        // Verifica se este select pertence a outro dia que não o atual
        const cardPai = el.closest('.dia-card');
        if (!cardPai) return;
        const idCard = cardPai.id; // "cardDia_X"
        const diaPai = parseInt(idCard.replace('cardDia_', ''));
        if (diaPai === diaAtual) return; // pula selects do dia que estamos preenchendo
        const val = el.getAttribute('data-value');
        if (val && val.trim()) atribuidos.add(val);
    });

    return atribuidos;
}

/**
 * Escolhe o melhor par dentre candidatos, respeitando:
 * - Não pode estar em atribuidosMes (já designado em outro dia do mês)
 * - Não pode estar em atribuidosDia (já designado neste dia nesta execução)
 * - Prioriza quem está há mais tempo sem designação
 * - Evita reincidência de parceiros (usa reincidência mínima como fallback)
 *
 * Os candidatos já devem ser do mesmo gênero — gênero é filtrado ANTES.
 */
function escolherMelhorPar(candidatos, atribuidosMes, atribuidosDia) {
    // Filtra disponíveis (não no mês e não neste dia já)
    const disponiveis = candidatos.filter(c =>
        !atribuidosMes.has(c.nome) && !atribuidosDia.has(c.nome)
    );
    if (disponiveis.length < 2) return null;

    // Ordena por prioridade: nunca designado > última designação mais antiga > menos no mês
    const pontuados = disponiveis.map(c => ({
        c,
        ultima: getUltimaDesignacao(c.nome)
    }));
    pontuados.sort((a, b) => {
        if (a.ultima === 0 && b.ultima !== 0) return -1;
        if (a.ultima !== 0 && b.ultima === 0) return 1;
        return a.ultima - b.ultima;
    });

    // Tenta encontrar par sem reincidência histórica
    for (let i = 0; i < pontuados.length; i++) {
        const parceirosA = getHistoricoParceiros(pontuados[i].c.nome);
        for (let j = i + 1; j < pontuados.length; j++) {
            if (!parceirosA.has(pontuados[j].c.nome)) {
                return [pontuados[i].c, pontuados[j].c];
            }
        }
    }

    // Fallback: par com menor reincidência
    let melhorPar = null;
    let menorReincidencia = Infinity;
    for (let i = 0; i < pontuados.length; i++) {
        const parceirosA = getHistoricoParceiros(pontuados[i].c.nome);
        for (let j = i + 1; j < pontuados.length; j++) {
            const reincid = parceirosA.get(pontuados[j].c.nome) || 0;
            if (reincid < menorReincidencia) {
                menorReincidencia = reincid;
                melhorPar = [pontuados[i].c, pontuados[j].c];
            }
        }
    }
    return melhorPar;
}

/**
 * Designação automática para um dia.
 * Regras:
 * - Gênero: pares devem ser do mesmo gênero (M+M ou F+F). Mistura é proibida.
 * - Mês: ninguém pode ser designado duas vezes no mesmo mês.
 * - Prioridade: quem está há mais tempo sem designação vem primeiro.
 * - Parceiros: evita repetir pares já usados; só repete se não houver outra opção.
 * - Observações: exibe pop-up se algum designado automaticamente tiver observação.
 */
function designarDiaAutomatico(diaMes) {
    const ano = dataFocoGerador.getFullYear();
    const mes = dataFocoGerador.getMonth();
    const chaveMes = formatarChaveMes(ano, mes);
    const dataLoop = new Date(ano, mes, diaMes);
    const diaSemanaTXT = nomesDias[dataLoop.getDay()];

    const locaisDoDia = padraoSemanal[diaSemanaTXT];
    if (!locaisDoDia || locaisDoDia.length === 0) return;

    const locaisParaDia = obterLocaisParaDia(diaSemanaTXT, diaMes, chaveMes, locaisDoDia);

    // Pessoas já designadas em outros dias do mês (não podem ser usadas novamente)
    const atribuidosMes = getAtribuidosMes(chaveMes, diaMes);

    // Pessoas designadas neste dia durante esta execução (evita duplicar no mesmo dia)
    const atribuidosDia = new Set();

    let temObservacoes = false;
    const nomesComObs = [];

    locaisParaDia.forEach((localInfo, locIdx) => {
        const localNome = localInfo.local;

        localInfo.turnos.forEach((turno, turIdx) => {
            const selIdBase = `sel_${diaMes}_${locIdx}_${turIdx}`;
            const el1 = document.getElementById(`${selIdBase}_1`);
            const el2 = document.getElementById(`${selIdBase}_2`);
            if (!el1 || !el2) return;

            // Não sobrescreve slots já preenchidos manualmente (ambos preenchidos)
            const val1 = el1.getAttribute('data-value') || '';
            const val2 = el2.getAttribute('data-value') || '';
            if (val1.trim() && val2.trim()) {
                // Garante que eles entrem no atribuidosDia para não serem usados em outro turno
                if (val1.trim()) atribuidosDia.add(val1.trim());
                if (val2.trim()) atribuidosDia.add(val2.trim());
                return;
            }

            // Candidatos disponíveis para este dia e horário
            const candidatos = contatosDB.filter(c =>
                c.disp && c.disp[diaSemanaTXT] && c.disp[diaSemanaTXT].includes(turno)
            );

            // Separa por gênero — mistura é proibida
            const homens = candidatos.filter(c => c.sexo === 'M');
            const mulheres = candidatos.filter(c => c.sexo === 'F');

            // Tenta formar par de cada gênero (sem preferência entre M e F)
            const parM = escolherMelhorPar(homens, atribuidosMes, atribuidosDia);
            const parF = escolherMelhorPar(mulheres, atribuidosMes, atribuidosDia);

            let par = null;
            if (parM && parF) {
                // Ambos os gêneros têm par disponível — escolhe o par "mais antigo" (maior prioridade)
                const ultimaM = Math.min(
                    getUltimaDesignacao(parM[0].nome),
                    getUltimaDesignacao(parM[1].nome)
                );
                const ultimaF = Math.min(
                    getUltimaDesignacao(parF[0].nome),
                    getUltimaDesignacao(parF[1].nome)
                );
                // Quem tem menor timestamp (mais antigo ou nunca designado) tem prioridade
                par = (ultimaM <= ultimaF) ? parM : parF;
            } else if (parM) {
                par = parM;
            } else if (parF) {
                par = parF;
            }
            // Se não há par disponível em nenhum gênero, o slot fica vazio

            if (!par) return;

            // Marca como usados
            atribuidosDia.add(par[0].nome);
            atribuidosDia.add(par[1].nome);

            // Atualiza os selects no DOM
            [el1, el2].forEach((el, idx) => {
                const pessoa = par[idx];
                const temObs = pessoa.observacoes && pessoa.observacoes.trim() !== '';
                if (temObs && !nomesComObs.includes(pessoa.nome)) {
                    temObservacoes = true;
                    nomesComObs.push(pessoa.nome);
                }
                el.setAttribute('data-value', pessoa.nome);
                el.innerHTML = _renderSlotHTML(pessoa.nome, temObs ? pessoa.observacoes.trim() : null);
                el.className = `custom-select has-value${temObs ? ' has-obs' : ''}`;
            });
        });
    });

    // Visual do botão: feedback de "Pronto" por 3 segundos
    const btnAuto = document.getElementById(`btnAutoDia_${diaMes}`);
    if (btnAuto) {
        btnAuto.classList.add('auto-ran');
        btnAuto.innerHTML = `<svg class="inline-icon" style="margin:0;width:14px;height:14px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Pronto`;
        setTimeout(() => {
            btnAuto.classList.remove('auto-ran');
            btnAuto.innerHTML = `<svg class="inline-icon" style="margin:0;width:14px;height:14px;" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Auto`;
        }, 3000);
    }

    // Pop-up de aviso se houver designados com observações
    if (temObservacoes) {
        setTimeout(() => {
            mostrarModalInfoCustom(`
                <div style="text-align:center; padding: 8px 0;">
                    <svg style="width:48px;height:48px;color:var(--warning);margin-bottom:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3 style="color:var(--warning); margin-bottom:12px;">Atenção! Verifique as Designações</h3>
                    <p style="color:var(--text-main); font-size:0.9rem; line-height:1.6; margin-bottom:16px;">
                        A designação automática incluiu <strong>pessoa(s) com observações</strong>. A IA não consegue levar em conta as observações — por favor, revise manualmente:
                    </p>
                    <div style="background:var(--warning-pale); border:1px solid var(--warning); border-radius:var(--radius-sm); padding:12px 16px; text-align:left;">
                        ${nomesComObs.map(n => {
                const c = contatosDB.find(x => x.nome === n);
                return `<div style="margin-bottom:8px; font-size:0.85rem;">
                                <strong style="color:var(--warning);">⚠️ ${n}</strong><br>
                                <span style="color:var(--text-muted); font-size:0.8rem;">${c ? c.observacoes : ''}</span>
                            </div>`;
            }).join('')}
                    </div>
                </div>
            `, true);
        }, 400);
    }
}
