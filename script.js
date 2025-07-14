let asignaturas = [];
let estados = {};

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

  // Agrupar asignaturas por semestre
  const semestres = {};
  asignaturas.forEach(a => {
    if (!semestres[a.semestre]) semestres[a.semestre] = [];
    semestres[a.semestre].push(a);
  });

  // Agrupar semestres por año
  const años = {};
  Object.keys(semestres).forEach(sem => {
    let año;
    const semestreNum = Number(sem);
    if (semestreNum === 11 || semestreNum === 12) {
      año = 6;
    } else if (semestreNum === 13 || semestreNum === 14) {
      año = 7;
    } else {
      año = Math.ceil(semestreNum / 2);
    }

    if (!años[año]) años[año] = [];
    años[año].push({ semestre: semestreNum, asignaturas: semestres[sem] });
  });

  // Ordenar años numéricamente
  const añosOrdenados = Object.keys(años).map(Number).sort((a,b) => a-b);

  añosOrdenados.forEach(año => {
    const divAño = document.createElement("div");
    divAño.className = "año";
    divAño.innerHTML = `<h2>AÑO ${año}</h2>`;

    const gridAño = document.createElement("div");
    gridAño.className = "grid-año";

    // Ordenar semestres dentro del año
    const semestresOrdenados = años[año].sort((a,b) => a.semestre - b.semestre);

    semestresOrdenados.forEach(grupo => {
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

        div.innerHTML = `
          <h4>${a.nombre}</h4>
          <small>${a.area}</small>
          ${completado && estados[a.id]?.nota 
            ? `<p class="nota-mostrada">${estados[a.id].nota}</p>` 
            : ''
          }
          <input class="nota" type="text" placeholder="Ingresa tu nota" value="${estados[a.id]?.nota || ''}">
          <button class="boton-nota" title="Editar nota">✎</button>
        `;

        // Mostrar input nota solo si no está completado
        if (completado) {
          div.querySelector('.nota').style.display = "none";
          div.querySelector('.boton-nota').style.display = "none";
        } else {
          div.querySelector('.nota').style.display = "none";
        }

        // Toggle input nota al tocar esquina inferior derecha (botón invisible)
        const botonNota = div.querySelector('.boton-nota');
        const inputNota = div.querySelector('.nota');

        botonNota.addEventListener('click', (e) => {
          e.stopPropagation();
          if (inputNota.style.display === "block") {
            inputNota.style.display = "none";
          } else {
            inputNota.style.display = "block";
            inputNota.focus();
          }
        });

        // Al hacer click en la asignatura (excepto en input), marcar completado si nota ingresada
        div.addEventListener('click', (e) => {
          if (e.target === inputNota || e.target === botonNota) return;
          if (bloqueado || completado) return;

          const nota = inputNota.value.trim();
          if (!nota) {
            alert("Debes ingresar una nota antes de marcar como completado.");
            return;
          }

          estados[a.id].nota = nota;
          estados[a.id].completado = true;
          guardarEstado();
          renderMalla();
        });

        // Guardar nota automáticamente al cambiar input
        inputNota.addEventListener('change', (e) => {
          estados[a.id].nota = e.target.value;
          guardarEstado();
        });

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
}

function resetearMalla() {
  if (confirm("¿Estás segura que quieres resetear toda la malla?")) {
    asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
    localStorage.removeItem("estadoMalla");
    renderMalla();
  }
}
