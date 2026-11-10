# Reglas de Arquitectura - Teacher Fabian (Fase 1)

## 1. Separación Estricta en 3 Archivos
- Todo componente DEBE dividirse estrictamente en 3 archivos independientes:
  - Lógica: `[nombre].component.ts`
  - Plantilla: `[nombre].component.html` (referenciado vía `templateUrl`)
  - Estilos: `[nombre].component.css` (referenciado vía `styleUrl`)
- Queda terminantemente **prohibido** el uso de `template` o `styles` inline dentro del decorador `@Component`.

## 2. Angular Moderno
- **Standalone:** Todos los componentes, directivas y pipes deben ser `standalone: true`.
- **Detección de Cambios:** Usar obligatoriamente `changeDetection: ChangeDetectionStrategy.OnPush` en todos los componentes.
- **Inyección de Dependencias:** Usar la función `inject()` en lugar de inyección tradicional en constructor.
- **Reactividad:** Utilizar Angular Signals (`signal()`, `computed()`, `input()`, `output()`) para la gestión reactiva del estado local.
- **Control Flow:** Utilizar exclusivamente la sintaxis nativa de control de flujo de Angular (`@if`, `@for` con `track`, `@switch`). Prohibido usar `*ngIf` o `*ngFor`.
- **Formularios Reactivos y Tipado:** Usar `ReactiveFormsModule` con `NonNullableFormBuilder` o tipado estricto. Prohibido el uso de `any`; todos los modelos, datos y formularios deben contar con interfaces o tipos estrictos.

## 3. Estilos y Tokens de Diseño
- **Tailwind CSS:** Utilizar clases utilitarias de Tailwind configuradas con los tokens del frame `Teacher Fabian - Design System`.
  - Colores:
    - `primary`: `#244B7A`
    - `primary-container` (Mist Blue): `#D5E3F7`
    - `accent`: `#3F7CC8`
    - `surface`: `#FFFFFF`
    - `surface-container`: `#EEF2F8`
    - `outline`: `#6A7180`
    - `success`: `#1E6B43`
    - `error`: `#BA1A1A`
  - Tipografías:
    - Display / Headings: `Plus Jakarta Sans`
    - Cuerpo de texto / Formularios / Botones: `Inter`
- **Iconografía:** Uso exclusivo de Hugeicons (`@hugeicons/angular` o componentes basados en SVG Hugeicons) sin mezclar otras librerías como FontAwesome o Material Icons.

## 4. Enfoque de Diseño Mobile-First
- Diseño concebido desde `320px - 480px` (viewport móvil estándar) con escalado suave a desktop (`sm:`, `md:`, `lg:`).
- Centrado limpio de la interfaz móvil en contenedores máximos (`max-w-[430px]` o contenedor responsivo centrado con `mx-auto`) para garantizar coherencia visual idéntica a los mockups de diseño de Stitch.
- Ergonomía táctil: áreas interactivas mínimas de 44x44px en móviles y retroalimentación activa de pulsación (`active:scale-[0.99]`).
