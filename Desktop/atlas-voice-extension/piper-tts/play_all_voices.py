#!/usr/bin/env python3
"""
Auto-play all Piper TTS voices
"""
import subprocess
import time
from pathlib import Path

# Test phrase
TEST_PHRASE = "Hello! I'm Atlas, your voice assistant. How can I help you today?"

# Available voices
VOICES = [
    ("lessac", "en_US-lessac-medium.onnx", "Male - Medium Quality"),
    ("amy", "en_US-amy-medium.onnx", "Female - Medium Quality"),
    ("ljspeech", "en_US-ljspeech-high.onnx", "Female - High Quality (Best)"),
    ("ryan", "en_US-ryan-high.onnx", "Male - High Quality (Best)"),
    ("danny", "en_US-danny-low.onnx", "Male - Low Quality (Fast)"),
    ("kathleen", "en_US-kathleen-low.onnx", "Female - Low Quality (Fast)")
]

def play_voice(name, model_file, description):
    """Generate and play audio for a voice"""
    print(f"\n{'='*60}")
    print(f"🎤 NOW PLAYING: {name.upper()}")
    print(f"   {description}")
    print(f"{'='*60}")

    voices_dir = Path(__file__).parent / "voices"
    model_path = voices_dir / model_file
    output_file = voices_dir / f"test_{name}.wav"

    if not model_path.exists():
        print(f"❌ Model not found: {model_path}")
        return False

    # Generate audio
    print("🔊 Generating audio...")
    cmd = f'echo "{TEST_PHRASE}" | python -m piper --model {model_path} --output-file {output_file}'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        return False

    # Play audio
    print("▶️  Playing now...")
    subprocess.run(['afplay', str(output_file)], check=False)

    print("✅ Done!")
    time.sleep(1)  # Pause between voices

    return True

def main():
    print("\n" + "="*60)
    print("🎙️  PIPER TTS VOICE AUTO-PLAYER")
    print("="*60)
    print(f'\nTest phrase: "{TEST_PHRASE}"')
    print("\nPlaying all 6 voices automatically...")
    print("Listen and decide which one you like best!\n")

    time.sleep(2)

    # Play all voices
    for i, (name, model, desc) in enumerate(VOICES, 1):
        print(f"\n[{i}/6] ", end="")
        play_voice(name, model, desc)

    print("\n" + "="*60)
    print("✅ ALL VOICES PLAYED!")
    print("="*60)
    print("\n📊 Voice Summary:")
    for i, (name, _, desc) in enumerate(VOICES, 1):
        print(f"   {i}. {name.upper()} - {desc}")

    print("\n💡 Recommended:")
    print("   • 'ljspeech' - Best female voice (high quality)")
    print("   • 'ryan' - Best male voice (high quality)")
    print("\n")

if __name__ == "__main__":
    main()
