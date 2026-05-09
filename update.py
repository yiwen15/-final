import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update User Creation
code = code.replace(
    "level: 1, xp: 0, mastered: [], drawings: {}, lastActive: Date.now()",
    "level: 1, xp: 0, mastered: [], drawings: {}, lastActive: Date.now(), stats: {}, abilities: [], badges: []"
)

# 2. Replace startQuiz
new_start_quiz = """// 3-Level Quiz System
let currentQuizStage = 1;

function startQuiz(char) {
    currentChar = char;
    currentQuizStage = 1;
    showQuizLevel();
}

function showQuizLevel() {
    closeModal();
    const charData = libraryData.characters[currentChar];
    const modal = document.getElementById('quiz-modal');
    const optionsDiv = document.getElementById('quiz-options');
    optionsDiv.innerHTML = '';
    document.getElementById('quiz-feedback').innerText = '';
    modal.style.display = 'flex';

    if (!currentUser.stats) currentUser.stats = {};
    if (!currentUser.stats[currentChar]) currentUser.stats[currentChar] = { attempts: 0, mistakes: 0 };
    currentUser.stats[currentChar].attempts++;
    saveUser();

    if (currentQuizStage === 1) {
        document.getElementById('quiz-question-title').innerText = `【Level 1: 辨認】「${currentChar}」的意思是？`;
        const correctDef = charData.definition;
        let allDefs = Object.values(libraryData.characters).map(c => c.definition).filter(d => d !== correctDef);
        allDefs = [...new Set(allDefs)].sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [correctDef, ...allDefs].sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            const btn = document.createElement('div'); btn.className = 'quiz-option'; btn.innerText = opt;
            btn.onclick = () => handleQuizAnswer(opt === correctDef, btn, charData.logic);
            optionsDiv.appendChild(btn);
        });
    } else if (currentQuizStage === 2) {
        let storyTxt = charData.story || charData.logic;
        document.getElementById('quiz-question-title').innerText = `【Level 2: 理解】哪一個字的故事是：「${storyTxt}」`;
        const correctChar = currentChar;
        let allChars = Object.keys(libraryData.characters).filter(c => c !== correctChar);
        allChars = allChars.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [correctChar, ...allChars].sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            let zhyinTxt = libraryData.characters[opt]?.zhuyin || '';
            const btn = document.createElement('div'); btn.className = 'quiz-option'; btn.innerText = `${opt} ( ${zhyinTxt} )`;
            btn.onclick = () => handleQuizAnswer(opt === correctChar, btn, charData.logic);
            optionsDiv.appendChild(btn);
        });
    } else if (currentQuizStage === 3) {
        let sentence = charData.sentence || "這個__字非常好學。";
        let maskedSentence = sentence.replace(new RegExp(currentChar, 'g'), "___");
        document.getElementById('quiz-question-title').innerText = `【Level 3: 應用】請選出適合填入空格的字：\\n\\n「 ${maskedSentence} 」`;
        const correctChar = currentChar;
        let allChars = Object.keys(libraryData.characters).filter(c => c !== correctChar);
        allChars = allChars.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [correctChar, ...allChars].sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            const btn = document.createElement('div'); btn.className = 'quiz-option'; btn.innerText = opt;
            btn.onclick = () => handleQuizAnswer(opt === correctChar, btn, charData.logic);
            optionsDiv.appendChild(btn);
        });
    }
}

function handleQuizAnswer(isCorrect, btn, logicText) {
    if (isCorrect) {
        btn.classList.add('correct');
        document.getElementById('quiz-feedback').innerText = '✨ 答對了！繼續前進！';
        setTimeout(() => {
            if (currentQuizStage < 3) {
                currentQuizStage++;
                showQuizLevel();
            } else {
                finishQuiz();
            }
        }, 1000);
    } else {
        btn.classList.add('incorrect');
        currentUser.stats[currentChar].mistakes++;
        saveUser();
        document.getElementById('quiz-feedback').innerText = `❌ 不太對喔，回想一下：${logicText}`;
        setTimeout(() => {
            currentQuizStage = 1;
            showQuizLevel();
        }, 2000);
    }
}

function finishQuiz() {
    const modal = document.getElementById('quiz-modal');
    document.getElementById('quiz-question-title').innerText = '🎉 挑戰成功！';
    document.getElementById('quiz-options').innerHTML = '';
    document.getElementById('quiz-feedback').innerText = '你已經完美掌握了這個字！已收錄至字卡圖鑑！';
    let justMastered = false;
    if (!currentUser.mastered.includes(currentChar)) { 
        currentUser.mastered.push(currentChar); 
        gainXP(50); 
        justMastered = true;
        checkBadgesAndAbilities();
    }
    setTimeout(() => { 
        modal.style.display = 'none'; 
        showLibrary(currentArea);
        if (justMastered && currentUser.mastered.length > 0 && currentUser.mastered.length % 10 === 0) {
            startRPGMode();
        }
    }, 2000);
}

function checkBadgesAndAbilities() {
    if (!currentUser.badges) currentUser.badges = [];
    if (!currentUser.abilities) currentUser.abilities = [];
    let mCount = currentUser.mastered.length;
    if (mCount >= 10 && !currentUser.badges.includes('🥉 銅章探險者')) currentUser.badges.push('🥉 銅章探險者');
    if (mCount >= 30 && !currentUser.badges.includes('🥈 銀章探險者')) currentUser.badges.push('🥈 銀章探險者');
    if (mCount >= 50 && !currentUser.badges.includes('🥇 金章探險者')) currentUser.badges.push('🥇 金章探險者');
    const compCounts = {};
    currentUser.mastered.forEach(char => {
        const comp = libraryData.characters[char]?.comp;
        if(comp) compCounts[comp] = (compCounts[comp]||0) + 1;
    });
    if (compCounts['water'] >= 3 && !currentUser.abilities.includes('🌊 潛伏水底')) currentUser.abilities.push('🌊 潛伏水底');
    if (compCounts['wood'] >= 3 && !currentUser.abilities.includes('🍃 林間跳躍')) currentUser.abilities.push('🍃 林間跳躍');
    if (compCounts['sun'] >= 3 && !currentUser.abilities.includes('✨ 烈陽衝刺')) currentUser.abilities.push('✨ 烈陽衝刺');
    
    saveUser();
}
"""
code = re.sub(r'function startQuiz\(char\).*?(?=const RPG_MAP_TEMPLATES)', new_start_quiz, code, flags=re.DOTALL)

