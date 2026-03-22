# WebApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.
In this mode, the **CommandHub** will load data from local files in `src/assets/json`.

## Building

### Local / Development Build (Uses Local Assets)
To build the project using local assets (located in `src/assets/json`), run:

```bash
ng build
```

This is the default configuration. The resulting bundle will fetch command data from your local server's `/assets/json` directory.

### Production Build (Uses GitHub Data)
To build the project for production, fetching data dynamically from the GitHub repository, run:

```bash
ng build --configuration production
```

In this mode:
- The `environment.ts` is replaced with `environment.prod.ts`.
- The data source for CommandHub is set to `https://raw.githubusercontent.com/justamitsaha/configurationServer/main/json`.
- The bundle is optimized for performance.

## Build Troubleshooting

If you encounter `HttpErrorResponse` (ECONNREFUSED) during the building process, it is likely due to Angular's **Prerendering** attempting to fetch data from local backends (like `localhost:8000`) that are not running. 

We have implemented `isPlatformBrowser` checks in the core services (`ApiService`, `RagService`, `CustomerRetentionService`) to prevent these calls during the build phase. This ensures a clean build even if your local backend services are offline.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```
