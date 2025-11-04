
const cursosDiv = document.getElementById('cursos');
APP_CONFIG.cursos.forEach(curso => {
  const btn = document.createElement('button');
  btn.textContent = curso;
  btn.className = 'btn-curso';
  btn.onclick = () => renderCurso(curso, btn);
  cursosDiv.appendChild(btn);
});

// ====== Upload CSV ======
document.getElementById('uploadBtn').onclick = () => document.getElementById('csvFile').click();
document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  carregarCSV(file, initSistema);
});

const dadosSalvos = obterDisciplinas();
if (dadosSalvos) initSistema(dadosSalvos);

function initSistema(dados) {

  window.disciplinas = normalizarCampos(dados);
  window.disciplinasFiltradas = normalizarCampos(dados);
  document.querySelector('.btn-curso')?.click(); // seleciona o primeiro curso automaticamente
}

function obterColunaEDisciplinas(curso) {
  const idSelecionado = String(APP_CONFIG.idCurriculos?.[curso] || "").trim();
  let col = APP_CONFIG.mapaColunas?.[curso];
  let disciplinas;

  if (!col) {
    // Caso não exista mapeamento, usa tipo_vinculo_componente e filtra pelo id_curriculo
    col = "tipo_vinculo_componente";
    disciplinas = window.disciplinas.filter(
      d => String(d.id_curriculo).trim() === idSelecionado
    );
  } else {
    // Caso exista mapeamento, usa todas as disciplinas
    disciplinas = window.disciplinas;
  }

  return { col, disciplinas, idSelecionado };
}

function renderCurso(curso, btnEl) {
  document.querySelectorAll('.btn-curso').forEach(b => b.classList.remove('ativo'));
  btnEl.classList.add('ativo');
// 🔸 Gera uma lista sem duplicatas por código,
// priorizando registros com o id_curriculo igual ao do curso selecionado

/*  
const col = APP_CONFIG.mapaColunas?.[curso] || `relacao_${curso.toLowerCase()}`;
const idSelecionado = String(APP_CONFIG.idCurriculos?.[curso] || "").trim();
const todas = window.disciplinas;
*/
const { col, disciplinas: todas, idSelecionado } = obterColunaEDisciplinas(curso);

const mapa = {};

todas.forEach(d => {
  const cod = d.codigo?.trim();
  if (!cod) return;

  const atual = mapa[cod];
  const idAtual = String(atual?.id_curriculo || "").trim();
  const idNova = String(d.id_curriculo || "").trim();

  // Se o código ainda não foi registrado, ou se o registro novo pertence ao curso atual, substitui
  if (!atual || (idAtual !== idSelecionado && idNova === idSelecionado)) {
    mapa[cod] = d;
  }
});

window.disciplinasFiltradas = Object.values(mapa); // 👈 versão deduplicada e priorizada


  const dados = window.disciplinasFiltradas.filter(d =>
  d[col] &&
  !["naodefinido", "equivalente"].includes(d[col].toLowerCase())
);



  const grupos = {};
  dados.forEach(d => {
    const tipo = (d[col] || "naodefinido").toLowerCase();
    if (!grupos[tipo]) grupos[tipo] = [];
    grupos[tipo].push(d);
  });

  const ordem = ["obrigatoria", "obrigatório", "optativaes", "optativo", "optativa", "flextoria", "complementar"];
  const div = document.getElementById('disciplinas');
  div.innerHTML = `<h2>${APP_CONFIG.nomesCursos[curso]}</h2>`;

  ordem.concat(Object.keys(grupos).filter(k => !ordem.includes(k))).forEach(tipo => {
  let lista = grupos[tipo];
  if (!lista || lista.length === 0) return;

  // 🔹 Ordena pela coluna "semestre_oferta" (convertendo para número)
  lista = lista.sort((a, b) => {
    const sa = parseInt(a.semestre_oferta) || 0;
    const sb = parseInt(b.semestre_oferta) || 0;
    return sa - sb;
  });

  const h = document.createElement("h3");
  h.textContent = `${tipo} (${lista.length})`;
  div.appendChild(h);

  lista.forEach(d => {
    const sem = parseInt(d.semestre_oferta);
    const chTotal = parseInt(d.ch_total);

    const semTexto = sem && sem > 0 ? ` (sem: ${sem}, ch: ${chTotal})` : "";
    const el = document.createElement("div");
    el.className = "disciplina";
    el.textContent = `${d.codigo} - ${d.nome}${semTexto}`;
    el.onclick = () => selecionarDisciplina(d);
    div.appendChild(el);
  });
});

}