# 3. Update Render Teacher Dashboard
new_render_teacher = """function renderTeacherDashboard() {
    const tbody = document.getElementById('student-table-body'); if (!tbody) return; tbody.innerHTML = '';
    const names = JSON.parse(localStorage.getItem(USERLIST_KEY) || '[]');
    let totalLibChars = Object.keys(libraryData.characters).length;

    names.forEach(name => {
        const s = JSON.parse(localStorage.getItem(STORAGE_PREFIX + name));
        if (s) {
            let totalAttempts = 0; let totalMistakes = 0;
            let weakChar = '無'; let maxMistakes = 0;
            if(s.stats) {
                Object.keys(s.stats).forEach(c => {
                    if(!s.stats[c]) return;
                    totalAttempts += (s.stats[c].attempts || 0);
                    totalMistakes += (s.stats[c].mistakes || 0);
                    if((s.stats[c].mistakes || 0) > maxMistakes) { maxMistakes = s.stats[c].mistakes; weakChar = c; }
                });
            }
            let accuracy = totalAttempts > 0 ? Math.round(((totalAttempts - totalMistakes) / totalAttempts) * 100) : 100;
            if (accuracy < 0) accuracy = 0;
            let progressPct = Math.round((s.mastered.length / totalLibChars) * 100);

            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="padding: 1rem;">${s.name} (${s.grade})</td>
                <td>Lvl ${s.level}</td>
                <td>${accuracy}%</td>
                <td>
                    <div style="font-size: 0.8rem; text-align: right;">${s.mastered.length} / ${totalLibChars}</div>
                    <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${progressPct}%;"></div></div>
                </td>
                <td><span class="weak-char">${maxMistakes > 2 ? weakChar : '優秀'}</span></td>
                <td><button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="previewStudentMap('${s.name}')">👀 查看</button></td>`;
            tbody.appendChild(tr);
        }
    });
}"""

