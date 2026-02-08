# 🎙️ PodCastTool

Turn any text file into a podcast episode using ElevenLabs voice AI and AWS — fully automated.

Drop a `.txt` file into an S3 bucket, and the pipeline translates it (optional), generates speech with a voice of your choice, and saves the MP3 to an output bucket. No servers to manage.

## How It Works

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌────────────┐     ┌──────────┐
│  Upload   │────▶│    S3    │────▶│  Lambda   │────▶│ ElevenLabs │────▶│    S3    │
│  .txt     │     │  Input   │     │ (Process) │     │   (TTS)    │     │  Output  │
└──────────┘     └──────────┘     └─────┬─────┘     └────────────┘     └──────────┘
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                        ┌─────▼─────┐     ┌───────▼───────┐
                        │ Translate │     │    Secrets    │
                        │ (optional)│     │    Manager   │
                        └───────────┘     └───────────────┘
```

## What You Need

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **S3** | Store input text + output audio | 5 GB/month |
| **Lambda** | Run the pipeline per upload | 1M requests/month |
| **Secrets Manager** | Store ElevenLabs API key | 30-day trial |
| **Amazon Translate** | Multi-language support | 2M chars/month (12 mo) |
| **ElevenLabs** | Text-to-speech engine | Limited chars/month |

## Voices

You can use **free premade voices** on ElevenLabs' free tier, or **your own cloned voice** with a Creator+ subscription.

| Voice | ID | Style |
|-------|----|-------|
| Roger | `CwhRBWXzGAHq8TQ4Fs17` | Laid-back, casual male |
| George | `JBFqnCBsd6RMkjVDRZzb` | Warm British storyteller |
| Brian | `nPczCjzI2devNBz1zQrb` | Deep, resonant male |
| Daniel | `onwK4e9ZLuTAKqWW03F9` | Steady British broadcaster |
| Alice | `Xb7hH8MSUJpSbSDYk0k2` | Clear British educator |
| Matilda | `XrExE9yKIg1WjnnlVkGX` | Professional female |

## Text File Format

Plain text works out of the box — Lambda uses Roger's voice in English by default.

For custom voice, language, or tuning, add a header above `---`:

```
lang: es
voice: JBFqnCBsd6RMkjVDRZzb
stability: 40
similarity: 80
style: 30
---
Welcome to the show. Today we're exploring how AI is changing
the way we create content. Stay tuned.
```

| Key | What It Does | Default |
|-----|-------------|---------|
| `lang` | Translate to this language (e.g. `es`, `fr`, `de`) | No translation |
| `voice` | ElevenLabs Voice ID | Roger |
| `stability` | 0 = expressive, 100 = consistent | 50 |
| `similarity` | 0 = broad, 100 = close to original | 75 |
| `style` | 0 = neutral, 100 = dramatic | 0 |

## Quick Start

```bash
# 1. Create S3 buckets
aws s3 mb s3://my-podcast-input --region YOUR_REGION
aws s3 mb s3://my-podcast-output --region YOUR_REGION

# 2. Store your ElevenLabs API key
aws secretsmanager create-secret \
  --name elevenlabs-api-key \
  --secret-string "YOUR_API_KEY" \
  --region YOUR_REGION

# 3. Deploy the Lambda function (see guide for IAM role setup)
zip function.zip podcast-tool/lambda/lambda_function.py
aws lambda create-function \
  --function-name podcast-pipeline \
  --runtime python3.12 \
  --handler lambda_function.lambda_handler \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/podcast-lambda-role \
  --zip-file fileb://function.zip \
  --timeout 60 --memory-size 256 \
  --environment "Variables={OUTPUT_BUCKET=my-podcast-output,SECRET_NAME=elevenlabs-api-key}" \
  --region YOUR_REGION

# 4. Add S3 trigger (fires Lambda on .txt uploads)
aws lambda add-permission \
  --function-name podcast-pipeline \
  --statement-id s3-trigger \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::my-podcast-input

# 5. Upload a text file — pipeline runs automatically
aws s3 cp my-episode.txt s3://my-podcast-input/

# 6. Check the output
aws s3 ls s3://my-podcast-output/
```

## Project Structure

```
podcast-tool/
├── guide/                  # Interactive step-by-step build guide (HTML)
│   ├── index.html
│   ├── app.js
│   ├── steps.js
│   └── styles.css
├── lambda/
│   └── lambda_function.py  # Production Lambda function
├── input/                  # Sample text files
│   ├── episode1.txt
│   └── episode2_spanish.txt
├── docs/
│   └── podcast-voice-pipeline.md
├── pipeline.py             # Local CLI pipeline (input/ → output/)
├── pipeline_s3.py          # S3-to-S3 pipeline (simulates Lambda locally)
├── server.py               # Flask web UI for interactive testing
├── index.html              # Web UI frontend
├── app.js                  # Web UI frontend logic
└── template.yaml           # SAM template (future use)
```

## Interactive Guide

A full step-by-step build guide is included as a web app:

```bash
cd podcast-tool/guide
python3 -m http.server 8090
# Open http://localhost:8090
```

## Local Testing

```bash
pip install boto3 requests flask flask-cors

# CLI pipeline — reads from input/, writes to output/
python podcast-tool/pipeline.py

# Web UI — interactive voice testing
python podcast-tool/server.py
# Open http://localhost:8080

# S3 pipeline — reads/writes S3 buckets (simulates Lambda)
python podcast-tool/pipeline_s3.py
```

## License

This is a proof of concept for educational purposes.
