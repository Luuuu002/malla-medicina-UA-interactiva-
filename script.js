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
  const g = localStorage.getItem('estadoMalla');
  if (g) estados = JSON.parse(g);
  else asignaturas.forEach(a => estados[a.id] = { completado: false, nota: '' });
}

// Guardar estado en localStorage
function guardarEstado() {
  localStorage.setItem('estadoMalla', JSON.stringify(estados));
  actualizarAvance();
}

// Generar la malla de ramos
function renderMalla() {
  const container = document.getElementById('malla-container');
  container.innerHTML = '';

  const semestres = {};
  asignaturas.forEach(a => {
    if (!semestres[a.semestre]) semestres[a.semestre] = [];
    semestres[a.semestre].push(a);
  });

  const agrup = { '6': ['11', '12'], '7': ['13', '14'] };
  const años = {};

  Object.keys(semestres).forEach(sem => {
    let año = Math.ceil(sem / 2);
    for (const key in agrup) {
      if (agrup[key].includes(sem)) año = parseInt(key);
    }
    if (!años[año]) años[año] = [];
    años[año].push({ semestre: sem, asignaturas: semestres[sem] });
  });

  Object.keys(años).sort((a, b) => a - b).forEach(año => {
    const divAño = document.createElement('div');
    divAño.className = 'año';
    divAño.innerHTML = `<h2>AÑO ${año}</h2>`;

    const gridAño = document.createElement('div');
    gridAño.className = 'grid-año';

    const grupos = años[año];
    const semKey = agrup[año] ? agrup[año].join(' y ') : null;

    if (semKey) {
      const divSem = document.createElement('div');
      divSem.className = 'semestre';
      divSem.setAttribute('data-grupo', agrup[año].join('-'));
      divSem.innerHTML = `<h3>Semestre ${semKey}</h3>`;
      const grid = document.createElement('div');
      grid.className = 'grid-asignaturas';
      grupos.forEach(grp => grp.asignaturas.forEach(a => grid.appendChild(crearRamo(a))));
      divSem.appendChild(grid);
      gridAño.appendChild(divSem);

    } else {
      grupos.forEach(grp => {
        const divSem = document.createElement('div');
        divSem.className = 'semestre';
        divSem.innerHTML = `<h3>Semestre ${grp.semestre}</h3>`;
        const grid = document.createElement('div');
        grid.className = 'grid-asignaturas';
        grp.asignaturas.forEach(a => grid.appendChild(crearRamo(a)));
        divSem.appendChild(grid);
        gridAño.appendChild(divSem);
      });
    }

    divAño.appendChild(gridAño);
    container.appendChild(divAño);
  });

  actualizarAvance();
}

// Crear un ramo con lógica de interacción
function crearRamo(a) {
  const bloqueado = tienePrerrequisitoNoCompletado(a);
  const completado = !!estados[a.id]?.completado;
  const notaVal = estados[a.id]?.nota || '';
  let cls = bloqueado ? 'bloqueado' : completado ? 'completado' : 'cursando';

  const div = document.createElement('div');
  div.className = `asignatura ${cls}`;
  div.innerHTML = `
    <h4>${a.nombre}</h4>
    <small>${a.area}</small>
    ${completado ? `<div class="nota-mostrada">${notaVal}</div>` : ''}
    <input class="nota" type="text" placeholder="Ingresa nota" value="${notaVal}">
  `;

  const inputNota = div.querySelector('.nota');
  inputNota.style.display = 'none';

  // Lógica para mostrar/ocultar input con clic en esquina
  div.addEventListener('click', e => {
    if (bloqueado) return;

    const rect = div.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    if (clickX >= rect.width - 50 && clickY >= rect.height - 30) {
      if (!completado) {
        div.classList.toggle('mostrar-nota');
        inputNota.style.display = div.classList.contains('mostrar-nota') ? 'block' : 'none';
        if (inputNota.style.display === 'block') inputNota.focus();
      }
      e.stopPropagation();
    } else if (div.classList.contains('mostrar-nota')) {
      const val = inputNota.value.trim();
      if (!val) return;
      estados[a.id].nota = val;
      estados[a.id].completado = true;
      guardarEstado();
      renderMalla();
    }
  });

  // Guardar nota al salir del input
  inputNota.addEventListener('change', () => {
    estados[a.id].nota = inputNota.value.trim();
    guardarEstado();
  });

  return div;
}

// Verificar prerrequisitos
function tienePrerrequisitoNoCompletado(a) {
  if (!a.prerrequisito) return false;
  if (typeof a.prerrequisito === 'number') {
    return !estados[a.prerrequisito]?.completado;
  }
  return a.prerrequisito.some(id => !estados[id]?.completado);
}

// Actualizar barra de progreso
function actualizarAvance() {
  const total = asignaturas.length;
  const completados = asignaturas.filter(a => estados[a.id]?.completado).length;
  const porcentaje = Math.round((completados / total) * 100);
  document.querySelector('.progreso').style.width = `${porcentaje}%`;
  document.getElementById('porcentaje').innerText = `${porcentaje}%`;
}

// Resetear malla
function resetearMalla() {
  if (!confirm('¿Resetear malla?')) return;
  asignaturas.forEach(a => estados[a.id] = { completado: false, nota: '' });
  localStorage.removeItem('estadoMalla');
  renderMalla();
}
