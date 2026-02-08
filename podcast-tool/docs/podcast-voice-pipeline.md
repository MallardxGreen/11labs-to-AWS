# Podcast Voice Pipeline — Build Guide

Turn any text into a podcast episode using your own cloned voice. This guide walks you through the end-to-end workflow: from setting up your voice clone, to storing text in S3, to generating audio automatically.

## What You're Building

A pipeline that takes a text file, optionally translates it, converts it to speech using your cloned voice, and outputs a podcast-ready MP3.

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  Text File   │────▶│   Translate   │────▶│  ElevenLabs   │────▶│  MP3 Audio  │
│  (S3 bucket) │     │ (AWS Native)  │     │  (Your Voice) │     │ (S3 bucket) │
└─────────────┘     └──────────────┘     └───────────────┘     └─────────────┘
                                                                       │
                                                                       ▼
                                                               ┌─────────────┐
                                                               │  CloudFront  │
                                                               │  (Delivery)  │
                                                               └─────────────┘
```

---

## Part 1: ElevenLabs Setup (Your Voice)

### 1.1 Create an Account
- Go to [elevenlabs.io](https://elevenlabs.io) and sign up
- Free tier works for testing with premade voices
- **Creator+ tier** required for voice cloning

### 1.2 Clone Your Voice (Creator+ only)
1. Go to **Voices** → **Add Voice** → **Instant Voice Cloning**
2. Upload audio samples of your voice (at least 1 minute of clean audio)
3. Name your voice and create it
4. Note your **Voice ID** — you'll need this later

### 1.3 Get Your API Key
1. Click your profile icon → **Profile + API key**
2. Copy your API key

### 1.4 API Key Permissions
When creating or scoping your API key, set these permissions:

| Permission | Access Level | Why |
|---|---|---|
| Text to Speech | Access | Core feature — generates audio |
| Voices | Read | Looks up your cloned voice |
| Models | Access | Lists available models |
| Everything else | No Access | Minimize risk |

> Set a monthly credit limit to avoid surprise charges during testing.

---

## Part 2: AWS Setup

### 2.1 Prerequisites
- AWS account with CLI access
- AWS SSO or IAM credentials configured
- Python 3.9+ installed

### 2.2 Store Your API Key Securely
Never hardcode API keys. Store them in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name elevenlabs-api-key \
  --description "ElevenLabs API key for podcast pipeline" \
  --secret-string "YOUR_API_KEY_HERE" \
  --region us-west-2
```

### 2.3 Create S3 Buckets
You need two buckets — one for input text files, one for output audio:

```bash
# Input bucket (where you drop text files)
aws s3 mb s3://my-podcast-input --region us-west-2

# Output bucket (where MP3s land)
aws s3 mb s3://my-podcast-output --region us-west-2
```

### 2.4 AWS Services Used & Free Tier

| Service | What It Does | Free Tier |
|---|---|---|
| S3 | Stores text input + audio output | 5GB storage, 20K GET, 2K PUT/month |
| Secrets Manager | Stores ElevenLabs API key | 30-day free trial |
| Amazon Translate | Translates text to other languages | 2M chars/month for 12 months |
| Lambda (future) | Runs the pipeline automatically | 1M requests/month |
| CloudFront (future) | Delivers audio globally | 1TB transfer/month for 12 months |

---

## Part 3: The Pipeline — How It Works

### 3.1 Local Test Flow
For testing, the pipeline runs locally as a Python script:

```
input/ folder → pipeline.py reads .txt files → translates (optional) →
calls ElevenLabs → saves .mp3 to output/ folder
```

### 3.2 Production Flow (Future)
Once validated, this moves to AWS:

```
S3 input bucket → S3 Event → Lambda → Translate → ElevenLabs → S3 output bucket → CloudFront
```

### 3.3 Pipeline Script Behavior
1. Watches the `input/` folder (or S3 bucket) for `.txt` files
2. Reads the text content
3. Checks for a language header (e.g., `lang: es`) at the top of the file
4. If a language is specified, translates via Amazon Translate
5. Sends the text to ElevenLabs with your voice settings
6. Saves the MP3 to `output/` (or S3 output bucket)
7. Logs the result

### 3.4 Text File Format
```
lang: es
voice: CwhRBWXzGAHq8TQ4Fs17
stability: 50
similarity: 75
style: 20
---
Welcome to my podcast. Today we're going to talk about building
voice applications on AWS. This is going to be a great episode.
```

The header is optional. If omitted, defaults are used (English, default voice, default tuning).

---

## Part 4: Voice Tuning Guide

ElevenLabs gives you three main knobs to shape how the voice sounds:

| Setting | Range | What It Does |
|---|---|---|
| Stability | 0–100 | Low = more expressive/varied, High = more consistent/predictable |
| Clarity (Similarity Boost) | 0–100 | Low = softer/broader, High = closer to original voice |
| Style | 0–100 | Low = neutral delivery, High = more dramatic/emotional |

### Recommended Starting Points

| Use Case | Stability | Clarity | Style |
|---|---|---|---|
| News/informational | 70 | 80 | 10 |
| Casual conversation | 45 | 70 | 30 |
| Storytelling/narrative | 35 | 75 | 50 |
| Dramatic reading | 25 | 80 | 70 |

---

## Part 5: Available Premade Voices (Free Tier)

If you don't have Creator+ for voice cloning, these premade voices work well for podcasts:

| Voice | ID | Style |
|---|---|---|
| Roger | CwhRBWXzGAHq8TQ4Fs17 | Laid-back, casual male |
| George | JBFqnCBsd6RMkjVDRZzb | Warm British storyteller |
| Brian | nPczCjzI2devNBz1zQrb | Deep, resonant male |
| Daniel | onwK4e9ZLuTAKqWW03F9 | Steady British broadcaster |
| Alice | Xb7hH8MSUJpSbSDYk0k2 | Clear British educator |
| Matilda | XrExE9yKIg1WjnnlVkGX | Professional female |
| Jessica | cgSgspJ2msm6clMCkdW9 | Playful, warm female |
| Sarah | EXAVITQu4vr4xnSDxMaL | Mature, confident female |

---

## Part 6: Running the Local Test

### 6.1 Install Dependencies
```bash
pip install boto3 requests flask flask-cors
```

### 6.2 Test the Pipeline (CLI)
Drop a text file in the `input/` folder and run:
```bash
python pipeline.py
```
It will process all `.txt` files and output `.mp3` files to `output/`.

### 6.3 Test with the Web UI
```bash
python server.py
```
Open http://localhost:8080 — type text, pick a voice, tune it, generate audio.

### 6.4 Test the S3 Flow
Upload a text file to your S3 input bucket:
```bash
aws s3 cp input/my-episode.txt s3://my-podcast-input/
```
Run the S3 version of the pipeline:
```bash
python pipeline_s3.py
```
Check the output bucket:
```bash
aws s3 ls s3://my-podcast-output/
```

---

## Part 7: What's Next

Once you've validated the pipeline works:

1. **Deploy to Lambda** — wrap `pipeline.py` in a Lambda handler, trigger on S3 events
2. **Add CloudFront** — serve the output bucket through a CDN for fast global delivery
3. **RSS feed** — generate a podcast RSS feed from the output bucket for distribution to Apple Podcasts, Spotify, etc.
4. **Episode management** — build a simple UI to manage episodes, reorder, add metadata
5. **CloudFormation template** — package everything for repeatable deployment
