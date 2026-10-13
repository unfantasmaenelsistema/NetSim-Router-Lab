export interface GlossaryTerm {
  id: string;
  term: string;
  category: 'Redes Básicas' | 'Wi-Fi' | 'Seguridad' | 'Protocolos' | 'Rendimiento';
  shortDef: string;
  explanation: string;
  analogy: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'ip_privada',
    term: 'Dirección IP Privada (LAN)',
    category: 'Redes Básicas',
    shortDef: 'Identificador único asignado a cada dispositivo dentro de tu red doméstica (ej. 192.168.1.50).',
    explanation: 'No es accesible directamente desde Internet. El router utiliza el rango definido por el RFC 1918 (192.168.0.0/16, 10.0.0.0/8 o 172.16.0.0/12) para que todos los dispositivos de la casa puedan comunicarse entre sí.',
    analogy: 'Es como el número de habitación dentro de un hotel. La gente dentro del hotel sabe dónde estás, pero un cartero desde la calle no puede llamarte directamente sin pasar por recepción.'
  },
  {
    id: 'ip_publica',
    term: 'Dirección IP Pública (WAN)',
    category: 'Redes Básicas',
    shortDef: 'La dirección con la que tu router se identifica ante todo el mundo en Internet.',
    explanation: 'Te la asigna tu proveedor de Internet (ISP). Todos los dispositivos de tu casa comparten esta única dirección pública gracias al mecanismo NAT.',
    analogy: 'Es la dirección postal del edificio del hotel en la calle.'
  },
  {
    id: 'nat',
    term: 'NAT (Network Address Translation)',
    category: 'Protocolos',
    shortDef: 'Traducción de direcciones entre tu red local privada y la Internet pública.',
    explanation: 'Como las direcciones IPv4 son limitadas, NAT traduce las decenas de IPs privadas de tu casa (192.168.1.X) a tu única IP pública cuando navegas, anotando en una tabla qué paquete pertenece a qué móvil o PC.',
    analogy: 'Es el recepcionista del hotel que recibe todas las cartas dirigidas al edificio y las reparte a cada huésped según el número de habitación.'
  },
  {
    id: 'gateway',
    term: 'Puerta de Enlace (Default Gateway)',
    category: 'Redes Básicas',
    shortDef: 'La dirección IP interna del router que sirve de salida hacia el resto del mundo (habitualmente 192.168.1.1).',
    explanation: 'Cualquier paquete cuyo destino no esté dentro de la red local se envía automáticamente a la puerta de enlace para que el router lo encamine a Internet.',
    analogy: 'Es la puerta de salida de tu casa hacia la calle principal.'
  },
  {
    id: 'dhcp',
    term: 'DHCP (Dynamic Host Configuration Protocol)',
    category: 'Protocolos',
    shortDef: 'Servicio automático que entrega IP, máscara, DNS y puerta de enlace a cada cliente.',
    explanation: 'Evita tener que teclear a mano la dirección IP en cada teléfono o consola que llega a casa. Si se desactiva, los dispositivos no pueden comunicarse a menos que se configure una IP estática manual.',
    analogy: 'Es como el repartidor de credenciales en una convención que te da una tarjeta de identificación con tu número de asiento al entrar.'
  },
  {
    id: 'dns',
    term: 'DNS (Domain Name System)',
    category: 'Protocolos',
    shortDef: 'El traductor que convierte nombres legibles (ej. google.com) en direcciones IP numéricas (142.250.200.14).',
    explanation: 'Los humanos recordamos palabras; los routers solo entienden números IP. Un servidor DNS rápido reduce drásticamente el tiempo de carga de las webs.',
    analogy: 'La agenda de contactos de tu teléfono: buscas el nombre "Mamá" y el teléfono marca su número real.'
  },
  {
    id: 'bufferbloat',
    term: 'Bufferbloat (Retraso por Colas Llenas)',
    category: 'Rendimiento',
    shortDef: 'El aumento excesivo de latencia (ping) cuando la conexión a Internet está saturada de tráfico.',
    explanation: 'Ocurre cuando los buffers de memoria del router se llenan de paquetes de una descarga pesada. Los paquetes pequeños de un videojuego o llamada deben esperar en la cola detrás de megabytes de datos, disparando el ping de 20ms a 300ms.',
    analogy: 'Un peaje en la autopista donde camiones gigantes ocupan todas las ventanillas, obligando a una ambulancia rápida a esperar en la fila.'
  },
  {
    id: 'qos',
    term: 'QoS (Quality of Service)',
    category: 'Rendimiento',
    shortDef: 'Priorización inteligente del tráfico de red según su tipo o dispositivo.',
    explanation: 'Permite clasificar los paquetes para dar paso preferente a los que no toleran retrasos (partidas online, llamadas de Zoom) y regular las descargas en segundo plano.',
    analogy: 'Un carril prioritario exclusivo para autobuses y vehículos de emergencia.'
  },
  {
    id: 'port_forwarding',
    term: 'Port Forwarding (Reenvío de Puertos)',
    category: 'Protocolos',
    shortDef: 'Regla que redirige conexiones entrantes de un puerto de Internet a un ordenador local.',
    explanation: 'Permite que usuarios externos se conecten a un servidor alojado en tu casa (como Minecraft en el puerto 25565 o un servidor web en el 80).',
    analogy: 'Indicarle al recepcionista: "Si alguien llama preguntando por la extensión 25565, pásale directamente a la habitación 50".'
  },
  {
    id: 'dmz',
    term: 'DMZ (Zona Desmilitarizada)',
    category: 'Seguridad',
    shortDef: 'Función que envía TODO el tráfico de puertos no solicitados a un único dispositivo.',
    explanation: 'Deja al dispositivo completamente expuesto a Internet sin el cortafuegos del router. Es extremadamente peligroso para ordenadores con Windows o Linux.',
    analogy: 'Poner a un huésped a dormir en el portal del edificio en plena calle en vez de dentro de una habitación segura.'
  },
  {
    id: 'upnp',
    term: 'UPnP (Universal Plug and Play)',
    category: 'Seguridad',
    shortDef: 'Protocolo que permite a los programas de tu PC abrir puertos en el router sin pedir permiso.',
    explanation: 'Muy cómodo para consolas y Torrent, pero un riesgo si un virus entra en la red y abre un puerto silenciosamente para crear una puerta trasera.',
    analogy: 'Darle una llave maestra del edificio a cualquier invitado para que abra la puerta que quiera cuando le apetezca.'
  },
  {
    id: 'wpa3',
    term: 'WPA3 (Wi-Fi Protected Access 3)',
    category: 'Wi-Fi',
    shortDef: 'El estándar de seguridad inalámbrica más moderno y robusto.',
    explanation: 'Reemplaza el protocolo de 4 vías de WPA2 por SAE (Simultaneous Authentication of Equals). Es inmune a ataques de diccionario offline y protege el tráfico de cada usuario incluso en redes abiertas.',
    analogy: 'Una cerradura digital cuántica que cambia el cifrado de cada conversación para que ni siquiera otros miembros de la red puedan espiarte.'
  },
  {
    id: 'wps_pin',
    term: 'WPS PIN (Vulnerabilidad Pixie Dust)',
    category: 'Seguridad',
    shortDef: 'Código de 8 dígitos para emparejamiento rápido que sufre un grave fallo de diseño criptográfico.',
    explanation: 'El router verifica los primeros 4 dígitos y los últimos 3 por separado. Eso reduce las combinaciones de 100 millones a apenas 11.000, permitiendo a atacantes descifrar la clave Wi-Fi en minutos con programas como Reaver.',
    analogy: 'Un candado que te avisa con un clic audible cuando aciertas la primera mitad de la combinación.'
  },
  {
    id: 'spi_firewall',
    term: 'Firewall SPI (Stateful Packet Inspection)',
    category: 'Seguridad',
    shortDef: 'Cortafuegos que mantiene una tabla de estados de todas las conversaciones activas.',
    explanation: 'Solo permite que un paquete de Internet entre a tu casa si responde a una solicitud que tú hiciste primero. Cualquier intento de conexión espontáneo es bloqueado.',
    analogy: 'Un portero de discoteca que tiene una lista de quién salió a tomar el aire y solo deja reentrar a los que tienen sello en la mano.'
  },
  {
    id: 'mac_address',
    term: 'Dirección MAC (Media Access Control)',
    category: 'Redes Básicas',
    shortDef: 'Identificador físico único de 48 bits grabado en el chip de tu tarjeta de red (ej. 00:1A:2B:3C:4D:5E).',
    explanation: 'Opera en la capa 2 (Enlace de datos) del modelo OSI. Nunca cambia con el proveedor de Internet, aunque hoy en día los sistemas operativos pueden simular MACs aleatorias por privacidad.',
    analogy: 'El número de bastidor o matrícula de fábrica de un coche.'
  }
];