function selecionarDisciplina(d) {
  document.querySelectorAll('.disciplina').forEach(e => e.classList.remove('disciplina-selecionada'));
  const el = [...document.querySelectorAll('.disciplina')].find(e => e.textContent.includes(d.codigo));
  if (el) el.classList.add('disciplina-selecionada');

const det = document.getElementById('detalhes');

// curso atualmente selecionado
const cursoAtivo = document.querySelector('.btn-curso.ativo')?.textContent?.trim();
//const colRelacao = APP_CONFIG.mapaColunas?.[cursoAtivo] || `relacao_${cursoAtivo?.toLowerCase()}`;
const { col: colRelacao } = obterColunaEDisciplinas(cursoAtivo);
// valores opcionais
const tipo = d.tipo_componente || "--";
const periodo = d.periodo_programa || "--";
//const relacao = d[colRelacao] || "--";

// monta HTML principal
det.innerHTML = `
  <h3>${d.codigo} - ${d.nome}</h3>
  <p>
    <b>CH Total:</b> ${d.ch_total || "-"}
    <span style="margin-left:10px;">${tipo}</span>
    <span style="margin-left:10px;">${periodo}</span>
  </p>
`;

// adiciona pré/co-requisitos se existirem
let prereq = d.pre_requisito?.trim();
let coreq = d.co_requisito?.trim();
if (prereq || coreq) {
  det.innerHTML += `<p>`;
  if (prereq) det.innerHTML += `<b>Pré-requisito:</b> ${prereq} `;
  if (coreq) det.innerHTML += `<b>Co-requisito:</b> ${coreq}`;
  det.innerHTML += `</p>`;
}

// mantém as linhas existentes depois (ementa, equivalência etc.)
det.innerHTML += `<p><b>Ementa:</b> ${d.ementa || "-"}</p>`;


  const exprEquivalencia = d.equivalencia?.trim();
  if (exprEquivalencia) {
    const codigos = exprEquivalencia.match(/[A-Z]{3}\d{4}/g) || [];
    let expressaoFormatada = exprEquivalencia;

    codigos.forEach(code => {
      const eq = window.disciplinas.find(x => x.codigo?.trim() === code.trim());
      expressaoFormatada = expressaoFormatada.replace(
        new RegExp(`\\b${code}\\b`, "g"),
        `<span style="color:${eq ? '#004080' : '#999'}; font-weight:bold;">${code}</span>`
      );
    });

    det.innerHTML += `<p><b>Equivalentes diretas:</b> <i>${expressaoFormatada}</i></p>`;

    const encontrados = codigos
      .map(code => window.disciplinas.find(x => x.codigo?.trim() === code.trim()))
      .filter(Boolean);

    if (encontrados.length > 0) {
     encontrados.forEach(eq => {
  const cursoAtivo = document.querySelector('.btn-curso.ativo')?.textContent?.trim();
  //const colRelacao = APP_CONFIG.mapaColunas?.[cursoAtivo] || `relacao_${cursoAtivo?.toLowerCase()}`;
  const tipo = eq.tipo_componente || "--";
  const periodo = eq.periodo_programa || "--";
  //const relacao = eq[colRelacao] || "--";

  det.innerHTML += `
    <div class="equivalente">
      <b>${eq.codigo}</b> - ${eq.nome}<br>
      <b>CH:</b> ${eq.ch_total || "-"}
      <span style="margin-left:8px;">${tipo}</span>
      <span style="margin-left:8px;">${periodo}</span>
      <br>
      <b>Ementa:</b> ${eq.ementa || "-"}
    </div>`;
});

    } else {
      //det.innerHTML += `<p style="font-size:0.9em;">Nenhuma disciplina equivalente encontrada no dataset.</p>`;
    }
  } else {
    det.innerHTML += `<p><i>Nenhuma equivalência direta definida.</i></p>`;
  }

  const sugeridas = sugerirEquivalentesSemanticos(d);
  if (sugeridas.length) {
    det.innerHTML += `<h4>Sugestões de equivalência (análise semântica):</h4>`;
    sugeridas.slice(0, 10).forEach(s => {
    const cursoAtivo = document.querySelector('.btn-curso.ativo')?.textContent?.trim();
    //const colRelacao = APP_CONFIG.mapaColunas?.[cursoAtivo] || `relacao_${cursoAtivo?.toLowerCase()}`;
    const tipo = s.tipo_componente || "--";
    const periodo = s.periodo_programa || "--";
    //const relacao = s[colRelacao] || "--";

    // 🔸 Verifica se o código começa com DIM ou IMD
    const destaque = /^DIM|^IMD/i.test(s.codigo?.trim()) ? " destaque" : "";

    det.innerHTML += `
      <div class="sugerida${destaque}">
        <b>${s.codigo}</b> - ${s.nome}<br>
        <b>CH:</b> ${s.ch_total || "-"}
        <span style="margin-left:8px;">${tipo}</span>
        <span style="margin-left:8px;">${periodo}</span>
      <br>
        <span class="score">Similaridade: ${(s.score * 100).toFixed(1)}%</span><br>
        <b>Ementa:</b> ${s.ementa || "-"}
      </div>`;
});


  }
}



