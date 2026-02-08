let currentStep = 0;

function init() {
    const nav = document.getElementById("stepNav");
    STEPS.forEach((step, i) => {
        const a = document.createElement("a");
        a.href = "#";
        a.dataset.index = i;
        a.innerHTML = `<span class="step-num">${step.icon}</span> ${step.title}`;
        a.onclick = (e) => { e.preventDefault(); goToStep(i); };
        nav.appendChild(a);
    });
    goToStep(0);
}

function goToStep(index) {
    currentStep = index;
    const step = STEPS[index];

    // Update content
    const content = document.getElementById("content");
    content.innerHTML = step.content + renderNavButtons(index);

    // Update nav
    document.querySelectorAll("#stepNav a").forEach((a, i) => {
        a.classList.toggle("active", i === index);
        a.classList.toggle("completed", i < index);
    });

    // Update progress
    const pct = ((index + 1) / STEPS.length) * 100;
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressText").textContent =
        `Step ${index + 1} of ${STEPS.length}`;

    // Scroll to top
    content.scrollTop = 0;
    window.scrollTo(0, 0);
}

function renderNavButtons(index) {
    const prev = index > 0
        ? `<button class="nav-btn" onclick="goToStep(${index - 1})">← ${STEPS[index - 1].title}</button>`
        : `<button class="nav-btn" disabled>← Previous</button>`;
    const next = index < STEPS.length - 1
        ? `<button class="nav-btn primary" onclick="goToStep(${index + 1})">${STEPS[index + 1].title} →</button>`
        : `<button class="nav-btn primary" disabled>Complete ✓</button>`;
    return `<div class="nav-buttons">${prev}${next}</div>`;
}

function switchTab(event, tabId) {
    const tabGroup = event.target.closest(".tabs");
    const contentParent = tabGroup.parentElement;

    // Deactivate all tabs in this group
    tabGroup.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    event.target.classList.add("active");

    // Find all tab-content siblings after this tab group
    let sibling = tabGroup.nextElementSibling;
    while (sibling && sibling.classList.contains("tab-content")) {
        sibling.classList.remove("active");
        sibling = sibling.nextElementSibling;
    }

    // Activate the target
    document.getElementById(tabId).classList.add("active");
}

function copyCode(btn) {
    const code = btn.closest(".code-block").querySelector("code").textContent;
    navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy", 1500);
    });
}

init();
