# NotarIA Digital - Frontend

Aplicación frontend para NotarIA Digital, construida con Angular 20+ y PrimeNG.

## Tecnologías

- **Framework**: Angular 20.3+ con componentes standalone
- **UI Library**: PrimeNG v20 con Tailwind CSS
- **State Management**: Angular Signals
- **Change Detection**: Zoneless (sin Zone.js)
- **Build Tool**: Angular CLI con Vite
- **Styling**: SCSS + Tailwind CSS
- **AI Integration**: Chrome Prompt API (para asesor legal)

## Requisitos Previos

- Node.js 18+ o superior
- npm 9+ o superior
- Angular CLI 20+ (`npm install -g @angular/cli`)

## Instalación

```bash
# Instalar dependencias
npm install
```

## Configuración

### Variables de Entorno

Editar `src/environments/environment.ts` para desarrollo:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1'
};
```

Para producción, editar `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-api-produccion.com/api/v1'
};
```

## Comandos Disponibles

### Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 4200)
npm start
# o
ng serve

# Iniciar con puerto personalizado
ng serve --port 4300

# Abrir automáticamente en el navegador
ng serve --open
```

### Build

```bash
# Build de desarrollo
ng build

# Build de producción
ng build --configuration production

# Los archivos compilados estarán en dist/frontend/browser/
```

### Testing

```bash
# Ejecutar tests unitarios
ng test

# Ejecutar tests con coverage
ng test --code-coverage
```

### Linting

```bash
# Verificar código
ng lint
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Servicios y utilidades core
│   │   │   ├── guards/             # Guards de autenticación
│   │   │   ├── interceptors/       # HTTP interceptors
│   │   │   ├── models/             # Interfaces TypeScript
│   │   │   └── services/           # Servicios (API, Auth, Storage)
│   │   ├── features/               # Componentes por feature
│   │   │   ├── landing/            # Página de inicio
│   │   │   ├── auth/               # Login y registro
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/          # Dashboard principal
│   │   │   ├── documents/          # Gestión de documentos
│   │   │   ├── services/           # Catálogo de servicios
│   │   │   ├── chat/               # Asesor legal IA
│   │   │   └── profile/            # Perfil de usuario
│   │   ├── shared/                 # Componentes compartidos
│   │   │   ├── components/
│   │   │   ├── directives/
│   │   │   └── pipes/
│   │   ├── app.config.ts           # Configuración de la app
│   │   ├── app.routes.ts           # Definición de rutas
│   │   ├── app.ts                  # Componente raíz
│   │   ├── app.html                # Template raíz
│   │   └── app.scss                # Estilos raíz
│   ├── environments/               # Configuración de entornos
│   │   ├── environment.ts          # Desarrollo
│   │   └── environment.prod.ts     # Producción
│   ├── styles.scss                 # Estilos globales
│   ├── index.html                  # HTML principal
│   └── main.ts                     # Entry point
├── public/                         # Assets estáticos
├── angular.json                    # Configuración de Angular CLI
├── tailwind.config.js              # Configuración de Tailwind
├── tsconfig.json                   # Configuración de TypeScript
└── package.json                    # Dependencias
```

## Principios de Arquitectura

### SOLID

- **Single Responsibility**: Cada carpeta tiene una responsabilidad única
  - `/core/services`: Solo servicios de comunicación con API
  - `/core/guards`: Solo protección de rutas
  - `/features/{feature}`: Solo componentes de esa funcionalidad

- **Open/Closed**: Estructura extensible
  - Componentes standalone (fácilmente reemplazables)
  - Configuración centralizada en `app.config.ts`

- **Dependency Inversion**:
  - Servicios inyectan HttpClient (abstracción)
  - Componentes dependen de interfaces de servicios

### Convenciones

1. **Componentes**: Standalone (no NgModules)
2. **Lazy Loading**: Todas las rutas usan lazy loading
3. **Signals**: Para estado reactivo
4. **Functional Guards/Interceptors**: En lugar de clases
5. **SCSS**: Para todos los estilos (no CSS)
6. **Nomenclatura**: kebab-case para archivos (login.component.ts)

## Rutas de la Aplicación

| Ruta | Componente | Protegida | Descripción |
|------|-----------|-----------|-------------|
| `/` | LandingComponent | No | Página de inicio pública |
| `/auth/login` | LoginComponent | No | Inicio de sesión |
| `/auth/register` | RegisterComponent | No | Registro de usuario |
| `/dashboard` | DashboardComponent | Sí | Dashboard principal |
| `/documents` | DocumentsComponent | Sí | Gestión de documentos |
| `/services` | ServicesComponent | Sí | Catálogo de servicios |
| `/chat` | ChatComponent | Sí | Asesor legal IA |
| `/profile` | ProfileComponent | Sí | Perfil de usuario |

## Servicios Core

### AuthService
- `login(credentials)`: Iniciar sesión
- `register(userData)`: Registrar usuario
- `logout()`: Cerrar sesión
- `getToken()`: Obtener token JWT
- `isAuthenticated()`: Signal de estado de autenticación

### ApiService
- `get<T>(endpoint, params?)`: Petición GET
- `post<T>(endpoint, body)`: Petición POST
- `put<T>(endpoint, body)`: Petición PUT
- `delete<T>(endpoint)`: Petición DELETE

### StorageService
- `setItem(key, value)`: Guardar en localStorage
- `getItem<T>(key)`: Leer de localStorage
- `removeItem(key)`: Eliminar de localStorage
- `clear()`: Limpiar localStorage

## Integración con Backend

La aplicación está configurada para comunicarse con el backend FastAPI en:
- **Desarrollo**: `http://localhost:8000/api/v1`
- **Producción**: Configurar en `environment.prod.ts`

Todas las peticiones incluyen automáticamente el token JWT en el header `Authorization` gracias al interceptor `authInterceptor`.

## PrimeNG y Tailwind

### Componentes PrimeNG Disponibles
- Button
- Card
- InputText
- DataTable
- Dialog
- Toast
- Dropdown
- Y más: https://primeng.org/

### Clases de Tailwind Personalizadas
- `text-primary`: Color azul profesional (#1e40af)
- `bg-secondary`: Fondo gris claro (#f3f4f6)
- `text-accent`: Color verde confianza (#10b981)
- `text-text`: Color de texto principal (#1f2937)

## Próximos Pasos

1. Implementar lógica de negocio en los componentes stub
2. Conectar formularios de login/registro con AuthService
3. Implementar CRUD completo de documentos
4. Integrar Chrome Prompt API en el componente de chat
5. Agregar validaciones de formularios con Reactive Forms
6. Implementar manejo de errores global
7. Agregar notificaciones con PrimeNG Toast

## Problemas Conocidos

- Chrome Prompt API requiere Chrome con capacidades de IA habilitadas
- El componente de chat mostrará un mensaje de fallback si no está disponible

## Soporte

Para más información sobre las tecnologías utilizadas:
- [Angular Documentation](https://angular.dev/)
- [PrimeNG Documentation](https://primeng.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Chrome Prompt API](https://developer.chrome.com/docs/extensions/ai/prompt-api)

---

**NotarIA Digital** - Legalidad al alcance de todos
