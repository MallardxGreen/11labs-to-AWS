import json
import boto3
import base64

translate_client = boto3.client("translate")
polly_client = boto3.client("polly")

# Map language codes to Polly neural voices
LANG_VOICE_MAP = {
    "en": {"voice": "Matthew", "polly_lang": "en-US"},
    "es": {"voice": "Lucia", "polly_lang": "es-ES"},
    "fr": {"voice": "Lea", "polly_lang": "fr-FR"},
    "de": {"voice": "Vicki", "polly_lang": "de-DE"},
    "pt": {"voice": "Camila", "polly_lang": "pt-BR"},
    "it": {"voice": "Bianca", "polly_lang": "it-IT"},
    "ja": {"voice": "Takumi", "polly_lang": "ja-JP"},
    "ko": {"voice": "Seoyeon", "polly_lang": "ko-KR"},
    "zh": {"voice": "Zhiyu", "polly_lang": "cmn-CN"},
    "ar": {"voice": "Hala", "polly_lang": "ar-AE"},
    "nl": {"voice": "Laura", "polly_lang": "nl-NL"},
    "pl": {"voice": "Ola", "polly_lang": "pl-PL"},
    "sv": {"voice": "Elin", "polly_lang": "sv-SE"},
}

def cors_response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Content-Type": "application/json",
        },
        "body": json.dumps(body),
    }

def lambda_handler(event, context):
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return cors_response(200, {"message": "ok"})

    try:
        body = json.loads(event.get("body", "{}"))
        text = body.get("text", "").strip()
        target_lang = body.get("target_lang", "")
        voice_override = body.get("voice")

        if not text:
            return cors_response(400, {"error": "Text is required"})

        translated_text = text
        # Translate if target language is specified and not English
        if target_lang and target_lang != "en":
            result = translate_client.translate_text(
                Text=text,
                SourceLanguageCode="en",
                TargetLanguageCode=target_lang,
            )
            translated_text = result["TranslatedText"]

        # Pick the right voice for the language
        lang_key = target_lang if target_lang else "en"
        voice_config = LANG_VOICE_MAP.get(lang_key, LANG_VOICE_MAP["en"])
        voice_id = voice_override or voice_config["voice"]

        # Generate speech with Polly
        polly_response = polly_client.synthesize_speech(
            Text=translated_text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            Engine="neural",
        )

        audio_bytes = polly_response["AudioStream"].read()
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Content-Type": "application/json",
            },
            "body": json.dumps({
                "audio": audio_b64,
                "translated_text": translated_text if target_lang else None,
            }),
        }

    except Exception as e:
        return cors_response(500, {"error": str(e)})
