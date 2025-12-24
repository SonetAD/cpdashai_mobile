# CP Dash AI

A React Native mobile application for career development and talent acquisition, powered by AI-driven features.

## About

CP Dash AI is a dual-role mobile application that serves both job candidates and recruiters. Candidates can manage their profiles, upload resumes with AI-powered parsing, and explore career opportunities. Recruiters can discover talent and manage their recruitment pipeline efficiently.

### Key Features

- **Dual Role System**: Separate dashboards for candidates and recruiters
- **AI-Powered Resume Parsing**: Automatic extraction of skills, experience, and education
- **Profile Management**: Comprehensive profile editing capabilities
- **Google Authentication**: Secure OAuth-based login
- **Cross-Platform**: iOS and Android support

## Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **EAS CLI**: 14.0.0 or higher (for building)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CP-DASH-APP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example configuration and add your values:
   ```bash
   cp eas.example.json eas.json
   ```

   Edit `eas.json` and replace placeholder values with your actual configuration.

4. **Start the development server**
   ```bash
   npm start
   ```

## Running the App

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator

## Building for Production

Build a local production APK:
```bash
npx eas build --profile production --local
```

The APK will be generated in your project directory.

## License

Copyright © 2025 Chawla Solutions. All rights reserved.
