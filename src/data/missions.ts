import { Mission } from '../types/router';

export const MISSIONS: Mission[] = [
  {
    id: 'mission-bufferbloat-qos',
    title: 'Misión 1: Eliminar el Lag del Gamer (QoS y Bufferbloat)',
    difficulty: 'Fácil',
    description: 'Cuando varios dispositivos consumen ancho de banda simultáneamente (Smart TV en 4K, descargas), los paquetes del PC Gamer se acumulan en la cola del router y su ping se dispara de 18ms a más de 180ms.',
    objective: 'Activa la Calidad de Servicio (QoS) y asigna prioridad "Máxima" (highest) o "Alta" (high) al PC Gamer para reducir su latencia.',
    problemScenario: 'El PC Gamer está sufriendo retraso de cola (Bufferbloat) inaceptable para partidas competitivas.',
    steps: [
      'Ve a la pestaña "QoS & Tráfico".',
      'Activa la casilla "Habilitar Motor de QoS".',
      'Configura la prioridad del dispositivo "PC Gamer" en "Máxima" o "Alta".',
      'Haz clic en "Guardar y Aplicar Cambios".'
    ],
    hint: 'Dirígete a la pestaña "QoS & Tráfico", activa el interruptor de QoS y verifica que el PC Gamer tenga prioridad Máxima.',
    isCompleted: (config, devices) => {
      const pcDevice = devices.find(d => d.id === 'dev-pc-gamer');
      const isPrioritySet = config.qosDevicePriorities['dev-pc-gamer'] === 'highest' || config.qosDevicePriorities['dev-pc-gamer'] === 'high';
      return config.qosEnabled && isPrioritySet && (pcDevice ? pcDevice.currentLatencyMs < 40 : false);
    },
    solutionSummary: '¡Excelente! Al priorizar los paquetes del juego sobre las descargas en segundo plano, el router evita que los buffers se llenen y mantiene la latencia en niveles competitivos (<30ms).'
  },
  {
    id: 'mission-port-forward',
    title: 'Misión 2: Publicar Servidor de Juegos (Port Forwarding)',
    difficulty: 'Intermedio',
    description: 'Quieres que tus amigos se conecten desde Internet a tu servidor local de Minecraft alojado en tu ordenador (192.168.1.50). Por defecto, el router descarta las conexiones entrantes.',
    objective: 'Crea o habilita una regla de Reenvío de Puertos (Port Forwarding) para el puerto 25565 (TCP) dirigida a la IP 192.168.1.50.',
    problemScenario: 'Tus amigos reciben "Conexión rechazada" porque el cortafuegos NAT del router no sabe a qué ordenador enviar el tráfico del puerto 25565.',
    steps: [
      'Ve a la pestaña "Reenvío de Puertos (NAT)".',
      'Revisa la lista de Servidores Virtuales / Port Forwarding.',
      'Activa la regla "Minecraft Server" (puerto 25565 TCP hacia 192.168.1.50) o crea una regla equivalente.',
      'Comprueba en el simulador de auditoría que el puerto 25565 responde como abierto.'
    ],
    hint: 'En la pestaña "Reenvío de Puertos", habilita el interruptor de la regla de Minecraft Server que apunta al puerto 25565 y la IP 192.168.1.50.',
    isCompleted: (config) => {
      const rule = config.portForwardRules.find(r => 
        r.enabled && 
        r.externalPort === 25565 && 
        (r.protocol === 'TCP' || r.protocol === 'BOTH') &&
        r.internalIp === '192.168.1.50'
      );
      return Boolean(rule);
    },
    solutionSummary: '¡Regla configurada con éxito! La tabla NAT del router ahora redirige los paquetes del puerto 25565 directamente a tu PC, permitiendo que jugadores de todo el mundo se unan.'
  },
  {
    id: 'mission-wifi-hardening',
    title: 'Misión 3: Blindar el Wi-Fi contra Ataques Pixie Dust y Espionaje',
    difficulty: 'Intermedio',
    description: 'El protocolo WPS con código PIN tiene una vulnerabilidad grave conocida como "Pixie Dust" que permite descifrar la clave en minutos. Además, es conveniente separar las visitas en una red de invitados aislada.',
    objective: 'Desactiva WPS (o el modo PIN), establece seguridad WPA3 o WPA2/WPA3 en la red de 5 GHz, y habilita la Red de Invitados con aislamiento activado.',
    problemScenario: 'El router es vulnerable a ataques de fuerza bruta de PIN WPS y los dispositivos invitados pueden husmear en tu red privada.',
    steps: [
      'Ve a la pestaña "Red Inalámbrica (Wi-Fi)".',
      'En la sección WPS, desactiva WPS por completo o cambia el modo a "Botón Físico" en vez de PIN.',
      'En la banda de 5 GHz, asegúrate de que la seguridad esté en WPA3 o WPA2/WPA3.',
      'En la sección "Red de Invitados", habilita la red y activa la opción "Aislamiento de Invitados (AP Isolation)".',
      'Haz clic en "Guardar y Aplicar".'
    ],
    hint: 'Desactiva WPS en Wi-Fi, configura WPA3 en 5GHz y activa la Red de Invitados con aislamiento de clientes.',
    isCompleted: (config) => {
      const wpsSafe = !config.wpsEnabled || config.wpsMode === 'push_button';
      const wifi5Safe = config.wifi5Security === 'wpa3' || config.wifi5Security === 'wpa2_wpa3';
      const guestSafe = config.guestWifiEnabled && config.guestIsolation;
      return wpsSafe && wifi5Safe && guestSafe;
    },
    solutionSummary: '¡Red fortificada! Al neutralizar el PIN de WPS evitas ataques de fuerza bruta, WPA3 blinda el tráfico contra descifrado offline y el aislamiento de invitados previene que visitantes infectados contagien tus equipos.'
  },
  {
    id: 'mission-parental-control',
    title: 'Misión 4: Control Parental y Descanso Digital',
    difficulty: 'Fácil',
    description: 'Para evitar distracciones durante el horario de estudio o proteger a los más pequeños, es necesario restringir el acceso a plataformas de vídeos cortos o apuestas.',
    objective: 'Habilita el Control Parental y asegura que el dominio "tiktok.com" esté activo en la lista de bloqueo.',
    problemScenario: 'Cualquier dispositivo puede acceder a cualquier contenido web sin supervisión ni filtros.',
    steps: [
      'Ve a la pestaña "Seguridad & Firewall".',
      'Localiza la sección "Control Parental & Filtro Web".',
      'Activa la casilla "Habilitar Control Parental".',
      'Verifica que el dominio "tiktok.com" esté marcado como habilitado en la lista.',
      'Guarda los cambios.'
    ],
    hint: 'En la pestaña "Seguridad & Firewall", enciende el interruptor de Control Parental y verifica que tiktok.com esté en la lista bloqueada.',
    isCompleted: (config) => {
      const tiktokBlocked = config.blockedDomains.some(d => d.domain === 'tiktok.com' && d.enabled);
      return config.parentalControlEnabled && tiktokBlocked;
    },
    solutionSummary: '¡Filtro activo! El router interceptará las consultas DNS hacia esos dominios y responderá con bloqueo, garantizando un entorno seguro para los menores.'
  },
  {
    id: 'mission-dos-defense',
    title: 'Misión 5: Detener Ataque DoS SYN Flood y Activar Modo Oculto',
    difficulty: 'Avanzado',
    description: 'Un bot malicioso está inundando la IP del router con paquetes de sincronización falsos (SYN Flood), elevando la carga del procesador y provocando cortes en la navegación.',
    objective: 'Activa el Firewall SPI, habilita la Protección Anti-DoS y desactiva la respuesta a Ping en WAN (Modo Oculto).',
    problemScenario: 'El router carece de filtros de mitigación de tasa de paquetes y contesta a todos los pings de reconocimiento externos.',
    steps: [
      'Ve a la pestaña "Seguridad & Firewall".',
      'Asegúrate de que "Firewall SPI (Stateful Packet Inspection)" esté ACTIVADO.',
      'Activa el interruptor "Protección contra Ataques DoS / SYN Flood".',
      'Asegúrate de que "Responder a Ping en WAN" esté DESACTIVADO (Modo Stealth).',
      'Guarda y dirígete al "Centro de Pruebas de Ciberseguridad" para lanzar una prueba de estrés y verificar que la protección descarta el ataque.'
    ],
    hint: 'En "Seguridad & Firewall", activa SPI y Protección DoS, y desmarca "Responder a Ping en WAN".',
    isCompleted: (config) => {
      return config.firewallSpiEnabled && config.dosProtectionEnabled && !config.wanPingRespond;
    },
    solutionSummary: '¡Defensa impenetrable! Con SPI y filtro DoS activos, el router descarta las ráfagas anómalas antes de saturar su procesador, y al no responder a pings WAN, tu router es invisible a escáneres masivos de la red.'
  }
];
