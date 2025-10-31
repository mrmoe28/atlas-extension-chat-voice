#!/usr/bin/env python3
"""
Test all Piper TTS voices
"""
import subprocess
import os
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

def test_voice(name, model_file, description):
    """Generate and play audio for a voice"""
    print(f"\n{'='*60}")
    print(f"🎤 Testing: {name.upper()}")
    print(f"   {description}")
    print(f"{'='*60}")

    voices_dir = Path(__file__).parent / "voices"
    model_path = voices_dir / model_file
    output_file = voices_dir / f"test_{name}.wav"

    if not model_path.exists():
        print(f"❌ Model not found: {model_path}")
        return

    # Generate audio
    print("🔊 Generating audio...")
    cmd = f'echo "{TEST_PHRASE}" | python -m piper --model {model_path} --output-file {output_file}'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ Error generating audio: {result.stderr}")
        return

    print(f"✅ Audio generated: {output_file}")

    # Play audio using macOS 'afplay'
    print("▶️  Playing audio...")
    subprocess.run(['afplay', str(output_file)])

    print("✅ Playback complete!")

    # Ask for feedback
    feedback = input("\n💭 What do you think? (Press Enter to continue to next voice) ")

    return output_file

def main():
    print("\n" + "="*60)
    print("🎙️  PIPER TTS VOICE TESTER")
    print("="*60)
    print("\nYou'll hear each voice say the same phrase.")
    print("After each voice plays, press Enter to hear the next one.")
    print("\nTest phrase:")
    print(f'  "{TEST_PHRASE}"')

    input("\n▶️  Press Enter to start testing voices...")

    # Test all voices
    for name, model, desc in VOICES:
        test_voice(name, model, desc)

    print("\n" + "="*60)
    print("✅ All voices tested!")
    print("="*60)
    print("\nVoice Summary:")
    for i, (name, _, desc) in enumerate(VOICES, 1):
        print(f"{i}. {name.upper()} - {desc}")

    print("\n💡 Which voice did you like best?")
    print("   I recommend: 'ljspeech' (female) or 'ryan' (male)")

if __name__ == "__main__":
    main()
