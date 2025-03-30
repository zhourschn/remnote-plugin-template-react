# RemNote Youdao Audio Flashcards Plugin

A RemNote plugin that automatically plays audio for English words or sentences in flashcards using the Youdao Dictionary API.

## Features

- Automatically plays audio for the text on the front side of flashcards
- Supports both single words and complete sentences
- Adjustable playback speed through settings
- Configurable repeat count for audio playback
- Toggle auto-play on/off
- Test audio command for any word or phrase

## How to Use

1. Install the plugin in RemNote
2. Create flashcards with English text on the front side
3. When reviewing flashcards, the plugin will automatically play the pronunciation
4. Use the command palette (Ctrl+P) and search for "Test Youdao Audio" to manually test the pronunciation of any word or sentence

## Settings

- **Enable Auto Play**: Turn automatic pronunciation on or off
- **Playback Speed**: Adjust the speed of audio playback (default 1.0)
- **Repeat Count**: Number of times the audio will repeat (default 1)

## API Information

This plugin uses the Youdao Dictionary API at:
```
http://dict.youdao.com/dictvoice?type=1&audio=yourword
```

Where `yourword` is the word or phrase to be pronounced. For example:
```
http://dict.youdao.com/dictvoice?type=1&audio=ability
```

## Development

Built with:
- React
- TypeScript
- RemNote Plugin SDK

To build the plugin:

```bash
npm install
npm run dev   # For development with hot reload
npm run build # For production build
```

## License

MIT

<!-- ignore-after -->
