
document.addEventListener("DOMContentLoaded", () => {
  gerarCheckboxCursos();
  document.getElementById("btn-aplicar-comparacao").addEventListener("click", renderComparativo);

  const dadosSalvos2 = obterDisciplinas();
  if (dadosSalvos2) {
    window.disciplinas = normalizarCampos(dadosSalvos2);
  } else {
    alert("Por favor, carregue o arquivo CSV na página inicial.");
  }
});

function gerarCheckboxCursos() {
  const div = document.getElementById("checkbox-cursos");
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


function renderComparativo() {
  const selecionados = Array.from(document.querySelectorAll("#checkbox-cursos input:checked"))
    .map(chk => chk.value);

  if (selecionados.length === 0) {
    alert("Selecione pelo menos um curso para comparar.");
    return;
  }

  const container = document.getElementById("comparativo");
  container.innerHTML = ""; // limpa colunas anteriores

  selecionados.forEach(curso => {
    const colDiv = document.createElement("div");
    colDiv.className = "coluna-curso";

    const titulo = document.createElement("h2");
    titulo.textContent = APP_CONFIG.nomesCursos[curso];
    colDiv.appendChild(titulo);

    // 🔹 Configurações básicas
   /* const col = APP_CONFIG.mapaColunas?.[curso] || `relacao_${curso.toLowerCase()}`;
    const idSelecionado = String(APP_CONFIG.idCurriculos?.[curso] || "").trim();

    const todas = window.disciplinas;*/
    const { col, disciplinas: todas, idSelecionado } = obterColunaEDisciplinas(curso);
    
    const mapa = {};

    // 🔸 Deduplicação: prioriza o registro do curso ativo (id_curriculo)
    todas.forEach(d => {
      const cod = d.codigo?.trim();
      if (!cod) return;

      const atual = mapa[cod];
      const idAtual = String(atual?.id_curriculo || "").trim();
      const idNova = String(d.id_curriculo || "").trim();

      if (!atual || (idAtual !== idSelecionado && idNova === idSelecionado)) {
        mapa[cod] = d;
      }
    });

    // 🔹 Filtra apenas disciplinas válidas (presentes nos grupos esperados)
    const gruposValidos = ["obrigatoria", "obrigatório", "optativaes", "flextoria", "optativa", "optativo",  "optativanova"];
    const disciplinasFiltradas = Object.values(mapa).filter(d =>
      d[col] && gruposValidos.includes(d[col].toLowerCase())
    );

    // 🔹 Agrupa conforme o valor em relacao_***
    const grupos = {};
    disciplinasFiltradas.forEach(d => {
      const tipo = d[col]?.toLowerCase();
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(d);
    });

    // 🔹 Ordem de exibição
    const ordem = ["obrigatoria", "obrigatório", "optativaes", "flextoria", "optativa", "optativo", "optativanova"];

    // 🔹 Monta as listas de cada grupo
    ordem.forEach(tipo => {
      let lista = grupos[tipo];
      if (!lista || lista.length === 0) return;

      // Ordena por semestre_oferta (número crescente)
      lista = lista.sort((a, b) => {
        const sa = parseInt(a.semestre_oferta) || 0;
        const sb = parseInt(b.semestre_oferta) || 0;
        return sa - sb;
      });

      // Cabeçalho do grupo
      const h = document.createElement("h3");
      const nomeTipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
      h.textContent = `${nomeTipo} (${lista.length})`;
      colDiv.appendChild(h);

      // Disciplinas do grupo
      lista.forEach(d => {
        const sem = parseInt(d.semestre_oferta);
        const semTexto = sem && sem > 0 ? ` (sem: ${sem})` : "";
        const el = document.createElement("div");
        el.className = "disciplina";
        el.textContent = `${d.codigo} - ${d.nome}${semTexto}`;
        colDiv.appendChild(el);
      });
    });

    container.appendChild(colDiv);
  });
}
