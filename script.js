document.addEventListener("DOMContentLoaded", () => {
  const asignaturas = document.querySelectorAll(".asignatura");

  asignaturas.forEach((asig) => {
    // Detectar clic izquierdo
    asig.addEventListener("click", (e) => {
      if (e.button === 2) return; // Evitar si es clic derecho

      const rect = asig.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const margenEsquina = 20; // Tamaño de la esquina inferior derecha
      const esEsquinaInferiorDerecha =
        x > rect.width - margenEsquina &&
        y > rect.height - margenEsquina;

      if (!esEsquinaInferiorDerecha) {
        asig.classList.toggle("completado");
      }
    });

    // Mostrar número al hacer clic derecho
    asig.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const numContextual = asig.querySelector(".numero-contextual");
      if (numContextual) {
        numContextual.style.display = "block";
        setTimeout(() => {
          numContextual.style.display = "none";
        }, 2000);
      }
    });
  });

  // Botón resetear
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("¿Estás seguro de reiniciar la malla?")) {
        document.querySelectorAll(".asignatura").forEach((asig) => {
          asig.classList.remove("completado");
          const inputNota = asig.querySelector(".nota");
          if (inputNota) inputNota.value = "";
          const numeroContextual = asig.querySelector(".numero-contextual");
          if (numeroContextual) numeroContextual.style.display = "none";
        });
        actualizarProgreso();
      }
    });
  }

  // Actualizar barra de progreso
  function actualizarProgreso() {
    const total = document.querySelectorAll(".asignatura").length;
    const completadas = document.querySelectorAll(".asignatura.completado").length;
    const porcentaje = Math.round((completadas / total) * 100);
    const barra = document.querySelector(".progreso");
    const textoPorcentaje = document.getElementById("porcentaje");

    if (barra) barra.style.width = `${porcentaje}%`;
    if (textoPorcentaje) textoPorcentaje.textContent = `${porcentaje}%`;
  }

  // Escuchar cambios en clases para actualizar progreso
  const observer = new MutationObserver(actualizarProgreso);
  document.querySelectorAll(".asignatura").forEach((asig) => {
    observer.observe(asig, { attributes: true, attributeFilter: ["class"] });
  });

  // Inicializar progreso al cargar
  actualizarProgreso();
});
