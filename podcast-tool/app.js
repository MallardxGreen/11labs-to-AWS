const scriptInput = document.getElementById("scriptInput");
const langSelect = document.getElementById("langSelect");
const voiceSelect = document.getElementById("voiceSelect");
const charCount = document.getElementById("charCount");
const generateBtn = document.getElementById("generateBtn");
const btnText = document.getElementById("btnText");
const spinner = document.getElementById("spinner");
const playerSection = document.getElementById("playerSection");
const audioPlayer = document.getElementById("audioPlayer");
const downloadLink = document.getElementById("downloadLink");
const translatedSection = document.getElementById("translatedSection");
const translatedText = document.getElementById("translatedText");
const errorMsg = document.getElementById("errorMsg");

// Sliders
const stabilitySlider = document.getElementById("stabilitySlider");
const similaritySlider = document.getElementById("similaritySlider");
const styleSlider = document.getElementById("styleSlider");

stabilitySlider.oninput = () => document.getElementById("stabilityValue").textContent = stabilitySlider.value;
similaritySlider.oninput = () => document.getElementById("similarityValue").textContent = similaritySlider.value;
styleSlider.oninput = () => document.getElementById("styleValue").textContent = styleSlider.value;

scriptInput.addEventListener("input", () => {
    charCount.textContent = scriptInput.value.length;
});

let lastAudioBlob = null;

async function generateAudio() {
    const text = scriptInput.value.trim();
    if (!text) { showError("Please enter some text first."); return; }

    setLoading(true);
    hideError();
    document.getElementById("s3Status").textContent = "";

    try {
        const response = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text,
                target_lang: langSelect.value,
                voice_id: voiceSelect.value,
                tuning: {
                    stability: parseInt(stabilitySlider.value),
                    similarity: parseInt(similaritySlider.value),
                    style: parseInt(styleSlider.value),
                },
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Server error: ${response.status}`);
        }

        const translated = response.headers.get("X-Translated-Text");
        if (translated) {
            translatedText.textContent = decodeURIComponent(translated);
            translatedSection.style.display = "block";
        } else {
            translatedSection.style.display = "none";
        }

        lastAudioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(lastAudioBlob);
        audioPlayer.src = audioUrl;
        downloadLink.href = audioUrl;
        playerSection.style.display = "block";
        audioPlayer.play();
    } catch (err) {
        showError(err.message);
    } finally {
        setLoading(false);
    }
}

async function saveToS3() {
    if (!lastAudioBlob) { showError("Generate audio first."); return; }

    const s3Btn = document.getElementById("s3Btn");
    const s3BtnText = document.getElementById("s3BtnText");
    const s3Spinner = document.getElementById("s3Spinner");
    const s3Status = document.getElementById("s3Status");

    s3Btn.disabled = true;
    s3BtnText.textContent = "Saving...";
    s3Spinner.style.display = "inline-block";
    s3Status.textContent = "";

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const filename = `podcast-${timestamp}.mp3`;

        const formData = new FormData();
        formData.append("audio", lastAudioBlob, filename);
        formData.append("filename", filename);

        const response = await fetch("/save-to-s3", { method: "POST", body: formData });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        s3Status.textContent = `✅ ${data.s3_url}`;
        s3Status.style.color = "#6c5ce7";
    } catch (err) {
        s3Status.textContent = `❌ ${err.message}`;
        s3Status.style.color = "#ff6b6b";
    } finally {
        s3Btn.disabled = false;
        s3BtnText.textContent = "Save to S3";
        s3Spinner.style.display = "none";
    }
}

function setLoading(on) {
    generateBtn.disabled = on;
    btnText.textContent = on ? "Generating..." : "Generate Audio";
    spinner.style.display = on ? "inline-block" : "none";
}

function showError(msg) { errorMsg.textContent = msg; errorMsg.style.display = "block"; }
function hideError() { errorMsg.style.display = "none"; }
