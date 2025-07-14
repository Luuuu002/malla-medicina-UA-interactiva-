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

// Cargar estados guardados
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

// Renderizar malla
function renderMalla() {
  const container = document.getElementById("malla-container");
  container.innerHTML = "";

  const semestres = {};
  asignaturas.forEach(a => {
    if (!semestres[a.semestre]) semestres[a.semestre] = [];
    semestres[a.semestre].push(a);
  });

  // Agrupaciones especiales para años
  const agrupaciones = {
    "6": ["11", "12"],
    "7": ["13", "14"]
  };

  const años = {};

  Object.keys(semestres).forEach(sem => {
    let año = Math.ceil(sem / 2);

    for (const a in agrupaciones) {
      if (agrupaciones[a].includes(sem)) {
        año = parseInt(a);
      }
    }

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

      const grupoKey = (grupo.semestre === "11" || grupo.semestre === "12") ? "11-12"
                      : (grupo.semestre === "13" || grupo.semestre === "14") ? "13-14"
                      : null;

      if (grupoKey) {
        divSemestre.setAttribute("data-grupo", grupoKey);
      }

      divSemestre.innerHTML += `<h3>Semestre ${grupo.semestre}</h3>`;

      const grid = document.createElement("div");
      grid.className = "grid-asignaturas";

      grupo.asignaturas.forEach(a => {
        const bloqueado = tienePrerrequisitoNoCompletado(a);
        const completado = !!estados[a.id]?.completado;
        const nota = estados[a.id]?.nota || "";

        let estadoClase = '';
        if (completado) estadoClase = 'completado';
        else if (!bloqueado && !completado) estadoClase = 'cursando';
        else if (bloqueado) estadoClase = 'bloqueado';

        const div = document.createElement("div");
        div.className = `asignatura ${estadoClase}`;
        div.innerHTML = `
          <h4>${a.nombre}</h4>
          <small>${a.area}</small>
          ${completado ? `<div class="nota-mostrada">${nota}</div>` : ''}
          <button class="boton-nota" title="Ingresar nota">✏️</button>
          <input class="nota" type="text" placeholder="Ingresa tu nota" value="${nota}" style="display: none;">
        `;

        const inputNota = div.querySelector(".nota");
        const btnNota = div.querySelector(".boton-nota");

        // Mostrar input de nota al hacer clic en el botón
        if (!completado && !bloqueado) {
          btnNota.onclick = (e) => {
            e.stopPropagation();
            inputNota.style.display = "block";
            inputNota.focus();
          };

          inputNota.onchange = () => {
            estados[a.id].nota = inputNota.value.trim();
            guardarEstado();
          };

          div.onclick = (e) => {
            // Evitar marcar como completado si se hizo clic en el input o botón
            if (e.target.classList.contains("nota") || e.target.classList.contains("boton-nota")) return;

            const notaIngresada = inputNota.value.trim();
            if (!notaIngresada) {
              alert("Debes ingresar una nota antes de marcar como completado.");
              return;
            }

            estados[a.id].nota = notaIngresada;
            estados[a.id].completado = true;
            guardarEstado();
            renderMalla();
          };
        } else {
          div.onclick = null;
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

// Verifica si hay prerrequisitos no cumplidos
function tienePrerrequisitoNoCompletado(asignatura) {
  if (!asignatura.prerrequisito) return false;

  if (typeof asignatura.prerrequisito === 'number') {
    return !estados[asignatura.prerrequisito]?.completado;
  }

  return asignatura.prerrequisito.some(id => !estados[id]?.completado);
}

// Actualiza barra de progreso
function actualizarAvance() {
  const total = asignaturas.length;
  const completados = asignaturas.filter(a => estados[a.id]?.completado).length;
  const porcentaje = Math.round((completados / total) * 100);

  document.querySelector(".progreso").style.width = `${porcentaje}%`;
  document.getElementById("porcentaje").innerText = `${porcentaje}%`;
}

// Resetear malla
function resetearMalla() {
  if (confirm("¿Estás segura que quieres resetear toda la malla?")) {
    asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
    localStorage.removeItem("estadoMalla");
    renderMalla();
  }
}
