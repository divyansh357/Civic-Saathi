/**
 * Architecture Overview - Mobile App
 * 
 * This document outlines the architecture of the Civic Saathi React Native mobile app.
 */

## Layer Architecture

### 1. Presentation Layer (UI)
- **Components** (`src/components/`)
  - Common reusable components (Button, Input, Card, etc.)
  - Role-specific components (Citizen, Worker)
  - Composed into screens

- **Screens** (`src/screens/`)
  - Auth screens: Login, Signup
  - Citizen screens: Home, Complaints, CreateComplaint, Notifications, Profile
  - Worker screens: (TODO)
  - Navigation between screens

### 2. Navigation Layer
- **RootNavigator** (`src/navigation/RootNavigator.tsx`)
  - Handles auth vs app navigation
  - Tab-based navigation for citizen
  - Stack-based navigation for workflows

### 3. State Management Layer
- **Zustand Stores** (`src/store/index.ts`)
  - `useAuthStore`: User authentication, profile, login/logout
  - `useComplaintStore`: Complaints CRUD, selection
  - `useNotificationStore`: Notifications, unread count
  - `useUIStore`: Theme, loading states
  - Lightweight, no boilerplate

### 4. Context Layer
- **AuthContext** (`src/context/AuthContext.tsx`)
  - Provides login/signup/logout functions
  - Wraps entire app
  - Integrates with AuthService

### 5. Services Layer
- **API Services** (`src/services/api/`)
  - `client.ts`: Axios configuration, interceptors, token management
  - `authService.ts`: Authentication API calls
  - `complaintService.ts`: Complaint CRUD operations
  - `notificationService.ts`: Notification management
  
- **Storage Service** (`src/services/storage/`)
  - `storageService.ts`: AsyncStorage wrapper for persistence
  - Handles user data, tokens, preferences
  
- **Notification Service** (`src/services/notification/`)
  - Push notification handling (TODO)

### 6. Types Layer
- **TypeScript Definitions** (`src/types/index.ts`)
  - User, AuthResponse, AuthToken
  - Complaint, ComplaintStatus, CreateComplaintRequest
  - Department, Worker, Notification
  - ApiResponse, PaginatedResponse, AppError

### 7. Constants & Utilities
- **Constants** (`src/constants/index.ts`)
  - API configuration
  - Endpoints mapping
  - Storage keys
  - UI constants (colors, statuses, priorities)
  
- **Utilities** (`src/utils/index.ts`)
  - Date formatting and calculations
  - Validation functions
  - Geolocation utilities
  - Data transformation and sorting

### 8. Custom Hooks
- **Hooks** (`src/hooks/index.ts`)
  - `useAsync`: Async operation handling
  - `useIsAuthenticated`: Auth check
  - `useCurrentUser`: Get user
  - `useUserRole`: Get user role
  - `useForm`: Form state management
  - `useDebounce`: Debounce values
  - `useLocalStorage`: Local storage

## Data Flow

### Authentication Flow
```
User Input (Email/Password)
    ↓
LoginScreen / SignupScreen
    ↓
useAuth() hook (AuthContext)
    ↓
AuthService (API Call)
    ↓
Store tokens + user in:
  - AsyncStorage (persistent)
  - useAuthStore (state)
    ↓
Navigation to Citizen Stack
```

### Complaint Creation Flow
```
CreateComplaintScreen (Form Input)
    ↓
useForm() hook (validation)
    ↓
ComplaintService.createComplaint()
    ↓
API Client (Token injected)
    ↓
Backend API
    ↓
Response → useComplaintStore.addComplaint()
    ↓
Navigate to ComplaintsScreen (Updated List)
```

### State Sync Flow
```
AsyncStorage (Persistent)
    ↓
On App Start: useAuthStore.hydrateUser()
    ↓
Load user from storage
    ↓
Populate AuthStore
    ↓
Navigation updates based on isAuthenticated
```

## Key Design Decisions

### 1. State Management
- **Choice**: Zustand (not Redux/Context API)
- **Reason**: 
  - Minimal boilerplate
  - Fast performance
  - Easy to test
  - Separate stores for concerns

### 2. API Layer Abstraction
- Single `ApiClient` with interceptors
- Automatic token injection
- Centralized error handling
- Service-specific wrappers for each module

### 3. Type Safety
- Full TypeScript coverage
- No `any` types
- Interfaces for API responses
- Enum for statuses

### 4. Storage Strategy
- AsyncStorage for offline data
- Zustand for runtime state
- Session storage for temporary data
- Token refresh on 401

### 5. Navigation
- Stack navigators for auth
- Tab navigator for citizen features
- Clear separation of concerns
- Animated transitions

## Component Composition Pattern

```
Screen
  ├── useCurrentUser() hook
  ├── useAsync() for data loading
  ├── useForm() for input handling
  │
  └── Card component (Container)
      ├── Button component (Action)
      ├── Input component (Form field)
      └── Text component (Display)
```

## Error Handling Strategy

1. Network Errors → `ApiClient.handleError()`
2. API Errors → `AppError` type
3. Validation Errors → `useForm()` error state
4. User Feedback → Alert/Toast notifications
5. Logging → Console in dev, crash reporting in prod

## Performance Optimizations

- FlatList with optimization props
- Memoization for expensive computations
- Lazy loading for screens
- Image optimization
- Debounced searches
- Connection pooling via Axios

## Security Implementation

- JWT token management
- Token refresh on expiry
- Automatic logout on 401
- Secure storage with keychain
- Input sanitization
- HTTPS enforced

## Testing Strategy

- Unit tests for utilities
- Integration tests for services
- Component tests for UI
- E2E tests for critical flows
- Mock ApiClient for testing

## Scalability Considerations

- Modular service architecture
- Store-based state scales easily
- Component composition patterns
- Hook-based logic reuse
- Clear separation of concerns

## Future Enhancements

1. **Offline Support**
   - Redux-persist or local caching
   - Sync mechanism on reconnect

2. **Real-time Updates**
   - WebSocket integration
   - Push notifications

3. **Analytics**
   - Event tracking
   - User behavior analysis

4. **Internationalization**
   - i18n library
   - Language switching

5. **Accessibility**
   - WCAG compliance
   - Screen reader support

6. **Performance**
   - Code splitting
   - Image optimization
   - Bundle size reduction
