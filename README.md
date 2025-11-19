# CP Dash AI - Mobile Application

A React Native mobile application for candidate and recruiter dashboard management, powered by AI-driven features for career development and talent acquisition.

## Overview

CP Dash AI is a dual-role mobile application that serves both job candidates and recruiters with AI-enhanced features for profile management, resume parsing, and career development.

### Key Features

- **Dual Role System**: Separate dashboards for candidates and recruiters
- **AI-Powered Resume Parsing**: Automatic extraction of skills, experience, and education from uploaded resumes
- **Profile Management**: Comprehensive profile editing with education, experience, skills, and hobbies
- **Secure Authentication**: JWT-based authentication with token refresh
- **Cross-Platform**: iOS and Android support with single codebase

## Technology Stack

### Core Framework
- **Expo SDK**: 54.0.23
- **React**: 19.1.0
- **React Native**: 0.81.5
- **TypeScript**: 5.9.2

### State Management
- **Redux Toolkit**: 2.10.1
- **Redux Persist**: 6.0.0
- **RTK Query**: Built-in with Redux Toolkit

### UI & Styling
- **NativeWind**: 2.0.11 (TailwindCSS for React Native)
- **Tailwind CSS**: 3.3.2
- **React Native SVG**: 15.15.0
- **Expo Linear Gradient**: 15.0.7
- **Expo Blur**: 15.0.7

### Forms & Validation
- **React Hook Form**: 7.66.0
- **Zod**: 3.25.76

### Storage & Security
- **Expo SecureStore**: 15.0.7 (JWT token storage)
- **AsyncStorage**: 2.2.0 (App state persistence)

### File Handling
- **Expo Document Picker**: 14.0.7
- **Expo File System**: 19.0.17

### API Communication
- **GraphQL**: 16.12.0
- **Backend**: Python/Strawberry GraphQL API

## Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Expo CLI**: Latest version
- **EAS CLI**: 14.0.0 or higher (for building)
- **iOS**: macOS with Xcode (for iOS development)
- **Android**: Android Studio (for Android development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cp-dashAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_URL=http://your-api-url:8000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

### Project Structure

```
cp-dashAI/
├── assets/              # Images, icons, and static assets
├── components/          # Reusable UI components
│   ├── layouts/         # Layout components
│   ├── profile/         # Profile-specific components
│   └── ui/              # Generic UI components
├── screens/             # Application screens
│   ├── auth/            # Authentication screens
│   ├── candidate/       # Candidate-specific screens
│   └── recruiter/       # Recruiter-specific screens
├── services/            # API services (RTK Query)
├── store/               # Redux store configuration
│   └── slices/          # Redux slices
├── utils/               # Utility functions
├── App.tsx              # Main app component
├── index.ts             # App entry point
└── app.json             # Expo configuration
```

## Building for Production

### Using EAS Build

1. **Login to Expo**
   ```bash
   eas login
   ```

2. **Configure project**
   ```bash
   eas build:configure
   ```

3. **Build for Android (APK)**
   ```bash
   eas build --platform android --profile preview
   ```

4. **Build for iOS**
   ```bash
   eas build --platform ios --profile preview
   ```

### Build Profiles

- **development**: Debug build with dev tools
- **preview**: Optimized build for internal testing
- **production**: Production-ready build for app stores

## App Configuration

### Android
- **Package**: `com.chawlasolutions.cpdashai`
- **Version Code**: 1

### iOS
- **Bundle Identifier**: `com.chawlasolutions.cpdashai`
- **Build Number**: 1.0.0

### App Version
- **Current Version**: 1.0.0

## API Integration

The app communicates with a GraphQL backend API for:
- User authentication (login, register, token refresh)
- Candidate profile management
- Education and experience CRUD operations
- Skills and hobbies management
- Resume upload and AI parsing

## License

Copyright © 2025 Chawla Solutions. All rights reserved.

## Support

For issues or questions, please contact the development team.
