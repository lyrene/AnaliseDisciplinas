document.addEventListener("DOMContentLoaded", () => {
  gerarCheckboxCursos();
  const dados = obterDisciplinas();
  if (!dados) {
    alert("⚠️ Por favor, carregue o arquivo CSV na página inicial (index.html).");
    return;
  }
  window.todasDisciplinas = normalizarCampos(dados);
  document.getElementById("btn-comparar").addEventListener("click", compararCursos);
});



function gerarCheckboxCursos() {
  const div = document.getElementById("checkbox");
  div.innerHTML = "";
  APP_CONFIG.cursos.forEach(curso => {
    const id = `chk_${curso}`;
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" id="${id}" value="${curso}">
      ${APP_CONFIG.nomesCursos[curso]}
    `;
    div.appendChild(label);
  });
}






function compararCursos() {
  const selecionados = [...document.querySelectorAll("#painel-selecao input:checked")].map(i => i.value);
  if (selecionados.length !== 2) {
    alert("Selecione exatamente dois cursos para comparar.");
    return;
  }

  const [siglaA, siglaB] = selecionados;
  const idA = APP_CONFIG.idCurriculos[siglaA];
  const idB = APP_CONFIG.idCurriculos[siglaB];

  const cursoA = window.todasDisciplinas.filter(d => d.id_curriculo == idA && d.tipo_vinculo_componente === "OBRIGATÓRIO");
  const cursoB = window.todasDisciplinas.filter(d => d.id_curriculo == idB && d.tipo_vinculo_componente === "OBRIGATÓRIO");

  // analisar equivalências e marcar cores
  marcarEquivalencias(cursoA, cursoB);

  renderCursosSincronizados(cursoA, siglaA, "cursoA", cursoB, siglaB, "cursoB");
}

/* ---------- Alinhamento de semestres ---------- */
function renderCursosSincronizados(cursoA, siglaA, idA, cursoB, siglaB, idB) {
  const semestres = new Set([...cursoA, ...cursoB].map(d => d.semestre_oferta));
  const semestresOrdenados = [...semestres].sort((a,b)=>a-b);

  const contA = document.getElementById(idA);
  const contB = document.getElementById(idB);
  contA.innerHTML = `<div class="titulo-curso">${siglaA}</div>`;
  contB.innerHTML = `<div class="titulo-curso">${siglaB}</div>`;

  semestresOrdenados.forEach(sem => {
    renderCamada(cursoA.filter(d => d.semestre_oferta == sem), sem, contA);
    renderCamada(cursoB.filter(d => d.semestre_oferta == sem), sem, contB);
  });
}

/* ---------- Renderização de uma camada ---------- */
function renderCamada(lista, semestre, container) {
  const bloco = document.createElement("div");
  bloco.className = "semestre-camada";
  bloco.innerHTML = `<div class='semestre-titulo'>${semestre}º Semestre</div>`;

  const grid = document.createElement("div");
  grid.className = "grid-disciplinas";
  bloco.appendChild(grid);

  lista.forEach(d => {
    const box = document.createElement("div");
    box.className = "disciplina-box";
    box.dataset.codigo = d.codigo;

    // largura proporcional à CH total
    const ch = parseInt(d.ch_total) || 0;
    if (ch <= 30) box.classList.add("box-ch30");
    else if (ch <= 60) box.classList.add("box-ch60");
    else box.classList.add("box-ch90");

    // aplicar cor de equivalência
    if (d._eq === "compartilhada") box.classList.add("eq-compartilhada");
    else if (d._eq === "bi") box.classList.add("eq-bidirecional");
    else if (d._eq === "amarelo") box.classList.add("eq-amarelo");
    else if (d._eq === "vermelho") box.classList.add("eq-vermelho");

    // aplicar bordas adicionais
    if (d._indireta) box.classList.add("eq-indireta");
    if (d._multipla) box.classList.add("eq-multipla");

    box.innerHTML = `
      <div class="disciplina-codigo">${d.codigo || ""}</div>
      <div class="disciplina-nome">${d.nome || ""}</div>
      <div class="disciplina-equivalencia">${d.equivalencia || ""}</div>
      <div class="disciplina-prereq">${d.pre_requisito || ""}</div>
      <div class="disciplina-ch-total">${d.ch_total || ""}</div>
      <div class="disciplina-ch-pratico">${d.ch_pratico || ""}</div>
    `;
    grid.appendChild(box);
  });

  container.appendChild(bloco);
}

/* ---------- Marcação de equivalências ---------- */
/* ---------- Marcação de equivalências com lógica semântica nova ---------- */
function marcarEquivalencias(cursoA, cursoB) {
  const mapA = Object.fromEntries(cursoA.map(d => [d.codigo, d]));
  const mapB = Object.fromEntries(cursoB.map(d => [d.codigo, d]));

  // reset
  cursoA.forEach(a => { a._eq = null; a._indireta = false; a._multipla = false; });
  cursoB.forEach(b => { b._eq = null; b._indireta = false; b._multipla = false; });

  // 1) MARCAR "COMPARTILHADA" (mesmo código existe nos dois cursos)
  //    e travar esses nós para não sofrerem recoloração depois.
  const compartilhadasA = new Set();
  const compartilhadasB = new Set();
  for (const cod in mapA) {
    if (mapB[cod]) {
      mapA[cod]._eq = "compartilhada";
      mapB[cod]._eq = "compartilhada";
      compartilhadasA.add(cod);
      compartilhadasB.add(cod);
    }
  }

  // 2) RELAÇÕES DIRETAS A -> B (pule "compartilhadas")
  cursoA.forEach(a => {
    if (compartilhadasA.has(a.codigo)) return; // não sobrescrever
    const equivalencias = (a.equivalencia || "").split(/[,; ]+/).filter(Boolean);
    if (equivalencias.length > 1) a._multipla = true;
//if (equivalencias.length > 1 && d.tipo_vinculo_componente === "OBRIGATÓRIO") a._multipla = true;

    equivalencias.forEach(codB => {
      const b = mapB[codB];
      if (!b) return;

      if (compartilhadasB.has(b.codigo)) return; // não sobrescrever B compartilhada

      const bRefs = (b.equivalencia || "").split(/[,; ]+/).filter(Boolean);
      const bApontaA = bRefs.includes(a.codigo);

      if (bApontaA) {
        // A <-> B: equivalência perfeita (verde suave normal)
        a._eq = a._eq ?? "bi";
        b._eq = b._eq ?? "bi";
      } else {
        // sua regra: A->B e B !-> A => A = amarelo, B = vermelho
        a._eq = a._eq ?? "amarelo";
        b._eq = b._eq ?? "vermelho";
      }
    });
  });

  // 3) RELAÇÕES DIRETAS B -> A (para cobrir casos não pegos acima)
  cursoB.forEach(b => {
    if (compartilhadasB.has(b.codigo)) return;
    const equivalencias = (b.equivalencia || "").split(/[,; ]+/).filter(Boolean);
    if (equivalencias.length > 1) b._multipla = true;
//if (equivalencias.length > 1 && d.tipo_vinculo_componente === "OBRIGATÓRIO") a._multipla = true;

    equivalencias.forEach(codA => {
      const a = mapA[codA];
      if (!a) return;
      if (compartilhadasA.has(a.codigo)) return;

      const aRefs = (a.equivalencia || "").split(/[,; ]+/).filter(Boolean);
      const aApontaB = aRefs.includes(b.codigo);

      if (aApontaB) {
        // B <-> A (coberto na etapa anterior, mas deixamos idempotente)
        a._eq = a._eq ?? "bi";
        b._eq = b._eq ?? "bi";
      } else {
        // sua regra: B->A e A !-> B => B = amarelo, A = vermelho
        b._eq = b._eq ?? "amarelo";
        a._eq = a._eq ?? "vermelho";
      }
    });
  });

  // 4) INDIRETAS (nível 2) — opcional, mantém
  const todosCodigosA = new Set(Object.keys(mapA));
  cursoA.forEach(a => {
    const eqsA = (a.equivalencia || "").split(/[,; ]+/).filter(Boolean);
    eqsA.forEach(codB => {
      const b = mapB[codB];
      if (!b) return;
      const bEqs = (b.equivalencia || "").split(/[,; ]+/).filter(Boolean);
      if (bEqs.some(x => todosCodigosA.has(x) && x !== a.codigo)) {
        a._indireta = true;
        b._indireta = true;
      }
    });
  });

  // 5) (Opcional) se quiser borda roxa apenas para OBRIGATÓRIAS, deixe como está;
  //    se quiser considerar TODAS, já está valendo (pois _multipla foi setado acima).
}




