// TPE Suzano — Módulo de Estatísticas v6.4.0

let estatFiltroCongreAtual = '';
let estatNomePesquisa = '';
let estatMesFoco = null;


function _chaveDeMes(date) {
    return `${date.getFullYear()}-${date.getMonth()}`;
}

function _nomeMes(date) {
    return `${mesesNomes[date.getMonth()]} / ${date.getFullYear()}`;
}

function _mesesDisponiveis() {
    return Object.keys(designacoesSalvas)
        .filter(k => k !== '_fechado' && /^\d{4}-\d+$/.test(k))
        .sort((a, b) => {
            const [aA, aM] = a.split('-').map(Number);
            const [bA, bM] = b.split('-').map(Number);
            return new Date(aA, aM) - new Date(bA, bM);
        });
}

function _totalSlots(contato) {
    if (!contato.disp) return 0;
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    return dias.reduce((s, d) => s + (Array.isArray(contato.disp[d]) ? contato.disp[d].length : 0), 0);
}


function calcularConteoDesignacoes() {
    const conteo = {};
    for (const mes in designacoesSalvas) {
        const diasMes = designacoesSalvas[mes];
        for (const dia in diasMes) {
            if (dia === '_fechado') continue;
            const turnos = diasMes[dia];
            if (!Array.isArray(turnos)) continue;
            turnos.forEach(t => {
                if (t.i1 && t.i1.trim()) conteo[t.i1.trim()] = (conteo[t.i1.trim()] || 0) + 1;
                if (t.i2 && t.i2.trim()) conteo[t.i2.trim()] = (conteo[t.i2.trim()] || 0) + 1;
            });
        }
    }
    return conteo;
}

function getDesignacoesDoMes(chaveMes) {
    const lista = [];
    const diasMes = designacoesSalvas[chaveMes] || {};
    for (const dia in diasMes) {
        if (dia === '_fechado') continue;
        const turnos = diasMes[dia];
        if (!Array.isArray(turnos)) continue;
        turnos.forEach(t => {
            if (t.i1 && t.i1.trim()) lista.push({ dia: parseInt(dia), nome: t.i1.trim(), local: t.local || '', horario: t.horario || '' });
            if (t.i2 && t.i2.trim()) lista.push({ dia: parseInt(dia), nome: t.i2.trim(), local: t.local || '', horario: t.horario || '' });
        });
    }
    return lista;
}

function getDesignacoesContato(nome) {
    const lista = [];
    for (const mes in designacoesSalvas) {
        const diasMes = designacoesSalvas[mes];
        for (const dia in diasMes) {
            if (dia === '_fechado') continue;
            const turnos = diasMes[dia];
            if (!Array.isArray(turnos)) continue;
            turnos.forEach(t => {
                const i1 = (t.i1 || '').trim();
                const i2 = (t.i2 || '').trim();
                if (i1 === nome || i2 === nome) {
                    lista.push({ mes, dia: parseInt(dia), local: t.local || '', horario: t.horario || '', parceiro: (i1 === nome ? i2 : i1) || '' });
                }
            });
        }
    }
    lista.sort((a, b) => {
        const [aA, aM] = a.mes.split('-').map(Number);
        const [bA, bM] = b.mes.split('-').map(Number);
        return new Date(bA, bM, b.dia) - new Date(aA, aM, a.dia);
    });
    return lista;
}

function calcularDisponibilidadesPorDiaTurno(contatos) {
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const turnos = ['09h às 12h', '12h às 15h', '15h às 17h', '18h às 20h'];
    const mapa = {};
    dias.forEach(d => { mapa[d] = {}; turnos.forEach(t => { mapa[d][t] = 0; }); });
    contatos.forEach(c => {
        if (!c.disp) return;
        dias.forEach(d => {
            if (Array.isArray(c.disp[d])) c.disp[d].forEach(t => { if (mapa[d][t] !== undefined) mapa[d][t]++; });
        });
    });
    return mapa;
}

function temDisponibilidade(c) {
    if (!c.disp) return false;
    return ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
        .some(d => Array.isArray(c.disp[d]) && c.disp[d].length > 0);
}


