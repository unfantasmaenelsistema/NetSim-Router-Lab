# Guía de Contribución a NetSim Router Lab

¡Gracias por tu interés en contribuir a **NetSim Router Lab**! 🎉

Este proyecto es una herramienta educativa de código abierto diseñada para enseñar conceptos de redes, enrutamiento y ciberseguridad.

---

## 🛠️ Cómo Empezar

1. Haz un **Fork** del repositorio en GitHub.
2. Clona tu fork localmente:
   ```bash
   git clone https://github.com/tu-usuario/netsim-router-lab.git
   cd netsim-router-lab
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Crea una rama para tu funcionalidad o corrección:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

---

## 💻 Desarrollo y Buenas Prácticas

- **TypeScript:** Mantén tipados estrictos sin usar `any`.
- **Estilos:** Utiliza las clases utilitarias de Tailwind CSS.
- **Validación:** Antes de enviar tu PR, asegúrate de que el código compila y pasa el linter:
  ```bash
  npm run lint
  npm run build
  ```

---

## 📬 Reportar Errores (Issues)

Si encuentras un error o tienes una idea para mejorar:
1. Revisa las [Issues existentes](https://github.com/tu-usuario/netsim-router-lab/issues) para evitar duplicados.
2. Abre una nueva issue describiendo:
   - Pasos para reproducir el fallo.
   - Comportamiento esperado vs obtenido.
   - Capturas de pantalla o mensajes de consola si aplica.

---

## 📄 Licencia

Al contribuir a este proyecto, aceptas que tus contribuciones se licencien bajo la [Licencia MIT](LICENSE).
