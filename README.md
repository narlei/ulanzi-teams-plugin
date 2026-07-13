# Microsoft Teams Controls — Ulanzi Deck Plugin

[![Available on Ulanzi Community Store](https://raw.githubusercontent.com/narlei/ulanzicommunitystore/main/docs/badges/ulanzi-community-store.svg)](https://ulanzicommunitystore.narlei.com)

Control your **Microsoft Teams** meetings directly from your Ulanzi Deck macro keyboard. One button press to mute, toggle camera, share screen, raise hand, end a call, or push-to-talk — no need to switch windows.

---

## Actions

| Button | Default Shortcut | Description |
|--------|-----------------|-------------|
| 🎤 Mute / Unmute | `Ctrl+Shift+M` | Toggle microphone on/off |
| 📷 Camera On/Off | `Ctrl+Shift+O` | Toggle camera on/off |
| 🖥️ Share Screen | `Ctrl+Shift+E` | Open screen sharing panel |
| ✋ Raise Hand | `Ctrl+Shift+K` | Raise or lower your hand |
| 📵 End Call | `Ctrl+Shift+H` | Leave the meeting |
| 🔊 Push to Talk | `Ctrl+Space` | Toggle mute (press to unmute, press again to mute) |

> **Note on Push-to-Talk:** The Ulanzi Deck API does not expose key-hold events, so Push-to-Talk works as a toggle instead of hold-to-talk. Each button press sends `Ctrl+Space` once.

---

## How It Works

The plugin runs as a **Node.js** background service that communicates with the Ulanzi Deck via WebSocket. When a button is pressed, it uses PowerShell's `WScript.Shell.SendKeys` to bring the Teams window into focus and send the configured keyboard shortcut.

```
Button press → onRun event → PowerShell → AppActivate("Microsoft Teams") → SendKeys
```

---

## Requirements

- **Ulanzi Deck** app (with Node.js runtime — bundled by the app)
- **Microsoft Teams** (New Teams, desktop app) running on Windows 10 or later
- Windows 10 / 11

---

## Installation

1. Download or clone this repository.
2. Copy the folder `com.ulanzi.teams.ulanziPlugin` into your Ulanzi Deck plugins directory:
   ```
   C:\Users\<YourUser>\AppData\Roaming\Ulanzi\UlanziDeck\Plugins\
   ```
3. Restart the Ulanzi Deck app.
4. The **Microsoft Teams Controls** category will appear in the action list.
5. Drag any action onto a button and press it during a Teams meeting.

---

## Customizing Shortcuts

Each button has a **Property Inspector** where you can override the default shortcut:

1. Click on the button in the Ulanzi Deck app.
2. In the settings panel, type a custom shortcut (e.g. `ctrl+shift+m`).
3. Click **Save**. Use **Test** to verify it works, or **Default** to restore the original.

**Shortcut format:** lowercase keys separated by `+`
Examples: `ctrl+shift+m` · `ctrl+space` · `alt+f4`

---

## Plugin Structure

```
com.ulanzi.teams.ulanziPlugin/
├── manifest.json                  # Plugin metadata and action definitions
├── package.json                   # Node.js module config (type: module)
├── plugin/
│   └── app.js                     # Main Node.js service
├── property-inspector/
│   └── inspector.html             # Settings UI (shared across all actions)
├── libs/
│   ├── js/                        # Browser-side API (used by Property Inspector)
│   │   ├── ulanzideckApi.js
│   │   ├── constants.js
│   │   ├── eventEmitter.js
│   │   └── utils.js
│   └── node/                      # Node.js API (used by plugin/app.js)
│       ├── ulanzideckApi.js
│       ├── constants.js
│       └── utils.js
└── resources/
    └── icons/                     # Button icons (PNG)
```

---

## API Notes

This plugin uses the **Ulanzi Deck SDK** (`UlanziStreamDeck` / `UlanzideckApi`), not the Elgato Stream Deck SDK. Key differences:

| Stream Deck API | Ulanzi Deck API |
|----------------|-----------------|
| `$SD.onKeyDown` | `$UD.onRun` (no key-hold events) |
| `$SD.setSettings` | `$UD.sendParamFromPlugin` |
| `$SD.onDidReceiveSettings` | `$UD.onAdd` + `$UD.onParamFromApp` |
| `$SD.sendToPlugin` | `$UD.sendParamFromPlugin` |
| `$SD.onSendToPlugin` | `$UD.onParamFromPlugin` |

---

## License

MIT

---

## Author

**Rodrigo Curi Garcia**
Plugin built with the Ulanzi Deck JavaScript SDK.
