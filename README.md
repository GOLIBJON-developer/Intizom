# ⚡ Intizom — Discipline. Focus. Results.

A React Native Expo productivity app built for developers who want to build
**real daily discipline** — not just track tasks, but actually execute them.

---

## 📱 Screens

| Screen | Route | Description |
|---|---|---|
| Home | `Main → Home` | Today's plan, streak, active task, progress |
| Schedule | `Main → Schedule` | Drag-to-reorder task list, add/edit/delete |
| Notes | `Main → NotesStats → Notes` | All session notes, searchable |
| Stats | `Main → NotesStats → Stats` | Streak, weekly chart, category breakdown |
| Settings | `Main → Settings` | Theme, language, notifications, data storage |
| Add/Edit Task | `AddEditTask` (modal) | Create/modify tasks |
| Focus Timer | `FocusTimer` | Circular countdown, pause/resume, in-session notes |
| Alert | `Alert` (fullscreen modal) | Glowing full-screen next-task notification |

---

## 🚀 Setup

### 1. Prerequisites
```bash
node >= 18
npm >= 9
expo-cli or eas-cli
```

### 2. Install
```bash
cd intizom
npm install
```

### 3. Run (Expo Go)
```bash
npx expo start
```
> ⚠️ Voice STT requires EAS custom build (see below)

### 4. Build (Android APK)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### 5. Build (iOS)
```bash
eas build --platform ios
```

---

## 🏗 Architecture

```
intizom/
├── App.js                     # Entry — fonts, store init, navigation
├── app.json                   # Expo config, permissions
├── src/
│   ├── constants/
│   │   ├── theme.js           # Dark/light tokens (Linear-inspired)
│   │   └── i18n.js            # EN/UZ translations + categories
│   ├── store/
│   │   └── useStore.js        # Zustand — all state + data persistence
│   ├── hooks/
│   │   └── useTheme.js        # useTheme(), useI18n()
│   ├── utils/
│   │   └── notifications.js   # Expo notifications setup + helpers
│   ├── components/
│   │   ├── UI.js              # ThemedView, ThemedText, Buttons, Pills
│   │   ├── TaskCard.js        # Draggable task card with actions
│   │   └── CircularTimer.js   # Animated SVG ring timer
│   ├── navigation/
│   │   └── AppNavigator.js    # Bottom tabs + Stack navigator
│   └── screens/
│       ├── HomeScreen.js      # Today overview
│       ├── ScheduleScreen.js  # DraggableFlatList task manager
│       ├── AddEditTaskScreen.js # Task CRUD modal
│       ├── FocusTimerScreen.js  # Active session screen
│       ├── AlertScreen.js     # Full-screen glowing alert
│       ├── NotesScreen.js     # Notes history
│       ├── StatsScreen.js     # Stats + charts
│       └── SettingsScreen.js  # All app settings
└── assets/
    └── icon.svg               # Violet lightning clock icon
```

---

## 🎨 Design System

Based on **Linear** design aesthetic:
- **Dark bg**: `#0A0A0F` — deep space
- **Accent**: `#7C3AED` violet — energy, focus
- **Typography**: DM Sans (UI) + Space Mono (timer/numbers)
- **Cards**: subtle `1px` border, `12px` radius
- **Light mode**: soft lavender `#F4F2FF`

---

## 🔔 Notification System

| Type | Platform | Behavior |
|---|---|---|
| Task start alert | Android + iOS | Full-screen AlertScreen |
| Persistent timer | Android only | Ongoing notification bar |
| End-of-day summary | Both | Scheduled daily repeat |

---

## 💾 Data Storage

All data saved as **JSON** to device storage:
- **Default path**: `DocumentDirectory/intizom-data.json`
- **Custom path**: Configurable in Settings
- **Export**: Shares JSON file (copy to any device)
- **Import**: Pick JSON file from any location
- **Schema**: `{ tasks, dailyLogs, streak, settings }`

---

## 🎙 Voice Notes (EAS Build Required)

Voice STT uses `@react-native-voice/voice` — not compatible with Expo Go.

To enable:
```bash
# Add to dependencies:
npm install @react-native-voice/voice

# Then build custom dev client:
eas build --profile development --platform android
```

Currently: text notes only in Expo Go. Voice recordings via `expo-av` in EAS build.

---

## 📋 Task Data Schema

```json
{
  "id": "uuid",
  "name": "Crypto Audit",
  "duration": 180,
  "breakAfter": 15,
  "category": "work | study | build | apply | freelance | break | other",
  "color": "#7C3AED",
  "order": 0,
  "createdAt": "ISO string"
}
```

---

## 🔐 Permissions

| Permission | Purpose |
|---|---|
| `NOTIFICATIONS` | Task start alerts |
| `FOREGROUND_SERVICE` | Persistent timer notification (Android) |
| `WAKE_LOCK` | Keep timer running when screen off |
| `SCHEDULE_EXACT_ALARM` | Precise task notifications (Android 12+) |
| `RECORD_AUDIO` | Voice notes (EAS build) |
| `READ/WRITE_EXTERNAL_STORAGE` | JSON data file |
| `NSMicrophoneUsageDescription` | Voice notes (iOS) |

---

## 🗺 Roadmap (v2)

- [ ] Live Activities / Dynamic Island (iOS)
- [ ] Home screen widget
- [ ] Cloud backup (Supabase)
- [ ] Recurring tasks (daily / weekdays)
- [ ] Pomodoro micro-sessions
- [ ] AI daily plan suggestions
- [ ] Dark mode OLED pure-black variant

---

## 🧠 Built With

- Expo SDK 52
- React Native Reanimated 3
- Zustand 5
- React Navigation 6
- expo-notifications
- expo-file-system
- react-native-draggable-flatlist
- DM Sans + Space Mono (Google Fonts)
