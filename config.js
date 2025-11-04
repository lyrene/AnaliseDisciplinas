// ===========================
// CONFIGURAÇÕES DO SISTEMA
// ===========================
window.APP_CONFIG = {
  cursos: ["BES", "BCC", "BTI_C", "BTI_DS", "BTI_L", "BTI_N", "BIA", "ENGCOMP", "ENGCOMP_C", "BSI", "ADS" ],

  nomesCursos: {
    BES: "BES",
    BTI_C: "BTI Comp",
    BCC: "BCC",
    BIA: "BIA",
    ENGCOMP: "EngComp",
    BSI: "BSI",
    ADS: "Analise DesSof",
    ENGCOMP_C: "EngComp Caicó",
    BTI_N: "BTI Noturno",
    BTI_DS: "BTI DesSof",
    BTI_L: "BTI Livre"
  },

  idCurriculos: {
    BES: "105694093",     // 🔹 substitua pelos IDs reais dos currículos
    BTI_C: "133804382",
    BCC: "165191073",
    BIA: "178736047",
    ENGCOMP: "171836029",
    BSI: "510230607",
    ADS: "136481372",
    ENGCOMP_C: "181661632",
    BTI_N: "133797961",
    BTI_DS: "134044403",
    BTI_L: "133795010"
  },

  mapaColunas: {
    BES: "relacao_bes",
    BTI_C: "relacao_bti_c",   // 👈 aqui você coloca o nome exato da coluna no CSV
    BCC: "relacao_bcc",
    BIA: "relacao_bia",
    ENGCOMP: "relacao_engcomp"
  },

  visualizacoes: [
    { id: "individual", nome: "Por Curso", url: "index.html" },
    { id: "tabela", nome: "Tabela Completa", url: "tabela.html" },
    { id: "comparativo", nome: "Comparativo", url: "comparativo.html" },
    { id: "compara2cursos", nome: "Comparar 2 Cursos", url: "comparar_cursos.html" }
  ],

  similaridade: {
    pesoNome: 0.45,
    pesoEmenta: 0.35,
    pesoObjetivos: 0.05,
    pesoConteudo: 0.15
  }
};
