#!/usr/bin/env python3
"""
Atlas Wake Word Listener
Runs in background and opens Chrome + Atlas when "Hey Atlas" is detected
"""

import speech_recognition as sr
import subprocess
import time
import os
from datetime import datetime

def log(message):
    """Log messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def is_chrome_running():
    """Check if Chrome is running"""
    try:
        result = subprocess.run(
            ['pgrep', '-x', 'Google Chrome'],
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except:
        return False

def open_atlas():
    """Open Chrome and activate Atlas extension"""
    log("Opening Chrome and Atlas...")

    # AppleScript to open Chrome with the extension
    applescript = '''
    tell application "Google Chrome"
        activate
        delay 1

        -- Open side panel if not already open
        tell application "System Events"
            tell process "Google Chrome"
                -- Try to open side panel with keyboard shortcut (Cmd+Shift+E)
                keystroke "e" using {command down, shift down}
            end tell
        end tell
    end tell
    '''

    try:
        subprocess.run(['osascript', '-e', applescript], check=True)
        log("✅ Chrome and Atlas opened successfully")

        # Play confirmation sound
        subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'])

        # Announce with voice
        subprocess.run(['say', 'Atlas is ready'])

    except subprocess.CalledProcessError as e:
        log(f"❌ Error opening Chrome: {e}")

def listen_for_wake_word():
    """Listen continuously for 'Hey Atlas' wake word"""
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()

    # Adjust for ambient noise
    log("Calibrating microphone for ambient noise...")
    with microphone as source:
        recognizer.adjust_for_ambient_noise(source, duration=2)

    log("🎤 Listening for 'Hey Atlas'...")
    log("Say 'Hey Atlas' to open Chrome and activate Atlas Voice")

    while True:
        try:
            with microphone as source:
                # Listen with timeout to check periodically
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=3)

            try:
                # Recognize speech using Google Speech Recognition
                text = recognizer.recognize_google(audio).lower()

                if "hey atlas" in text or "hi atlas" in text or "hello atlas" in text:
                    log(f"🎯 Wake word detected: '{text}'")

                    if is_chrome_running():
                        log("Chrome is already running, activating Atlas...")
                    else:
                        log("Chrome not running, opening now...")

                    open_atlas()

                    # Short pause after activation
                    time.sleep(3)
                    log("🎤 Listening for 'Hey Atlas'...")

            except sr.UnknownValueError:
                # Speech not understood - this is normal, keep listening
                pass
            except sr.RequestError as e:
                log(f"⚠️  Speech recognition service error: {e}")
                time.sleep(5)

        except sr.WaitTimeoutError:
            # Timeout - no speech detected, keep listening
            pass
        except KeyboardInterrupt:
            log("\n👋 Stopping Atlas wake word listener")
            break
        except Exception as e:
            log(f"❌ Unexpected error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    log("=" * 60)
    log("Atlas Wake Word Listener Starting")
    log("=" * 60)

    # Check if speech_recognition is installed
    try:
        import speech_recognition
        log("✅ speech_recognition module found")
    except ImportError:
        log("❌ speech_recognition module not found")
        log("Installing speech_recognition...")
        subprocess.run(['pip3', 'install', 'SpeechRecognition', 'pyaudio'], check=True)
        log("✅ Installed speech_recognition")

    try:
        listen_for_wake_word()
    except Exception as e:
        log(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
