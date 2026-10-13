import React, { useState, useEffect } from 'react';
import { RouterConfig, VirtualDevice } from '../../types/router';
import { SecurityAuditReport } from '../../simulation/networkEngine';
import { BlockedAttacksChart } from '../BlockedAttacksChart';
import { VulnerabilityScanner } from '../VulnerabilityScanner';
import { ShieldCheck, ShieldAlert, Terminal, Play, Pause, AlertTriangle, CheckCircle2, Flame, Search, FileCheck } from 'lucide-react';

interface Props {
  config: RouterConfig;
  devices: VirtualDevice[];
  securityAudit: SecurityAuditReport;
  isExternalDosAttackActive: boolean;
  setIsExternalDosAttackActive: (val: boolean) => void;
  onOpenTopic: (topicId: string) => void;
  onUpdateConfig: (newConfig: Partial<RouterConfig>) => void;
  onOpenAuditReport?: () => void;
}

export const SecurityLabTab: React.FC<Props> = ({
  config,
  devices,
  securityAudit,
  isExternalDosAttackActive,
  setIsExternalDosAttackActive,
  onOpenTopic,
  onUpdateConfig,
  onOpenAuditReport
}) => {
  // Test states
  const [isScanningPorts, setIsScanningPorts] = useState(false);
  const [portScanLog, setPortScanLog] = useState<string[]>([]);
  const [scannedPortsResult, setScannedPortsResult] = useState<{ port: number; name: string; state: 'open' | 'filtered' | 'closed'; reason: string }[]>([]);

  const [isWpsAttacking, setIsWpsAttacking] = useState(false);
  const [wpsTerminalLog, setWpsTerminalLog] = useState<string[]>([]);

  const [isIsolationTesting, setIsIsolationTesting] = useState(false);
  const [isolationTestResult, setIsIsolationTestResult] = useState<string | null>(null);

  // Run Port Scan (Nmap Simulator)
  const runPortScan = () => {
    setIsScanningPorts(true);
    setPortScanLog([
      `Iniciando escaneo de reconocimiento Nmap v7.94 sobre la IP pública ${config.wanIp}...`,
      `Sondeando puertos TCP comunes con técnica SYN Stealth (-sS -Pn)...`
    ]);
    setScannedPortsResult([]);

    setTimeout(() => {
      const probeList = [
        { port: 21, name: 'FTP (File Transfer)' },
        { port: 22, name: 'SSH (Secure Shell)' },
        { port: 53, name: 'DNS (Domain System)' },
        { port: 80, name: 'HTTP (Web Server)' },
        { port: 443, name: 'HTTPS (Web Segura)' },
        { port: 3389, name: 'RDP (Escritorio Remoto Windows)' },
        { port: 8443, name: 'Web Admin Remoto' },
        { port: 25565, name: 'Minecraft Server' },
        { port: 32400, name: 'Plex Media Server' }
      ];

      const results = probeList.map(item => {
        let state: 'open' | 'filtered' | 'closed' = 'filtered';
        let reason = 'Bloqueado por Firewall SPI';

        if (config.dmzEnabled) {
          state = 'open';
          reason = `Reenviado al host DMZ (${config.dmzHostIp}) sin filtro`;
        } else if (config.remoteManagementEnabled && item.port === config.remoteManagementPort) {
          state = 'open';
          reason = 'Gestión remota WAN habilitada';
        } else {
          const matchingRule = config.portForwardRules.find(r => r.enabled && r.externalPort === item.port);
          if (matchingRule) {
            state = 'open';
            reason = `Reenviado a ${matchingRule.internalIp}:${matchingRule.internalPort} (${matchingRule.serviceName})`;
          } else if (!config.firewallSpiEnabled) {
            state = 'closed';
            reason = 'Firewall SPI desactivado: puerto responde RST';
          }
        }

        return {
          port: item.port,
          name: item.name,
          state,
          reason
        };
      });

      setScannedPortsResult(results);
      setPortScanLog(prev => [
        ...prev,
        `Escaneo completado. 9 puertos probados en 1.42 segundos.`,
        config.dmzEnabled
          ? `[ALERTA DE SEGURIDAD]: Todos los puertos están abiertos debido a la regla DMZ activa hacia ${config.dmzHostIp}!`
          : `Resultado: ${results.filter(r => r.state === 'open').length} puertos abiertos detectados desde el exterior.`
      ]);
      setIsScanningPorts(false);
    }, 1200);
  };

  // Run WPS Brute Force (Pixie Dust Simulator)
  const runWpsAttack = () => {
    setIsWpsAttacking(true);
    setWpsTerminalLog([
      `[+] Iniciando herramienta de auditoría Reaver / PixieWps v1.4...`,
      `[+] BSSID objetivo: 00:90:A9:7B:44:01 (${config.wifi24Ssid})`,
      `[+] Probando asociación EAPOL y negociación M1/M2 WPS...`
    ]);

    setTimeout(() => {
      if (!config.wpsEnabled) {
        setWpsTerminalLog(prev => [
          ...prev,
          `[-] [DEFENSA]: El router no respondió a paquetes WPS.`,
          `[-] Estado: WPS está DESACTIVADO en el router. Ataque neutralizado con éxito.`,
          `[+] ¡La red es segura contra ataques WPS!`
        ]);
        setIsWpsAttacking(false);
      } else if (config.wpsMode === 'push_button') {
        setWpsTerminalLog(prev => [
          ...prev,
          `[-] [AVISO]: El router está en modo botón pulsador físico (PBC).`,
          `[-] Ataque de PIN rechazado por el router: "PIN disabled, push button required".`,
          `[+] ¡Ataque de PIN bloqueado!`
        ]);
        setIsWpsAttacking(false);
      } else {
        // WPS PIN is enabled -> VULNERABLE!
        setWpsTerminalLog(prev => [
          ...prev,
          `[+] [VULNERABILIDAD DETECTADA]: Router vulnerable al fallo de entropía en números pseudoaleatorios (PRNG).`,
          `[+] Recibido mensaje M3. Extrayendo E-Hash1 y E-Hash2...`,
          `[+] Verificando primera mitad del PIN (4 dígitos)... Coincidencia encontrada: ${config.wpsPin.slice(0, 4)}`,
          `[+] Verificando segunda mitad del PIN (3 dígitos + checksum)... Coincidencia: ${config.wpsPin.slice(4)}`,
          `[!] ¡PIN WPS CRACKEADO CON ÉXITO!: [ ${config.wpsPin} ] en 2.8 segundos!`,
          `[!] Clave WPA2/WPA3 obtenida: [ "${config.wifi24Password}" ]`,
          `[CRÍTICO]: Cualquier intruso puede conectarse ahora a tu red sin tu permiso.`
        ]);
        setIsWpsAttacking(false);
      }
    }, 1800);
  };

  // Run Guest Isolation Test
  const runIsolationTest = () => {
    setIsIsolationTesting(true);
    setIsIsolationTestResult(null);

    setTimeout(() => {
      if (!config.guestWifiEnabled) {
        setIsIsolationTestResult('Red de invitados desactivada actualmente.');
      } else if (config.guestIsolation) {
        setIsIsolationTestResult('AISLAMIENTO EXITOSO: El dispositivo invitado intentó escanear los hosts de la subred privada (192.168.1.10 y 192.168.1.50) pero los paquetes ARP y TCP fueron descartados por el router. Los invitados solo tienen salida hacia Internet.');
      } else {
        setIsIsolationTestResult('¡FALLO DE SEGURIDAD! El aislamiento de invitados está DESACTIVADO. El dispositivo invitado pudo descubrir e interactuar con el Servidor NAS (192.168.1.10) y el PC Gamer (192.168.1.50). Podrían ocurrir ataques de Man-in-the-Middle o robo de archivos compartidos.');
      }
      setIsIsolationTesting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Security Score */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Centro de Pruebas de Ciberseguridad & Diagnóstico de Intrusión
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Realiza simulaciones de ataques reales (escaneo Nmap, fuerza bruta WPS, inundación DoS y aislamiento de subredes) en un entorno seguro y didáctico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-400">Calificación de Seguridad</div>
            <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <span>{securityAudit.score}/100</span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                securityAudit.grade === 'A+' || securityAudit.grade === 'A'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : securityAudit.grade === 'B'
                  ? 'bg-sky-950 text-sky-400 border border-sky-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                Grado {securityAudit.grade}
              </span>
            </div>
          </div>

          {onOpenAuditReport && (
            <button
              type="button"
              onClick={onOpenAuditReport}
              className="flex items-center gap-2 px-3.5 py-3 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-700/60 text-emerald-300 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:border-emerald-400"
              title="Generar e imprimir informe ejecutivo oficial"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Informe Oficial Certificado</span>
            </button>
          )}
        </div>
      </div>

      {/* Vulnerability Scanner and Top 3 Critical Recommendations */}
      <VulnerabilityScanner
        config={config}
        onUpdateConfig={onUpdateConfig}
        onOpenTopic={onOpenTopic}
      />

      {/* Historical Blocked Attacks 24h Bar Chart */}
      <BlockedAttacksChart
        config={config}
        isExternalDosAttackActive={isExternalDosAttackActive}
      />

      {/* Cyber Test 1: Port Scanner (Nmap Simulator) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Prueba 1: Escáner de Puertos WAN (Simulador Nmap)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Prueba qué servicios de tu router son visibles y accesibles para atacantes en Internet ({config.wanIp}).
            </p>
          </div>

          <button
            type="button"
            onClick={runPortScan}
            disabled={isScanningPorts}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isScanningPorts ? 'Escaneando...' : 'Lanzar Escaneo Nmap'}</span>
          </button>
        </div>

        {/* Nmap Terminal Log */}
        {portScanLog.length > 0 && (
          <div className="bg-black/90 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
            {portScanLog.map((log, idx) => (
              <div key={idx} className={log.includes('ALERTA') ? 'text-rose-400 font-bold' : ''}>
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Scanned Ports Table */}
        {scannedPortsResult.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Puerto</th>
                  <th className="py-2 px-3">Servicio</th>
                  <th className="py-2 px-3">Estado Exterior</th>
                  <th className="py-2 px-3">Explicación Técnica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {scannedPortsResult.map((res) => (
                  <tr key={res.port} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">{res.port}/TCP</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{res.name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        res.state === 'open'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {res.state.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{res.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: WPS Attack & DoS Attack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cyber Test 2: WPS Pixie Dust Attack */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Prueba 2: Ataque de Fuerza Bruta WPS PIN (Pixie Dust)
              </h3>
              <p className="text-xs text-slate-400">
                Demuestra por qué tener WPS PIN activado anula la seguridad de tu clave Wi-Fi.
              </p>
            </div>
            <button
              type="button"
              onClick={runWpsAttack}
              disabled={isWpsAttacking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{isWpsAttacking ? 'Ejecutando...' : 'Iniciar Ataque WPS'}</span>
            </button>
          </div>

          <div className="bg-black/90 p-3 rounded-lg border border-slate-800 font-mono text-xs min-h-[140px] space-y-1.5 text-slate-300">
            {wpsTerminalLog.length === 0 ? (
              <span className="text-slate-600 italic">
                Presiona "Iniciar Ataque WPS" para comprobar si tu router resiste un ataque de inyección de PIN.
              </span>
            ) : (
              wpsTerminalLog.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.includes('DEFENSA') || line.includes('segura')
                      ? 'text-emerald-400'
                      : line.includes('CRACKEADO') || line.includes('VULNERABILIDAD')
                      ? 'text-rose-400 font-bold'
                      : ''
                  }
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cyber Test 3: DoS Flooding Attack */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Prueba 3: Simulador de Inundación DoS (SYN Flood)
              </h3>
              <p className="text-xs text-slate-400">
                Lanza una ráfaga de 60.000 paquetes por segundo para probar la protección DoS del Firewall.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExternalDosAttackActive(!isExternalDosAttackActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                isExternalDosAttackActive
                  ? 'bg-rose-600 text-white hover:bg-rose-500 animate-pulse'
                  : 'bg-amber-600 text-white hover:bg-amber-500'
              }`}
            >
              {isExternalDosAttackActive ? <Pause className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
              <span>{isExternalDosAttackActive ? 'Detener Ataque DoS' : 'Lanzar Ataque DoS'}</span>
            </button>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Estado del Ataque:</span>
              <span className={`font-mono font-bold ${isExternalDosAttackActive ? 'text-rose-400' : 'text-slate-500'}`}>
                {isExternalDosAttackActive ? 'ATAQUE EN CURSO (60.000 pps)' : 'Inactivo'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Protección DoS en Router:</span>
              <span className={`font-mono font-bold ${config.dosProtectionEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                {config.dosProtectionEnabled ? 'ACTIVADA' : 'DESACTIVADA'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] leading-relaxed text-slate-300">
              {isExternalDosAttackActive ? (
                config.dosProtectionEnabled && config.firewallSpiEnabled ? (
                  <span className="text-emerald-400 font-semibold">
                    ¡Protección Eficaz!: El Firewall SPI detectó la inundación de paquetes SYN y los descarta en la tarjeta de red. El uso de CPU se mantiene controlado y los clientes legítimos pueden seguir jugando y navegando.
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold">
                    ¡COLAPSO DE RED!: La protección DoS está apagada. El procesador del router está saturado al 95%+, la tabla de conexiones NAT está desbordada y la latencia para todos los dispositivos se ha disparado a más de 500ms.
                  </span>
                )
              ) : (
                <span>
                  Haz clic en "Lanzar Ataque DoS" y observa en la pestaña Dashboard cómo varía la gráfica de latencia y el porcentaje de CPU del router con y sin protección anti-DoS activa.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cyber Test 4: Guest Isolation Test */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Prueba 4: Test de Aislamiento de Red de Invitados (AP Isolation)
            </h3>
            <p className="text-xs text-slate-400">
              Comprueba si un dispositivo conectado a la Wi-Fi de invitados puede espiar o alcanzar los servidores de tu casa.
            </p>
          </div>
          <button
            type="button"
            onClick={runIsolationTest}
            disabled={isIsolationTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <span>{isIsolationTesting ? 'Comprobando...' : 'Probar Aislamiento'}</span>
          </button>
        </div>

        {isolationTestResult && (
          <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
            isolationTestResult.includes('EXITOSO')
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            {isolationTestResult}
          </div>
        )}
      </div>

      {/* Security Audit Vulnerabilities Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Auditoría de Vulnerabilidades y Buenas Prácticas
          </h3>
          <span className="text-xs text-slate-400">
            {securityAudit.vulnerabilities.length === 0 ? 'Sin riesgos detectados' : `${securityAudit.vulnerabilities.length} riesgos encontrados`}
          </span>
        </div>

        {/* Found vulnerabilities */}
        {securityAudit.vulnerabilities.length > 0 && (
          <div className="space-y-3">
            {securityAudit.vulnerabilities.map((vuln) => (
              <div
                key={vuln.id}
                className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                  vuln.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                    : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{vuln.title}</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-current">
                    {vuln.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{vuln.description}</p>
                <div className="pt-1 text-[11px] font-semibold text-white">
                  Remediación: <span className="font-normal text-slate-300">{vuln.remediation}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        {securityAudit.positives.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider block">
              Puntos Fuertes Configurados Correctamente:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {securityAudit.positives.map((pos, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded border border-slate-800 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{pos}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
