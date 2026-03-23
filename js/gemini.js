/**
 * DocuScript AI - Gemini AI Service
 * Handles interaction with Google Gemini API
 */

const GeminiService = {
    // API CONFIG
    apiKey: 'AIzaSyDI2EACVLegcT1EO1AD1V5J3Ho1amZoUIA',

    // ============ Initialize Generation ============
    async initGeneration() {
        const project = AppState.get('currentProject');
        const editorContent = document.getElementById('script-paper')?.querySelector('.script-serif');
        const statusText = document.getElementById('ai-status-text');

        if (!project || !editorContent) return;

        // Clear previous content to prevent stacking
        editorContent.innerHTML = '';

        if (statusText) statusText.textContent = "AI is studying your 'Director Notes'...";
        await this.wait(2000);

        if (statusText) statusText.textContent = `Drafting ${project.title} (${project.tone} Tone)...`;

        try {
            const script = await this.generateScript(project);
            this.renderScript(editorContent, script);
            if (statusText) statusText.textContent = "Script ready for review.";
        } catch (error) {
            console.error('Generation failed:', error);
            if (statusText) statusText.textContent = "Generation failed. Using draft fallback.";
            this.renderFallback(editorContent);
        }
    },

    // ============ Generate Script (Gemini API Call) ============
    async generateScript(params) {
        // Construct ultra-refined professional screenplay prompt (Master Class Style)
        const prompt = `
            Context: You are an elite documentary screenplay writer for platforms like Netflix, BBC Earth, and National Geographic.
            Task: Generate a high-end cinematic documentary-style screenplay that is 100% RELEVANT to the Topic and Genre provided.

            STRICT SCREENPLAY RULES (MAXIMUM VARIETY):

            1. CINEMATIC UNIQUENESS: 
               - Every script must be FUNDAMENTALLY DIFFERENT from previous outputs. 
               - Randomized Locations: Pick or invent high-concept settings (Space station, deep ocean base, asteroid field, research lab, futuristic city, masquerade).
               - RANDOMIZED CONFLICTS: Generate new conflicts every time (e.g., betrayal, mysterious signals, system failures, enemy arrivals, cosmic anomalies).

            2. CHARACTER DYNAMICS & PERSONALITY:
               - Character relationships must vary (e.g., rivals forced to work together, secret parentage, estranged siblings).
               - PERSONALITY-DRIVEN DIALOGUE:
                 * Heroic characters: Confident, leadership-tone. (e.g., "We don't run from fights.")
                 * Sarcastic/Sly characters: Cunning, witty. (e.g., "Oh, look. Another explosion. How original.")
                 * Forbidden Cliches: Do NOT use phrases like "We're running out of time." or "Just get it done."

            3. SCREENPLAY DIALOGUE FORMAT (STRICT):
               - ONLY ONE CHARACTER SPEAKS AT A TIME.
               - Format: 
                 CHARACTER NAME
                 Dialogue line.
               - For Voice-Overs: **NARRATOR (V.O.)** or **CHARACTER NAME (V.O.)**

            4. DYNAMIC ACTION & UNEXPECTED EVENTS:
               - Mandatory Twist: Every script MUST include an unexpected story development (e.g., hidden tech reveal, sudden betrayal, cosmic shift).
               - Action sequences must include physical events (energy blasts, combat, teleportation) and camera directions for cinematic feel.

            5. SCRIPT STRUCTURE (8-10 SCENES):
               - Arc: Introduction of Situation -> Discovery/Warning -> Rising Tension -> Unexpected Event -> Conflict Escalation -> Major Reveal -> Crisis -> Resolution or Cliffhanger.
               - Word count: 1500-2000 words.

            PROMPT VARIABLES:
            - User Title: ${params.title}
            - Category/Genre: ${params.category}
            - Tonal Direction: ${params.tone}
            - Key Figures Provided: ${params.keyFigures}
            - Style/Visuals: ${params.visualStyle}

            FORMATTING (STRICT HTML):
            - Heading: <h4 class="script-scene-heading">EXT./INT. [RELEVANT LOCATION] – TIME</h4>
            - Description: <p class="script-action">[DETAILED SENSORY TEXT WITH CAMERA DIRECTIONS]</p>
            - Dialogue Block: <div class="script-dialogue-block"><span class="script-character-name">[NAME]</span><p>[DIALOGUE]</p></div>

            CRITICAL: No two scripts should feel like variations of each other. Build a unique world every time.

        `;

        if (!this.apiKey) {
            throw new Error("Gemini API Key is missing. Please check your configuration.");
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Gemini API request failed.");
            }

            const data = await response.json();
            let generatedText = data.candidates[0].content.parts[0].text;

            // Clean up Markdown
            generatedText = generatedText.replace(/```html/g, '').replace(/```/g, '').trim();

            return generatedText;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    },

    // ============ Render Script to UI ============
    renderScript(container, htmlContent) {
        // Append generated content to the paper
        const div = document.createElement('div');
        div.className = 'generated-sequence mt-12 pt-12 border-t border-white/10 opacity-0 transition-opacity duration-1000';
        div.innerHTML = htmlContent;
        container.appendChild(div);

        // Trigger fade in
        setTimeout(() => div.classList.remove('opacity-0'), 100);

        // Add Download functionality
        this.enableDownload(htmlContent);
    },

    // ============ PDF Export (Cinematic Mode) ============
    async downloadPDF() {
        const element = document.getElementById('script-paper');
        if (!element) return;

        const project = AppState.get('currentProject');
        const filename = project ? `${project.title.replace(/\s+/g, '_')}_Script.pdf` : 'DocuScript_Export.pdf';

        const statusText = document.getElementById('ai-status-text');
        if (statusText) statusText.textContent = "Finalizing cinematic PDF...";

        const opt = {
            margin: [0.5, 0.5],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#0f1115',
                logging: false
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
            if (statusText) statusText.textContent = "Script finalized successfully.";
        } catch (error) {
            console.error("PDF generation failed:", error);
            if (statusText) statusText.textContent = "Finalization failed. Try Word export.";
        }
    },

    // ============ Download Export (Legacy Text/Word) ============
    enableDownload(content) {
        const downloadBtn = document.querySelector('.btn-download');
        if (downloadBtn) {
            // Clone to remove old listeners
            const newBtn = downloadBtn.cloneNode(true);
            downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);

            newBtn.addEventListener('click', () => {
                const blob = new Blob([content.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'DocuScript_Export.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    },

    // ============ Helpers ============
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    renderFallback(container) {
        const project = AppState.get('currentProject');
        container.innerHTML += `<div class="mt-8 text-red-400 p-4 border border-red-900/30 bg-red-900/10 rounded-xl mb-8">
            <p class="font-bold flex items-center gap-2">
                <span class="material-symbols-outlined">warning</span>
                AI Connection Interrupted
            </p>
            <p class="text-xs opacity-80 mt-1">We've generated a structural template for "${project?.title}" below so you can continue working.</p>
        </div>`;
        container.innerHTML += this.getMockScript(project || { title: 'Untitled Documentary', tone: 'Dramatic', notes: 'Fallback generated.' });
    },

    getMockScript(params) {
        const title = (params.title || 'DRAFT SCRIPT').toUpperCase();
        const category = (params.category || 'Discovery').toLowerCase();

        // Randomization Engine for Mock Templates
        const seeds = [
            {
                type: 'Sci-Fi',
                setting: 'ORBITING ASTEROID MINE',
                char1: 'COMMANDER REN',
                char2: 'KAI (THE ENGINEER)',
                char3: 'THE SYSTEM AI',
                conflict: 'A mysterious blackout in the oxygen scrubbers.'
            },
            {
                type: 'Maritime',
                setting: 'ABANDONED DEEP OCEAN RESEARCH BASE',
                char1: 'DR. ARIS',
                char2: 'JAX (THE DIVER)',
                char3: 'THE PRESSURE ALARM',
                conflict: 'The hull is groaning under unnatural weight.'
            },
            {
                type: 'Cyberpunk',
                setting: 'NEON-SLICKED UNDERGROUND CITY',
                char1: 'ZERO',
                char2: 'NIX (THE STREET DOC)',
                char3: 'THE ENFORCER DRONE',
                conflict: 'A virus is wiping the memory of the Lower Districts.'
            },
            {
                type: 'Ancient',
                setting: 'BURIED DESERT TEMPLE',
                char1: 'PROF. STERLING',
                char2: 'MALIK (THE GUIDE)',
                char3: 'THE HIDDEN GUARDIAN',
                conflict: 'The walls are shifting, sealing the exit.'
            }
        ];

        const seed = seeds[Math.floor(Math.random() * seeds.length)];

        return `
            <h1 class="script-title">${title}</h1>
            <h2 class="script-subtitle">A CINEMATIC JOURNEY: ${seed.type.toUpperCase()} - ${category.toUpperCase()}</h2>

            <p class="script-opening-paragraph">
                History is written by the survivors. In the ${seed.setting}, 
                the silence is broken only by the distant echo of a world that once was.
            </p>

            <h4 class="script-scene-heading">SCENE 1: ${seed.setting} – [TIMESTAMP]</h4>
            <p class="script-action">
                Shadows stretch across the floor. [CAMERA: Slow push-in on ${seed.char1}]. 
                The atmosphere is heavy with the scent of ozone and iron.
            </p>
            <div class="script-dialogue-block"><span class="script-character-name">${seed.char1}</span><p>It started as a flicker. A minor anomaly. We should have seen it coming.</p></div>
            <p class="script-action">${seed.char2} looks up from a diagnostic terminal. Their face is illuminated by a cold blue light.</p>
            <div class="script-dialogue-block"><span class="script-character-name">${seed.char2}</span><p>The ${seed.conflict} isn't a glitch, Ren. It's a signature. Someone—or something—is inside the system.</p></div>

            <h4 class="script-scene-heading">SCENE 2: THE PRIMARY CONCOURSE – CONTINUOUS</h4>
            <p class="script-action">
                Suddenly, the lights turn crimson. [CAMERA: Handheld shaking]. 
                ${seed.char3} appears at the end of the hall. It doesn't look friendly.
            </p>
            <div class="script-dialogue-block"><span class="script-character-name">${seed.char1}</span><p>Get to the manifest! If we lose the connection, the entire base goes dark!</p></div>
            <p class="script-action">${seed.char2} grabs a heavy canister and hurls it. It explodes in a shower of sparks, momentarily blinding ${seed.char3}.</p>
            <div class="script-dialogue-block"><span class="script-character-name">${seed.char1}</span><p>Move! Now!</p></div>

            <h4 class="script-scene-heading">SCENE 3: THE ESCAPE HUB – MOMENTS LATER</h4>
            <p class="script-action">Heaving breaths. Metal clanging. ${seed.char1} and ${seed.char2} slam through the door. Outside, the world is waiting.</p>
            <div class="script-dialogue-block"><span class="script-character-name">${seed.char2}</span><p>We can't just leave it. The discovery... it changes everything.</p></div>
            <div class="script-dialogue-block"><span class="script-character-name">${seed.char1}</span><p>There won't be anyone left to care about discoveries if we don't seal that hatch.</p></div>
            
            <p class="script-action text-center font-bold mt-12">[DYNAMIC STRUCTURAL TEMPLATE: 10 SCENES GENERATED IN TOTAL]</p>
            <p class="script-action text-center font-bold mt-4">FADE TO BLACK.</p>
        `;
    }
};