function renderizarEstatisticas() {
    renderizarVisaoGeral();
}


function abrirEstatTab(tab) {
    const map = {
        geral: { btn: 'tabBtnGeral', panel: 'tabGeral' },
        congregacao: { btn: 'tabBtnCong', panel: 'tabCongregacao' },
        individual: { btn: 'tabBtnIndiv', panel: 'tabIndividual' }
    };

    Object.values(map).forEach(({ btn, panel }) => {
        document.getElementById(btn).classList.remove('active');
        document.getElementById(panel).classList.remove('active');
    });

    document.getElementById(map[tab].btn).classList.add('active');
    document.getElementById(map[tab].panel).classList.add('active');

    if (tab === 'geral') {
        estatMesFoco = null;
        renderizarVisaoGeral();
    }
    if (tab === 'congregacao') {
        estatFiltroCongreAtual = '';
        const sel = document.getElementById('estatFiltroCongreSelect');
        if (sel) sel.value = '';
        renderizarEstatCongregacao();
    }
    if (tab === 'individual') {
        estatNomePesquisa = '';
        const inp = document.getElementById('estatBuscaNome');
        const ul = document.getElementById('estatListaBusca');
        if (inp) inp.value = '';
        if (ul) { ul.innerHTML = ''; ul.style.display = 'none'; }
        renderizarEstatIndividual();
    }
}


function navegarMesEstat(delta) {
    const meses = _mesesDisponiveis();
    if (meses.length === 0) return;

    if (!estatMesFoco) {
        const ultima = meses[meses.length - 1].split('-').map(Number);
        estatMesFoco = new Date(ultima[0], ultima[1], 1);
    }

    const chaveAtual = _chaveDeMes(estatMesFoco);
    let idxAtual = meses.indexOf(chaveAtual);

    if (idxAtual === -1) {
        idxAtual = delta > 0 ? 0 : meses.length - 1;
    }

    const novoIdx = idxAtual + delta;
    if (novoIdx < 0 || novoIdx >= meses.length) return;

    const [ano, mes] = meses[novoIdx].split('-').map(Number);
    estatMesFoco = new Date(ano, mes, 1);
    renderizarBloco_MesVigente();
}

function renderizarVisaoGeral() {
    renderizarBloco_MesVigente();
    renderizarBloco_Top10();
    renderizarBloco_CongDesig();
    renderizarBloco_CongAtualiz();
    renderizarBloco_Excluidos();
}

function renderizarBloco_MesVigente() {
    const meses = _mesesDisponiveis();

    if (!estatMesFoco) {
        if (meses.length > 0) {
            const ultima = meses[meses.length - 1].split('-').map(Number);
            estatMesFoco = new Date(ultima[0], ultima[1], 1);
        } else {
            const hoje = new Date();
            estatMesFoco = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        }
    }

    const chave = _chaveDeMes(estatMesFoco);
    const label = _nomeMes(estatMesFoco);
    const idxAtual = meses.indexOf(chave);

    const podePrev = idxAtual > 0;
    const podeNext = idxAtual !== -1 && idxAtual < meses.length - 1;

    const designacoesMes = getDesignacoesDoMes(chave);
    const totalDesig = designacoesMes.length;
    const nomesMes = [...new Set(designacoesMes.map(d => d.nome))];
    const locaisMes = [...new Set(designacoesMes.map(d => d.local).filter(Boolean))];

    const secaoEl = document.getElementById('secaoMesVigente');
    if (secaoEl) {
        secaoEl.innerHTML = `
            <div class="estat-mes-nav">
                <button class="cal-nav" onclick="navegarMesEstat(-1)" ${!podePrev ? 'disabled' : ''}>
                    <svg class="inline-icon" style="margin:0;" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span class="estat-mes-nav-label">${label}</span>
                <button class="cal-nav" onclick="navegarMesEstat(1)" ${!podeNext ? 'disabled' : ''}>
                    <svg class="inline-icon" style="margin:0;" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>
        `;
    }

    const container = document.getElementById('estatMesVigente');
    if (!container) return;

    if (totalDesig === 0) {
        container.innerHTML = `<p class="estat-empty">Nenhuma designação registrada neste mês.</p>`;
        return;
    }

    container.innerHTML = `
        <div class="estat-mes-grid">
            <div class="estat-mes-card">
                <div class="estat-mes-num">${totalDesig}</div>
                <div class="estat-mes-label">Designações</div>
            </div>
            <div class="estat-mes-card">
                <div class="estat-mes-num">${nomesMes.length}</div>
                <div class="estat-mes-label">Irmãos escalados</div>
            </div>
            <div class="estat-mes-card">
                <div class="estat-mes-num">${locaisMes.length}</div>
                <div class="estat-mes-label">Locais ativos</div>
            </div>
        </div>
    `;
}

