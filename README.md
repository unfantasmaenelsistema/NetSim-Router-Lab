# 🌐 NetSim Router Lab

> **Simulador Interactivo y Didáctico de Configuración de Router, Redes y Ciberseguridad**  
> Diseñado para estudiantes, docentes, técnicos de soporte y entusiastas del networking y la seguridad informática.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Recharts](https://img.shields.io/badge/Recharts-3.x-22c55e)](https://recharts.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📸 Capturas de Pantalla & Showcase

### 1. Panel de Control & Emulación de Hardware Físico
Simulación en tiempo real del chasis del router con LEDs frontales de actividad (PWR, WAN, LAN, Wi-Fi 2.4/5G, SEC), puertos traseros RJ-45 Gigabit con estados de enlace, y métricas dinámicas de tráfico RX/TX.

![Dashboard & Hardware](./docs/screenshots/dashboard-preview.svg)

---

### 2. Laboratorio de Ciberseguridad & Escáner de Vulnerabilidades
Histórico interactivo de ataques bloqueados en las últimas 24 horas usando **Recharts**, escáner heurístico de seguridad con **3 sugerencias críticas y botón de autorreparación (1-click auto-fix)**, simulador de ataques en vivo y registro de auditoría.

![Ciberseguridad & Firewall](./docs/screenshots/cyberlab-preview.svg)

---

### 3. Analizador de Paquetes (Sniffer) & Terminal CLI Cisco / Linux
Inspección profunda de tramas con desglose jerárquico del modelo OSI (Capa 2 Ethernet, Capa 3 IPv4, Capa 4 TCP/UDP) y consola de comandos interactiva con utilidades reales de diagnóstico de red.

![Sniffer & Terminal CLI](./docs/screenshots/terminal-sniffer-preview.svg)

---

## 📑 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Pestañas y Módulos de la Aplicación](#-pestañas-y-módulos-de-la-aplicación)
3. [Comandos de la Terminal CLI](#-comandos-de-la-terminal-cli)
4. [Casos de Uso Educativos](#-casos-de-uso-educativos)
5. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
6. [Estructura del Proyecto](#-estructura-del-proyecto)
7. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
8. [Despliegue](#-despliegue)
9. [Licencia](#-licencia)

---

## ✨ Características Principales

- **🎮 Simulación Realista sin Riesgo:** Experimenta con configuraciones críticas de red doméstica y empresarial sin temor a dejar sin conexión tu equipo físico.
- **🛡️ Laboratorio de Ciberseguridad Avanzado:**
  - Gráfico de barras temporal con histórico de ataques bloqueados por hora (SYN Flood, Port Scan, Brute-Force SSH, DNS Poisoning).
  - Escáner de vulnerabilidades del router con evaluación de configuración actual y recomendaciones automáticas de mitigación.
  - Simulador didáctico de ataques con respuesta en tiempo real del firewall SPI.
- **🔍 Packet Sniffer al estilo Wireshark:** Captura tráfico en vivo y visualiza las cabeceras binarias y campos de protocolo de cada trama.
- **💻 Consola CLI (Command Line Interface):** Soporta comandos de estilo Cisco IOS y entornos Linux / BSD.
- **🔧 Taller de Averías (Helpdesk Break & Fix):** 5 escenarios prácticos de incidencias comunes para entrenar habilidades de resolución de problemas.
- **🎯 Sistema de Misiones Gamificado:** Retos formativos paso a paso con celebración de confeti al cumplir los objetivos.
- **🌓 Selector de Tema Global (Claro / Oscuro / Sistema):** Adaptabilidad visual fluida con persistencia en `localStorage`.
- **📱 Cinta de Navegación de Doble Fila:** Distribución clara y ergonómica sin necesidad de scroll horizontal.

---

## 🧭 Pestañas y Módulos de la Aplicación

La navegación está dividida en dos filas temáticas para una máxima accesibilidad:

### Fila 1 · Configuración de Red & Router
| Módulo | Descripción |
| :--- | :--- |
| **📊 Dashboard & Hardware** | Estado de la conexión WAN, red LAN, clientes activos, monitor de tráfico RX/TX y emulador de chasis físico con puertos y LEDs. |
| **📶 Wi-Fi & Espectro** | Ajustes de SSID, seguridad (WPA2/WPA3), canal, ancho de banda y analizador de espectro radioeléctrico 2.4 GHz y 5 GHz. |
| **🌐 Red LAN & DHCP** | Dirección IP de pasarela, máscara de subred (/24, /23, /16), pool de asignación DHCP y reservas estáticas de IP por MAC. |
| **🛡️ Seguridad & Firewall** | Reglas de filtrado SPI, protección anti-DoS, bloqueo de Ping WAN (ICMP), y control de acceso parental/por URL. |
| **🔄 Port Forwarding (NAT)** | Reglas de redirección de puertos WAN hacia hosts de la LAN, DMZ (Zona Desmilitarizada) y gestión de UPnP. |
| **⚡ QoS & Tráfico** | Priorización de ancho de banda por categorías de tráfico (VoIP, teletrabajo, juegos, descargas). |
| **💻 Dispositivos Conectados** | Inventario de equipos en la red local (PCs, móviles, consolas, IoT), gestión de permisos y bloqueo MAC. |

### Fila 2 · Laboratorio & Taller Didáctico
| Módulo | Descripción |
| :--- | :--- |
| **🛡️ Ciberseguridad Lab** | Centro de pruebas de ciberdefensa: gráfico Recharts de 24h, escáner de vulnerabilidades y simulador de ataques. |
| **💻 Terminal CLI** | Consola virtual con comandos de red para pruebas de conectividad y auditoría. |
| **🔍 Sniffer de Paquetes** | Monitor de paquetes con filtros por protocolo (TCP, UDP, ICMP, DNS, DHCP) e inspección de capas OSI. |
| **🔧 Taller de Averías** | 5 casos de laboratorio para diagnosticar fallos de DNS, conflictos de IP, aislamiento Wi-Fi y bloqueos de firewall. |
| **🏆 Misiones Didácticas** | Desafíos interactivos guiados con validación automática y recompensas visuales. |
| **📖 Glosario de Redes** | Diccionario técnico interactivo con términos clave de telecomunicaciones y ciberseguridad. |

---

## 💻 Comandos de la Terminal CLI

La terminal integrada incluye un emulador de shell interactivo con soporte de auto-completado y comandos habituales:

```bash
# Ayuda y comandos disponibles
help

# Información de interfaces y direccionamiento IP
show ip interface brief
ifconfig

# Diagnóstico de conectividad y latencia
ping 8.8.8.8
ping 192.168.1.1
traceroute 1.1.1.1

# Tablas de estado y seguridad
show arp
iptables -L -n -v
netstat -tuln

# Servicios y operaciones
dhcp-leases
wifi-status
system-reboot
clear
```

---

## 🎓 Casos de Uso Educativos

- **Formación Profesional y Grados en Informática:** Ideal para módulos de Redes Locales, Seguridad Informática y Servicios de Red (FP SMR, ASIR, DAM, DAW).
- **Certificaciones Oficiales:** Excelente herramienta de apoyo visual para preparar certificaciones como:
  - **Cisco CCNA (200-301)**
  - **CompTIA Network+ (N10-008 / N10-009)**
  - **CompTIA Security+ (SY0-701)**
- **Talleres de Ciberseguridad Escolar y Universitaria:** Permite a los alumnos entender el impacto de abrir puertos peligrosos o deshabilitar el firewall sin consecuencias reales.

---

## 🛠️ Tecnologías Utilizadas

- **Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilos & Diseño:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Visualización de Datos:** [Recharts](https://recharts.org/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Efectos y Animaciones:** [Canvas-Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Bundler & Dev Server:** [Vite 8](https://vitejs.dev/)

---

## 📂 Estructura del Proyecto

```text
netsim-router-lab/
├── docs/
│   └── screenshots/              # Capturas y diagramas vectoriales para GitHub
│       ├── dashboard-preview.svg
│       ├── cyberlab-preview.svg
│       └── terminal-sniffer-preview.svg
├── public/
│   └── icono.png                 # Favicon e icono de la aplicación
├── src/
│   ├── components/
│   │   ├── tabs/                 # Pestañas principales de configuración y laboratorios
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── WirelessTab.tsx
│   │   │   ├── LanDhcpTab.tsx
│   │   │   ├── SecurityFirewallTab.tsx
│   │   │   ├── PortForwardingTab.tsx
│   │   │   ├── QosTab.tsx
│   │   │   ├── VirtualDevicesTab.tsx
│   │   │   ├── CybersecurityLabTab.tsx
│   │   │   ├── MissionsTab.tsx
│   │   │   └── GlossaryTab.tsx
│   │   ├── Header.tsx            # Cabecera con selector de tema y navegación en 2 filas
│   │   ├── ThemeSelector.tsx     # Selector de tema (Claro / Oscuro / Sistema)
│   │   ├── RouterHardwareView.tsx# Emulación del chasis físico, LEDs y puertos RJ-45
│   │   ├── NetworkCliTerminal.tsx# Emulador de terminal CLI Cisco / Linux
│   │   ├── PacketSnifferView.tsx # Analizador de protocolos y tramas OSI
│   │   ├── TroubleshootingLab.tsx# Taller de averías y casos helpdesk
│   │   ├── ActivityLogDrawer.tsx # Registro desplegable de auditoría en vivo
│   │   └── AuditReportModal.tsx  # Generador de informes de seguridad y exportación
│   ├── hooks/
│   │   └── useTheme.ts           # Hook personalizado para modo claro/oscuro con localStorage
│   ├── types/                    # Tipos TypeScript para estado del router, paquetes y reglas
│   ├── App.tsx                   # Componente raíz y orquestación del estado global
│   ├── main.tsx                  # Punto de entrada de React
│   └── index.css                 # Import de Tailwind v4 y variables CSS dinámicas
├── .gitignore                    # Filtros de exclusión para Git
├── LICENSE                       # Licencia de código abierto MIT
├── package.json                  # Dependencias y scripts del proyecto
├── tsconfig.json                 # Configuración del compilador TypeScript
└── vite.config.ts                # Configuración de compilación Vite
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18.0.0 o superior
- [npm](https://www.npmjs.com/) v9+ (o `pnpm` / `bun` / `yarn`)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/netsim-router-lab.git
   cd netsim-router-lab
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en [http://localhost:3000](http://localhost:3000).

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos optimizados se generarán en la carpeta `dist/`.

5. **Validar tipos con linter:**
   ```bash
   npm run lint
   ```

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo [`LICENSE`](LICENSE) para más detalles.

---

<p align="center">
  Desarrollado con fines educativos para la divulgación de redes y ciberseguridad. 🛡️💻
</p>