function sugerirEquivalentesSemanticosML(base) {
  const disciplinas = window.disciplinasFiltradas.filter(x => x.codigo !== base.codigo);

  // 🔸 Captura disciplinas equivalentes diretas para excluir das sugestões
  let codigosEquivalentes = [];
  if (base.equivalencia) {
    codigosEquivalentes = (base.equivalencia.match(/[A-Z]{3}\d{4}/g) || []).map(c => c.trim());
  }

  const vBaseNome = textoParaVetor(base.nome || "");
  const vBaseEmenta = textoParaVetor(base.ementa || "");
  const vBaseObj = textoParaVetor(base.objetivos || "");
  const vBaseCont = textoParaVetor(base.conteudo || "");

  const resultados = disciplinas.map(d => {
    const vNome = textoParaVetor(d.nome || "");
    const vEmenta = textoParaVetor(d.ementa || "");
    const vObj = textoParaVetor(d.objetivos || "");
    const vCont = textoParaVetor(d.conteudo || "");

    const simNome = cosineSimilarity(vBaseNome, vNome);
    const simEmenta = cosineSimilarity(vBaseEmenta, vEmenta);
    const simObj = cosineSimilarity(vBaseObj, vObj);
    const simCont = cosineSimilarity(vBaseCont, vCont);

    let score = 0.40 * simNome + 0.35 * simEmenta + 0.05 * simObj + 0.20 * simCont;
    if (base.nome.trim().toLowerCase() === d.nome.trim().toLowerCase()) {
      score = Math.max(score, 0.95);
    }

    return { ...d, score };
  }).sort((a, b) => b.score - a.score);

  return resultados
  .filter(r => r.score > 0.05 && !codigosEquivalentes.includes(r.codigo?.trim()))
  .slice(0, 10);

}

function sugerirEquivalentesSemanticosLLM(base) {
  // 🔹 Obtem todas as disciplinas do sistema (como antes)
  const disciplinas = window.disciplinasFiltradas;

  // 🔹 Encontra a disciplina "base" completa
  const disciplinaBase = disciplinas.find(d => d.codigo === base.codigo);
  if (!disciplinaBase) return [];

  // 🔹 Lê o campo com sugestões semânticas (do CSV processado)
  const campoSugestoes = disciplinaBase.top10_similares || "";
  if (!campoSugestoes.trim()) return [];

  // 🔹 Extrai pares CODIGO (score) do texto
  const sugestoes = campoSugestoes
    .split(",")                                 // separa por vírgula
    .map(s => s.trim())
    .map(item => {
      const match = item.match(/^([A-Z]{3}\d{3,4})\s*\(([\d.]+)\)$/);
      if (!match) return null;
      const [_, codigo, scoreStr] = match;
      return { codigo, score: parseFloat(scoreStr) };
    })
    .filter(Boolean);

  // 🔹 Converte os códigos sugeridos em objetos completos de disciplina
  const resultados = sugestoes.map(sug => {
    const d = disciplinas.find(x => x.codigo === sug.codigo);
    return d ? { ...d, score: sug.score } : null;
  }).filter(Boolean);

  // 🔹 Remove equivalências diretas (se existirem)
  let codigosEquivalentes = [];
  if (base.equivalencia) {
    codigosEquivalentes = (base.equivalencia.match(/[A-Z]{3}\d{3,4}/g) || []).map(c => c.trim());
  }

  return resultados.filter(r => !codigosEquivalentes.includes(r.codigo));
}

function sugerirEquivalentesSemanticos(base) {
  // 🔸 Executa as duas estratégias
  const resultadosOLD = sugerirEquivalentesSemanticosML(base);
  const resultadosNOVO = sugerirEquivalentesSemanticosLLM(base);

  // 🔸 Cria um dicionário para unir resultados e calcular médias
  const mapa = new Map();

  // 🔹 Adiciona resultados do OLD
  resultadosOLD.forEach(d => {
    mapa.set(d.codigo, { ...d, scores: [d.score] });
  });

  // 🔹 Adiciona resultados do NOVO (calculando média se já existir)
  resultadosNOVO.forEach(d => {
    if (mapa.has(d.codigo)) {
      const existente = mapa.get(d.codigo);
      existente.scores.push(d.score);
      existente.score = existente.scores.reduce((a, b) => a + b, 0) / existente.scores.length;
    } else {
      mapa.set(d.codigo, { ...d, scores: [d.score] });
    }
  });

  // 🔹 Converte de volta para lista
  const listaUnida = Array.from(mapa.values());

  // 🔹 Ordena: primeiro DIM/IMD, depois pelos scores
  listaUnida.sort((a, b) => {
    const aDIM = /^((DIM|IMD)\d+)/.test(a.codigo);
    const bDIM = /^((DIM|IMD)\d+)/.test(b.codigo);

    if (aDIM && !bDIM) return -1;
    if (!aDIM && bDIM) return 1;
    return b.score - a.score;
  });

  // 🔹 Retorna até 10 disciplinas unificadas
  return listaUnida; //.slice(0, 20)
}
