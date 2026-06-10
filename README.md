# Nexus Automation Suite - Lighthouse Template

Este proyecto es una plantilla (template) de automatización avanzada diseñada para realizar auditorías de rendimiento, accesibilidad, buenas prácticas y SEO utilizando Lighthouse User Flows de forma secuencial y multiplataforma. Combina la potencia de Puppeteer para la navegación y emulación de dispositivos con Winston para un sistema de logs estructurado y persistentemente separado.

## 🚀 Características Clave

* Lighthouse User Flows: Permite auditar flujos completos de usuario (páginas con login, interacciones, transiciones) y no solo cargas de páginas aisladas.
* Emulación Nativa Real: Configuración exacta de dimensiones, DPR (Device Pixel Ratio) y User Agents para Desktop, Tablet y Mobile sin deformaciones visuales.
* Persistencia Quirúrgica de Reportes: Los reportes HTML y JSON se guardan directamente en carpetas separadas por dispositivo (/reports/desktop, /reports/tablet, /reports/mobile). Las ejecuciones individuales no eliminan los reportes de otros dispositivos.
* Bitácora de Logs Estructurada: Sistema de trazabilidad mediante Winston que vuelca información en tiempo real en la consola con colores y clasifica los registros en archivos independientes dentro de /logs (info.log, error.log, debug.log, combined.log).
* Scripts de Limpieza Nativos: Mantenimiento de directorios automatizado a través de PowerShell, eliminando dependencias externas innecesarias de Node.js.

## 🛠️ Requisitos Previos

* Node.js (Versión 18 o superior recomendada)
* Entorno de ejecución de comandos compatible con PowerShell (para ejecutar los scripts de limpieza en Windows de forma nativa).

## 📦 Instalación

1. Clona o ubícate en la carpeta del repositorio.
2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

## 🏃 Scripts de Ejecución

La suite permite compilar el código TypeScript (tsc) automáticamente y lanzar las auditorías según el factor de forma (formFactor) requerido utilizando variables de entorno controladas por cross-env.

### Ejecuciones Individuales por Perfil

* Auditar entorno Escritorio (Desktop):
```bash
  npm run test:desktop
  ```

* Auditar entorno Tableta (Tablet):
```bash
  npm run test:tablet
  ```

* Auditar entorno Móvil (Mobile):
```bash
  npm run test:mobile
  ```

### Ejecución de la Suite Completa

* Auditar todos los dispositivos secuencialmente:
  Compila el proyecto y ejecuta de manera ordenada las pruebas en desktop, tablet y mobile, guardando los resultados de cada uno de forma independiente.
  ```bash
  npm run test:all
  ```

## 🧹 Scripts de Limpieza (PowerShell Nativo)

Para resetear los entornos de reportes o trazas de ejecución sin arrastrar basura de ejecuciones pasadas, cuentas con los siguientes comandos dedicados:

* Eliminar la carpeta de reportes generados (/reports):
```bash
  npm run clean:reports
  ```

* Eliminar la carpeta de registros históricos (/logs):
```bash
  npm run clean:logs
  ```

* Limpieza total (Borra tanto /reports como /logs):
```bash
  npm run clean:all
  ```

## 📊 Artefactos Generados

### 1. Reportes de Auditoría (/reports)
Al finalizar con éxito un flujo de usuario, se crearán archivos .html y .json dentro del directorio del dispositivo correspondiente:
* ./reports/desktop/audit_result_desktop.html
* ./reports/tablet/audit_result_tablet.html
* ./reports/mobile/audit_result_mobile.html

### 2. Trazas de Logs (/logs)
El sistema de logs separará de forma asíncrona los eventos ocurridos durante la automatización:
* combined.log: Historial cronológico completo de la ejecución de la suite.
* info.log: Trazas informativas generales sobre pasos del flujo exitosos.
* debug.log: Datos específicos de depuración técnica y selectores.
* error.log: Errores críticos acumulados o excepciones no controladas.

## Licencia

Este proyecto utiliza la [Licencia MIT](https://opensource.org/licenses/MIT).

## Disclaimer

La aplicación web utilizada en los ejemplos de este
proyecto [angular-dashboard-lime.vercel.app](https://angular-dashboard-lime.vercel.app) pertenece
a [Zoaib Khan](https://www.youtube.com/@ZoaibKhan). Se utiliza exclusivamente con fines educativos, demostrativos y para
prácticas de automatización.