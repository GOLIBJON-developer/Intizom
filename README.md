# ⚡ Intizom

> **Intizom** (O'zbekcha: "tartib", "intizom") — kunlik intizom qurish uchun React Native Expo ilovasi.  
> Vazifalarni rejalashtiring, fokus sessiyalarini boshqaring, natijalaringizni kuzating.

---

## 📱 Ilovaning Imkoniyatlari

### Asosiy Funksiyalar
- **Vazifa boshqaruvi** — Qo'shish, tahrirlash, o'chirish, drag-and-drop tartiblashtirish
- **Fokus taymer** — Aylana countdown taymer (Reanimated SVG)
- **Tanaffus boshqaruvi** — Har vazifa uchun avtomatik tanaffus sessiyasi
- **Full-screen ogohlantirish** — Pulsating glow animatsiyali to'liq ekran alert
- **Progress eslatmalari** — Sessiya davomida matn eslatmalari
- **Streak tracker** — Kunlik bajarilgan seriyasini hisoblash
- **Haftalik statistika** — Bar chart va kategoriya bo'yicha taqsimot
- **Kun yakuniy xulosa** — Scheduled bildirishnoma
- **Ma'lumot saqlash** — AsyncStorage (local) + JSON export/import

### Dizayn
- **Mavzu**: Light / Dark / System (telefon sozlamasiga ergashadi)
- **Til**: English / O'zbek (to'liq i18n)
- **Design system**: Linear-inspired (violet accent, deep space dark, soft lavender light)
- **Shriftlar**: DM Sans (UI) + Space Mono (taymer raqamlari)
- **Ikonlar**: Expo Vector Icons (Ionicons)

---

## 🏗 Arxitektura

```
intizom/
├── App.js                          # Entry, fontlar, store init, notification tap listener
├── app.json                        # Expo config, permissions, plugins
├── eas.json                        # EAS Build konfiguratsiya
├── babel.config.js                 # Babel + Reanimated plugin
├── metro.config.js                 # Metro bundler config
├── assets/
│   ├── icon.png                    # 1024x1024 violet gradient + lightning bolt
│   ├── adaptive-icon.png           # Android adaptive icon
│   └── splash.png                  # Splash screen
└── src/
    ├── constants/
    │   ├── theme.js                # Dark/light design tokens (Linear-inspired)
    │   └── i18n.js                 # EN+UZ tarjimalar, kategoriyalar
    ├── store/
    │   ├── useStore.js             # Zustand store — barcha state + persistence
    │   └── selectors.js            # Pure selectors (React 19 loop oldini olish)
    ├── hooks/
    │   └── useTheme.js             # useTheme(), useI18n()
    ├── utils/
    │   └/notifications.js          # Expo Notifications wrapper
    ├── components/
    │   ├── UI.js                   # ThemedView, ThemedText, Button, ProgressBar
    │   ├── TaskCard.js             # Drag-and-drop task card
    │   └── CircularTimer.js        # Animated SVG ring timer
    ├── navigation/
    │   └── AppNavigator.js         # Bottom tabs + Stack, onboarding check
    └── screens/
        ├── OnboardingScreen.js     # Birinchi ochilish: til + notification
        ├── HomeScreen.js           # Bugungi reja, streak, active task
        ├── ScheduleScreen.js       # Drag-and-drop task list, CRUD
        ├── AddEditTaskScreen.js    # Task yaratish/tahrirlash modal
        ├── FocusTimerScreen.js     # Fokus sessiya, pause/resume, eslatma
        ├── AlertScreen.js          # Full-screen glow alert
        ├── NotesScreen.js          # Eslatmalar tarixi, search
        ├── StatsScreen.js          # Streak, haftalik chart, kategoriya
        └── SettingsScreen.js       # Mavzu, til, notifications, export/import
```

---

## 📊 Ma'lumot Modeli

