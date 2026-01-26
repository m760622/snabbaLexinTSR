# Audio Memory Management & Leaks

**Problem:** We observed that creating new `Audio` objects or `AudioContext` instances repeatedly without proper cleanup led to memory leaks and performance degradation, especially on mobile devices (Safari primarily).
**Symptoms:** Audio stops playing after a while, or the app crashes/becomes sluggish during prolonged use of TTS or games.

**Protocol:**

1. **Singleton Pattern:** Use a centralized `AudioManager` or a single reuseable `Audio` instance where possible.
2. **Explicit Cleanup:** When an audio object is no longer needed:
    * Pause it: `audio.pause()`
    * Reset source: `audio.src = ""`
    * Load to clear buffer: `audio.load()`
    * Remove event listeners.
3. **Context Suspension:** Suspend `AudioContext` when the app is inactive or the user navigates away from the audio-heavy component.

**Example Cleanup:**

```typescript
public cleanup() {
    if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.src = '';
        this.currentAudio.load();
        this.currentAudio = null;
    }
}
```