code = re.sub(r'function renderTeacherDashboard\(\) \{.*?(?=function previewStudentMap)', new_render_teacher + '\\n\\n', code, flags=re.DOTALL)


# 4. Update Start Drawing
new_start_drawing = """function startDrawing(char) { 
    currentChar = char; 
    document.getElementById('drawing-char-display').innerText = char;
    const tv = document.getElementById('drawing-trace-text');
    if (tv) { tv.innerText = char; }
    const logic = libraryData.characters[char]?.logic || '';
    document.getElementById('drawing-desc').innerText = `💡 繪畫靈感：${logic}`;
    closeModal(); 
    showScreen('drawing-screen'); 
    clearCanvas(); 
}"""

code = re.sub(r'function startDrawing\(char\) \{.*?(?=function paint)', new_start_drawing + '\\n', code, flags=re.DOTALL)


# 5. Append Extra functions
extra_functions = """

function renderProfile() {
    const container = document.getElementById('avatar-profile-container');
    if (!container) return;
    
    let badgesHtml = (currentUser.badges || []).map(b => `<div class="badge-item">${b}</div>`).join('');
    if(!badgesHtml) badgesHtml = '<span style="color: #64748b;">尚未獲得徽章，繼續加油！</span>';
    
    let abilitiesHtml = (currentUser.abilities || []).map(a => `<div class="ability-pill">${a}</div>`).join('');
    if(!abilitiesHtml) abilitiesHtml = '<span style="color: #64748b;">學習部首以解鎖能力</span>';

    container.innerHTML = `
        <div style="display: flex; gap: 30px; align-items: center; flex-wrap: wrap;">
            <div class="avatar-sprite" style="background: var(--accent-blue);">
                🤴
            </div>
            <div style="flex: 1;">
                <h3 style="font-size: 1.8rem; color: var(--text-gold); margin-bottom: 5px;">${currentUser.name}</h3>
                <p style="font-size: 1.1rem; margin-bottom: 15px;">Level ${currentUser.level} | 累積 XP: ${currentUser.xp}</p>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #38bdf8;">解鎖能力：</strong><br>
                    ${abilitiesHtml}
                </div>
                <div>
                    <strong style="color: #fbbf24;">冒險徽章：</strong><br>
                    <div class="avatar-badges">${badgesHtml}</div>
                </div>
            </div>
        </div>
    `;
}

function showCardBook() {
    showScreen('cards-screen');
    const container = document.getElementById('card-book-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (currentUser.mastered.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; font-size: 1.2rem; padding: 3rem;">尚未收集到任何字卡。快去小島探險吧！</div>';
        return;
    }
    
    currentUser.mastered.forEach(char => {
        const data = libraryData.characters[char];
        if (!data) return;
        
        let isHard = (data.grade === '2A' || data.grade === '2B');
        let cardClass = isHard ? 'card-hard' : 'card-normal';
        let rarityStar = isHard ? '🌟 困難' : '⭐ 普通';
        
        const div = document.createElement('div');
        div.className = `char-card-item ${cardClass}`;
        div.innerHTML = `
            <div class="card-rarity">${rarityStar}</div>
            <div class="card-char-big">${char}</div>
            <div class="card-zhuyin">${data.zhuyin}</div>
            <div style="font-size: 0.9rem; margin-bottom: 10px; color: #cbd5e1;">${data.definition}</div>
            <div style="font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; color: #94a3b8;">${data.phrases[0] || data.phrases}</div>
        `;
        div.onclick = () => openCharModal(char); // clicking card opens details
        container.appendChild(div);
    });
}
"""

if "function showCardBook" not in code:
    code += extra_functions

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Replacement successful")
