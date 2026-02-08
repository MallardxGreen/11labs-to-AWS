"""
Podcast Voice Tool — Web UI Server
ElevenLabs for TTS + AWS Translate for translation.
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import boto3
import requests
import io

app = Flask(__name__)
CORS(app)

# Change region_name to your preferred region; remove profile_name to use default credentials
session = boto3.Session(region_name="us-west-2")
translate_client = session.client("translate")
secrets_client = session.client("secretsmanager")

XI_API_KEY = secrets_client.get_secret_value(
    SecretId="elevenlabs-api-key"
)["SecretString"]

s3_client = session.client("s3")

OUTPUT_BUCKET = "my-podcast-output"
ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/app.js")
def js():
    return send_from_directory(".", "app.js")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    text = data.get("text", "").strip()
    target_lang = data.get("target_lang", "")
    voice_id = data.get("voice_id", "CwhRBWXzGAHq8TQ4Fs17")
    tuning = data.get("tuning", {})

    if not text:
        return jsonify({"error": "Text is required"}), 400

    try:
        translated_text = text
        if target_lang and target_lang != "en":
            result = translate_client.translate_text(
                Text=text,
                SourceLanguageCode="en",
                TargetLanguageCode=target_lang,
            )
            translated_text = result["TranslatedText"]

        stability = tuning.get("stability", 50) / 100.0
        similarity = tuning.get("similarity", 75) / 100.0
        style = tuning.get("style", 0) / 100.0

        response = requests.post(
            f"{ELEVENLABS_URL}/{voice_id}",
            headers={
                "xi-api-key": XI_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": translated_text,
                "model_id": "eleven_multilingual_v2",
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
            msg = detail.get("message", f"ElevenLabs error: {response.status_code}")
            return jsonify({"error": msg}), response.status_code

        return send_file(
            io.BytesIO(response.content),
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="podcast.mp3",
        ), 200, {
            "X-Translated-Text": translated_text if target_lang else "",
        }

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/save-to-s3", methods=["POST"])
def save_to_s3():
    """Save uploaded audio to S3 output bucket."""
    audio = request.files.get("audio")
    filename = request.form.get("filename", "episode.mp3")

    if not audio:
        return jsonify({"error": "No audio file provided"}), 400

    try:
        audio_bytes = audio.read()
        key = f"episodes/{filename}"

        s3_client.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=key,
            Body=audio_bytes,
            ContentType="audio/mpeg",
        )

        s3_url = f"s3://{OUTPUT_BUCKET}/{key}"
        return jsonify({"message": "Saved", "s3_url": s3_url, "key": key})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=8080, debug=True)