### Task
```json
{
  "id": "abc123_1_xyz",
  "name": "Crypto Audit",
  "duration": 180,
  "breakAfter": 15,
  "category": "work | study | build | apply | freelance | break | other",
  "color": "#7C3AED",
  "order": 0,
  "createdAt": "2026-05-09T10:00:00.000Z"
}
```

### Daily Log
```json
{
  "2026-05-09": {
    "completed": ["taskId1", "taskId2"],
    "skipped":   ["taskId3"],
    "notes": {
      "taskId1": [
        {
          "id": "note_abc",
          "text": "VRF subscription muammosi bor edi",
          "voicePath": null,
          "timestamp": "2026-05-09T11:30:00.000Z"
        }
      ]
    }
  }
}
```

### Streak
```json
{ "current": 5, "longest": 12, "lastDate": "2026-05-09" }
```

### Settings
```json
{
  "theme": "system",
  "language": "en",
  "voiceLanguage": "en-US",
  "endOfDaySummaryTime": "22:00",
  "notificationsEnabled": true,
  "hasOnboarded": true,
  "exportFolderUri": null
}
```

---

## 🧰 Tech Stack

| Kutubxona | Versiya | Maqsad |
|---|---|---|
| `expo` | ~54.0.0 | SDK |
| `react-native` | 0.76.9 | Mobile framework |
| `zustand` | ^5.0.0 | State management |
| `@react-native-async-storage/async-storage` | ^2.1.0 | Local persistence |
| `expo-file-system/legacy` | ~18.0.12 | JSON export/import |
| `expo-notifications` | ~0.29.9 | Local + scheduled notifications |
| `expo-speech` | ~13.0.1 | Text-to-speech |
| `expo-haptics` | ~14.0.1 | Tactile feedback |
| `expo-keep-awake` | ~14.0.3 | Ekranni yoqiq saqlash |
| `react-native-reanimated` | ~3.16.1 | Glow animation, SVG timer |
| `react-native-svg` | 15.8.0 | Circular timer ring |
| `react-native-draggable-flatlist` | ^4.0.1 | Task drag-and-drop |
| `react-native-gesture-handler` | ~2.20.2 | Swipe, drag |
| `react-native-worklets` | 0.5.1 | Reanimated worklet support |
| `date-fns` | ^3.6.0 | Sana hisoblash |
| `@expo-google-fonts/dm-sans` | ^0.2.3 | UI shrift |
| `@expo-google-fonts/space-mono` | ^0.2.3 | Taymer shrift |

---

## 🚀 O'rnatish

### Expo Go (Test)
```bash
cd intizom
npm install --legacy-peer-deps
npx expo start
# Telefonda Expo Go → QR code skan
```

### Production APK (Android)
```bash
npm install -g eas-cli
eas login
eas init
# Preview (test APK)
eas build --platform android --profile preview
# Production (Play Store AAB)
eas build --platform android --profile production
```

---

## 📋 Ekranlar

### 1. OnboardingScreen
Birinchi ochilganda bir marta ko'rsatiladi. 3 qadam: xush kelibsiz, fokus, bildirishnomalar. Til tanlash (EN/UZ). `hasOnboarded = true` bo'lgandan keyin o'tkazib yuboriladi.

### 2. HomeScreen
Xayrli tong salomi, streak badge, bugungi progress bar, active task banner, keyingi vazifa preview, barcha vazifalar mini ro'yxati. Pull-to-refresh.

### 3. ScheduleScreen
Drag-and-drop vazifalar ro'yxati. Start / Edit / Delete. Long press haptic → drag. FAB → AddEditTask.

### 4. AddEditTaskScreen
Task nomi, davomiylik picker (soat+daqiqa), tanaffus toggle+picker, 7 kategoriya chip, 8 rang, real-time preview.

### 5. FocusTimerScreen
Aylana SVG taymer (task rangi). `adjustsFontSizeToFit` — 2+ soat ham sig'adi. Pause/Resume/Done/Note. Break avtomatik boshlanadi. `expo-keep-awake`. AppState listener — background'dan qaytganda vaqt to'g'ri hisoblanadi.

