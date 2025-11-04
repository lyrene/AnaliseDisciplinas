// ===========================
// FUNÇÕES COMPARTILHADAS
// ===========================
document.addEventListener("DOMContentLoaded", () => {
// ====== Monta menu de navegação ======
const nav = document.getElementById("menu");
APP_CONFIG.visualizacoes.forEach(v => {
  const link = document.createElement("a");
  link.href = v.url;
  link.textContent = v.nome;
  nav.appendChild(link);
});
});

// Carrega CSV com PapaParse
function carregarCSV(file, callback) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const dados = results.data;
      if (!dados[0]) {
        alert("⚠️ O arquivo CSV está vazio ou inválido.");
        return;
      }
      sessionStorage.setItem("disciplinasCSV", JSON.stringify(dados));
      callback(dados);
    }
  });
}

// Recupera dados salvos na sessão
function obterDisciplinas() {
  const dadosSalvos = sessionStorage.getItem("disciplinasCSV");
  if (dadosSalvos) return JSON.parse(dadosSalvos);
  return null;
}

// Normaliza campos (remove acentos e espaços)
function normalizarCampos(data) {
  const dadosNormalizados = data.map(row => {
    const novo = {};
    Object.entries(row).forEach(([k, v]) => {
      const key = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
      novo[key] = v ? v.trim() : "";
    });
    return novo;
  });

  // 🔹 Ordena alfabeticamente pelo nome (respeitando acentos)
  dadosNormalizados.sort((a, b) =>
    (a.nome || "").localeCompare(b.nome || "", "pt", { sensitivity: "base" })
  );

  return dadosNormalizados;
}


// Similaridade textual (compartilhada)
function textoParaVetor(t) {
  const p = t.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const f = {};
  p.forEach(w => f[w] = (f[w] || 0) + 1);
  return f;
}

function cosineSimilarity(v1, v2) {
  const termos = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  let dot = 0, norm1 = 0, norm2 = 0;
  termos.forEach(t => {
    const a = v1[t] || 0;
    const b = v2[t] || 0;
    dot += a * b;
    norm1 += a * a;
    norm2 += b * b;
  });
  const denom = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denom === 0 ? 0 : dot / denom;
}

