
// ====== Inicialização ======
document.addEventListener("DOMContentLoaded", () => {
  const dados = obterDisciplinas();
  if (!dados) {
    alert("⚠️ Por favor, carregue o arquivo CSV na página inicial (index.html).");
    return;
  }

  window.todasDisciplinas = normalizarCampos(dados);
  inicializarTabela();
});

function inicializarTabela() {
  // ====== Ordem dinâmica das colunas ======
  const todasColunas = Object.keys(window.todasDisciplinas[0]);
  const preferidas = [
    "id_curriculo",
    "codigo",
    "nome",
    "semestre_oferta",
    "tipo_vinculo_componente",
    "unidade_responsavel",
    "ch_total",
    "ch_pratico",
    "equivalencia",
    "pre_requisito",
    "ementa",
    "top10_similares",
    "relacao_bes",
    "relacao_bti_c",
    "relacao_bcc",
    "relacao_bia"
  ];

  const campos = preferidas.filter(c => todasColunas.includes(c))
    .concat(todasColunas.filter(c => !preferidas.includes(c)));

  const thead = document.getElementById("thead");
  const tbody = document.getElementById("tbody");
  const paginacaoDiv = document.getElementById("paginacao");

  const linhasPorPagina = 500;
  let paginaAtual = 1;
  let dadosFiltrados = [...window.todasDisciplinas];
  let ordemCampo = null, ordemAsc = true;

  // ====== Cabeçalho ======
  thead.innerHTML = "<tr>" + campos.map(c => `<th data-campo="${c}">${c}</th>`).join("") + "</tr>";

  // ====== Aplica largura de coluna por nome ======
  const estiloTabelas = document.createElement("style");
  estiloTabelas.textContent = campos.map(campo => {
    let largura = "10ch";
    if (["nome"].includes(campo)) largura = "50ch";
    if (["ementa", "equivalencia"].includes(campo)) largura = "30ch";
    return `
      th[data-campo='${campo}'], 
      td[data-campo='${campo}'] {
        max-width: ${largura};
      }
    `;
  }).join("\n");
  document.head.appendChild(estiloTabelas);

  // ====== Ordenação ======
  thead.querySelectorAll("th").forEach(th => {
    th.addEventListener("click", () => {
      const campo = th.dataset.campo;
      if (ordemCampo === campo) ordemAsc = !ordemAsc;
      else ordemAsc = true, ordemCampo = campo;
      renderTabela(filtrar(), campo, ordemAsc, 1);
    });
  });

  // ====== Botões ======
  document.getElementById("btn-filtrar").addEventListener("click", () => {
    dadosFiltrados = filtrar();
    renderTabela(dadosFiltrados, ordemCampo, ordemAsc, 1);
  });

  document.querySelectorAll("#painel-filtros input").forEach(inp => {
    inp.addEventListener("keypress", e => {
      if (e.key === "Enter") document.getElementById("btn-filtrar").click();
    });
  });

  document.getElementById("btn-limpar").addEventListener("click", () => {
    document.querySelectorAll("#painel-filtros input").forEach(i => i.value = "");
    dadosFiltrados = [...window.todasDisciplinas];
    renderTabela(dadosFiltrados, ordemCampo, ordemAsc, 1);
  });

  renderTabela(dadosFiltrados);

  // ====== Renderização principal ======
  function renderTabela(dados, campoOrd, asc, pagina = paginaAtual) {
    if (campoOrd) {
      dados = [...dados].sort((a, b) => {
        const va = (a[campoOrd] || "").toString().toLowerCase();
        const vb = (b[campoOrd] || "").toString().toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }

    const totalPaginas = Math.ceil(dados.length / linhasPorPagina);
    paginaAtual = Math.min(Math.max(1, pagina), totalPaginas);

    const inicio = (paginaAtual - 1) * linhasPorPagina;
    const fim = inicio + linhasPorPagina;
    const subset = dados.slice(inicio, fim);

    tbody.innerHTML = subset.map(d =>
      "<tr>" + campos.map(c => `<td data-campo="${c}" title="Clique para ver valor completo">${d[c] || ""}</td>`).join("") + "</tr>"
    ).join("");

    // === evento de clique na célula ===
    tbody.querySelectorAll("td").forEach(td => {
      td.addEventListener("click", () => exibirValorCelula(td));
    });

    paginacaoDiv.innerHTML = `
      <div>
        <span>Mostrando ${subset.length} de ${dados.length} disciplinas (página ${paginaAtual}/${totalPaginas})</span><br>
        <button id="prevPag" ${paginaAtual === 1 ? "disabled" : ""}>◀ Anterior</button>
        <button id="nextPag" ${paginaAtual === totalPaginas ? "disabled" : ""}>Próxima ▶</button>
      </div>
    `;

    document.getElementById("prevPag").onclick = () => renderTabela(dados, campoOrd, asc, paginaAtual - 1);
    document.getElementById("nextPag").onclick = () => renderTabela(dados, campoOrd, asc, paginaAtual + 1);
  }
}

// ====== Filtro multi-token ======
function filtrar() {
  const f = {
    id_curriculo: val("f_idcurriculo"),
    codigo: val("f_codigo"),
    nome: val("f_nome"),
    semestre_oferta: val("f_semestre"),
    unidade_responsavel: val("f_unidade"),
    pre_requisito: val("f_prereq"),
    equivalencia: val("f_equiv"),
    ementa: val("f_ementa"),
    tipo_vinculo_componente: val("f_tipovinculo")
  };

  return window.todasDisciplinas.filter(d => {
    return Object.entries(f).every(([campo, filtro]) => {
      if (!filtro.length) return true;
      const valor = (d[campo] || "").toString().toLowerCase();
      return filtro.some(token => {
        if (campo === "id_curriculo") {
          const idEsperado = Object.entries(APP_CONFIG.idCurriculos)
            .find(([sigla, id]) => sigla.toLowerCase() === token || id === token);
          if (idEsperado) token = idEsperado[1];
        }
        return valor.includes(token);
      });
    });
  });

  function val(id) {
    return document.getElementById(id).value
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }
}

// ====== Exibição do conteúdo completo de uma célula ======
function exibirValorCelula(td) {
  const valor = td.textContent || "(vazio)";
  const campo = td.dataset.campo;

  // cria overlay leve
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.right = 0;
  overlay.style.bottom = 0;
  overlay.style.background = "rgba(0,0,0,0.3)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = 10000;

  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.borderRadius = "8px";
  box.style.padding = "1rem";
  box.style.maxWidth = "80vw";
  box.style.maxHeight = "70vh";
  box.style.overflow = "auto";
  box.style.boxShadow = "0 4px 10px rgba(0,0,0,0.4)";
  box.innerHTML = `
    <h3 style="margin-top:0; color:#004080;">${campo}</h3>
    <p style="white-space: pre-wrap; font-size:0.9rem;">${valor}</p>
    <button style="margin-top:0.5rem; background:#004080; color:#fff; border:none; border-radius:4px; padding:0.4rem 0.8rem; cursor:pointer;">Fechar</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  box.querySelector("button").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.remove();
  });
}