function renderizarBloco_Top10() {
    const conteo = calcularConteoDesignacoes();
    const top10 = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const maxTop10 = top10[0]?.[1] || 1;

    document.getElementById('estatTop10').innerHTML = top10.length === 0
        ? '<p class="estat-empty">Nenhuma designação registrada ainda.</p>'
        : top10.map(([nome, qtd], i) => {
            const nomeLimpo = nome.replace(/\s*\([^)]+\)/g, '').trim();
            const contato = contatosDB.find(c => c.nome === nome);
            const cong = contato?.congregacao || extrairCongregacaoDoNome(nome) || '';
            return `
            <div class="estat-bar-row" style="animation-delay:${i * 55}ms">
                <div class="estat-rank">${i + 1}</div>
                <div class="estat-bar-info">
                    <div class="estat-bar-label">
                        <span class="estat-nome">${nomeLimpo}</span>
                        ${cong && cong !== 'Outros' ? `<span class="cong-badge">(${cong})</span>` : ''}
                    </div>
                    <div class="estat-bar-track">
                        <div class="estat-bar-fill" style="width:${Math.max(4, (qtd / maxTop10) * 100)}%;"></div>
                    </div>
                </div>
                <div class="estat-count">${qtd}</div>
            </div>`;
        }).join('');
}

function renderizarBloco_CongDesig() {
    const conteo = calcularConteoDesignacoes();
    const congDesig = {};
    Object.entries(conteo).forEach(([nome, qtd]) => {
        const c = contatosDB.find(x => x.nome === nome);
        const cong = c?.congregacao || extrairCongregacaoDoNome(nome) || 'Outros';
        congDesig[cong] = (congDesig[cong] || 0) + qtd;
    });
    const top = Object.entries(congDesig).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = top[0]?.[1] || 1;

    document.getElementById('estatCongDesig').innerHTML = top.length === 0
        ? '<p class="estat-empty">Sem dados.</p>'
        : top.map(([cong, qtd], i) => `
            <div class="estat-bar-row" style="animation-delay:${i * 55}ms">
                <div class="estat-bar-info">
                    <div class="estat-bar-label"><span class="estat-nome">${cong}</span></div>
                    <div class="estat-bar-track">
                        <div class="estat-bar-fill secondary" style="width:${Math.max(4, (qtd / max) * 100)}%;"></div>
                    </div>
                </div>
                <div class="estat-count">${qtd}</div>
            </div>`).join('');
}

function renderizarBloco_CongAtualiz() {
    const congregacoes = [...new Set(contatosDB.map(c => c.congregacao || 'Outros').filter(Boolean))];
    const atualizacaoData = congregacoes.map(cong => {
        const membros = contatosDB.filter(c => (c.congregacao || 'Outros') === cong);
        const comDisp = membros.filter(c => temDisponibilidade(c)).length;
        const pct = membros.length > 0 ? Math.round((comDisp / membros.length) * 100) : 0;
        return { cong, pct, comDisp, total: membros.length };
    }).sort((a, b) => b.pct - a.pct).slice(0, 6);

    document.getElementById('estatCongAtualiz').innerHTML = atualizacaoData.length === 0
        ? '<p class="estat-empty">Sem dados.</p>'
        : atualizacaoData.map(({ cong, pct, comDisp, total }, i) => `
            <div class="estat-bar-row" style="animation-delay:${i * 55}ms">
                <div class="estat-bar-info">
                    <div class="estat-bar-label">
                        <span class="estat-nome">${cong}</span>
                        <span class="estat-sub">${comDisp}/${total}</span>
                    </div>
                    <div class="estat-bar-track">
                        <div class="estat-bar-fill ${pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger'}" style="width:${Math.max(4, pct)}%;"></div>
                    </div>
                </div>
                <div class="estat-count">${pct}%</div>
            </div>`).join('');
}


