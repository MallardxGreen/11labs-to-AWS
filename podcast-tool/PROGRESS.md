# Podcast Voice Tool — Progress Tracker

## Architecture
- **Translation**: Amazon Translate (free tier — 2M chars/month for 12 months)
- **Text-to-Speech**: ElevenLabs API (multilingual v2 model)
- **API Key Storage**: AWS Secrets Manager (`elevenlabs-api-key` in us-west-2)
- **Future infra**: S3 + CloudFront for audio hosting, Lambda + API Gateway for backend

## AWS Account
- Profile: (use your own AWS profile or default credentials)
- Region: (your chosen region)

## ElevenLabs
- API key stored in Secrets Manager under the name `elevenlabs-api-key`
- Cloned voices require Creator+ tier
- Free premade voices work for testing

## Available Free Voices (ElevenLabs)
| Name | Voice ID | Style |
|------|----------|-------|
| Roger | CwhRBWXzGAHq8TQ4Fs17 | Laid-back, casual male |
| George | JBFqnCBsd6RMkjVDRZzb | Warm British storyteller |
| Brian | nPczCjzI2devNBz1zQrb | Deep, resonant male |
| Daniel | onwK4e9ZLuTAKqWW03F9 | Steady British broadcaster |
| Alice | Xb7hH8MSUJpSbSDYk0k2 | Clear British educator |
| Matilda | XrExE9yKIg1WjnnlVkGX | Professional female |
| Joanna | cgSgspJ2msm6clMCkdW9 | Playful, warm female |
| Amy | EXAVITQu4vr4xnSDxMaL | Mature, confident female |

## Completed
- [x] AWS CLI configured
- [x] ElevenLabs API key stored in Secrets Manager
- [x] Tested ElevenLabs TTS with free voices — works
- [x] Tested AWS Polly — works but quality not podcast-grade
- [x] Tested Amazon Translate — works
- [x] Built local prototype with voice tuning sliders

## Current Phase: Prototype v2
- [x] Rebuild backend: ElevenLabs for TTS + AWS Translate for translation
- [x] Voice tuning via ElevenLabs voice_settings (stability, similarity_boost, style)
- [x] Language selector with auto-translation
- [x] Audio playback + download
- [x] Local CLI pipeline (input/ → output/) — tested, works
- [x] S3 pipeline (S3 input bucket → S3 output bucket) — tested, works
- [x] S3 buckets created: my-podcast-input, my-podcast-output
- [x] Architecture document created (docs/podcast-voice-pipeline.md)

## Future
- [ ] CloudFormation template for production deployment
- [ ] S3 bucket for audio storage
- [ ] CloudFront CDN for delivery
- [ ] Lambda + API Gateway backend
- [ ] RSS feed generation for podcast distribution
- [ ] Episode management UI
- [ ] Upgrade to Creator+ for cloned voice support
