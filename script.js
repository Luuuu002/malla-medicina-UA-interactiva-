let asignaturas = [];
let estados = {};
const AREAS = [
  "Formación Básica",
  "Formación General",
  "Formación Profesional"
];
const SEMESTRES = 14;
let semestreActual = 1; // Puedes cambiarlo o pedirlo al usuario.

// Cargar datos desde data.json
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    asignaturas = data.asignaturas;
    cargarEstadosGuardados();
    renderMalla();
  });

function cargarEstadosGuardados() {
  const guardado = localStorage.getItem("estadoMalla");
  if (guardado) {
    estados = JSON.parse(guardado);
  } else {
    asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
  }
}

function guardarEstado() {
  localStorage.setItem("estadoMalla", JSON.stringify(estados));
  actualizarAvance();
}

function renderMalla() {
  const container = document.getElementById("malla-container");
  container.innerHTML = "";

  // Encabezado de semestres
  let header = `<div class="malla-header"><div class="area-header"></div>`;
  for (let s = 1; s <= SEMESTRES; s++) {
    let label = (s === 11) ? "Anual (11-12)" :
                (s === 13) ? "Anual (13-14)" :
                `Semestre ${s}`;
    header += `<div class="semestre-header">${label}</div>`;
  }
  header += `</div>`;
  container.innerHTML += header;

  // Filas por área
  AREAS.forEach(area => {
    let fila = `<div class="malla-area"><div class="area-title">${area}</div>`;
    let s = 1;
    while (s <= SEMESTRES) {
      let ramoDiv = "";
      // Ramos normales
      let ramos = asignaturas.filter(a => a.area === area && a.semestre === s);
      // Ramos anuales
      let ramosAnual = [];
      if (s === 11) ramosAnual = asignaturas.filter(a => a.area === area && (a.semestre === 11 || a.semestre === 12));
      if (s === 13) ramosAnual = asignaturas.filter(a => a.area === area && (a.semestre === 13 || a.semestre === 14));

      if (ramosAnual.length > 0) {
        // Solo mostrar una vez por ciclo anual
        let idsMostrados = [];
        ramosAnual.forEach(a => {
          if (!idsMostrados.includes(a.id)) {
            const completado = estados[a.id]?.completado;
            const cursando = (semestreActual === a.semestre);
            ramoDiv += `
              <div class="asignatura${completado ? ' completado' : ''}${cursando ? ' cursando' : ''}" style="grid-column: span 2;" data-id="${a.id}">
                <span class="nombre">${a.nombre}</span>
                <span class="nota-corner" title="Agregar promedio" onclick="mostrarNotaInput(event, ${a.id})">📝</span>
              </div>
            `;
            idsMostrados.push(a.id);
          }
        });
        fila += `<div class="asignatura-cell" style="grid-column: span 2;">${ramoDiv}</div>`;
        s += 2; // saltar siguiente semestre porque ya ocupó dos columnas
      } else {
        ramos.forEach(a => {
          const completado = estados[a.id]?.completado;
          const cursando = (semestreActual === a.semestre);
          ramoDiv += `
            <div class="asignatura${completado ? ' completado' : ''}${cursando ? ' cursando' : ''}" data-id="${a.id}">
              <span class="nombre">${a.nombre}</span>
              <span class="nota-corner" title="Agregar promedio" onclick="mostrarNotaInput(event, ${a.id})">📝</span>
            </div>
          `;
        });
        fila += `<div class="asignatura-cell">${ramoDiv}</div>`;
        s++;
      }
    }
    fila += `</div>`;
    container.innerHTML += fila;
  });

  actualizarAvance();
}

window.mostrarNotaInput = function(event, id) {
  event.stopPropagation();
  const currentNota = estados[id]?.nota || "";
  const nota = prompt("Ingrese el promedio para este ramo:", currentNota);
  if (nota !== null && nota !== "") {
    estados[id].nota = nota;
    guardarEstado();
    renderMalla();
  }
}

document.addEventListener("click", function(e) {
  if (e.target.classList.contains("nombre")) {
    const ramoDiv = e.target.closest('.asignatura');
    const id = parseInt(ramoDiv.dataset.id);
    if (!id) return;
    if (estados[id]?.nota && !estados[id].completado) {
      estados[id].completado = true;
      guardarEstado();
      renderMalla();
    }
  }
});

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
