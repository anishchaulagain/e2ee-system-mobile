# Cipher — E2EE Chat (Mobile)

A production-grade React Native client for the e2ee chat backend.
Messages are encrypted on-device with **NaCl box** (Curve25519 + XSalsa20-Poly1305);
the server only ever sees opaque ciphertext + nonce blobs.

## Stack

| Layer        | Choice                                   |
| ------------ | ---------------------------------------- |
| Runtime      | Expo SDK 54 + React Native 0.81 + React 19 |
| Language     | TypeScript (strict, no `any`)            |
| Routing      | `expo-router` (file-based, typed routes) |
| Styling      | NativeWind v4 (Tailwind for RN)          |
| State        | Zustand (auth, theme)                    |
| Server state | TanStack Query (cache + invalidation)    |
| Realtime     | `socket.io-client`                       |
| Crypto       | `tweetnacl` + `tweetnacl-util`           |
| Secure store | `expo-secure-store` (keychain / keystore)|

## Architecture

```
mobile/
├── app/                       # expo-router (file-based)
│   ├── _layout.tsx            # root: providers + auth gate
│   ├── (auth)/                # login, register
│   └── (app)/                 # chats list, chat/[id], new-chat, settings
└── src/
    ├── api/                   # fetch wrapper + endpoint helpers
    ├── crypto/                # keypair + encrypt/decrypt
    ├── socket/                # socket.io client
    ├── state/                 # zustand stores (auth, theme)
    ├── hooks/                 # useChat, useConversations, useUserSearch
    ├── components/            # Button, Input, Avatar, MessageBubble, ...
    ├── theme/                 # palette tokens (mirrors tailwind config)
    ├── types/api.ts           # types kept in sync with backend entities
    └── utils/                 # storage, time, conversation helpers
```

### How E2EE works in the app

1. **First launch.** A Curve25519 keypair is generated on-device and the secret
   key is written to the OS keychain (`expo-secure-store`). It never leaves the
   device.
2. **Public-key publication.** On register/login we upload our public key via
   `PUT /api/v1/users/me/public-key` so peers can encrypt messages addressed
   to us.
3. **Sending.** Outbound text is encrypted with `nacl.box(message, nonce,
   peerPublicKey, mySecretKey)`. Both `ciphertext` and `nonce` are base64'd
   and POSTed to `/conversations/:id/messages`.
4. **Receiving.** Incoming envelopes (whether from REST history or Socket.IO
   `new_message` events) are decrypted with `nacl.box.open(ciphertext, nonce,
   peerPublicKey, mySecretKey)`. Failed decryptions render as a locked
   placeholder rather than crashing the conversation.
5. **Key rotation / device migration** is **not** implemented. Reinstalling
   the app generates a new keypair, which makes prior history undecryptable.
   This is a deliberate v1 simplification — see *Known limitations* below.

### Auth lifecycle

- Tokens are stored with `expo-secure-store` (keychain on iOS, EncryptedSharedPreferences on Android).
- The `apiRequest` helper transparently refreshes the access token on a
  401 and replays the original request. Concurrent 401s are coalesced onto a
  single in-flight refresh.
- A hard 401 (refresh itself fails) calls `forceLogout()` which clears tokens
  and bounces the user to `/login`.

### Realtime

`socket.io-client` connects with the access token via `auth.token`. The server
auto-joins us to every conversation room on connect, so we just listen for:

- `new_message` → prepend to the message cache (deduped by `id`)
- `typing` → drives the "typing…" indicator in the chat header
- `user_online` → reserved for presence (UI hook is wired, store not yet)

## Setup

```bash
cd mobile
npm install
cp .env.example .env       # adjust EXPO_PUBLIC_API_URL if the backend isn't on localhost:3000
npx expo start
```

Then press `i` (iOS Simulator), `a` (Android emulator), or scan the QR with the
Expo Go app on a physical device.

### Connecting to the backend

The default `apiUrl` in `app.json` is `http://localhost:3000`, which works for
iOS Simulator. For other targets, set `EXPO_PUBLIC_API_URL` (and optionally
`EXPO_PUBLIC_SOCKET_URL`) in `.env`:

| Target                | URL                              |
| --------------------- | -------------------------------- |
| iOS Simulator         | `http://localhost:3000`          |
| Android emulator      | `http://10.0.2.2:3000`           |
| Physical device       | `http://<your-lan-ip>:3000`      |

Make sure the backend's `cors` and Socket.IO `origin` allow your dev origin
(the backend already uses `cors()` open + Socket.IO `origin: "*"`).

### Asset note

`app.json` uses Expo's default splash/icon. To customize, drop `icon.png`
(1024×1024), `splash.png`, `adaptive-icon.png`, and `favicon.png` into
`./assets/` and add the file refs back to `app.json`.

## Scripts

| Command           | Purpose                            |
| ----------------- | ---------------------------------- |
| `npm start`       | Expo dev server                    |
| `npm run ios`     | Build & run on iOS Simulator       |
| `npm run android` | Build & run on Android emulator    |
| `npm run web`     | Run in the browser via react-native-web |
| `npm run type-check` | TypeScript strict type-check    |

## Known limitations

- **No multi-device support.** A user has exactly one keypair, bound to the
  device they registered on. A future Signal-style x3dh + sender-key scheme
  would lift this.
- **No message persistence.** Messages are re-fetched and re-decrypted from
  the server on every cold start. Adding a local SQLite/MMKV cache would
  enable offline reads.
- **No attachments.** Text-only.
- **No group chats.** Backend has the `is_group` flag but the mobile UI
  currently treats every conversation as 1:1.
- **No presence indicator wiring.** Backend emits `user_online`; the UI
  component supports it but no store currently subscribes.

## Backend mapping

| Mobile call                          | Backend endpoint                            |
| ------------------------------------ | ------------------------------------------- |
| `AuthApi.login`                      | `POST /api/v1/auth/login`                   |
| `AuthApi.register`                   | `POST /api/v1/auth/register`                |
| `AuthApi.logout`                     | `POST /api/v1/auth/logout`                  |
| (auto, on 401)                       | `POST /api/v1/auth/refresh`                 |
| `UserApi.me`                         | `GET /api/v1/users/me`                      |
| `UserApi.search`                     | `GET /api/v1/users/search?q=…`              |
| `UserApi.updatePublicKey`            | `PUT /api/v1/users/me/public-key`           |
| `UserApi.getPublicKey`               | `GET /api/v1/users/:id/public-key`          |
| `ConversationApi.list`               | `GET /api/v1/conversations`                 |
| `ConversationApi.create`             | `POST /api/v1/conversations`                |
| `ConversationApi.get`                | `GET /api/v1/conversations/:id`             |
| `MessageApi.list`                    | `GET /api/v1/conversations/:id/messages`    |
| `MessageApi.send`                    | `POST /api/v1/conversations/:id/messages`   |
| Socket: `new_message`, `typing`, `user_online` | Socket.IO (auth via JWT)         |
