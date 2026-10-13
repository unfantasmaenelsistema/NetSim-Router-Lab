import React, { useState } from 'react';
import { RouterConfig, VirtualDevice } from '../types/router';
import { Wrench, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle, Sparkles, RefreshCw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActiveTab } from './Header';
import { getDhcpPool, isApipa, isDnsWorking } from '../simulation/netUtils';

export type TroubleshootingStatus = Record<string, 'active' | 'resolved'>;

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  onUpdateConfig: (newConfig: Partial<RouterConfig>) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenTopic: (topicId: string) => void;
  status: TroubleshootingStatus;
  onStatusChange: (status: TroubleshootingStatus) => void;
}

export interface TroubleshootingCase {
  id: string;
  title: string;
  difficulty: 'Fácil' | 'Media' | 'Avanzada';
  clientTicket: string;
  symptom: string;
  diagnosisClue: string;
  targetTab: ActiveTab;
  /** Comando de terminal con el que el alumno puede observar el síntoma */
  observeHint: string;
  checkResolved: (config: RouterConfig, devices: VirtualDevice[]) => boolean;
  solutionExplanation: string;
  injectIssue: (config: RouterConfig) => Partial<RouterConfig>;
}

export const TroubleshootingLab: React.FC<Props> = ({
  config,
  devices,
  onUpdateConfig,
  onNavigateTab,
  status,
  onStatusChange
}) => {
  const [revealedClues, setRevealedClues] = useState<Record<string, boolean>>({});
  const [failedCheck, setFailedCheck] = useState<Record<string, boolean>>({});

  const cases: TroubleshootingCase[] = [
    {
      id: 'trouble-dhcp-exhausted',
      title: 'Incidencia #1: Pool DHCP Agotado (Dispositivos en 169.254.x.x)',
      difficulty: 'Fácil',
      clientTicket: '"Compré una nueva tablet y no se conecta a Internet. Dice Obteniendo IP... y luego asigna una dirección extraña que empieza por 169.254."',
      symptom: 'El pool DHCP se configuró con solo 2 direcciones IP disponibles (192.168.1.100 a 192.168.1.101) y ya están ocupadas: los demás clientes no reciben DHCPOFFER y se autoconfiguran con APIPA.',
      diagnosisClue: 'Ve a "Red LAN & DHCP" y amplía el rango del Pool DHCP (por ejemplo de 192.168.1.100 hasta 192.168.1.200).',
      targetTab: 'lan',
      observeHint: 'Consola del Router → "show dhcp leases" · en un móvil → "ipconfig"',
      checkResolved: (cfg, devs) => {
        const pool = getDhcpPool(cfg);
        // Equipos que piden concesión: los conectados y los que se quedaron sin IP por culpa del DHCP
        const clients = devs.filter(d => d.isOnline || /DHCP|APIPA/.test(d.statusLog));
        return cfg.dhcpEnabled && pool.valid && clients.every(d => !isApipa(d.ip));
      },
      solutionExplanation: 'Al ampliar el pool de direcciones IP, el demonio DHCP vuelve a tener direcciones libres para asignar a nuevos clientes sin agotar el espacio.',
      injectIssue: () => ({
        dhcpEnabled: true,
        dhcpPoolStart: '192.168.1.100',
        dhcpPoolEnd: '192.168.1.101'
      })
    },
    {
      id: 'trouble-dns-failure',
      title: 'Incidencia #2: Fallo de Resolución DNS (Hay Ping a 8.8.8.8 pero las webs no abren)',
      difficulty: 'Media',
      clientTicket: '"Puedo hacer ping a direcciones IP numéricas, pero ninguna página web abre cuando escribo google.com o wikipedia.org."',
      symptom: 'El servidor DNS primario fue configurado erróneamente en una IP no funcional (ej. 192.0.2.1).',
      diagnosisClue: 'En la pestaña "Red LAN & DHCP", cambia los DNS a servidores fiables como Cloudflare (1.1.1.1) o Google (8.8.8.8).',
      targetTab: 'lan',
      observeHint: 'Terminal → "ping 8.8.8.8" (funciona) y "nslookup google.com" (falla)',
      checkResolved: (cfg) => isDnsWorking(cfg),
      solutionExplanation: 'Sin un servidor DNS activo, el navegador no puede traducir nombres de dominio a direcciones IP, aunque la conexión física funcione al 100%.',
      injectIssue: () => ({
        wanDnsMode: 'Custom',
        wanPrimaryDns: '192.0.2.1', // Unroutable TEST-NET IP
        wanSecondaryDns: '192.0.2.2'
      })
    },
    {
      id: 'trouble-nat-misconfigured',
      title: 'Incidencia #3: Servidor de Juegos Inaccesible (Regla NAT Apunta a Puerto Erróneo)',
      difficulty: 'Media',
      clientTicket: '"Mis amigos no pueden entrar a mi servidor de Minecraft. Comprobé que el juego está abierto en mi PC pero ellos reciben Conexión rechazada."',
      symptom: 'La regla de Port Forwarding se configuró con el puerto externo correcto (25565), pero el puerto interno se puso en 8080 en vez de 25565.',
      diagnosisClue: 'En "Port Forwarding (NAT)", edita o habilita la regla de Minecraft asegurando que tanto el puerto externo como interno sean 25565 TCP.',
      targetTab: 'portforward',
      observeHint: 'Consola del Router → "iptables -t nat -L -n -v"',
      checkResolved: (cfg) => {
        const rules = cfg.portForwardRules.filter(r => r.enabled && r.externalPort === 25565);
        return rules.length > 0 && rules.every(r => r.internalPort === 25565 && r.internalIp === '192.168.1.50' && r.protocol !== 'UDP');
      },
      solutionExplanation: 'El tráfico llegaba a tu IP pública pero el router lo enviaba al puerto 8080 de tu PC, donde nadie estaba escuchando.',
      // Sustituye solo la regla del puerto 25565: el resto de reglas del alumno se conservan
      injectIssue: (cfg) => ({
        portForwardRules: [
          ...cfg.portForwardRules.filter(r => r.externalPort !== 25565),
          {
            id: 'rule-minecraft-broken',
            serviceName: 'Minecraft Server',
            externalPort: 25565,
            internalIp: '192.168.1.50',
            internalPort: 8080, // Wrong port!
            protocol: 'TCP',
            enabled: true
          }
        ]
      })
    },
    {
      id: 'trouble-wifi-channel-overlap',
      title: 'Incidencia #4: Wi-Fi con Jitter Severo y Pérdida de Paquetes en 2.4 GHz',
      difficulty: 'Media',
      clientTicket: '"Las videollamadas y juegos tienen cortes constantes por Wi-Fi. La velocidad baja a 1 Mbps de golpe."',
      symptom: 'La banda de 2.4 GHz está en canal con ancho de 40 MHz colisionando con los canales 1 al 9.',
      diagnosisClue: 'En "Wi-Fi Inalámbrico", reduce el ancho de canal de 2.4 GHz a 20 MHz en canales limpios (1, 6 u 11).',
      targetTab: 'wireless',
      observeHint: 'Terminal desde la Cámara IP (2.4 GHz) → "ping 8.8.8.8" · Consola → "wifi-status"',
      checkResolved: (cfg) => {
        return cfg.wifi24ChannelWidth === 20 && (cfg.wifi24Channel === 1 || cfg.wifi24Channel === 6 || cfg.wifi24Channel === 11);
      },
      solutionExplanation: 'En 2.4 GHz, usar 40 MHz ocupa casi todo el espectro electromagnético doméstico provocando colisiones continuas con routers vecinos.',
      injectIssue: () => ({
        wifi24ChannelWidth: 40,
        wifi24Channel: 3 // Worst non-standard overlapping channel
      })
    },
    {
      id: 'trouble-firewall-lockout',
      title: 'Incidencia #5: Vulnerabilidad de Red Abierta y DMZ Descontrolada',
      difficulty: 'Avanzada',
      clientTicket: '"Un informe de seguridad indica que todos los puertos de mi ordenador principal están expuestos a Internet sin cortafuegos."',
      symptom: 'La zona desmilitarizada (DMZ) quedó activada apuntando a la IP de la torre de trabajo y, además, alguien desactivó el Firewall SPI.',
      diagnosisClue: 'Son dos fallos: en "Port Forwarding (NAT)" desactiva la DMZ, y en "Seguridad & Firewall" vuelve a activar el Firewall SPI.',
      targetTab: 'portforward',
      observeHint: 'Consola del Router → "iptables -L -n -v" y "iptables -t nat -L -n -v"',
      checkResolved: (cfg) => !cfg.dmzEnabled && cfg.firewallSpiEnabled,
      solutionExplanation: 'Al desactivar DMZ y tener SPI activo, ningún atacante puede alcanzar directamente los puertos vulnerables de tu ordenador.',
      injectIssue: () => ({
        dmzEnabled: true,
        dmzHostIp: '192.168.1.50',
        firewallSpiEnabled: false
      })
    }
  ];

  const handleSimulateTrouble = (c: TroubleshootingCase) => {
    onUpdateConfig(c.injectIssue(config));
    onStatusChange({ ...status, [c.id]: 'active' });
    setRevealedClues(prev => ({ ...prev, [c.id]: false }));
    setFailedCheck(prev => ({ ...prev, [c.id]: false }));
  };

  const handleVerifyCase = (c: TroubleshootingCase) => {
    const isDone = c.checkResolved(config, devices);
    if (isDone) {
      confetti({ particleCount: 70, spread: 60 });
      onStatusChange({ ...status, [c.id]: 'resolved' });
    }
    setFailedCheck(prev => ({ ...prev, [c.id]: !isDone }));
  };

  // Un caso solo cuenta como resuelto si antes se ha simulado la avería
  const totalResolved = cases.filter(c => status[c.id] === 'resolved').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-800/60 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Taller de Averías & Soporte Técnico (Modo Break & Fix)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Aprende a diagnosticar y reparar los 5 problemas de red más comunes a los que se enfrenta un técnico informático.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800">
          <span className="text-xs font-mono text-slate-400">Casos Resueltos:</span>
          <span className="text-sm font-bold font-mono text-emerald-400">{totalResolved} / {cases.length}</span>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {cases.map((c) => {
          const isResolved = status[c.id] === 'resolved';
          const isActive = status[c.id] === 'active';
          const isClueOpen = revealedClues[c.id];

          return (
            <div
              key={c.id}
              className={`bg-slate-950 border rounded-xl p-4.5 space-y-3 transition-all ${
                isResolved
                  ? 'border-emerald-800/50 bg-gradient-to-r from-slate-950 to-emerald-950/15'
                  : isActive
                  ? 'border-amber-600/70 shadow-lg'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${
                      isResolved
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isResolved ? <CheckCircle2 className="w-4 h-4 text-emerald-950" /> : '•'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{c.title}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      Dificultad: {c.difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateTrouble(c)}
                    className="px-2.5 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Simular Avería
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab(c.targetTab)}
                    className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Ir a Reparar →
                  </button>
                </div>
              </div>

              {/* Client Ticket */}
              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  Ticket de Soporte del Usuario:
                </span>
                <p className="italic text-slate-300">{c.clientTicket}</p>
                {(isActive || isResolved) && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    <strong>Cómo observarlo:</strong> <span className="font-mono">{c.observeHint}</span>
                  </div>
                )}
              </div>

              {/* Clue and Verification */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                <div>
                  {isResolved ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> {c.solutionExplanation}
                    </span>
                  ) : isActive ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleVerifyCase(c)}
                        className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold cursor-pointer"
                      >
                        Comprobar si está solucionado
                      </button>
                      {failedCheck[c.id] && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Todavía no está resuelto.
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500">Pulsa «Simular Avería» para empezar este caso.</span>
                  )}
                </div>

                {(isActive || isResolved) && (
                <button
                  type="button"
                  onClick={() => setRevealedClues(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isClueOpen ? 'Ocultar Pista de Diagnóstico' : 'Ver Pista de Diagnóstico'}</span>
                </button>
                )}
              </div>

              {isClueOpen && (isActive || isResolved) && (
                <div className="p-2.5 bg-sky-950/30 border border-sky-800/40 rounded-lg text-xs text-sky-300 space-y-1">
                  <div><strong>Diagnóstico técnico:</strong> {c.symptom}</div>
                  <div><strong>Pista:</strong> {c.diagnosisClue}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
