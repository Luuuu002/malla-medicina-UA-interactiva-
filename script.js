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

  const semestres = {};
  asignaturas.forEach(a => {
    if (!semestres[a.semestre]) semestres[a.semestre] = [];
    semestres[a.semestre].push(a);
  });

  const años = {};
  Object.keys(semestres).forEach(semStr => {
    const sem = parseInt(semStr, 10);
    const año = Math.ceil(sem / 2);
    if (!años[año]) años[año] = [];
    años[año].push({
      semestre: sem,
      asignaturas: semestres[sem],
      nombre: (sem === 11) ? "Semestre 11 y 12" :
              (sem === 13) ? "Semestre 13 y 14" :
              `Semestre ${sem}`
    });
  });

  const añosOrdenados = Object.keys(años).map(n => parseInt(n)).sort((a, b) => a - b);
  const divAñosContenedor = document.createElement("div");
  divAñosContenedor.style.display = "flex";
  divAñosContenedor.style.gap = "2mm";
  divAñosContenedor.style.overflowX = "auto";

  añosOrdenados.forEach(año => {
    const divAño = document.createElement("div");
    divAño.className = `año año${año}`;

    const h2 = document.createElement("h2");
    h2.textContent = `AÑO ${año}`;
    divAño.appendChild(h2);

    const gridAño = document.createElement("div");
    gridAño.className = "grid-año";
    gridAño.style.gap = "1mm";

    años[año].sort((a, b) => a.semestre - b.semestre).forEach(grupo => {
      const divSemestre = document.createElement("div");
      divSemestre.className = "semestre";
      divSemestre.innerHTML = `<h3>${grupo.nombre}</h3>`;

      const grid = document.createElement("div");
      grid.className = "grid-asignaturas";

      grupo.asignaturas.forEach(a => {
        const bloqueado = tienePrerrequisitoNoCompletado(a);
        const completado = !!estados[a.id]?.completado;
        const div = document.createElement("div");

        let claseAsignatura = "asignatura";
        if (completado) claseAsignatura += " completado";
        else if (bloqueado) claseAsignatura += " bloqueado";
        else claseAsignatura += " cursando";

        const esMedInterna = a.nombre.toLowerCase().includes("medicina interna") && a.semestre === 5;
        const esInternado = a.nombre.toLowerCase().includes("internado") && (a.semestre === 11 || a.semestre === 13);

        if (esMedInterna || esInternado) {
          claseAsignatura += " med-interna";
        }

        div.className = claseAsignatura;

        div.innerHTML = `
          <h4>${a.nombre}</h4>
          <small>${a.area}</small>
          ${completado && estados[a.id]?.nota
            ? `<p class="nota-mostrada">Nota: <strong>${estados[a.id].nota}</strong></p>`
            : ''}
          <div class="nota-section">
            <input class="nota" type="text" placeholder="Ingresa tu nota" value="${estados[a.id]?.nota || ''}">
          </div>
          <div class="nota-button" title="Mostrar/Ocultar nota"></div>
        `;

        if (!bloqueado) {
          div.style.position = "relative";
          div.style.cursor = "pointer";

          div.onclick = (e) => {
            const rect = div.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const esquinaAncho = rect.width * 0.25;
            const esquinaAlto = rect.height * 0.25;

            if (clickX > rect.width - esquinaAncho && clickY > rect.height - esquinaAlto) {
              div.classList.toggle("mostrar-nota");
              return;
            }

            const nota = estados[a.id]?.nota;
            if (!nota || isNaN(nota) || nota < 1 || nota > 7) {
              alert("Debes ingresar una nota válida entre 1.0 y 7.0 antes de marcar como completado.");
              return;
            }

            estados[a.id].completado = true;
            guardarEstado();
            renderMalla();
          };

          const botonNota = div.querySelector(".nota-button");
          botonNota.onclick = (ev) => {
            ev.stopPropagation();
            div.classList.toggle("mostrar-nota");
          };

          const inputNota = div.querySelector(".nota");
          inputNota.onchange = (ev) => {
            const valor = ev.target.value.trim();
            estados[a.id].nota = valor;
            guardarEstado();
          };
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
    divAñosContenedor.appendChild(divAño);
  });

  container.appendChild(divAñosContenedor);

  // Agregar contenedor del promedio si no existe
  if (!document.getElementById("promedio-general")) {
    const promedioDiv = document.createElement("div");
    promedioDiv.id = "promedio-general";
    promedioDiv.textContent = "Promedio general: 0.0";
    container.appendChild(promedioDiv);
  }

  actualizarAvance();
}

function tienePrerrequisitoNoCompletado(asignatura) {
  if (!asignatura.prerrequisito) return false;
  if (typeof asignatura.prerrequisito === 'number') {
    return !estados[asignatura.prerrequisito]?.completado;
  }
  return asignatura.prerrequisito.some(id => !estados[id]?.completado);
}

function actualizarAvance() {
  const total = asignaturas.length;
  const completados = asignaturas.filter(a => estados[a.id]?.completado).length;
  const porcentaje = Math.round((completados / total) * 100);

  document.querySelector(".progreso").style.width = `${porcentaje}%`;
  document.getElementById("porcentaje").innerText = `${porcentaje}%`;

  // Calcular promedio general
  const notasValidas = asignaturas
    .filter(a => estados[a.id]?.completado)
    .map(a => parseFloat(estados[a.id]?.nota))
    .filter(n => !isNaN(n) && n >= 1 && n <= 7);

  const promedio = notasValidas.length
    ? (notasValidas.reduce((sum, n) => sum + n, 0) / notasValidas.length).toFixed(2)
    : "0.0";

  const promedioDiv = document.getElementById("promedio-general");
  if (promedioDiv) promedioDiv.textContent = `Promedio general: ${promedio}`;
}

function resetearMalla() {
  if (confirm("¿Estás segura que quieres resetear toda la malla?")) {
    asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
    localStorage.removeItem("estadoMalla");
    renderMalla();
  }
}
function cambiarEstado(asignaturaId) {
  const asignatura = document.getElementById(asignaturaId);

  if (asignatura.classList.contains("completado")) {
    asignatura.classList.remove("completado");
    asignatura.classList.add("cursando");
  } else if (asignatura.classList.contains("cursando")) {
    asignatura.classList.remove("cursando");
    asignatura.classList.add("bloqueado");
  } else if (asignatura.classList.contains("bloqueado")) {
    asignatura.classList.remove("bloqueado");
  } else {
    asignatura.classList.add("completado");
  }

  guardarProgreso();
} 
function guardarProgreso() {
  const asignaturas = document.querySelectorAll(".asignatura");
  const progreso = {};

  asignaturas.forEach(asignatura => {
    progreso[asignatura.id] = asignatura.className;
  });

  localStorage.setItem("progresoMalla", JSON.stringify(progreso));
}

function cargarProgreso() {
  const progreso = JSON.parse(localStorage.getItem("progresoMalla"));
  if (progreso) {
    Object.keys(progreso).forEach(id => {
      const asignatura = document.getElementById(id);
      if (asignatura) {
        asignatura.className = progreso[id];
      }
    });
  }
}

// Llamar al cargar la página
document.addEventListener("DOMContentLoaded", cargarProgreso);
