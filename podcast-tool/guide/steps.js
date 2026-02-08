const STEPS = [
{
    id: "overview",
    title: "Architecture Overview",
    icon: "🏗️",
    content: `
<span class="step-badge">Overview</span>
<h1>Podcast Voice Pipeline</h1>
<p>Turn any text file into a podcast episode using your own voice — or a free premade voice. This guide walks you through building an event-driven pipeline on AWS that automatically converts text to speech when a file is uploaded to S3.</p>

<h2>What You're Building</h2>
<div class="flow-diagram">
    <div class="flow-box aws"><div class="icon">📄</div><div class="label">S3 Input</div><div class="sublabel">Upload .txt</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">⚡</div><div class="label">Lambda</div><div class="sublabel">Process text</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">🌐</div><div class="label">Translate</div><div class="sublabel">Optional</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box elevenlabs"><div class="icon">🎙️</div><div class="label">ElevenLabs</div><div class="sublabel">Generate MP3</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">📦</div><div class="label">S3 Output</div><div class="sublabel">Store MP3</div></div>
</div>

<div class="branch-diagram">
    <p style="color:#888; font-size:0.85rem; margin-bottom:0.75rem;">Lambda also connects to:</p>
    <div class="branch-row">
        <div class="flow-box aws" style="min-width:100px;"><div class="icon">🔐</div><div class="label">Secrets Manager</div><div class="sublabel">API Key Store</div></div>
    </div>
</div>

<h2>How It Works</h2>
<div class="sequence">
    <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">Upload a <code>.txt</code> file to an S3 bucket — a podcast script, blog post, or any text</div></div>
    <div class="seq-row"><div class="step-circle">2</div><div class="seq-text">S3 fires an event notification that triggers <span class="seq-service aws">Lambda</span> automatically</div></div>
    <div class="seq-row"><div class="step-circle">3</div><div class="seq-text">Lambda reads the text, optionally translates it with <span class="seq-service aws">Amazon Translate</span></div></div>
    <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">Lambda calls <span class="seq-service el">ElevenLabs</span> to generate speech using your chosen voice</div></div>
    <div class="seq-row"><div class="step-circle">5</div><div class="seq-text">The MP3 is saved to an output S3 bucket — done</div></div>
</div>

<h2>Voices: Free or Cloned</h2>
<div class="flow-diagram">
    <div class="flow-box elevenlabs"><div class="icon">🆓</div><div class="label">Free Tier</div><div class="sublabel">Premade voices</div></div>
    <div class="flow-arrow">or</div>
    <div class="flow-box user"><div class="icon">🎤</div><div class="label">Creator+ Tier</div><div class="sublabel">Your cloned voice</div></div>
</div>
<p>You don't need a paid plan to use this pipeline. ElevenLabs offers high-quality premade voices on the free tier. If you want to use your own cloned voice, you'll need a Creator+ subscription.</p>

<h2>AWS Services & Free Tier</h2>
<table>
    <tr><th>Service</th><th>Role</th><th>Free Tier</th></tr>
    <tr><td>S3</td><td>Input text + output audio storage</td><td>5 GB, 20K GET, 2K PUT/month</td></tr>
    <tr><td>Lambda</td><td>Runs the pipeline on each upload</td><td>1M requests/month</td></tr>
    <tr><td>Secrets Manager</td><td>Stores ElevenLabs API key</td><td>30-day trial</td></tr>
    <tr><td>Amazon Translate</td><td>Multi-language support</td><td>2M chars/month (12 months)</td></tr>
</table>

<h2>Resource Creation Order</h2>
<div class="sequence">
    <div class="seq-row"><div class="step-circle">1</div><div class="seq-text"><strong>ElevenLabs</strong> — get your account and API key first</div></div>
    <div class="seq-row"><div class="step-circle">2</div><div class="seq-text"><strong>S3 Buckets</strong> — create input and output buckets</div></div>
    <div class="seq-row"><div class="step-circle">3</div><div class="seq-text"><strong>Secrets Manager</strong> — store your API key securely</div></div>
    <div class="seq-row"><div class="step-circle">4</div><div class="seq-text"><strong>Lambda Function</strong> — deploy the pipeline code</div></div>
    <div class="seq-row"><div class="step-circle">5</div><div class="seq-text"><strong>S3 Event Trigger</strong> — wire S3 uploads to Lambda</div></div>
    <div class="seq-row"><div class="step-circle">6</div><div class="seq-text"><strong>Test</strong> — upload a text file and verify</div></div>
</div>

<div class="info-box note">
    <strong>💡 What you bring:</strong>
    An ElevenLabs account with an API key. Free tier works with premade voices. Creator+ tier if you want to use your own cloned voice.
</div>
`
},
{
    id: "elevenlabs",
    title: "ElevenLabs Setup",
    icon: "🎙️",
    content: `
<span class="step-badge">Step 1</span>
<h1>Set Up ElevenLabs</h1>
<p>ElevenLabs provides the voice engine. You'll create an account, pick a voice (or clone your own), and get an API key.</p>

<h2>1.1 Create an Account</h2>
<p>Go to <a href="https://elevenlabs.io" style="color:#a78bfa;">elevenlabs.io</a> and sign up. The free tier gives you limited characters per month — enough for testing.</p>

<h2>1.2 Choose Your Voice</h2>
<p>You have two options depending on your ElevenLabs plan:</p>

<div class="tabs">
    <button class="tab-btn active" onclick="switchTab(event, 'voice-free')">Free Premade Voices</button>
    <button class="tab-btn" onclick="switchTab(event, 'voice-cloned')">Cloned Voice (Creator+)</button>
</div>
<div id="voice-free" class="tab-content active">
    <p>These premade voices are available on the free tier and work great for podcasts:</p>
    <table>
        <tr><th>Voice</th><th>Voice ID</th><th>Style</th></tr>
        <tr><td>Roger</td><td><code>CwhRBWXzGAHq8TQ4Fs17</code></td><td>Laid-back, casual male</td></tr>
        <tr><td>George</td><td><code>JBFqnCBsd6RMkjVDRZzb</code></td><td>Warm British storyteller</td></tr>
        <tr><td>Brian</td><td><code>nPczCjzI2devNBz1zQrb</code></td><td>Deep, resonant male</td></tr>
        <tr><td>Daniel</td><td><code>onwK4e9ZLuTAKqWW03F9</code></td><td>Steady British broadcaster</td></tr>
        <tr><td>Alice</td><td><code>Xb7hH8MSUJpSbSDYk0k2</code></td><td>Clear British educator</td></tr>
        <tr><td>Matilda</td><td><code>XrExE9yKIg1WjnnlVkGX</code></td><td>Professional female</td></tr>
    </table>
    <div class="info-box tip">
        <strong>✅ No paid plan needed</strong>
        Pick any voice from the table above and copy the Voice ID. You'll use this in your text files later.
    </div>
</div>
<div id="voice-cloned" class="tab-content">
    <p>With a Creator+ subscription, you can clone your own voice:</p>
    <div class="sequence">
        <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">Go to <strong>Voices</strong> → <strong>Add Voice</strong> → <strong>Instant Voice Cloning</strong></div></div>
        <div class="seq-row"><div class="step-circle">2</div><div class="seq-text">Upload audio samples of your voice (at least 1 minute of clean audio)</div></div>
        <div class="seq-row"><div class="step-circle">3</div><div class="seq-text">Name your voice and click Create</div></div>
        <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">Copy your <strong>Voice ID</strong> from the voice settings</div></div>
    </div>
    <h3>Tips for Good Clones</h3>
    <ul class="checklist">
        <li>Use a quiet room with no background noise</li>
        <li>Speak naturally — don't read robotically</li>
        <li>Include varied sentences (questions, statements, exclamations)</li>
        <li>More samples = better clone (3-5 minutes ideal)</li>
        <li>Use a decent microphone — phone voice memos work in a pinch</li>
    </ul>
</div>

<h2>1.3 Get Your API Key</h2>
<p>Click your profile icon → <strong>Profile + API key</strong> → Copy the key.</p>

<h2>1.4 Set API Key Permissions</h2>
<p>When scoping your key, only enable what you need:</p>
<table>
    <tr><th>Permission</th><th>Level</th><th>Why</th></tr>
    <tr><td>Text to Speech</td><td>✅ Access</td><td>Core — generates audio from text</td></tr>
    <tr><td>Voices</td><td>✅ Read</td><td>Looks up your voice ID</td></tr>
    <tr><td>Models</td><td>✅ Access</td><td>Lists available TTS models</td></tr>
    <tr><td>Everything else</td><td>❌ No Access</td><td>Minimize risk if key leaks</td></tr>
</table>

<div class="info-box warn">
    <strong>⚠️ Set a credit limit</strong>
    Set a monthly cap on your API key to avoid surprise charges during development and testing.
</div>

<div class="info-box note">
    <strong>💡 Save your API key somewhere safe</strong>
    You'll need it in Step 3 when you store it in AWS Secrets Manager. Don't put it in code or commit it to a repo.
</div>
`
},
{
    id: "s3-buckets",
    title: "Create S3 Buckets",
    icon: "📦",
    content: `
<span class="step-badge">Step 2</span>
<h1>Create S3 Buckets</h1>
<p>You need two S3 buckets: one for your input text files and one for the generated MP3 audio. Create these first — they're referenced by everything else.</p>

<h2>What You're Creating</h2>
<div class="flow-diagram">
    <div class="flow-box aws"><div class="icon">📥</div><div class="label">Input Bucket</div><div class="sublabel">my-podcast-input</div></div>
    <div class="flow-arrow"><span>Lambda reads</span>→</div>
    <div class="flow-box aws"><div class="icon">⚡</div><div class="label">Lambda</div><div class="sublabel">Processes text</div></div>
    <div class="flow-arrow"><span>Lambda writes</span>→</div>
    <div class="flow-box aws"><div class="icon">📤</div><div class="label">Output Bucket</div><div class="sublabel">my-podcast-output</div></div>
</div>

<div class="tabs">
    <button class="tab-btn active" onclick="switchTab(event, 's3-cli')">CLI</button>
    <button class="tab-btn" onclick="switchTab(event, 's3-console')">Console</button>
</div>
<div id="s3-cli" class="tab-content active">
    <div class="code-block">
        <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
        <pre><code># Replace YOUR_REGION with your preferred AWS region (e.g. us-east-1, eu-west-1, etc.)

# Create input bucket (where you upload text files)
aws s3 mb s3://my-podcast-input --region YOUR_REGION

# Create output bucket (where MP3s are saved)
aws s3 mb s3://my-podcast-output --region YOUR_REGION</code></pre>
    </div>
    <div class="info-box note">
        <strong>💡 Pick the region closest to you</strong>
        Use whatever AWS region makes sense for your location. All resources (S3, Lambda, Secrets Manager) should be in the <strong>same region</strong>.
    </div>
</div>
<div id="s3-console" class="tab-content">
    <div class="sequence">
        <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">Open <strong>AWS Console</strong> → <strong>S3</strong></div></div>
        <div class="seq-row"><div class="step-circle">2</div><div class="seq-text">Click <strong>Create bucket</strong></div></div>
        <div class="seq-row"><div class="step-circle">3</div><div class="seq-text">Name: <code>my-podcast-input</code>, Region: pick the region closest to you</div></div>
        <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">Leave defaults, click <strong>Create bucket</strong></div></div>
        <div class="seq-row"><div class="step-circle">5</div><div class="seq-text">Repeat for <code>my-podcast-output</code></div></div>
    </div>
</div>

<div class="info-box warn">
    <strong>⚠️ Bucket names must be globally unique</strong>
    If <code>my-podcast-input</code> is taken, add your name or a random suffix, e.g. <code>my-podcast-input-jsmith-2024</code>. Just remember to use your actual bucket names in all later steps.
</div>

<h2>Verify</h2>
<div class="code-block">
    <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
    <pre><code># List your buckets to confirm
aws s3 ls | grep podcast</code></pre>
</div>

<p>You should see both buckets listed. These are the foundation — Lambda will read from the input bucket and write to the output bucket.</p>
`
},
{
    id: "secrets-manager",
    title: "Store API Key",
    icon: "🔐",
    content: `
<span class="step-badge">Step 3</span>
<h1>Store Your API Key in Secrets Manager</h1>
<p>Never hardcode API keys in your code. AWS Secrets Manager encrypts and stores them securely, and your Lambda function retrieves the key at runtime.</p>

<h2>Why Secrets Manager?</h2>
<div class="flow-diagram">
    <div class="flow-box user"><div class="icon">🔑</div><div class="label">Your API Key</div><div class="sublabel">From Step 1</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">🔐</div><div class="label">Secrets Manager</div><div class="sublabel">Encrypted at rest</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">⚡</div><div class="label">Lambda</div><div class="sublabel">Reads at runtime</div></div>
</div>

<p>Your API key is encrypted at rest, never in your code or repo, and Lambda pulls it at runtime. If the key leaks, you rotate it in one place.</p>

<div class="tabs">
    <button class="tab-btn active" onclick="switchTab(event, 'secret-cli')">CLI</button>
    <button class="tab-btn" onclick="switchTab(event, 'secret-console')">Console</button>
</div>
<div id="secret-cli" class="tab-content active">
    <div class="code-block">
        <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
        <pre><code># Replace YOUR_REGION with the same region you used for your S3 buckets
aws secretsmanager create-secret \\
  --name elevenlabs-api-key \\
  --description "ElevenLabs API key for podcast pipeline" \\
  --secret-string "YOUR_ELEVENLABS_API_KEY_HERE" \\
  --region YOUR_REGION</code></pre>
    </div>
    <p>Replace <code>YOUR_ELEVENLABS_API_KEY_HERE</code> with the API key from Step 1, and <code>YOUR_REGION</code> with the same region you chose for your S3 buckets.</p>
</div>
<div id="secret-console" class="tab-content">
    <div class="sequence">
        <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">Open <strong>AWS Console</strong> → <strong>Secrets Manager</strong> (make sure you're in the same region as your S3 buckets)</div></div>
        <div class="seq-row"><div class="step-circle">2</div><div class="seq-text">Click <strong>Store a new secret</strong></div></div>
        <div class="seq-row"><div class="step-circle">3</div><div class="seq-text">Choose <strong>Other type of secret</strong></div></div>
        <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">In Plaintext, paste your ElevenLabs API key</div></div>
        <div class="seq-row"><div class="step-circle">5</div><div class="seq-text">Click Next, name it <code>elevenlabs-api-key</code></div></div>
        <div class="seq-row"><div class="step-circle">6</div><div class="seq-text">Click through the remaining steps and save</div></div>
    </div>
</div>

<h2>Verify</h2>
<div class="code-block">
    <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
    <pre><code># Confirm the secret exists
aws secretsmanager describe-secret \\
  --secret-id elevenlabs-api-key \\
  --region YOUR_REGION</code></pre>
</div>

<div class="info-box tip">
    <strong>✅ Secret name matters</strong>
    The Lambda function in Step 4 looks for a secret named <code>elevenlabs-api-key</code> by default. If you use a different name, you'll set it as an environment variable on the Lambda function.
</div>
`
},
{
    id: "lambda",
    title: "Create Lambda Function",
    icon: "⚡",
    content: `
<span class="step-badge">Step 4</span>
<h1>Create the Lambda Function</h1>
<p>This is the brain of the pipeline. Lambda reads your text file from S3, optionally translates it, calls ElevenLabs to generate audio, and saves the MP3 back to S3.</p>

<h2>What Lambda Does</h2>
<div class="flow-diagram">
    <div class="flow-box aws"><div class="icon">📄</div><div class="label">Read from S3</div><div class="sublabel">Get .txt file</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">🔐</div><div class="label">Secrets Mgr</div><div class="sublabel">Get API key</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">🌐</div><div class="label">Translate</div><div class="sublabel">Optional</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box elevenlabs"><div class="icon">🎙️</div><div class="label">ElevenLabs</div><div class="sublabel">Generate audio</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">📤</div><div class="label">Save to S3</div><div class="sublabel">Output MP3</div></div>
</div>

<h2>4.1 Create the IAM Role</h2>
<p>Lambda needs permissions to access S3, Secrets Manager, Translate, and CloudWatch Logs.</p>

<div class="tabs">
    <button class="tab-btn active" onclick="switchTab(event, 'iam-cli')">CLI</button>
    <button class="tab-btn" onclick="switchTab(event, 'iam-console')">Console</button>
    <button class="tab-btn" onclick="switchTab(event, 'iam-policy')">Policy JSON</button>
</div>
<div id="iam-cli" class="tab-content active">
    <div class="code-block">
        <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
        <pre><code># 1. Create the trust policy file
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# 2. Create the role
aws iam create-role \\
  --role-name podcast-lambda-role \\
  --assume-role-policy-document file://trust-policy.json

# 3. Attach the permissions policy (see Policy JSON tab)
aws iam put-role-policy \\
  --role-name podcast-lambda-role \\
  --policy-name podcast-pipeline-permissions \\
  --policy-document file://permissions-policy.json

# 4. Attach basic Lambda execution (CloudWatch logs)
aws iam attach-role-policy \\
  --role-name podcast-lambda-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole</code></pre>
    </div>
</div>
<div id="iam-console" class="tab-content">
    <div class="sequence">
        <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">Open <strong>IAM Console</strong> → <strong>Roles</strong> → <strong>Create role</strong></div></div>
        <div class="seq-row"><div class="step-circle">2</div><div class="seq-text">Trusted entity: <strong>AWS Service</strong> → <strong>Lambda</strong></div></div>
        <div class="seq-row"><div class="step-circle">3</div><div class="seq-text">Attach <strong>AWSLambdaBasicExecutionRole</strong></div></div>
        <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">Name it <code>podcast-lambda-role</code>, create it</div></div>
        <div class="seq-row"><div class="step-circle">5</div><div class="seq-text">Open the role, add an inline policy using the JSON from the Policy JSON tab</div></div>
    </div>
</div>
<div id="iam-policy" class="tab-content">
    <div class="code-block">
        <div class="code-header"><span class="lang">json — permissions-policy.json</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
        <pre><code>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR-INPUT-BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::YOUR-OUTPUT-BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:*:*:secret:elevenlabs-api-key-*"
    },
    {
      "Effect": "Allow",
      "Action": ["translate:TranslateText"],
      "Resource": "*"
    }
  ]
}</code></pre>
    </div>
    <div class="info-box tip">
        <strong>✅ Least privilege</strong>
        Replace <code>YOUR-INPUT-BUCKET</code> and <code>YOUR-OUTPUT-BUCKET</code> with your actual bucket names. This policy only allows reading from input, writing to output, reading one secret, and calling Translate.
    </div>
</div>

<h2>4.2 Lambda Function Code</h2>
<p>This is the complete Lambda function. Copy this into a file called <code>lambda_function.py</code>.</p>

<div class="code-block">
    <div class="code-header"><span class="lang">python — lambda_function.py</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
    <pre><code>import json
import os
import boto3
import urllib3

s3 = boto3.client("s3")
translate_client = boto3.client("translate")
secrets_client = boto3.client("secretsmanager")

OUTPUT_BUCKET = os.environ.get("OUTPUT_BUCKET", "my-podcast-output")
SECRET_NAME = os.environ.get("SECRET_NAME", "elevenlabs-api-key")
ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"

# Defaults — Roger is a free premade voice
DEFAULT_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"
DEFAULT_MODEL = "eleven_multilingual_v2"

# Cache the API key across warm invocations
_api_key_cache = None
http = urllib3.PoolManager()


def get_api_key():
    global _api_key_cache
    if _api_key_cache is None:
        resp = secrets_client.get_secret_value(SecretId=SECRET_NAME)
        _api_key_cache = resp["SecretString"]
    return _api_key_cache


def parse_text_file(content):
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


def translate_text(text, target_lang):
    result = translate_client.translate_text(
        Text=text, SourceLanguageCode="en",
        TargetLanguageCode=target_lang,
    )
    return result["TranslatedText"]


def generate_audio(api_key, text, voice_id, stability, similarity, style):
    body = json.dumps({
        "text": text,
        "model_id": DEFAULT_MODEL,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity,
            "style": style,
            "use_speaker_boost": True,
        },
    })
    resp = http.request(
        "POST", f"{ELEVENLABS_URL}/{voice_id}",
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        body=body,
    )
    if resp.status != 200:
        raise Exception(f"ElevenLabs error {resp.status}: {resp.data.decode()}")
    return resp.data


def lambda_handler(event, context):
    record = event["Records"][0]["s3"]
    bucket = record["bucket"]["name"]
    key = record["object"]["key"]
    print(f"Processing: s3://{bucket}/{key}")

    obj = s3.get_object(Bucket=bucket, Key=key)
    content = obj["Body"].read().decode("utf-8")

    config, text = parse_text_file(content)
    lang = config.get("lang", "")
    voice_id = config.get("voice", DEFAULT_VOICE_ID)
    stability = float(config.get("stability", "50")) / 100
    similarity = float(config.get("similarity", "75")) / 100
    style = float(config.get("style", "0")) / 100

    if lang and lang != "en":
        print(f"Translating to: {lang}")
        text = translate_text(text, lang)

    api_key = get_api_key()
    print(f"Generating audio: voice={voice_id}")
    audio = generate_audio(api_key, text, voice_id, stability, similarity, style)

    name = os.path.splitext(os.path.basename(key))[0]
    output_key = f"{name}.mp3" if not lang else f"{name}_{lang}.mp3"

    s3.put_object(
        Bucket=OUTPUT_BUCKET, Key=output_key,
        Body=audio, ContentType="audio/mpeg",
    )
    print(f"Saved: s3://{OUTPUT_BUCKET}/{output_key} ({len(audio)} bytes)")

    return {"statusCode": 200, "body": json.dumps({
        "input": f"s3://{bucket}/{key}",
        "output": f"s3://{OUTPUT_BUCKET}/{output_key}",
        "translated": bool(lang),
    })}</code></pre>
</div>

<div class="info-box note">
    <strong>💡 Key things to notice:</strong>
    <p style="margin:0.5rem 0 0.25rem;">• <code>get_api_key()</code> — pulls from Secrets Manager and caches across warm invocations</p>
    <p style="margin:0.25rem 0;">• <code>parse_text_file()</code> — reads the optional header above <code>---</code> for lang, voice, and tuning</p>
    <p style="margin:0.25rem 0;">• Uses <code>urllib3</code> (included in Lambda runtime) — no extra dependencies needed</p>
    <p style="margin:0.25rem 0;">• Environment variables <code>OUTPUT_BUCKET</code> and <code>SECRET_NAME</code> keep it configurable</p>
</div>

<h2>4.3 Deploy the Function</h2>
<div class="tabs">
    <button class="tab-btn active" onclick="switchTab(event, 'deploy-cli')">CLI</button>
    <button class="tab-btn" onclick="switchTab(event, 'deploy-console')">Console</button>
</div>
<div id="deploy-cli" class="tab-content active">
    <div class="code-block">
        <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
        <pre><code># 1. Package the function
zip function.zip lambda_function.py

# 2. Create the Lambda function
# Replace YOUR_ACCOUNT_ID and YOUR_REGION
aws lambda create-function \\
  --function-name podcast-pipeline \\
  --runtime python3.12 \\
  --handler lambda_function.lambda_handler \\
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/podcast-lambda-role \\
  --zip-file fileb://function.zip \\
  --timeout 60 --memory-size 256 \\
  --environment "Variables={OUTPUT_BUCKET=my-podcast-output,SECRET_NAME=elevenlabs-api-key}" \\
  --region YOUR_REGION</code></pre>
    </div>
</div>
<div id="deploy-console" class="tab-content">
    <div class="sequence">
        <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">Open <strong>Lambda Console</strong> → <strong>Create function</strong></div></div>
        <div class="seq-row"><div class="step-circle">2</div><div class="seq-text">Name: <code>podcast-pipeline</code>, Runtime: <strong>Python 3.12</strong></div></div>
        <div class="seq-row"><div class="step-circle">3</div><div class="seq-text">Under Permissions, choose <strong>Use an existing role</strong> → <code>podcast-lambda-role</code></div></div>
        <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">Create the function, then paste the code above into the editor</div></div>
        <div class="seq-row"><div class="step-circle">5</div><div class="seq-text">Go to <strong>Configuration</strong> → <strong>General</strong> → set timeout to <strong>60 seconds</strong>, memory to <strong>256 MB</strong></div></div>
        <div class="seq-row"><div class="step-circle">6</div><div class="seq-text">Go to <strong>Configuration</strong> → <strong>Environment variables</strong> → add:<br><code>OUTPUT_BUCKET</code> = your output bucket name<br><code>SECRET_NAME</code> = <code>elevenlabs-api-key</code></div></div>
        <div class="seq-row"><div class="step-circle">7</div><div class="seq-text">Click <strong>Deploy</strong></div></div>
    </div>
</div>
`
},
{
    id: "event-trigger",
    title: "S3 Event Trigger",
    icon: "🔔",
    content: `
<span class="step-badge">Step 5</span>
<h1>Set Up the S3 → Lambda Trigger</h1>
<p>This is where it becomes fully automated. Instead of running a script manually, S3 triggers Lambda every time a <code>.txt</code> file is uploaded.</p>

<h2>How S3 Event Notifications Work</h2>
<div class="flow-diagram">
    <div class="flow-box user"><div class="icon">👤</div><div class="label">You</div><div class="sublabel">Upload .txt</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">📥</div><div class="label">S3 Bucket</div><div class="sublabel">Detects new file</div></div>
    <div class="flow-arrow"><span>Event</span>→</div>
    <div class="flow-box aws"><div class="icon">📨</div><div class="label">S3 Notification</div><div class="sublabel">ObjectCreated</div></div>
    <div class="flow-arrow"><span>Trigger</span>→</div>
    <div class="flow-box aws"><div class="icon">⚡</div><div class="label">Lambda</div><div class="sublabel">Processes file</div></div>
</div>

<h2>What Lambda Receives</h2>
<p>When S3 triggers Lambda, it sends a JSON event with the bucket and file info:</p>
<div class="code-block">
    <div class="code-header"><span class="lang">json — S3 Event Payload</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
    <pre><code>{
  "Records": [
    {
      "s3": {
        "bucket": { "name": "my-podcast-input" },
        "object": { "key": "episode3.txt", "size": 1024 }
      }
    }
  ]
}</code></pre>
</div>

<h2>Configure the Trigger</h2>
<div class="tabs">
    <button class="tab-btn active" onclick="switchTab(event, 'trigger-cli')">CLI</button>
    <button class="tab-btn" onclick="switchTab(event, 'trigger-console')">Console</button>
</div>
<div id="trigger-cli" class="tab-content active">
    <div class="code-block">
        <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
        <pre><code># 1. Allow S3 to invoke the Lambda
aws lambda add-permission \\
  --function-name podcast-pipeline \\
  --statement-id s3-trigger \\
  --action lambda:InvokeFunction \\
  --principal s3.amazonaws.com \\
  --source-arn arn:aws:s3:::my-podcast-input \\
  --region YOUR_REGION

# 2. Add the S3 event notification
# Replace YOUR_ACCOUNT_ID and YOUR_REGION
aws s3api put-bucket-notification-configuration \\
  --bucket my-podcast-input \\
  --notification-configuration '{
    "LambdaFunctionConfigurations": [{
      "LambdaFunctionArn": "arn:aws:lambda:YOUR_REGION:YOUR_ACCOUNT_ID:function:podcast-pipeline",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [{"Name": "suffix", "Value": ".txt"}]
        }
      }
    }]
  }'</code></pre>
    </div>
</div>
<div id="trigger-console" class="tab-content">
    <div class="sequence">
        <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">Open <strong>Lambda Console</strong> → select <code>podcast-pipeline</code></div></div>
        <div class="seq-row"><div class="step-circle">2</div><div class="seq-text">Click <strong>Add trigger</strong> → select <strong>S3</strong></div></div>
        <div class="seq-row"><div class="step-circle">3</div><div class="seq-text">Bucket: <code>my-podcast-input</code></div></div>
        <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">Event type: <strong>All object create events</strong></div></div>
        <div class="seq-row"><div class="step-circle">5</div><div class="seq-text">Suffix filter: <code>.txt</code></div></div>
        <div class="seq-row"><div class="step-circle">6</div><div class="seq-text">Click <strong>Add</strong> — done</div></div>
    </div>
</div>

<div class="info-box note">
    <strong>💡 The suffix filter is important</strong>
    It ensures Lambda only triggers on <code>.txt</code> files, not on any other file type you might upload to the bucket.
</div>
`
},
{
    id: "text-format",
    title: "Write & Upload Text Files",
    icon: "📄",
    content: `
<span class="step-badge">Step 6</span>
<h1>Write & Upload Text Files</h1>
<p>Your text file controls everything — what gets said, which voice says it, what language, and how it sounds. Upload it to S3 and the pipeline does the rest.</p>

<h2>The Flow</h2>
<div class="flow-diagram">
    <div class="flow-box user"><div class="icon">✍️</div><div class="label">Write Script</div><div class="sublabel">.txt file</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">📥</div><div class="label">Upload to S3</div><div class="sublabel">CLI or Console</div></div>
    <div class="flow-arrow"><span>Trigger</span>→</div>
    <div class="flow-box aws"><div class="icon">⚡</div><div class="label">Lambda</div><div class="sublabel">Reads your file</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box elevenlabs"><div class="icon">🎙️</div><div class="label">ElevenLabs</div><div class="sublabel">Generates audio</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">📤</div><div class="label">S3 Output</div><div class="sublabel">MP3 ready</div></div>
</div>

<h2>Simple Format: Just the Script</h2>
<p>If you just want the default voice (Roger) speaking English, write plain text:</p>
<div class="code-block">
    <div class="code-header"><span class="lang">episode1.txt</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
    <pre><code>Welcome to the show. Today we're diving into something that's
been on every developer's mind lately — how to build voice
applications using cloud services. Let's get into it.</code></pre>
</div>

<h2>Advanced Format: With a Header</h2>
<p>Want a different voice? A different language? Custom tuning? Add a header above <code>---</code>:</p>
<div class="code-block">
    <div class="code-header"><span class="lang">episode2_spanish.txt</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
    <pre><code>lang: es
voice: JBFqnCBsd6RMkjVDRZzb
stability: 40
similarity: 80
style: 30
---
Welcome to the show. In this episode, we're exploring how
artificial intelligence is changing the way we create content.
Stay tuned.</code></pre>
</div>

<h2>Header Reference</h2>
<table>
    <tr><th>Key</th><th>What It Does</th><th>Example</th><th>Default</th></tr>
    <tr><td><code>lang</code></td><td>Translate to this language before generating audio</td><td><code>lang: es</code></td><td>No translation</td></tr>
    <tr><td><code>voice</code></td><td>ElevenLabs Voice ID to use</td><td><code>voice: JBFqnCBsd6RMkjVDRZzb</code></td><td>Roger</td></tr>
    <tr><td><code>stability</code></td><td>0 = expressive, 100 = consistent</td><td><code>stability: 40</code></td><td>50</td></tr>
    <tr><td><code>similarity</code></td><td>0 = soft/broad, 100 = close to original</td><td><code>similarity: 80</code></td><td>75</td></tr>
    <tr><td><code>style</code></td><td>0 = neutral, 100 = dramatic</td><td><code>style: 30</code></td><td>0</td></tr>
</table>

<h2>Voice Tuning Guide</h2>
<div class="tuning-visual">
    <div class="tuning-row">
        <div class="tuning-name">Stability</div>
        <div style="flex:1;">
            <div class="tuning-bar"><div class="fill" style="width:50%"></div></div>
            <div class="tuning-ends"><span>← Expressive, varied</span><span>Consistent, predictable →</span></div>
        </div>
    </div>
    <div class="tuning-row">
        <div class="tuning-name">Clarity</div>
        <div style="flex:1;">
            <div class="tuning-bar"><div class="fill" style="width:75%"></div></div>
            <div class="tuning-ends"><span>← Soft, broader tone</span><span>Sharp, close to original →</span></div>
        </div>
    </div>
    <div class="tuning-row">
        <div class="tuning-name">Style</div>
        <div style="flex:1;">
            <div class="tuning-bar"><div class="fill" style="width:0%"></div></div>
            <div class="tuning-ends"><span>← Neutral delivery</span><span>Dramatic, emotional →</span></div>
        </div>
    </div>
</div>

<h3>Recommended Presets</h3>
<table>
    <tr><th>Use Case</th><th>Stability</th><th>Clarity</th><th>Style</th></tr>
    <tr><td>News / informational</td><td>70</td><td>80</td><td>10</td></tr>
    <tr><td>Casual conversation</td><td>45</td><td>70</td><td>30</td></tr>
    <tr><td>Storytelling / narrative</td><td>35</td><td>75</td><td>50</td></tr>
    <tr><td>Dramatic reading</td><td>25</td><td>80</td><td>70</td></tr>
</table>

<h2>How to Upload</h2>
<div class="tabs">
    <button class="tab-btn active" onclick="switchTab(event, 'upload-cli')">CLI</button>
    <button class="tab-btn" onclick="switchTab(event, 'upload-console')">Console (Drag & Drop)</button>
</div>
<div id="upload-cli" class="tab-content active">
    <div class="code-block">
        <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
        <pre><code># Upload a single episode
aws s3 cp my-episode.txt s3://my-podcast-input/

# Upload multiple episodes at once
aws s3 cp ./scripts/ s3://my-podcast-input/ --recursive --include "*.txt"</code></pre>
    </div>
</div>
<div id="upload-console" class="tab-content">
    <div class="sequence">
        <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">Open <strong>AWS Console</strong> → <strong>S3</strong> → your input bucket</div></div>
        <div class="seq-row"><div class="step-circle">2</div><div class="seq-text">Click <strong>Upload</strong></div></div>
        <div class="seq-row"><div class="step-circle">3</div><div class="seq-text">Drag and drop your <code>.txt</code> file(s)</div></div>
        <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">Click <strong>Upload</strong> — Lambda triggers automatically</div></div>
    </div>
</div>

<div class="info-box note">
    <strong>💡 The header is optional</strong>
    If you skip the header entirely, Lambda uses defaults: English, Roger's voice, neutral tuning. The header just lets you customize per episode.
</div>
`
},
{
    id: "end-to-end",
    title: "End-to-End Test",
    icon: "🚀",
    content: `
<span class="step-badge">Step 7</span>
<h1>End-to-End Test</h1>
<p>Time to put it all together. Upload a text file and watch the pipeline generate a podcast episode automatically.</p>

<h2>The Complete Flow</h2>
<div class="flow-diagram">
    <div class="flow-box user"><div class="icon">👤</div><div class="label">Upload .txt</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">📥</div><div class="label">S3 Input</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">⚡</div><div class="label">Lambda</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">🌐</div><div class="label">Translate</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box elevenlabs"><div class="icon">🎙️</div><div class="label">ElevenLabs</div></div>
    <div class="flow-arrow">→</div>
    <div class="flow-box aws"><div class="icon">📤</div><div class="label">S3 Output</div></div>
</div>

<h2>Test It</h2>
<div class="code-block">
    <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
    <pre><code># 1. Create a test episode
cat > /tmp/test-episode.txt << 'EOF'
lang: es
voice: JBFqnCBsd6RMkjVDRZzb
stability: 40
similarity: 80
style: 30
---
Welcome to the podcast. Today we're talking about how
developers can build voice applications using cloud services
and AI. It's never been easier to turn your ideas into
something people can actually hear.
EOF

# 2. Upload to S3 (this triggers the pipeline)
aws s3 cp /tmp/test-episode.txt s3://my-podcast-input/

# 3. Wait for Lambda to process...
sleep 10

# 4. Check the output
aws s3 ls s3://my-podcast-output/

# 5. Download and listen
aws s3 cp s3://my-podcast-output/test-episode_es.mp3 ./
open test-episode_es.mp3</code></pre>
</div>

<h2>What Just Happened</h2>
<div class="sequence">
    <div class="seq-row"><div class="step-circle">1</div><div class="seq-text">You uploaded <code>test-episode.txt</code> to <span class="seq-service aws">S3</span></div></div>
    <div class="seq-row"><div class="step-circle">2</div><div class="seq-text"><span class="seq-service aws">S3</span> fired an ObjectCreated event</div></div>
    <div class="seq-row"><div class="step-circle">3</div><div class="seq-text"><span class="seq-service aws">Lambda</span> received the event with bucket + file info</div></div>
    <div class="seq-row"><div class="step-circle">4</div><div class="seq-text">Lambda parsed the header: lang=es, voice=George</div></div>
    <div class="seq-row"><div class="step-circle">5</div><div class="seq-text"><span class="seq-service aws">Amazon Translate</span> converted English → Spanish</div></div>
    <div class="seq-row"><div class="step-circle">6</div><div class="seq-text"><span class="seq-service el">ElevenLabs</span> generated speech with George's voice in Spanish</div></div>
    <div class="seq-row"><div class="step-circle">7</div><div class="seq-text">Lambda saved the MP3 to <span class="seq-service aws">S3 Output</span></div></div>
    <div class="seq-row"><div class="step-circle">✓</div><div class="seq-text"><strong>Done.</strong> No servers running. No manual steps. Fully automated.</div></div>
</div>

<h2>Troubleshooting</h2>
<div class="code-block">
    <div class="code-header"><span class="lang">bash</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>
    <pre><code># Check Lambda logs if something went wrong
aws logs tail /aws/lambda/podcast-pipeline --follow --region YOUR_REGION</code></pre>
</div>

<div class="info-box tip">
    <strong>✅ That's it!</strong>
    You now have a fully automated podcast pipeline. Drop a text file in S3, get a podcast episode out.
</div>

<h2>What's Next</h2>
<table>
    <tr><th>Feature</th><th>How</th></tr>
    <tr><td>Public audio URLs</td><td>Add CloudFront in front of the output bucket</td></tr>
    <tr><td>RSS feed</td><td>Lambda generates podcast RSS from output bucket contents</td></tr>
    <tr><td>Episode management</td><td>Build a simple web UI to manage episodes and metadata</td></tr>
    <tr><td>Voice cloning</td><td>Upgrade to ElevenLabs Creator+ and use your own voice</td></tr>
    <tr><td>CloudFormation</td><td>Package everything into a repeatable template</td></tr>
</table>
`
}
];