function popularFiltroCongreEstat() {
    const sel = document.getElementById('estatFiltroCongreSelect');
    if (!sel) return;
    const congregacoes = [...new Set(contatosDB.map(c => c.congregacao || 'Outros').filter(Boolean))].sort();
    sel.innerHTML = `<option value="">Selecione uma congregação...</option>` +
        congregacoes.map(c => `<option value="${c}">${c}</option>`).join('');
}

function onChangeFiltroCongreEstat() {
    estatFiltroCongreAtual = document.getElementById('estatFiltroCongreSelect').value;
    renderizarEstatCongregacao();
}

function renderizarEstatCongregacao() {
    const container = document.getElementById('estatCongContainer');
    if (!container) return;

    if (!estatFiltroCongreAtual) {
        container.innerHTML = `<div class="estat-placeholder">
            <svg viewBox="0 0 24 24" style="width:40px;height:40px;stroke:var(--primary);fill:none;stroke-width:1.5;opacity:.5;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p>Selecione uma congregação acima para ver as estatísticas.</p>
        </div>`;
        return;
    }

    const membros = contatosDB.filter(c => (c.congregacao || 'Outros') === estatFiltroCongreAtual);
    if (membros.length === 0) {
        container.innerHTML = `<p class="estat-empty">Nenhum irmão encontrado nesta congregação.</p>`;
        return;
    }

    const conteoGeral = calcularConteoDesignacoes();

    const todosMembros = membros
        .map(c => ({ nome: c.nome, qtd: conteoGeral[c.nome] || 0, slots: _totalSlots(c), temDisp: temDisponibilidade(c) }))
        .sort((a, b) => b.qtd - a.qtd);

    const maxD = todosMembros[0]?.qtd || 1;

    const maisDisp = [...membros]
        .map(c => ({ nome: c.nome, slots: _totalSlots(c), temDisp: temDisponibilidade(c) }))
        .sort((a, b) => b.slots - a.slots);
    const maxSlots = maisDisp[0]?.slots || 1;

    const contagemAtualiz = {};
    (atualizacoesDB || []).forEach(a => {
        if (a && a.nome) contagemAtualiz[a.nome] = (contagemAtualiz[a.nome] || 0) + 1;
    });
    const maisAtualizaram = membros
        .map(c => ({ nome: c.nome, atualizacoes: contagemAtualiz[c.nome] || 0, temDisp: temDisponibilidade(c) }))
        .sort((a, b) => b.atualizacoes - a.atualizacoes || (b.temDisp ? 1 : 0) - (a.temDisp ? 1 : 0));
    const maxAtualiz = maisAtualizaram[0]?.atualizacoes || 1;

    const disponMap = calcularDisponibilidadesPorDiaTurno(membros);
    const diasOrdem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const turnosOrdem = ['09h às 12h', '12h às 15h', '15h às 17h', '18h às 20h'];

    const comDisp = membros.filter(c => temDisponibilidade(c)).length;
    const semDisp = membros.length - comDisp;
    const totalDesigCong = todosMembros.reduce((s, x) => s + x.qtd, 0);

    container.innerHTML = `
        <div class="estat-cong-stats">

            <!-- Mini cards de resumo -->
            <div class="estat-mini-cards">
                <div class="estat-mini-card">
                    <div class="estat-mini-num">${membros.length}</div>
                    <div class="estat-mini-label">Membros</div>
                </div>
                <div class="estat-mini-card success">
                    <div class="estat-mini-num">${comDisp}</div>
                    <div class="estat-mini-label">Disponíveis</div>
                </div>
                <div class="estat-mini-card ${semDisp > 0 ? 'danger' : 'success'}">
                    <div class="estat-mini-num">${semDisp}</div>
                    <div class="estat-mini-label">Sem horários</div>
                </div>
                <div class="estat-mini-card secondary">
                    <div class="estat-mini-num">${totalDesigCong}</div>
                    <div class="estat-mini-label">Designações</div>
                </div>
            </div>

            <!-- Todos os irmãos — gráfico completo -->
            <div class="estat-card-inner">
                <div class="estat-card-title">
                    <svg viewBox="0 0 24 24" class="estat-icon"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    Todos os irmãos — designações
                </div>
                <div class="estat-scroll-list tall">
                    ${todosMembros.map(({ nome, qtd }, i) => {
        const nomeLimpo = nome.replace(/\s*\([^)]+\)/g, '').trim();
        const pct = maxD > 0 ? Math.max(qtd > 0 ? 6 : 0, (qtd / maxD) * 100) : 0;
        return `<div class="estat-bar-row small" style="animation-delay:${Math.min(i, 20) * 30}ms">
                            <div class="estat-rank small">${i + 1}</div>
                            <div class="estat-bar-info">
                                <div class="estat-bar-label"><span class="estat-nome">${nomeLimpo}</span></div>
                                <div class="estat-bar-track">
                                    ${pct > 0
                ? `<div class="estat-bar-fill" style="width:${pct}%;"></div>`
                : `<div class="estat-bar-fill zero" style="width:3%;"></div>`}
                                </div>
                            </div>
                            <div class="estat-count ${qtd === 0 ? 'muted' : ''}">${qtd}</div>
                        </div>`;
    }).join('')}
                </div>
            </div>

            <!-- Mais disponíveis + Mais atualizaram -->
            <div class="estat-dois-cols">
                <div class="estat-card-inner">
                    <div class="estat-card-title">
                        <svg viewBox="0 0 24 24" class="estat-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Mais disponíveis
                    </div>
                    <div class="estat-scroll-list">
                        ${maisDisp.map(({ nome, slots, temDisp }, i) => {
        const nomeLimpo = nome.replace(/\s*\([^)]+\)/g, '').trim();
        const pct = maxSlots > 0 ? Math.max(slots > 0 ? 6 : 0, (slots / maxSlots) * 100) : 0;
        return `<div class="estat-bar-row small" style="animation-delay:${Math.min(i, 20) * 30}ms">
                                <div class="estat-rank small">${i + 1}</div>
                                <div class="estat-bar-info">
                                    <div class="estat-bar-label">
                                        <span class="estat-nome">${nomeLimpo}</span>
                                        ${!temDisp ? `<span class="estat-tag danger">sem disp.</span>` : ''}
                                    </div>
                                    <div class="estat-bar-track">
                                        ${pct > 0
                ? `<div class="estat-bar-fill secondary" style="width:${pct}%;"></div>`
                : `<div class="estat-bar-fill zero" style="width:3%;"></div>`}
                                    </div>
                                </div>
                                <div class="estat-count ${slots === 0 ? 'muted' : ''}">${slots}</div>
                            </div>`;
    }).join('')}
                    </div>
                </div>

                <div class="estat-card-inner">
                    <div class="estat-card-title">
                        <svg viewBox="0 0 24 24" class="estat-icon"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                        Perfis mais atualizados
                    </div>
                    <div class="estat-scroll-list">
                        ${maisAtualizaram.map(({ nome, atualizacoes, temDisp }, i) => {
        const nomeLimpo = nome.replace(/\s*\([^)]+\)/g, '').trim();
        return `<div class="estat-perfil-row ${temDisp ? 'ok' : 'warning'}" style="animation-delay:${Math.min(i, 20) * 30}ms">
                                <span class="estat-perfil-ico">${temDisp ? '✓' : '!'}</span>
                                <span style="flex:1;">${nomeLimpo}</span>
                                ${atualizacoes > 0 ? `<span class="estat-tag success">${atualizacoes}x</span>` : ''}
                            </div>`;
    }).join('')}
                    </div>
                </div>
            </div>

            <!-- Disponibilidades por dia/turno -->
            <div class="estat-card-inner" style="margin-top: 16px;">
                <div class="estat-card-title">
                    <svg viewBox="0 0 24 24" class="estat-icon"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Dias e horários mais disponíveis
                </div>
                <div class="estat-disp-grid">
                    ${diasOrdem.map(dia => {
        const totalDia = turnosOrdem.reduce((s, t) => s + (disponMap[dia]?.[t] || 0), 0);
        if (totalDia === 0) return '';
        const maxT = Math.max(...turnosOrdem.map(t => disponMap[dia]?.[t] || 0), 1);
        return `<div class="estat-disp-dia">
                            <div class="estat-disp-dia-nome">${dia.substring(0, 3)}</div>
                            ${turnosOrdem.map(turno => {
            const qtd = disponMap[dia]?.[turno] || 0;
            if (qtd === 0) return '';
            return `<div class="estat-disp-turno">
                                    <span class="estat-disp-label">${turno.replace('h às ', '→').replace('h', 'h')}</span>
                                    <div class="estat-bar-track mini">
                                        <div class="estat-bar-fill secondary" style="width:${Math.max(4, (qtd / maxT) * 100)}%;"></div>
                                    </div>
                                    <span class="estat-disp-count">${qtd}</span>
                                </div>`;
        }).join('')}
                        </div>`;
    }).filter(Boolean).join('')}
                </div>
            </div>

        </div>
    `;
}


