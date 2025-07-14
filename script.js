let asignaturas = [];
let estados = {};
const AREAS = [
  "Formación Básica",
  "Formación General",
  "Formación Profesional"
  // Agrega aquí otras áreas si tienes más
];
const SEMESTRES = 14;
let semestreActual = 1; // Puedes pedirlo al usuario con un modal o input al inicio

// Cargar datos desde data.json
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    asignaturas = data.asignaturas;
    cargarEstadosGuardados();
    renderMalla();
  });

// Cargar estados guardados (completado y nota)
function cargarEstadosGuardados() {
  const guardado = localStorage.getItem("estadoMalla");
  if (guardado) {
    estados = JSON.parse(guardado);
  } else {
    asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
  }
}

// Guardar estado actual
function guardarEstado() {
  localStorage.setItem("estadoMalla", JSON.stringify(estados));
  actualizarAvance();
}

function renderMalla() {
  const container = document.getElementById("malla-container");
  container.innerHTML = "";

  // Encabezados (años y semestres)
  let header = `<div class="malla-header"><div class="area-header"></div>`;
  for (let s = 1; s <= SEMESTRES; s++) {
    let isAnual = (s === 11 || s === 13);
    let colspan = isAnual ? 2 : 1;
    let label = isAnual
      ? `Anual (${s} y ${s+1})`
      : `Semestre ${s}`;
    header += `<div class="semestre-header" style="grid-column: span ${colspan};">${label}</div>`;
    if (isAnual) s++; // saltar siguiente porque ya ocupó dos columnas
  }
  header += `</div>`;
  container.innerHTML += header;

  // Filas por área
  AREAS.forEach(area => {
    let fila = `<div class="malla-area"><div class="area-title">${area}</div>`;
    for (let s = 1; s <= SEMESTRES; s++) {
      // Buscar ramos de este área y semestre
      let ramos = asignaturas.filter(a =>
        a.area === area &&
        (a.semestre === s || (s === 11 && a.semestre === 12) || (s === 13 && a.semestre === 14))
      );
      let isAnual = (s === 11 || s === 13);
      let colspan = isAnual ? 2 : 1;
      let ramoDiv = "";
      ramos.forEach(a => {
        const completado = estados[a.id]?.completado;
        const cursando = (semestreActual === a.semestre);
        ramoDiv += `
          <div class="asignatura${completado ? ' completado' : ''}${cursando ? ' cursando' : ''}">
            <span class="nombre">${a.nombre}</span>
            <span class="nota-corner" onclick="mostrarNotaInput(${a.id}, this)">📝</span>
            ${estados[a.id]?.nota ? `<span class="nota-value">${estados[a.id].nota}</span>` : ""}
          </div>
        `;
      });
      fila += `<div class="asignatura-cell" style="grid-column: span ${colspan};">${ramoDiv}</div>`;
      if (isAnual) s++; // saltar el siguiente semestre porque ya ocupó dos columnas
    }
    fila += `</div>`;
    container.innerHTML += fila;
  });

  actualizarAvance();
}

// Mostrar input para nota (modal simple)
function mostrarNotaInput(id, elem) {
  const currentNota = estados[id]?.nota || "";
  const nota = prompt("Ingrese el promedio para este ramo:", currentNota);
  if (nota !== null) {
    estados[id].nota = nota;
    guardarEstado();
    renderMalla();
  }
}

// Marcar ramo como completado/tachar
document.addEventListener("click", function(e) {
  if (e.target.classList.contains("nombre")) {
    // Buscar el ramo por nombre
    const nombre = e.target.textContent;
    const ramo = asignaturas.find(a => a.nombre === nombre);
    if (!ramo) return;
    // Solo si tiene nota
    if (estados[ramo.id]?.nota && !estados[ramo.id].completado) {
      estados[ramo.id].completado = true;
      guardarEstado();
      renderMalla();
    }
  }
});

// Resetear malla
function resetearMalla() {
  if (confirm("¿Estás segura que quieres resetear toda la malla?")) {
    asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
    localStorage.removeItem("estadoMalla");
    renderMalla();
  }
}

function actualizarAvance() {
  const total = asignaturas.length;
  const completados = asignaturas.filter(a => estados[a.id]?.completado).length;
  const porcentaje = Math.round((completados / total) * 100);
  document.querySelector(".progreso").style.width = `${porcentaje}%`;
  document.getElementById("porcentaje").innerText = `${porcentaje}%`;
}
