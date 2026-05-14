# RUUMI FINANCIAL SUITE - v1.0 🛡️🏦
### Guía de Operaciones y Lógica Contable

Bienvenido a la versión final de **Ruumi**, un motor financiero diseñado para la máxima consistencia de datos y una experiencia de usuario premium (Neo-Brutalista).

---

## 🧠 El Motor Contable (Fuente de Verdad)

Ruumi no es un simple gestor de gastos; es un sistema de **Contabilidad de Devengo**. Aquí está la lógica que gobierna tus números:

### 1. Deuda de la Casa vs. Deuda Interna
*   **Gasto Pendiente (Proveedor)**: Si registras un gasto pero no marcas "Pagado al Proveedor", el sistema lo considera **Deuda de la Casa**. 
    *   *Efecto*: Ambos roomies ven su saldo neto disminuir (aparecen en rojo), reflejando que la casa le debe dinero al mundo exterior.
*   **Gasto Ejecutado (Roomie Pagó)**: Al marcar "Pagado al Proveedor", la deuda se vuelve **Interna**. 
    *   *Efecto*: El roomie que pagó se convierte en **Acreedor** (positivo) y el otro en **Deudor** (negativo).

### 2. Sistema de Abonos Inteligente
*   **Abono a Gasto Pendiente**: Si abonas dinero a una cuenta que la casa aún no paga al proveedor, ese dinero se considera **Aporte Directo**. Tu saldo personal mejora y tu cupo de crédito se libera proporcionalmente.
*   **Abono a Gasto Pagado**: Se considera un pago entre personas para saldar la deuda interna.

### 3. Gestión de Riesgos (Cupo de Crédito)
*   Cada roomie tiene un límite de crédito (mínimo sugerido $200.000). 
*   Si el saldo negativo de un roomie supera su cupo, el sistema emitirá alertas visuales de **ESTADO CRÍTICO** y bloqueará la creación de nuevos gastos hasta que se realice un abono.

---

## 📄 Boletas de Liquidación (Cyber-Audit)

El motor de reportes genera un PDF con estética industrial que sirve como **instrumento de pago**:
*   **Algoritmo de Liquidación**: Calcula la ruta más corta de transferencias bancarias para que el mes seleccionado quede en cero.
*   **Separación de Saldos**: Muestra la liquidación del mes actual de forma prominente, pero mantiene un registro de los **Saldos Históricos Arrastrados** al final del documento.

---

## 🛠️ Mantenimiento Técnico
*   **Persistencia**: Todos los datos se guardan en el `AsyncStorage` de tu teléfono.
*   **Reloj**: El sistema utiliza exclusivamente el reloj y zona horaria de tu dispositivo para organizar los meses y el badge de "HOY".
*   **Categorías**: Los colores y estilos que elijas para cada categoría se guardan permanentemente.

---

**¡Ruumi está listo para el despliegue! Mantén las cuentas claras, la casa en orden y el diseño al máximo nivel.** 🦾🚀