function filtrarBuscaEstatIndividual() {
    const termo = removerAcentos(document.getElementById('estatBuscaNome').value.trim());
    const ul = document.getElementById('estatListaBusca');
    if (termo.length < 2) { ul.innerHTML = ''; ul.style.display = 'none'; return; }

    const filtrados = contatosDB.filter(c => c && c.nome && removerAcentos(c.nome).includes(termo)).slice(0, 8);
    if (filtrados.length === 0) {
        ul.innerHTML = '<li class="estat-busca-empty">Nenhum resultado.</li>';
        ul.style.display = 'block';
        return;
    }
    ul.style.display = 'block';
    ul.innerHTML = filtrados.map(c => {
        const nomeLimpo = c.nome.replace(/\s*\([^)]+\)/g, '').trim();
        const cong = c.congregacao || extrairCongregacaoDoNome(c.nome) || '';
        return `<li class="estat-busca-item" onclick="selecionarContatoEstat('${c.nome.replace(/'/g, "\\'")}')">
            <div class="item-avatar small">${getInitials(c.nome)}</div>
            <div>
                <div class="estat-busca-nome">${nomeLimpo}</div>
                ${cong && cong !== 'Outros' ? `<div class="estat-busca-cong">${cong}</div>` : ''}
            </div>
        </li>`;
    }).join('');
}

