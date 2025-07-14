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

// Guardar estado
function guardarEstado() {
  localStorage.setItem("estadoMalla", JSON.stringify(estados));
  actualizarAvance();
}

// Renderizar la malla
function renderMalla() {
  const container = document.getElementById("malla-container");
  container.innerHTML = "";

  // Agrupar por semestre
  const semestres = {};
  asignaturas.forEach(a => {
    if (!semestres[a.semestre]) semestres[a.semestre] = [];
    semestres[a.semestre].push(a);
  });

  // Agrupar por año
  const años = {};
  Object.keys(semestres).forEach(sem => {
    let año;
    if (sem == 11 || sem == 12) {
      año = "6";
    } else if (sem == 13 || sem == 14) {
      año = "7";
    } else {
      año = Math.ceil(sem / 2);
    }

    if (!años[año]) años[año] = [];
    años[año].push({ semestre: sem, asignaturas: semestres[sem] });
  });

  // Crear estructura por año
  Object.keys(años).forEach(año => {
    const divAño = document.createElement("div");
    divAño.className = "año";
    divAño.innerHTML = `<h2>AÑO ${año}</h2>`;

    const gridAño = document.createElement("div");
    gridAño.className = "grid-año";

    años[año].forEach(grupo => {
      const divSemestre = document.createElement("div");
      divSemestre.className = "semestre";
      divSemestre.innerHTML = `<h3>Semestre ${grupo.semestre}</h3>`;

      const grid = document.createElement("div");
      grid.className = "grid-asignaturas";

      grupo.asignaturas.forEach(a => {
        const bloqueado = tienePrerrequisitoNoCompletado(a);
        const completado = !!estados[a.id]?.completado;

        let clase = "asignatura";
        if (completado) {
          clase += " completado";
        } else if (bloqueado) {
          clase += " bloqueado";
        } else {
          clase += " disponible";
        }

        const div = document.createElement("div");
        div.className = clase;

        // Evitar tachado si es área especial
        const evitarTachado = ["Formación General", "Formación Profesional", "Formación Básica"];
        if (completado && !evitarTachado.includes(a.area)) {
          div.style.textDecoration = "line-through";
        }

        div.innerHTML = `
          <button class="boton-nota">🖊️</button>
          <h4>${a.nombre}</h4>
          <small>${a.area}</small>
          ${completado && estados[a.id]?.nota 
            ? `<p class="nota-mostrada">${estados[a.id].nota}</p>` 
            : ''}
          <input class="nota" type="text" placeholder="Ingresa nota" value="${estados[a.id]?.nota || ''}">
        `;

        // Mostrar input de nota al hacer clic en el lápiz
        const botonNota = div.querySelector('.boton-nota');
        const inputNota = div.querySelector('.nota');
        botonNota.onclick = (e) => {
          e.stopPropagation();
          div.classList.toggle("mostrando-nota");
          inputNota.focus();
        };

        // Clic para marcar como completado
        if (!bloqueado && !completado) {
          div.style.cursor = "pointer";
          div.onclick = (e) => {
            if (e.target.classList.contains("nota") || e.target.classList.contains("boton-nota")) return;

            const notaInput = div.querySelector('.nota');
            const nota = notaInput ? notaInput.value.trim() : "";

            if (!nota) {
              alert("Debes ingresar una nota antes de marcar como completado.");
              return;
            }

            estados[a.id].nota = nota;
            estados[a.id].completado = true;
            guardarEstado();
            renderMalla();
          };
        }

        // Guardar nota automáticamente
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

// Verificar prerrequisitos
function tienePrerrequisitoNoCompletado(asignatura) {
  if (!asignatura.prerrequisito) return false;
  if (typeof asignatura.prerrequisito === 'number') {
    return !estados[asignatura.prerrequisito]?.completado;
  }
  return asignatura.prerrequisito.some(id => !estados[id]?.completado);
}

// Calcular y actualizar porcentaje
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
