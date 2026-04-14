# Civic Saathi - React Native Mobile App

A comprehensive React Native application for citizen complaint management and government worker coordination.

## Project Structure

```
mobile-app/
├── src/
│   ├── App.tsx                 # Main app component
│   ├── components/             # Reusable UI components
│   │   ├── common/            # Shared components (Button, Input, Card, etc.)
│   │   ├── citizen/           # Citizen-specific components
│   │   └── worker/            # Worker-specific components
│   ├── screens/               # Screen components
│   │   ├── auth/              # Authentication screens (Login, Signup)
│   │   ├── citizen/           # Citizen screens (Home, Complaints, Profile)
│   │   └── worker/            # Worker screens (TODO)
│   ├── navigation/            # Navigation configuration
│   ├── services/              # API and utility services
│   │   ├── api/               # API client & service modules
│   │   ├── storage/           # Local storage service
│   │   └── notification/      # Push notification service
│   ├── store/                 # Zustand state management
│   ├── hooks/                 # Custom React hooks
│   ├── context/               # React context (Auth)
│   ├── types/                 # TypeScript type definitions
│   ├── constants/             # App constants & configurations
│   └── utils/                 # Utility functions
├── assets/                    # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
├── package.json              # Dependencies
├── app.json                  # App configuration
├── tsconfig.json            # TypeScript configuration
├── babel.config.js          # Babel configuration
└── .env.example             # Environment variables template
```

## Key Features

### Architecture
- **Modular Design**: Clear separation of concerns with role-based navigation
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **State Management**: Zustand for lightweight, scalable state management
- **API Layer**: Centralized API client with automatic token management
- **Local Storage**: Secure persistence with AsyncStorage

### Authentication
- Email/Password login and signup
- JWT token management with refresh token support
- Automatic token refresh on 401 responses
- Secure credential storage

### Citizen Features
- **Dashboard**: Overview of complaint statistics
- **File Complaint**: Create complaints with location, category, priority
- **Track Complaints**: View all complaints with real-time status updates
- **Notifications**: Receive updates on complaint progress
- **Profile Management**: Manage personal information

### State Management Stores
- **AuthStore**: User authentication and profile
- **ComplaintStore**: Complaint data and selection
- **NotificationStore**: Notifications and unread count
- **UIStore**: Dark mode and loading states

### Services

#### API Service (`services/api/`)
- `client.ts`: Axios configured client with interceptors
- `authService.ts`: Authentication API calls
- `complaintService.ts`: Complaint CRUD operations
- `notificationService.ts`: Notification management

#### Storage Service (`services/storage/`)
- `storageService.ts`: AsyncStorage wrapper for data persistence

#### Notification Service (`services/notification/`)
- Push notification handling (TODO)

### Custom Hooks (`hooks/`)
- `useAsync`: Handle async operations with loading/error states
- `useIsAuthenticated`: Check authentication status
- `useCurrentUser`: Get current logged-in user
- `useUserRole`: Get user's role
- `useForm`: Handle form state and validation
- `useDebounce`: Debounce values
- `useLocalStorage`: Local storage management

### Utilities (`utils/`)
- Date formatting and time calculations
- Email/phone validation
- Complaint status color mapping
- Coordinate calculations (Haversine formula)
- Text truncation and formatting
- Complaint grouping and sorting

### Common Components
- **Button**: Primary, secondary, danger, ghost variants with sizes
- **Input**: Text input with label, error handling, icon support
- **Card**: Elevated container with customizable styling

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (via `npx expo`)
- Android Studio (for Android) or Xcode (for iOS)

### Setup Steps

```bash
# Install dependencies
npm install
# or
yarn install

# Setup environment
cp .env.example .env
# Edit .env with your API configuration

# Start development server
npm run start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Configuration

### Environment Variables (`.env`)
```
EXPO_PUBLIC_API_URL=http://YOUR_API_URL/api
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_LOG_LEVEL=debug
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
```

### API Endpoints
All endpoints are defined in `constants/index.ts`. Configure the base URL in environment variables.

## Development

### Adding New Screens
1. Create screen component in appropriate folder under `screens/`
2. Add route to navigation stack in `navigation/RootNavigator.tsx`
3. Import and use in navigation configuration

### Adding New API Services
1. Create new file in `services/api/`
2. Use `apiClient` for HTTP requests
3. Export service instance
4. Add endpoints to `constants/index.ts`

### Adding State
1. Create new Zustand store in `store/index.ts`
2. Export hook for component usage
3. Use in components with `const store = useStore()`

### Styling
- Use StyleSheet for performance
- Reference colors from `COLORS` constant
- Maintain consistent spacing and typography

## Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## Production Build

```bash
# Android APK
cd android && ./gradlew assembleRelease

# iOS IPA
cd ios && xcodebuild -workspace CivicSaathi.xcworkspace -scheme CivicSaathi -configuration Release
```

## State Flow

```
User Auth → Login/Signup → AuthStore → Navigation to Citizen Stack
                                            ↓
                        Dashboard (Stats, Quick Actions)
                                ↓
                    Complaints List ← → Individual Complaint
                                ↓
                        Create Complaint (Form)
                                ↓
                        Back to Dashboard
```

## TODO

- [ ] Worker dashboard and screens
- [ ] Location services integration
- [ ] Image upload functionality
- [ ] Push notifications implementation
- [ ] Offline support with sync
- [ ] Analytics module integration
- [ ] AI suggestions for complaint routing
- [ ] Real-time complaint status updates
- [ ] Profile editing
- [ ] Password change functionality
- [ ] Advanced filtering and search
- [ ] Complaint rating system improvements

## Performance Optimization

- Used FlatList with optimization props
- Memoized components for re-render prevention
- Debounced search and form inputs
- Lazy loading for screens
- AsyncStorage caching strategy

## Security

- JWT token management
- Secure credential storage with react-native-keychain
- HTTPS API communication
- Input validation and sanitization
- Role-based access control

## Troubleshooting

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### Dependency conflicts
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build issues
```bash
# Android
cd android && ./gradlew clean

# iOS
cd ios && rm -rf Pods && pod install
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Add comments for complex logic
4. Test changes before committing
5. Update documentation as needed

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, contact the development team or raise an issue in the repository.
