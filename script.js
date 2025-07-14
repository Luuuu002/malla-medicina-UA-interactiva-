// === Manejador de la malla académica ===

let asignaturas = [];
let estados = {};

// Cargar datos desde data.json
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    asignaturas = data.asignaturas;
    cargarEstadosGuardados();
    renderMalla();
  });

// Cargar estados guardados desde localStorage
function cargarEstadosGuardados() {
  const guardado = localStorage.getItem("estadoMalla");
  if (guardado) {
    estados = JSON.parse(guardado);
  } else {
    asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
  }
}

// Guardar estado en localStorage
function guardarEstado() {
  localStorage.setItem("estadoMalla", JSON.stringify(estados));
  actualizarAvance();
}

// Renderizar toda la malla
function renderMalla() {
  const container = document.getElementById("malla-container");
  container.innerHTML = "";

  // Agrupar asignaturas por semestre
  const semestres = {};
  asignaturas.forEach(a => {
    if (!semestres[a.semestre]) semestres[a.semestre] = [];
    semestres[a.semestre].push(a);
  });

  // Agrupar semestres por años (cada 2 semestres)
  const años = {};
  Object.keys(semestres).forEach(sem => {
    const año = Math.ceil(sem / 2);
    if (!años[año]) años[año] = [];
    años[año].push({ semestre: sem, asignaturas: semestres[sem] });
  });

  Object.keys(años).forEach(año => {
    const divAño = document.createElement("div");
    divAño.className = "año";
    divAño.innerHTML = `<h2>AÑO ${año}</h2>`;

    const gridAño = document.createElement("div");
    gridAño.className = "grid-año";

    años[año].forEach(grupo => {
      const divSemestre = document.createElement("div");
      divSemestre.className = "semestre";

      // Títulos especiales
      let titulo = `Semestre ${grupo.semestre}`;
      if (parseInt(grupo.semestre) === 11) titulo = "Semestre 11 y 12";
      if (parseInt(grupo.semestre) === 13) titulo = "Semestre 13 y 14";

      divSemestre.innerHTML = `<h3>${titulo}</h3>`;

      const grid = document.createElement("div");
      grid.className = "grid-asignaturas";

      grupo.asignaturas.forEach(a => {
        const bloqueado = tienePrerrequisitoNoCompletado(a);
        const completado = !!estados[a.id]?.completado;

        const div = document.createElement("div");
        div.className = `asignatura${completado ? ' completado' : (bloqueado ? ' bloqueado' : '')}`;
        div.dataset.id = a.id;

        const notaHTML = completado && estados[a.id]?.nota 
          ? `<p class="nota-mostrada">Nota: <strong>${estados[a.id].nota}</strong></p>`
          : `<div class="nota-section">
              <input class="nota" type="text" placeholder="Ingresa tu nota" value="${estados[a.id]?.nota || ''}">
            </div>`;

        div.innerHTML = `
          <h4>${a.nombre}</h4>
          <small>${a.area}</small>
          ${notaHTML}
          <div class="nota-button">Nota</div>
        `;

        // Click en botón de nota (esquina inferior derecha)
        const btnNota = div.querySelector(".nota-button");
        btnNota.onclick = (e) => {
          e.stopPropagation();
          div.classList.toggle("mostrar-nota");
        };

        // Click en el ramo para marcar como completado
        if (!bloqueado && !completado) {
          div.style.cursor = "pointer";
          div.onclick = (e) => {
            if (e.target.classList.contains("nota") || e.target.classList.contains("nota-button")) return;

            const notaInput = div.querySelector('.nota');
            const nota = notaInput ? notaInput.value.trim() : "";

            if (!nota || isNaN(nota) || nota < 1 || nota > 7) {
              alert("Debes ingresar una nota válida entre 1.0 y 7.0 antes de marcar como completado.");
              return;
            }

            estados[a.id].nota = nota;
            estados[a.id].completado = true;
            guardarEstado();
            renderMalla();
          };
        }

        // Guardar nota sin marcar como completado
        if (!completado) {
          setTimeout(() => {
            const input = div.querySelector('.nota');
            if (input) {
              input.onchange = (ev) => {
                estados[a.id].nota = ev.target.value;
                guardarEstado();
              };
            }
          }, 0);
        }

        if (bloqueado) {
          div.title = "Esta asignatura está bloqueada por prerrequisitos no cumplidos.";
        }

        grid.appendChild(div);
      });

      divSemestre.appendChild(grid);
      gridAño.appendChild(divSemestre);
    });

    divAño.appendChild(gridAño);
    container.appendChild(divAño);
  });

  actualizarAvance();
}

// Verifica si los prerrequisitos están cumplidos
function tienePrerrequisitoNoCompletado(asignatura) {
  if (!asignatura.prerrequisito) return false;

  if (typeof asignatura.prerrequisito === 'number') {
    return !estados[asignatura.prerrequisito]?.completado;
  }

  return asignatura.prerrequisito.some(id => !estados[id]?.completado);
}

// Actualiza la barra de progreso
function actualizarAvance() {
  const total = asignaturas.length;
  const completados = asignaturas.filter(a => estados[a.id]?.completado).length;
  const porcentaje = Math.round((completados / total) * 100);

  document.querySelector(".progreso").style.width = `${porcentaje}%`;
  document.getElementById("porcentaje").innerText = `${porcentaje}%`;
}

// Resetea toda la malla
function resetearMalla() {
  if (confirm("¿Estás segura que quieres resetear toda la malla?")) {
    asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
    localStorage.removeItem("estadoMalla");
    renderMalla();
  }
}
