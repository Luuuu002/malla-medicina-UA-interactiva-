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
  // Además, ajustar nombre de semestres 11 y 12, 13 y 14
  const años = {};
  Object.keys(semestres).forEach(semStr => {
    const sem = parseInt(semStr, 10);
    const año = Math.ceil(sem / 2);
    if (!años[año]) años[año] = [];
    años[año].push({ 
      semestre: sem, 
      asignaturas: semestres[sem],
      nombre: (sem === 11) ? "Semestre 11 y 12" : (sem === 13) ? "Semestre 13 y 14" : `Semestre ${sem}`
    });
  });

  // Ordenar los años para mostrarlos en fila (horizontal)
  const añosOrdenados = Object.keys(años).map(n => parseInt(n, 10)).sort((a,b) => a-b);

  // Contenedor horizontal de años
  const divAñosContenedor = document.createElement("div");
  divAñosContenedor.style.display = "flex";
  divAñosContenedor.style.gap = "2mm";
  divAñosContenedor.style.overflowX = "auto";

  añosOrdenados.forEach(año => {
    const divAño = document.createElement("div");
    divAño.className = "año";

    // Título año arriba
    const h2 = document.createElement("h2");
    h2.textContent = `AÑO ${año}`;
    divAño.appendChild(h2);

    // Grid horizontal para semestres de este año
    const gridAño = document.createElement("div");
    gridAño.className = "grid-año";
    gridAño.style.gap = "1mm";

    // Ordenar semestres dentro del año
    años[año].sort((a,b) => a.semestre - b.semestre).forEach(grupo => {
      const divSemestre = document.createElement("div");
      divSemestre.className = "semestre";
      divSemestre.innerHTML = `<h3>${grupo.nombre}</h3>`;

      const grid = document.createElement("div");
      grid.className = "grid-asignaturas";

      grupo.asignaturas.forEach(a => {
        const bloqueado = tienePrerrequisitoNoCompletado(a);
        const completado = !!estados[a.id]?.completado;

        const div = document.createElement("div");

        // Clases especiales para internados que abarcan 2 semestres
        // Medicina Interna (semestres 5 y 6)
        // Ejemplo: otros internados en 6º y 7º año
        const esMedInterna = a.nombre.toLowerCase().includes("medicina interna");
        const esInternado6o7o = a.nombre.toLowerCase().includes("internado") && (a.semestre === 11 || a.semestre === 13);

        let claseAsignatura = "asignatura";
        if (completado) claseAsignatura += " completado";
        else if (bloqueado) claseAsignatura += " bloqueado";
        else if (!completado) claseAsignatura += " cursando";

        if (esMedInterna || esInternado6o7o) claseAsignatura += " med-interna";

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

        // Evento clic en la asignatura
        div.style.position = "relative";

        if (!bloqueado && !completado) {
          div.style.cursor = "pointer";

          div.onclick = (e) => {
            // No interferir con input o botón nota
            if (e.target.classList.contains("nota") || e.target.classList.contains("nota-button")) return;

            // Detectar clic en esquina inferior derecha para mostrar/ocultar input nota
            const rect = div.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const esquinaAncho = rect.width * 0.25;
            const esquinaAlto = rect.height * 0.25;

            if (clickX > rect.width - esquinaAncho && clickY > rect.height - esquinaAlto) {
              // Alternar visibilidad input nota
              div.classList.toggle("mostrar-nota");
              return;
            }

            // Si la nota está visible, no hacer nada al clic fuera del botón ni input
          };

          // Click en el botón invisible (esquina inferior derecha) para toggle nota
          const botonNota = div.querySelector(".nota-button");
          botonNota.onclick = (ev) => {
            ev.stopPropagation();
            div.classList.toggle("mostrar-nota");
          };

          // Guardar nota cuando cambie el input
          const inputNota = div.querySelector(".nota");
          inputNota.onchange = (ev) => {
            const valor = ev.target.value.trim();
            estados[a.id].nota = valor;
            guardarEstado();
          };

          // Validar nota y marcar completado si clic fuera del botón esquina y nota válida
          div.addEventListener("dblclick", (ev) => {
            if (!div.classList.contains("mostrar-nota")) return;
            const nota = estados[a.id].nota;
            if (!nota || isNaN(nota) || nota < 1 || nota > 7) {
              alert("Debes ingresar una nota válida entre 1.0 y 7.0 antes de marcar como completado.");
              return;
            }
            estados[a.id].completado = true;
            guardarEstado();
            renderMalla();
          });
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
