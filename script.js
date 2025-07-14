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
  const g = localStorage.getItem("estadoMalla");
  if (g) estados = JSON.parse(g);
  else asignaturas.forEach(a => estados[a.id] = { completado: false, nota: "" });
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

  const agrup = { "6": ["11","12"], "7": ["13","14"] };
  const años = {};

  Object.keys(semestres).forEach(sem => {
    let año = Math.ceil(sem/2);
    for (const a in agrup) if (agrup[a].includes(sem)) año = parseInt(a);
    if (!años[año]) años[año] = [];
    años[año].push({ sem: sem, asignaturas: semestres[sem] });
  });

  Object.keys(años).sort((a,b)=>a-b).forEach(año => {
    const divAño = document.createElement("div");
    divAño.className = "año";
    divAño.innerHTML = `<h2>AÑO ${año}</h2>`;
    const col = document.createElement("div");
    col.className = "semestres";

    const grupos = años[año];
    const semKey = agrup[año] ? agrup[año].join(" y ") : null;
    if (semKey) { // si hay agrupación
      const divSem = document.createElement("div");
      divSem.className = "semestre";
      divSem.setAttribute("data-grupo", agrup[año].join("-"));
      divSem.innerHTML = `<h3>Semestre ${semKey}</h3>`;
      const grid = document.createElement("div");
      grid.className = "grid-asignaturas";
      grupos.forEach(grp => grp.asignaturas.forEach(a => grid.appendChild(crearRamo(a))));
      divSem.appendChild(grid);
      col.appendChild(divSem);
    } else {
      grupos.forEach(grp => {
        const divSem = document.createElement("div");
        divSem.className = "semestre";
        divSem.innerHTML = `<h3>Semestre ${grp.sem}</h3>`;
        const grid = document.createElement("div");
        grid.className = "grid-asignaturas";
        grp.asignaturas.forEach(a => grid.appendChild(crearRamo(a)));
        divSem.appendChild(grid);
        col.appendChild(divSem);
      });
    }

    divAño.appendChild(col);
    container.appendChild(divAño);
  });

  actualizarAvance();
}

function crearRamo(a) {
  const bloqueado = tienePrerrequisitoNoCompletado(a);
  const completado = !!estados[a.id]?.completado;
  const nota = estados[a.id]?.nota || "";
  let cls = '';
  if (completado) cls = 'completado';
  else if (!bloqueado) cls = 'cursando';
  else cls = 'bloqueado';

  const div = document.createElement("div");
  div.className = `asignatura ${cls}`;
  div.innerHTML = `
    <h4>${a.nombre}</h4>
    <small>${a.area}</small>
    ${completado ? `<div class="nota-mostrada">${nota}</div>` : ''}
    <input class="nota" type="text" placeholder="Ingresa tu nota" value="${nota}" style="display:none; position:absolute; bottom:6px; right:6px; width:50px;">
  `;

  const inputNota = div.querySelector(".nota");

  if (!completado && !bloqueado) {
    div.addEventListener("click", e => {
      const x = e.offsetX, y = e.offsetY;
      const w = div.clientWidth, h = div.clientHeight;
      if (x >= w - 50 && y >= h - 30) {
        inputNota.style.display = "block"; inputNota.focus();
      } else if (inputNota.style.display === "block") {
        const val = inputNota.value.trim();
        if (!val) return alert("Debes ingresar nota primero");
        estados[a.id].nota = val;
        estados[a.id].completado = true;
        guardarEstado();
        renderMalla();
      }
    });

    inputNota.addEventListener("change", () => {
      estados[a.id].nota = inputNota.value.trim();
      guardarEstado();
    });
  }

  return div;
}

function tienePrerrequisitoNoCompletado(a) {
  if (!a.prerrequisito) return false;
  if (typeof a.prerrequisito === 'number') return !estados[a.prerrequisito]?.completado;
  return a.prerrequisito.some(id => !estados[id]?.completado);
}

function actualizarAvance() {
  const total = asignaturas.length;
  const completos = asignaturas.filter(a => estados[a.id]?.completado).length;
  const pct = Math.round((completos/total)*100);
  document.querySelector(".progreso").style.width = pct + "%";
  document.getElementById("porcentaje").innerText = pct + "%";
}

function resetearMalla() {
  if (!confirm("¿Resetear malla?")) return;
  asignaturas.forEach(a => estados[a.id]={completado:false,nota:""});
  localStorage.removeItem("estadoMalla");
  renderMalla();
}
