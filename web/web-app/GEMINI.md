# Gemini CLI Mandates - WebApp

This project is a modern Angular 20 application focused on AI-driven Customer Retention and RAG (Retrieval-Augmented Generation). All development must strictly adhere to the following architectural and coding standards.

## 🏗️ Architectural Principles

- **Zoneless Change Detection:** `zone.js` is disabled. Always use `provideZonelessChangeDetection()` in `app.config.ts`.
- **Signals-First Reactivity:** Use Angular Signals (`signal()`, `computed()`, `effect()`, `input()`) for all local and shared state. Avoid `BehaviorSubject` or manual change detection.
- **Standalone Architecture:** Every component, directive, and pipe must use `standalone: true`. Do not use `NgModules`.

## 💻 Coding Standards

### 1. Naming Conventions
- **Concise Class Names:** Use short, descriptive names without redundant suffixes (e.g., `CsvUpload` instead of `CsvUploadComponent`).
- **File Extensions:** Use `.ts`, `.html`, and `.scss` extensions.
- **Template URLs:** Prefer `templateUrl` and `styleUrl` (singular) in component metadata.

### 2. Template Syntax (Control Flow)
- Always use the new `@if`, `@else`, `@for`, and `@switch` block syntax.
- **NEVER** use `*ngIf`, `*ngFor`, or `[ngSwitch]`.
- For `[ngModel]` two-way binding with signals, use the pattern:
  ```html
  <input [ngModel]="mySignal()" (ngModelChange)="mySignal.set($event)">
  ```

### 3. Styling
- **Bootstrap 5:** Use standard Bootstrap utility classes for layout and basic styling.
- **Vanilla CSS/SCSS:** Prefer standard CSS/SCSS for custom styling; avoid utility-first frameworks like Tailwind unless explicitly requested.

### 4. Component Structure
- Define reusable UI primitives (Cards, Lists) in `src/app/components/common/`.
- Use `inject()` for dependency injection instead of constructor-based injection for cleaner class definitions.

## 📂 Directory Structure

- `src/app/components/`: Feature-specific components.
- `src/app/components/common/`: Shared, reusable UI components.
- `src/app/services/`: Core logic and API integration.
- `src/app/pipes/`: Standalone pipes.
- `src/app/app.routes.ts`: Central routing configuration.

## 🧪 Testing & Validation
- Ensure all new features or refactors are verified with `npm run build` or `npx ng build`.
- Maintain technical integrity by validating that async operations correctly trigger Signal updates to reflect changes in the UI.
