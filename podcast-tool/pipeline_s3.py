"""
Podcast Voice Pipeline — S3 Version
Reads .txt files from an S3 input bucket, generates MP3s to an S3 output bucket.
This simulates what a Lambda function would do in production.
"""

import os
import sys
import boto3
import requests

# Set your AWS profile and region here
PROFILE = None  # Uses default credentials if None; set to your profile name if needed
REGION = "us-west-2"  # Change to your preferred region

INPUT_BUCKET = "my-podcast-input"
OUTPUT_BUCKET = "my-podcast-output"

DEFAULT_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"
DEFAULT_MODEL = "eleven_multilingual_v2"
DEFAULT_STABILITY = 0.50
DEFAULT_SIMILARITY = 0.75
DEFAULT_STYLE = 0.0

ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"


def setup_aws():
    session = boto3.Session(profile_name=PROFILE, region_name=REGION)
    return {
        "s3": session.client("s3"),
        "translate": session.client("translate"),
        "secrets": session.client("secretsmanager"),
    }


def get_api_key(secrets_client):
    return secrets_client.get_secret_value(SecretId="elevenlabs-api-key")["SecretString"]


def list_input_files(s3_client):
    """List all .txt files in the input bucket."""
    response = s3_client.list_objects_v2(Bucket=INPUT_BUCKET)
    if "Contents" not in response:
        return []
    return [
        obj["Key"] for obj in response["Contents"]
        if obj["Key"].endswith(".txt")
    ]


def read_from_s3(s3_client, key):
    response = s3_client.get_object(Bucket=INPUT_BUCKET, Key=key)
    return response["Body"].read().decode("utf-8")


def write_to_s3(s3_client, key, audio_bytes):
    s3_client.put_object(
        Bucket=OUTPUT_BUCKET,
        Key=key,
        Body=audio_bytes,
        ContentType="audio/mpeg",
    )


def parse_content(content):
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


def translate_text(translate_client, text, target_lang):
    result = translate_client.translate_text(
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


def process_s3_file(key, clients, api_key):
    name = os.path.splitext(os.path.basename(key))[0]
    print(f"\n📄 Processing: s3://{INPUT_BUCKET}/{key}")

    # Read from S3
    content = read_from_s3(clients["s3"], key)
    config, text = parse_content(content)

    lang = config.get("lang", "")
    voice_id = config.get("voice", DEFAULT_VOICE_ID)
    stability = float(config.get("stability", DEFAULT_STABILITY * 100)) / 100
    similarity = float(config.get("similarity", DEFAULT_SIMILARITY * 100)) / 100
    style = float(config.get("style", DEFAULT_STYLE * 100)) / 100

    # Translate
    if lang and lang != "en":
        print(f"   🌐 Translating to: {lang}")
        text = translate_text(clients["translate"], text, lang)
        print(f"   ✅ Translated ({len(text)} chars)")

    # Generate audio
    print(f"   🎙️  Generating audio (voice: {voice_id})")
    audio = generate_audio(api_key, text, voice_id, stability, similarity, style)

    # Write to S3
    output_key = f"{name}.mp3" if not lang else f"{name}_{lang}.mp3"
    write_to_s3(clients["s3"], output_key, audio)

    size_kb = len(audio) / 1024
    print(f"   ✅ Saved: s3://{OUTPUT_BUCKET}/{output_key} ({size_kb:.1f} KB)")
    return output_key


def main():
    print("🔧 Setting up AWS clients...")
    clients = setup_aws()

    print("🔑 Loading API key from Secrets Manager...")
    api_key = get_api_key(clients["secrets"])

    print(f"📂 Checking s3://{INPUT_BUCKET}/ for .txt files...")
    files = list_input_files(clients["s3"])

    if not files:
        print(f"\nNo .txt files found in s3://{INPUT_BUCKET}/")
        print(f"Upload one first:")
        print(f"  aws s3 cp my-episode.txt s3://{INPUT_BUCKET}/")
        sys.exit(0)

    print(f"Found {len(files)} file(s) to process")

    results = []
    for key in sorted(files):
        try:
            output = process_s3_file(key, clients, api_key)
            results.append((key, output, None))
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results.append((key, None, str(e)))

    print("\n" + "=" * 50)
    print("📊 Summary")
    success = sum(1 for _, _, err in results if err is None)
    print(f"   {success}/{len(results)} files processed successfully")
    for key, output, err in results:
        if err:
            print(f"   ❌ {key}: {err}")
        else:
            print(f"   ✅ {key} → s3://{OUTPUT_BUCKET}/{output}")


if __name__ == "__main__":
    main()
