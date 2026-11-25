# Design System MASTER - OpenArchitecto (UI/UX Pro Max)

## 1. Direccion de Producto y Stack

- **Proyecto:** OpenArchitecto
- **Stack UI detectado:** FastAPI (Python 3.12), PostgreSQL 16 + SQLAlchemy/Alembic, Next.js / React + TypeScript + Tailwind CSS, React Flow o Excalidraw + ELK.js, Docker multi-stage non-root, Pytest + Vitest + Playwright + axe-core
- **Principio rector:** Definir tokens, jerarquia visual, estados y reglas de accesibilidad antes de escribir componentes.

## 2. Orden de Prioridad UX (10 Categorias)

1. **Accesibilidad (Critica):** WCAG 2.1 AA, contraste texto/fondo >= 4.5:1 (grandes >= 3:1), navegacion completa por teclado, foco visible y `aria-live` para alertas.
2. **Touch e Interaccion (Critica):** Objetivos tactiles >= 44x44 px, estados claros (`default`, `hover`, `focus`, `active`, `disabled`, `loading`).
3. **Rendimiento (Alta):** LCP <= 1500 ms en 4G/5G, evitar layout shifts (CLS < 0.1), lazy loading de modulos pesados.
4. **Seleccion de Estilo (Alta):** Superficies limpias con 1 color primario de dominio, 1 acento de accion y neutros de alto contraste.
5. **Layout y Responsive (Media-Alta):** Mobile-first (360px, 768px, 1280px), grilla consistente y espaciado en escala de 4px/8px.
6. **Tipografia y Color (Media-Alta):** Maximo 2 familias tipograficas (sans legible para UI + mono para codigos/datos), cuerpo >= 16px en movil.
7. **Animacion y Microinteracciones (Media):** Transiciones <= 200 ms respetando `prefers-reduced-motion`.
8. **Formularios y Feedback (Media):** Validacion inline inmediata, mensajes de error accionables, manejo explicito de conflictos (ej. HTTP 409) sin perder datos ingresados.
9. **Navegacion (Media):** Flujos criticos en <= 3 pasos con indicadores de progreso claros.
10. **Visualizacion de Datos (Complementaria):** Tablas escaneables y graficos con etiquetas directas y soporte daltonismo.

## 3. Tokens Base Recomendados

- `--color-bg`: `#F8FAFC`
- `--color-surface`: `#FFFFFF`
- `--color-text`: `#0F172A`
- `--color-primary`: `#0F766E`
- `--color-accent`: `#1D4ED8`
- `--color-danger`: `#B91C1C`
- `--radius-md`: `8px`
- `--space-unit`: `4px`

## 4. Anti-Patrones Prohibidos (Pre-Delivery Gate)

- Botones sin estado de carga o susceptibles a doble envio en pagos/reservas.
- Texto gris claro sobre blanco con contraste inferior a 4.5:1.
- Modales sin trampa de foco ni cierre con tecla `Escape`.
- Almacenamiento de datos sensibles o clinicos en `localStorage` en texto plano.
- Uso de bloques genericos sin estados vacios (`empty state`) ni recuperacion de errores de red.
