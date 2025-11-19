# CLAUDE.md - AI Assistant Guide

> **Last Updated**: November 19, 2025
> **Project**: React Native Expo Application
> **Framework**: Expo SDK 54 with React Native 0.81.5

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Key Conventions](#key-conventions)
6. [Common Tasks](#common-tasks)
7. [Configuration Files](#configuration-files)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

This is a cross-platform mobile application built with **Expo** and **React Native**, targeting iOS, Android, and Web platforms. The project uses modern React patterns with TypeScript and integrates NativeWind for Tailwind CSS-based styling in React Native.

### Key Features

- **Expo Router**: File-based routing system (v6.0.14)
- **TypeScript**: Strict mode enabled for type safety
- **NativeWind v4**: Tailwind CSS utilities for React Native
- **React 19.1.0**: Latest React with concurrent features
- **New Architecture**: Expo's new architecture enabled
- **Experimental Features**: Typed routes and React Compiler enabled

---

## Technology Stack

### Core Dependencies

```json
{
  "expo": "~54.0.23",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "expo-router": "~6.0.14",
  "nativewind": "^4.2.1",
  "tailwindcss": "^3.4.18"
}
```

### Navigation & UI

- **Expo Router**: File-based routing with Stack navigation
- **React Navigation**: Bottom tabs, native stack, and navigation elements
- **Expo Icons**: Vector icons (@expo/vector-icons)
- **Expo Image**: Optimized image component

### Development Tools

- **TypeScript** (~5.9.2): Static typing with strict mode
- **ESLint** (^9.25.0): Code linting with expo config
- **Metro**: React Native bundler

### Platform Support

- **iOS**: Supports tablets, automatic UI style
- **Android**: Edge-to-edge enabled, adaptive icons
- **Web**: Static output with favicon support

---

## Project Structure

```
reactnativeclaude/
├── app/                      # Application screens (Expo Router)
│   ├── _layout.tsx          # Root layout with Stack navigator
│   ├── index.tsx            # Home screen
│   └── globals.css          # Global Tailwind CSS styles
├── assets/                   # Static assets
│   └── images/              # Image assets (icons, splash screens)
├── .vscode/                 # VSCode configuration
├── app.json                 # Expo configuration
├── babel.config.js          # Babel configuration
├── eslint.config.js         # ESLint configuration
├── metro.config.js          # Metro bundler configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── nativewind-env.d.ts      # NativeWind type definitions
├── package.json             # Dependencies and scripts
└── .gitignore              # Git ignore patterns
```

### Directory Conventions

#### `app/` Directory

The `app/` directory uses **Expo Router's file-based routing**:

- `_layout.tsx`: Defines the navigation structure (Stack, Tabs, etc.)
- `index.tsx`: The entry point/home screen
- File names become routes (e.g., `about.tsx` → `/about`)
- Folder structure creates nested routes
- Use `(folder)` for route groups without adding to the URL

#### `assets/` Directory

- `images/`: Icons, splash screens, and other image assets
  - `icon.png`: App icon
  - `splash-icon.png`: Splash screen icon
  - `favicon.png`: Web favicon
  - Android adaptive icons (foreground, background, monochrome)

---

## Development Workflow

### Initial Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npx expo start
```

### Platform-Specific Development

```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `expo start` | Start development server |
| `android` | `expo start --android` | Start and open Android |
| `ios` | `expo start --ios` | Start and open iOS |
| `web` | `expo start --web` | Start and open web |
| `lint` | `expo lint` | Run ESLint |
| `reset-project` | `node ./scripts/reset-project.js` | Reset to blank project |

### Development Server

When running `npm start`, you'll get options to:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web browser
- Scan QR code with Expo Go app for physical device testing

---

## Key Conventions

### TypeScript Configuration

**Location**: `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,          // Strict type checking enabled
    "paths": {
      "@/*": ["./*"]        // Path alias for imports
    }
  }
}
```

**Conventions**:
- ✅ **DO**: Use strict TypeScript mode
- ✅ **DO**: Use `@/` alias for absolute imports (e.g., `@/app/index`)
- ✅ **DO**: Define proper types for props and state
- ❌ **DON'T**: Use `any` type unless absolutely necessary

### Styling with NativeWind

**Location**: `tailwind.config.js`, `app/globals.css`

```tsx
// Example: Using Tailwind classes with className
<Text className="text-yellow-500">Hello World</Text>
```

**Conventions**:
- ✅ **DO**: Use `className` prop for Tailwind utilities
- ✅ **DO**: Import `globals.css` in `_layout.tsx`
- ✅ **DO**: Define custom Tailwind classes in `tailwind.config.js`
- ⚠️ **NOTE**: NativeWind v4 uses a different API than v3
- ❌ **DON'NOT**: Mix inline `style` props heavily with `className` unnecessarily

### File Naming

- **Components**: PascalCase for component files (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase for utility files (e.g., `formatDate.ts`)
- **Routes**: lowercase or kebab-case for route files in `app/` (e.g., `index.tsx`, `user-profile.tsx`)
- **Types**: Use `.d.ts` for type definition files

### Component Structure

```tsx
// Recommended component structure
import { View, Text } from "react-native";

interface Props {
  title: string;
  onPress?: () => void;
}

export default function MyComponent({ title, onPress }: Props) {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-lg">{title}</Text>
    </View>
  );
}
```

### Routing Conventions

**File-based routing** with Expo Router:

```tsx
// app/_layout.tsx - Root layout
import { Stack } from "expo-router";
import "./globals.css";

export default function RootLayout() {
  return <Stack />;
}
```

**Conventions**:
- Use `<Stack />` for stack navigation
- Use `<Tabs />` for tab navigation
- Use `(folder)` for route groups
- Use `[param]` for dynamic routes

---

## Common Tasks

### Adding a New Screen

1. Create a new file in `app/` directory:

```tsx
// app/about.tsx
import { View, Text } from "react-native";

export default function About() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text>About Screen</Text>
    </View>
  );
}
```

2. Navigate to it using `expo-router`:

```tsx
import { Link } from "expo-router";

<Link href="/about">Go to About</Link>
```

### Adding a New Component

1. Create component file (consider creating `components/` directory):

```tsx
// components/Button.tsx
import { Pressable, Text } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export default function Button({ title, onPress }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-blue-500 px-4 py-2 rounded"
    >
      <Text className="text-white">{title}</Text>
    </Pressable>
  );
}
```

2. Import and use:

```tsx
import Button from "@/components/Button";

<Button title="Click me" onPress={() => console.log("Clicked")} />
```

### Adding Dependencies

```bash
# For Expo-compatible packages
npx expo install package-name

# For regular npm packages
npm install package-name
```

**Note**: Use `npx expo install` for packages that need native code to ensure version compatibility.

### Customizing Tailwind

Edit `tailwind.config.js`:

```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#007AFF",
        secondary: "#5856D6",
      },
    },
  },
  plugins: [],
}
```

### Working with Navigation

```tsx
import { useRouter } from "expo-router";

export default function Screen() {
  const router = useRouter();

  return (
    <Button
      title="Go Back"
      onPress={() => router.back()}
    />
  );
}
```

---

## Configuration Files

### `app.json` - Expo Configuration

**Key settings**:
- `newArchEnabled: true` - Enables Expo's new architecture
- `experiments.typedRoutes: true` - Type-safe routing
- `experiments.reactCompiler: true` - React Compiler enabled
- `userInterfaceStyle: "automatic"` - Supports dark mode

### `metro.config.js` - Metro Bundler

Configures how JavaScript is bundled for React Native.

### `babel.config.js` - Babel Configuration

Transpiles modern JavaScript/TypeScript for React Native.

### `.gitignore`

Ignores:
- `node_modules/`
- `.expo/`
- Generated native folders (`/ios`, `/android`)
- `app-example/` (from reset-project script)

---

## Best Practices

### For AI Assistants

1. **Always check existing code patterns** before creating new components
2. **Use TypeScript strictly** - define interfaces for all props
3. **Follow Expo Router conventions** for file-based routing
4. **Use NativeWind className** instead of inline styles where possible
5. **Import from react-native** not from platform-specific libraries
6. **Test on multiple platforms** when making UI changes
7. **Keep components small and focused** - single responsibility
8. **Use Expo packages** (`npx expo install`) for better compatibility

### Code Style

```tsx
// ✅ GOOD: Type-safe, clear, uses NativeWind
interface UserCardProps {
  name: string;
  age: number;
}

export default function UserCard({ name, age }: UserCardProps) {
  return (
    <View className="p-4 bg-white rounded-lg shadow">
      <Text className="text-xl font-bold">{name}</Text>
      <Text className="text-gray-600">{age} years old</Text>
    </View>
  );
}

// ❌ BAD: No types, mixed styling approaches
export default function UserCard(props) {
  return (
    <View style={{ padding: 16, backgroundColor: "white" }}>
      <Text className="text-xl">{props.name}</Text>
      <Text>{props.age}</Text>
    </View>
  );
}
```

### Performance

- Use `React.memo()` for expensive components
- Use `useMemo()` and `useCallback()` appropriately
- Optimize images with `expo-image` component
- Use `FlatList` for long lists instead of `ScrollView` with `.map()`

### State Management

- Start with React `useState` and `useContext`
- Consider Zustand or Redux for complex state
- Use React Query for server state

### Testing Strategy

1. Install testing dependencies:
```bash
npm install --save-dev jest @testing-library/react-native
```

2. Write unit tests for utilities and hooks
3. Write integration tests for screens
4. Use Expo's built-in testing tools

---

## Troubleshooting

### Common Issues

#### Metro Bundler Issues

```bash
# Clear cache and restart
npx expo start -c
```

#### TypeScript Errors

```bash
# Regenerate types
npx expo customize tsconfig.json
```

#### NativeWind Not Working

1. Check `globals.css` is imported in `_layout.tsx`
2. Verify `tailwind.config.js` content paths include your files
3. Restart Metro bundler with cache clear

#### Navigation Not Working

1. Ensure file is in `app/` directory
2. Check file naming (lowercase, no spaces)
3. Restart development server

### Build Issues

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo start -c
```

---

## Git Workflow

### Branch Naming

Current branch: `claude/claude-md-mi599yiclfeacgb7-018Mfksv5XbsV8Vum8ugDgfS`

**Convention**: Use descriptive branch names:
- `feature/user-authentication`
- `fix/navigation-bug`
- `refactor/component-structure`

### Commit Messages

Follow conventional commits:
```
feat: add user profile screen
fix: resolve navigation issue on Android
docs: update README with setup instructions
refactor: simplify authentication logic
style: format code with prettier
```

### Before Committing

1. Run linter: `npm run lint`
2. Test on at least one platform
3. Ensure TypeScript compiles without errors
4. Review changes carefully

---

## Additional Resources

### Documentation Links

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

### Community

- [Expo Discord](https://chat.expo.dev)
- [Expo GitHub](https://github.com/expo/expo)
- [React Native Community](https://reactnative.dev/community/overview)

---

## Notes for AI Assistants

### When Making Changes

1. **Read before writing** - Always read existing files before modifying
2. **Preserve patterns** - Follow existing code style and patterns
3. **Type safety** - Add proper TypeScript types
4. **Test changes** - Consider cross-platform implications
5. **Document** - Add comments for complex logic
6. **Keep it simple** - Prefer readability over cleverness

### File References

When referencing code locations, use the format: `file_path:line_number`

Example: "The root layout is defined in `app/_layout.tsx:4`"

### Project State

- ✅ Project initialized with Expo
- ✅ NativeWind configured
- ✅ TypeScript strict mode enabled
- ✅ Expo Router setup with Stack navigation
- ⏳ Basic structure in place, ready for feature development

---

**End of CLAUDE.md**
