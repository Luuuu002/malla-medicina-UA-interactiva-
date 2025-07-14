// Por simplicidad, definimos el semestre actual aquí.
// En producción podrías pedirlo al usuario.
let semestreActual = 2;

// Agrupar 11+12 y 13+14 como "anuales"
function nombreSemestre(sem) {
  if (sem == 11 || sem == 12) return "Semestre 11 y 12";
  if (sem == 13 || sem == 14) return "Semestre 13 y 14";
  return `Semestre ${sem}`;
}

function renderMalla() {
  const container = document.getElementById("malla-container");
  container.innerHTML = "";

  // Agrupa semestres en años como antes...
  // ... pero renderiza los años en un div .años-grid (horizontal)
  const añosKeys = Object.keys(años).sort((a, b) => a - b);
  const añosGrid = document.createElement("div");
  añosGrid.className = "años-grid";

  añosKeys.forEach(año => {
    const divAño = document.createElement("div");
    divAño.className = "año";
    divAño.innerHTML = `<h2>AÑO ${año}</h2>`;
    const semestresColumna = document.createElement("div");
    semestresColumna.className = "semestres-columna";

    años[año].forEach(grupo => {
      // Fusiona 11+12 y 13+14 visualmente
      if (
        (grupo.semestre == 12 && años[año].some(g => g.semestre == 11)) ||
        (grupo.semestre == 14 && años[año].some(g => g.semestre == 13))
      ) return; // Ya lo mostró el anterior

      let mostrarAsignaturas = [];
      let nombre = nombreSemestre(grupo.semestre);
      if (grupo.semestre == 11 && años[año].some(g => g.semestre == 12)) {
        mostrarAsignaturas = [
          ...grupo.asignaturas,
          ...años[año].find(g => g.semestre == 12).asignaturas
        ];
      } else if (grupo.semestre == 13 && años[año].some(g => g.semestre == 14)) {
        mostrarAsignaturas = [
          ...grupo.asignaturas,
          ...años[año].find(g => g.semestre == 14).asignaturas
        ];
      } else {
        mostrarAsignaturas = grupo.asignaturas;
      }

      const divSemestre = document.createElement("div");
      divSemestre.className = "semestre";
      divSemestre.innerHTML = `<h3>${nombre}</h3>`;
      // Renderiza ramos...

      mostrarAsignaturas.forEach(a => {
        const completado = !!estados[a.id]?.completado;
        const enCurso = a.semestre == semestreActual;
        const div = document.createElement("div");
        div.className = "asignatura";
        if (completado) div.classList.add("completado");
        else if (enCurso) div.classList.add("en-curso");

        div.innerHTML = `
          <h4>${a.nombre}</h4>
          <small>${a.area}</small>
          ${
            completado
              ? `<div class="nota-mostrada">Nota: <strong>${estados[a.id].nota}</strong></div>`
              : ""
          }
        `;

        // Evento para marcar como completado y pedir nota
        if (!completado) {
          div.onclick = () => {
            let nota = prompt("Ingresa tu nota para esta asignatura:");
            if (nota && nota.trim()) {
              estados[a.id].nota = nota.trim();
              estados[a.id].completado = true;
              guardarEstado();
              renderMalla();
            }
          };
        }
        semestresColumna.appendChild(divSemestre);
        divSemestre.appendChild(div);
      });

      semestresColumna.appendChild(divSemestre);
    });
    divAño.appendChild(semestresColumna);
    añosGrid.appendChild(divAño);
  });

  container.appendChild(añosGrid);
  actualizarAvance();
}
