"""
Podcast Voice Pipeline — Local Test
Reads .txt files from input/, generates MP3s to output/
Uses ElevenLabs for TTS + AWS Translate for translation.
"""

import os
import sys
import boto3
import requests

# Set your AWS profile and region here
PROFILE = None  # Uses default credentials if None; set to your profile name if needed
REGION = "us-west-2"  # Change to your preferred region

# Defaults
DEFAULT_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"  # Roger
DEFAULT_MODEL = "eleven_multilingual_v2"
DEFAULT_STABILITY = 0.50
DEFAULT_SIMILARITY = 0.75
DEFAULT_STYLE = 0.0

ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"

INPUT_DIR = "input"
OUTPUT_DIR = "output"


def get_api_key():
    session = boto3.Session(profile_name=PROFILE, region_name=REGION)
    client = session.client("secretsmanager")
    return client.get_secret_value(SecretId="elevenlabs-api-key")["SecretString"]


def get_translate_client():
    session = boto3.Session(profile_name=PROFILE, region_name=REGION)
    return session.client("translate")


def parse_text_file(filepath):
    """Parse a text file with optional header metadata."""
    with open(filepath, "r") as f:
        content = f.read()

    # Check for header separated by ---
    config = {}
    text = content

    if "---" in content:
        parts = content.split("---", 1)
        header = parts[0].strip()
        text = parts[1].strip()

        for line in header.splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                config[key.strip().lower()] = value.strip()

    return config, text


def translate_text(client, text, target_lang):
    result = client.translate_text(
        Text=text,
        SourceLanguageCode="en",
        TargetLanguageCode=target_lang,
    )
    return result["TranslatedText"]


def generate_audio(api_key, text, voice_id, stability, similarity, style):
    response = requests.post(
        f"{ELEVENLABS_URL}/{voice_id}",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": DEFAULT_MODEL,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity,
                "style": style,
                "use_speaker_boost": True,
            },
        },
    )

    if response.status_code != 200:
        detail = response.json().get("detail", {})
        msg = detail.get("message", f"ElevenLabs error {response.status_code}")
        raise Exception(msg)

    return response.content


def process_file(filepath, api_key, translate_client):
    filename = os.path.basename(filepath)
    name = os.path.splitext(filename)[0]
    print(f"\n📄 Processing: {filename}")

    config, text = parse_text_file(filepath)

    # Extract settings from header or use defaults
    lang = config.get("lang", "")
    voice_id = config.get("voice", DEFAULT_VOICE_ID)
    stability = float(config.get("stability", DEFAULT_STABILITY * 100)) / 100
    similarity = float(config.get("similarity", DEFAULT_SIMILARITY * 100)) / 100
    style = float(config.get("style", DEFAULT_STYLE * 100)) / 100

    # Translate if needed
    if lang and lang != "en":
        print(f"   🌐 Translating to: {lang}")
        text = translate_text(translate_client, text, lang)
        print(f"   ✅ Translated ({len(text)} chars)")

    # Generate audio
    print(f"   🎙️  Generating audio (voice: {voice_id})")
    print(f"   ⚙️  Stability: {stability}, Clarity: {similarity}, Style: {style}")
    audio = generate_audio(api_key, text, voice_id, stability, similarity, style)

    # Save output
    output_name = f"{name}.mp3" if not lang else f"{name}_{lang}.mp3"
    output_path = os.path.join(OUTPUT_DIR, output_name)
    with open(output_path, "wb") as f:
        f.write(audio)

    size_kb = len(audio) / 1024
    print(f"   ✅ Saved: {output_path} ({size_kb:.1f} KB)")
    return output_path


def main():
    os.makedirs(INPUT_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Find text files
    txt_files = [
        os.path.join(INPUT_DIR, f)
        for f in os.listdir(INPUT_DIR)
        if f.endswith(".txt")
    ]

    if not txt_files:
        print(f"No .txt files found in {INPUT_DIR}/")
        print(f"Create a text file there and run again.")
        print(f"\nExample: echo 'Hello, welcome to my podcast.' > {INPUT_DIR}/episode1.txt")
        sys.exit(0)

    print(f"Found {len(txt_files)} file(s) to process")

    # Setup
    print("🔑 Loading API key from Secrets Manager...")
    api_key = get_api_key()
    translate_client = get_translate_client()

    # Process each file
    results = []
    for filepath in sorted(txt_files):
        try:
            output = process_file(filepath, api_key, translate_client)
            results.append((filepath, output, None))
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results.append((filepath, None, str(e)))

    # Summary
    print("\n" + "=" * 50)
    print("📊 Summary")
    success = sum(1 for _, _, err in results if err is None)
    print(f"   {success}/{len(results)} files processed successfully")
    for filepath, output, err in results:
        name = os.path.basename(filepath)
        if err:
            print(f"   ❌ {name}: {err}")
        else:
            print(f"   ✅ {name} → {output}")


if __name__ == "__main__":
    main()