function selecionarContatoEstat(nome) {
    estatNomePesquisa = nome;
    document.getElementById('estatBuscaNome').value = nome.replace(/\s*\([^)]+\)/g, '').trim();
    const ul = document.getElementById('estatListaBusca');
    ul.innerHTML = ''; ul.style.display = 'none';
    renderizarEstatIndividual();
}

function renderizarEstatIndividual() {
    const container = document.getElementById('estatIndivContainer');
    if (!container) return;

    if (!estatNomePesquisa) {
        container.innerHTML = `<div class="estat-placeholder">
            <svg viewBox="0 0 24 24" style="width:40px;height:40px;stroke:var(--primary);fill:none;stroke-width:1.5;opacity:.5;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <p>Pesquise o nome de um irmão para ver suas estatísticas detalhadas.</p>
        </div>`;
        return;
    }

    const contato = contatosDB.find(c => c.nome === estatNomePesquisa);
    const designacoes = getDesignacoesContato(estatNomePesquisa);
    const totalDesig = designacoes.length;

    const diasConteo = {};
    const turnosConteo = {};
    const parceirosConteo = {};
    const locaisConteo = {};

    designacoes.forEach(d => {
        const [ano, mes] = d.mes.split('-').map(Number);
        const diaSem = nomesDias[new Date(ano, mes, d.dia).getDay()];
        diasConteo[diaSem] = (diasConteo[diaSem] || 0) + 1;
        if (d.horario) turnosConteo[d.horario] = (turnosConteo[d.horario] || 0) + 1;
        if (d.parceiro) parceirosConteo[d.parceiro] = (parceirosConteo[d.parceiro] || 0) + 1;
        if (d.local) locaisConteo[d.local] = (locaisConteo[d.local] || 0) + 1;
    });

    const top5Parceiros = Object.entries(parceirosConteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const top5Locais = Object.entries(locaisConteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const diasOrdem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const maxDia = Math.max(...Object.values(diasConteo), 1);
    const maxTurno = Math.max(...Object.values(turnosConteo), 1);
    const maxLocal = Math.max(...Object.values(locaisConteo), 1);
    const historico = designacoes.slice(0, 20);

    const nomeLimpo = estatNomePesquisa.replace(/\s*\([^)]+\)/g, '').trim();
    const cong = contato?.congregacao || extrairCongregacaoDoNome(estatNomePesquisa) || '';
    const sexo = contato?.sexo || '';

    container.innerHTML = `
        <div class="estat-indiv-header">
            <div class="estat-indiv-avatar">${getInitials(estatNomePesquisa)}</div>
            <div class="estat-indiv-info">
                <h3 class="estat-indiv-nome">${nomeLimpo}</h3>
                ${cong && cong !== 'Outros' ? `<div class="cong-badge" style="font-size:.85rem;">${cong}</div>` : ''}
                <div class="estat-indiv-meta">
                    ${sexo ? `<span>${sexo === 'M' ? '♂ Masculino' : '♀ Feminino'}</span>` : ''}
                    ${contato?.telefone ? `<span>📞 ${contato.telefone}</span>` : ''}
                </div>
            </div>
            <div class="estat-indiv-total">
                <div class="estat-indiv-total-num">${totalDesig}</div>
                <div class="estat-indiv-total-label">total de designações</div>
            </div>
        </div>

        ${totalDesig === 0
            ? `<p class="estat-empty" style="margin-top:16px;text-align:center;">Este irmão ainda não possui designações registradas.</p>`
            : `
        <div class="estat-indiv-grid">
            <div class="estat-card-inner">
                <div class="estat-card-title">
                    <svg viewBox="0 0 24 24" class="estat-icon"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Dias mais designados
                </div>
                ${diasOrdem.filter(d => diasConteo[d] > 0).map(dia => `
                    <div class="estat-bar-row small">
                        <div class="estat-bar-info">
                            <div class="estat-bar-label"><span class="estat-nome">${dia}</span></div>
                            <div class="estat-bar-track">
                                <div class="estat-bar-fill" style="width:${Math.max(4, (diasConteo[dia] / maxDia) * 100)}%;"></div>
                            </div>
                        </div>
                        <div class="estat-count">${diasConteo[dia]}x</div>
                    </div>`).join('')}
            </div>

            <div class="estat-card-inner">
                <div class="estat-card-title">
                    <svg viewBox="0 0 24 24" class="estat-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Horários mais designados
                </div>
                ${Object.entries(turnosConteo).sort((a, b) => b[1] - a[1]).map(([turno, qtd]) => `
                    <div class="estat-bar-row small">
                        <div class="estat-bar-info">
                            <div class="estat-bar-label"><span class="estat-nome" style="font-size:.8rem;">${turno}</span></div>
                            <div class="estat-bar-track">
                                <div class="estat-bar-fill secondary" style="width:${Math.max(4, (qtd / maxTurno) * 100)}%;"></div>
                            </div>
                        </div>
                        <div class="estat-count">${qtd}x</div>
                    </div>`).join('')}
            </div>

            <div class="estat-card-inner">
                <div class="estat-card-title">
                    <svg viewBox="0 0 24 24" class="estat-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    5 locais mais frequentes
                </div>
                ${top5Locais.map(([local, qtd], i) => `
                    <div class="estat-bar-row small">
                        <div class="estat-rank small">${i + 1}</div>
                        <div class="estat-bar-info">
                            <div class="estat-bar-label"><span class="estat-nome" style="font-size:.8rem;">${local}</span></div>
                            <div class="estat-bar-track">
                                <div class="estat-bar-fill" style="width:${Math.max(4, (qtd / maxLocal) * 100)}%;"></div>
                            </div>
                        </div>
                        <div class="estat-count">${qtd}x</div>
                    </div>`).join('')}
            </div>

            <div class="estat-card-inner">
                <div class="estat-card-title">
                    <svg viewBox="0 0 24 24" class="estat-icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    5 parceiros mais frequentes
                </div>
                ${top5Parceiros.length === 0
                ? '<p class="estat-empty">Nenhum parceiro identificado.</p>'
                : top5Parceiros.map(([parceiro, qtd], i) => {
                    const pLimpo = parceiro.replace(/\s*\([^)]+\)/g, '').trim();
                    const pContato = contatosDB.find(c => c.nome === parceiro);
                    const pCong = pContato?.congregacao || extrairCongregacaoDoNome(parceiro) || '';
                    return `<div class="estat-parceiro-row">
                            <div class="estat-rank small">${i + 1}</div>
                            <div class="item-avatar xsmall">${getInitials(parceiro)}</div>
                            <div class="estat-parceiro-info">
                                <span class="estat-nome">${pLimpo}</span>
                                ${pCong && pCong !== 'Outros' ? `<span class="cong-badge xsmall">(${pCong})</span>` : ''}
                            </div>
                            <div class="estat-count">${qtd}x</div>
                        </div>`;
                }).join('')}
            </div>
        </div>

        <div class="estat-card-inner" style="margin-top:16px;">
            <div class="estat-card-title">
                <svg viewBox="0 0 24 24" class="estat-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Histórico de designações
            </div>
            <div class="estat-historico-list">
                ${historico.map(d => {
                    const [ano, mes] = d.mes.split('-').map(Number);
                    const dataF = new Date(ano, mes, d.dia);
                    const diaSem = nomesDias[dataF.getDay()];
                    const parcLimpo = d.parceiro ? d.parceiro.replace(/\s*\([^)]+\)/g, '').trim() : '';
                    return `<div class="estat-hist-row">
                        <div class="estat-hist-data">
                            <span class="estat-hist-dia">${String(d.dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}</span>
                            <span class="estat-hist-sem">${diaSem.substring(0, 3)}</span>
                        </div>
                        <div class="estat-hist-info">
                            <div class="estat-hist-local">${d.local || '—'}</div>
                            <div class="estat-hist-turno">${d.horario || '—'}</div>
                        </div>
                        ${parcLimpo ? `<div class="estat-hist-parceiro">c/ ${parcLimpo}</div>` : ''}
                    </div>`;
                }).join('')}
            </div>
        </div>
        `}
    `;
}


