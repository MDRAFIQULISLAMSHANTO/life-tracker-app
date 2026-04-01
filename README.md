<<<<<<< HEAD
# Livio - Personal Life & Money Management System

A production-ready SaaS dashboard for personal finance management, built with Next.js, Firebase Authentication, and Tailwind CSS.

## 🚀 Features

- **Complete Authentication System**:

  - Email + Password login
  - Google Sign-In
  - Phone Number + OTP authentication
  - Protected routes
  - Secure session management

- **Clean & Modern UI**: Minimal, professional design focused on clarity
- **Responsive Design**: Mobile-first approach, works seamlessly on all devices
- **Comprehensive Dashboard**:
  - Financial summary cards (Balance, Income, Expense, Savings)
  - Interactive charts (Expense breakdown, Daily trends)
  - Budget tracking with progress indicators
  - Today panel (Events, Reminders, Notes)
  - Recent activity timeline
- **Quick Actions**: Floating action button for quick transaction entry
- **Modular Architecture**: Ready for React Native conversion and backend integration

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18 (Functional Components)
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Next.js built-in bundler

## 📦 Installation
```bash
# Prerequisite:
# - Install Node.js >= 18.17.0 (Next.js 14 requirement)

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Firebase credentials

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication methods:
   - Email/Password
   - Google Sign-In
   - Phone Authentication
3. Get your Firebase config from Project Settings
4. Add credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## 🏗️ Project Structure

```
src/
 ├─ app/
 │   ├─ layout.jsx          # Root layout with AuthProvider
 │   ├─ page.jsx            # Root page (redirects based on auth)
 │   ├─ login/
 │   │   └─ page.jsx        # Login page
 │   ├─ signup/
 │   │   └─ page.jsx        # Signup page
 │   ├─ dashboard/
 │   │   ├─ layout.jsx      # Dashboard layout (Sidebar + TopBar)
 │   │   └─ page.jsx        # Dashboard page (protected)
 │   └─ globals.css         # Global styles & Tailwind imports
 ├─ components/
 │   ├─ auth/               # Authentication components
 │   │   ├─ LoginForm.jsx
 │   │   ├─ SignupForm.jsx
 │   │   ├─ GoogleLoginButton.jsx
 │   │   ├─ PhoneLogin.jsx
 │   │   └─ AuthLayout.jsx
 │   ├─ common/             # Reusable common components
 │   ├─ dashboard/          # Dashboard-specific components
 │   ├─ charts/             # Chart components
 │   ├─ layout/             # Layout components (Sidebar, TopBar)
 │   └─ modals/             # Modal components
 ├─ context/
 │   └─ AuthContext.jsx     # Authentication context
 ├─ lib/
 │   └─ firebase.js         # Firebase configuration
 └─ utils/
     ├─ formatters.js       # UI-agnostic formatting utilities
     └─ constants.js        # Application constants
```

## 🎨 Design System

### Colors

- **Primary**: `#4F46E5` (Indigo)
- **Background**: `#F9FAFB` (Light Gray)
- **Card Background**: `#FFFFFF` (White)
- **Text Primary**: `#111827` (Dark Gray)
- **Text Secondary**: `#6B7280` (Medium Gray)
- **Success**: `#16A34A` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Danger**: `#DC2626` (Red)

### Typography

- System font stack for optimal performance
- Clear hierarchy with semantic sizing

## 📱 Responsive Breakpoints

- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (640px+)
- **Desktop**: `lg:` (1024px+)
- **Large Desktop**: `xl:` (1280px+)

## 🔒 Authentication Routes

- `/login` - Login page (redirects to dashboard if authenticated)
- `/signup` - Signup page (redirects to dashboard if authenticated)
- `/dashboard` - Protected dashboard (redirects to login if not authenticated)

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Hosting Platforms

1. Build the project:

   ```bash
   npm run build
   ```

2. Start the production server:

   ```bash
   npm start
   ```

3. The production build is optimized and ready for hosting

## 🔮 Future Enhancements

- Firestore integration for data persistence
- Admin dashboard
- Multi-currency support
- AI-powered insights
- React Native mobile app
- Paid subscription plans
- Real-time data sync

## 📝 Development Guidelines

### Component Guidelines

- Use functional components only
- Mark components with `'use client'` when they use hooks, state, or browser APIs
- Keep components stateless when possible
- Props-driven components for reusability
- No business logic in UI components
- Prepare for React Native conversion

### Code Style

- Use ES6+ features
- Follow React best practices
- Maintain consistent naming conventions
- Keep components focused and small

## 🔐 Security Notes

- Firebase handles session management securely
- No sensitive data stored in localStorage
- Protected routes redirect unauthenticated users
- Environment variables for Firebase config

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For support and questions, please contact the development team.

---

Built with ❤️ for better financial management
=======
# life-tracker-app
>>>>>>> d97abce32411b72ab8300129d016a61249113eb4
