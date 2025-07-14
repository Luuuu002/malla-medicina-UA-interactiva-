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

// Renderizar malla por semestres y mostrar años
function renderMalla() {
  const container = document.getElementById("malla-container");
  container.innerHTML = "";

  // Agrupar por semestre (con agrupación especial 11-12 y 13-14)
  const semestres = {};
  asignaturas.forEach(a => {
    let sem = a.semestre;
    // Agrupar 11 y 12 juntos
    if (sem == 11 || sem == 12) sem = '11 y 12';
    // Agrupar 13 y 14 juntos
    if (sem == 13 || sem == 14) sem = '13 y 14';

    if (!semestres[sem]) semestres[sem] = [];
    semestres[sem].push(a);
  });

  // Agrupar semestres en años (1-2 = año 1, 3-4 = año 2, ..., con semestres 11 y 12 juntos y 13 y 14 juntos)
  const años = {};
  Object.keys(semestres).forEach(semKey => {
    let año;
    if (semKey === '11 y 12') año = 6;
    else if (semKey === '13 y 14') año = 7;
    else año = Math.ceil(parseInt(semKey) / 2);

    if (!años[año]) años[año] = [];
    años[año].push({ semestre: semKey, asignaturas: semestres[semKey] });
  });

  Object.keys(años).sort((a,b)=>a-b).forEach(año => {
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
        const cursando = esRamoCursando(a);

        const div = document.createElement("div");
        div.className = "asignatura";

        // No tachar Formación Básica y Profesional, se les pone clase 'formacion'
        if (a.area.toLowerCase().includes("formación básica") || a.area.toLowerCase().includes("formación profesional")) {
          div.classList.add("formacion");
        }

        if (completado) div.classList.add("completado");
        else if (cursando) div.classList.add("cursando");
        else if (bloqueado) div.classList.add("bloqueado");
        else div.classList.add("disponible");

        div.innerHTML = `
          <h4>${a.nombre}</h4>
          <small>${a.area}</small>
          ${completado && estados[a.id]?.nota
            ? `<p class="nota-mostrada">${estados[a.id].nota}</p>`
            : ''
          }
          <div class="zona-nota"></div>
          <button>Nota</button>
          <input class="nota" type="text" placeholder="Ingresa tu nota" value="${estados[a.id]?.nota || ''}">
        `;

        // Ocultar nota y botón al inicio
        const inputNota = div.querySelector(".nota");
        const botonNota = div.querySelector("button");
        inputNota.style.display = "none";
        botonNota.style.display = "none";

        // Click en asignatura para tachar (completar)
        div.onclick = (e) => {
          if (e.target === botonNota || e.target === inputNota || e.target.classList.contains('zona-nota')) return;

          if (bloqueado) return; // No hace nada si está bloqueado

          if (completado) return; // No permite destachar

          if (!estados[a.id].nota.trim()) {
            alert("Debes ingresar una nota para completar el ramo.");
            return;
          }

          estados[a.id].completado = true;
          guardarEstado();
          renderMalla();
        };

        // Mostrar/ocultar botón nota al clicar zona-nota (esquina inferior derecha)
        if (!completado && !bloqueado) {
          const zonaNota = div.querySelector(".zona-nota");
          zonaNota.onclick = (ev) => {
            ev.stopPropagation();
            if (inputNota.style.display === "none") {
              inputNota.style.display = "block";
              botonNota.style.display = "block";
              inputNota.focus();
            } else {
              inputNota.style.display = "none";
              botonNota.style.display = "none";
            }
          };

          botonNota.onclick = (ev) => {
            ev.stopPropagation();
            const val = inputNota.value.trim();
            if (val === "") {
              alert("Ingrese una nota antes de guardar.");
              return;
            }
            estados[a.id].nota = val;
            guardarEstado();
            alert("Nota guardada.");
            inputNota.style.display = "none";
            botonNota.style.display = "none";
          };
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

// Detectar ramo cursando (primer desbloqueado y no completado)
function esRamoCursando(asignatura) {
  if (estados[asignatura.id]?.completado) return false;
  if (tienePrerrequisitoNoCompletado(asignatura)) return false;
  return true;
}

// Actualizar porcentaje de avance
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