### 6. AlertScreen
Qora fon + pulsating glow. "Vaqt keldi: [Task]". TTS (EN/UZ). Haptic. Bosmagunicha o'chmaydi. "Boshlaylik" → FocusTimer. "O'tkazish" → Home.

### 7. NotesScreen
Barcha eslatmalar (sana+vaqt). Task badge. Search (matn+task). Delete.

### 8. StatsScreen
Streak cards, haftalik bar chart, kategoriya progress. Bo'sh holat: motivatsion UI.

### 9. SettingsScreen
Mavzu / Til / Ovoz tili / Bildirishnomalar / Saqlash joyi (SAF) / Export / Import / Reset / Haqida.

---

## 🔔 Bildirishnomalar

| Tur | Trigger | Tavsif |
|---|---|---|
| Task start | Darhol | Vazifa boshlanishi banner |
| Task complete | Darhol | Bajarildi badge |
| End-of-day | Scheduled, kunlik | Kun xulosa |

> Expo Go'da faqat local notifications ishlaydi (SDK 53+). Push notifications EAS build talab qiladi.

---

## 🗂 State Management

```
useStore (Zustand v5)
├── tasks, dailyLogs, streak, settings, activeSession, isLoaded
├── loadData / saveData / exportData / importData / resetData
├── addTask / updateTask / deleteTask / reorderTasks
├── startSession / pauseSession / resumeSession / completeSession / skipSession
├── addNote / deleteNote
├── updateStreak (recalcStreak — scratch'dan hisoblaydi)
└── updateSettings

selectors.js (useMemo bilan ishlatiladi)
├── selectTodayProgress(tasks, dailyLogs)
├── selectNextTask(tasks, dailyLogs)
├── selectAllNotes(tasks, dailyLogs)
└── selectWeeklyStats(dailyLogs)
```

---

## 🐛 Muammolar va Yechimlar

### 1. `uuid` — `crypto.getRandomValues` yo'q (Hermes engine)
**Muammo:** `uuid.v4()` Hermes'da crash qiladi. `addTask` silent crash — tugma loading'da qotib qoladi.  
**Yechim:** Custom `genId()` — timestamp + counter + random:
```js
let _counter = 0;
const genId = () =>
  `${Date.now().toString(36)}_${(++_counter).toString(36)}_${Math.random().toString(36).slice(2,6)}`;
```

---

### 2. React 19 + Zustand — Infinite Loop
**Muammo:** Store'dagi `getAllNotes()` kabi funksiyalar har render'da yangi reference qaytaradi → `useSyncExternalStore` cheksiz loop:
```
ERROR: The result of getSnapshot should be cached
ERROR: Maximum update depth exceeded
```
**Yechim:** `selectors.js` — pure functions + `useMemo`:
```js
const nextTask = useMemo(() => selectNextTask(tasks, dailyLogs), [tasks, dailyLogs]);
```

---

### 3. `expo-file-system` SDK 54 — Deprecated API
**Muammo:** `writeAsStringAsync`, `readAsStringAsync` deprecated. Export/import ishlamadi.  
**Yechim:** `import * as LegacyFS from 'expo-file-system/legacy'`. Asosiy persistence uchun AsyncStorage.

---

### 4. Expo Go SDK Version Mismatch
**Muammo:** `react-native: "*"` → npm `0.81.x` o'rnatdi → Expo Go (SDK 54) bilan mos kelmadi:
```
ERROR: PlatformConstants not found (TurboModule)
ERROR: VirtualViewExperimentalNativeComponent parse xatosi
```
**Yechim:** `react: "18.3.1"`, `react-native: "0.76.9"` aniq pinlandi. `npx expo install --fix` tasdiqlanди.

---

### 5. Reanimated `Easing` Import Konflikti
**Muammo:** `babel.config.js`'da `worklets/plugin` va `reanimated/plugin` ikkalasi → duplicate error. `Easing` undefined.  
**Yechim:** Faqat `react-native-reanimated/plugin`. `withTiming` default easing ishlatildi.