function renderizarBloco_Excluidos() {
    const container = document.getElementById('estatExcluidos');
    if (!container) return;

    const lista = (typeof excluidos !== 'undefined' ? excluidos : []);

    if (lista.length === 0) {
        container.innerHTML = `<p class="estat-empty">Nenhum perfil excluído registrado.</p>`;
        return;
    }

    container.innerHTML = `
        <div class="estat-excluidos-lista">
            ${lista.map((e, i) => {
        const nomeLimpo = (e.nome || '').replace(/\s*\([^)]+\)/g, '').trim();
        const iniciais = (typeof getInitials === 'function') ? getInitials(e.nome) : nomeLimpo.substring(0, 2).toUpperCase();
        const cong = e.congregacao || '';
        return `
                <div class="estat-excluido-card" style="animation-delay:${i * 50}ms">
                    <div class="estat-excluido-avatar">${iniciais}</div>
                    <div class="estat-excluido-body">
                        <div class="estat-excluido-topo">
                            <span class="estat-excluido-nome">${nomeLimpo}</span>
                            ${cong ? `<span class="estat-excluido-cong">${cong}</span>` : ''}
                        </div>
                        <div class="estat-excluido-detalhe">
                            ${e.telefone ? `<span class="estat-excluido-tel">📞 ${e.telefone}</span>` : ''}
                            ${e.motivo ? `<span class="estat-excluido-motivo"><strong>Motivo:</strong> ${e.motivo}</span>` : ''}
                        </div>
                    </div>
                </div>`;
    }).join('')}
        </div>
    `;
}


function inicializarEstatisticas() {
    popularFiltroCongreEstat();
    abrirEstatTab('geral');
}