---

### 6. `Speech.speak()` Promise Qaytarmaydi
**Muammo:** `expo-speech` v13 ba'zan `undefined` qaytaradi. `.catch()` → crash.  
**Yechim:**
```js
const safeSpeech = (text, opts) => { try { Speech.speak(text, opts); } catch {} };
```

---

### 7. Uzbek Apostrof — Syntax Error
**Muammo:** `'Keyingisiga o'ting'` — apostrof single-quote'ni yopib qo'yadi.  
**Yechim:** O'zbek matni double-quote:
```js
"Keyingisiga o'ting"  // ✅
```

---

### 8. Safe Area — Tab Bar Ustiga Chiqib Ketish
**Muammo:** Modal/picker'dan qaytganda tab bar tizim tugmalariga ustma-ust tushdi.  
**Yechim:**
```js
tabBarStyle: {
  height: 56 + insets.bottom,
  paddingBottom: insets.bottom,
  position: 'absolute',
  bottom: 0, left: 0, right: 0,
}
```

---

### 9. Streak Logikasi — Double Count
**Muammo:** Bir kun 2 marta complete → streak 2 marta oshardi. Skip kunlar streak'ni noto'g'ri uzardi.  
**Yechim:** `recalcStreak()` — barcha `dailyLogs`'dan scratch'dan hisoblaydi:
```js
// gap === 1 bo'lsa davom etadi, aks holda noldan boshlaydi
streak = gap === 1 ? streak + 1 : 1;
```

---

### 10. EAS Build — Lockfile Yo'q
**Muammo:** `package-lock.json` yo'q → EAS build xato.  
**Yechim:** `npm install --legacy-peer-deps` → lockfile yaratiladi.

---

### 11. `app.json` Plugins — Config Plugin Xatosi
**Muammo:** `expo-speech`, `expo-av`, `expo-document-picker` plugins'ga qo'shilgandi, lekin ular config plugin emas:
```
PluginError: Unable to resolve a valid config plugin for expo-speech
```
**Yechim:** Faqat native code o'zgartiruvchi paketlar:
```json
"plugins": [["expo-notifications", { "color": "#7C3AED" }]]
```

---

### 12. `eas.json` — `appVersionSource` Ogohlantirish
**Muammo:** `cli.appVersionSource` majburiy bo'lishi haqida ogohlantirish.  
**Yechim:**
```json
"cli": { "version": ">= 12.0.0", "appVersionSource": "local" }
```

---

## 🔐 Permissions

### Android
`NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE`, `WAKE_LOCK`, `VIBRATE`, `USE_EXACT_ALARM`, `SCHEDULE_EXACT_ALARM`, `RECORD_AUDIO`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_AUDIO`, `MANAGE_DOCUMENTS`

### iOS
`NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`, `NSDocumentsFolderUsageDescription`, `UIBackgroundModes: [fetch, remote-notification]`

---

## 🗺 Kelajak Rejalar (v2)

| Feature | Murakkablik |
|---|---|
| Voice STT (`@react-native-voice/voice`) | Yuqori — EAS build |
| iOS Live Activities / Dynamic Island | Yuqori — native Swift |
| Home Screen Widget | Yuqori |
| Cloud Sync (Supabase) | O'rta |
| Recurring Tasks | O'rta |
| AI Daily Plan (Claude API) | Yuqori |

---

## 📈 Kod Statistikasi

| Ko'rsatkich | Qiymat |
|---|---|
| Jami JS fayllari | 20 ta |
| Jami kod satrlari | ~3,277 |
| Ekranlar | 9 ta |
| Komponentlar | 5 ta |
| i18n kalitlari | 50+ (EN + UZ) |
| Kategoriyalar | 7 ta |
| Topilgan va tuzatilgan buglar | 12 ta |

---

*⚡ Intizom — Discipline. Focus. Results.*