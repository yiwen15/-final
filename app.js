console.log('Zi-Part-Quest App Script Loading...');
let currentUser = null;
let currentArea = null;
let currentChar = null;
let selectedGrade = '1A';
let activeIslandId = 'all';

// Global Game State
let userXP = 0;
let masteredChars = new Set();

// Load Library Data from LocalStorage if available
const CUSTOM_LIB_KEY = 'characterQuest_customLibrary';
function syncToCloud() {
    const data = {
        xp: userXP,
        mastered: Array.from(masteredChars),
        timestamp: new Date().toISOString()
    };
    console.log("Syncing to cloud...", data);
    alert("✨ 學習紀錄已成功同步至雲端（模擬）！教師現在可以從後台查看您的進度。");
}
function loadLibrary() {
    const saved = localStorage.getItem(CUSTOM_LIB_KEY);
    if (saved) {
        const customChars = JSON.parse(saved);
        libraryData.characters = { ...libraryData.characters, ...customChars };
    }
}
loadLibrary();

// Drawing State... (existing unchanged code)
let isDrawing = false;
let ctx = null;
let currentTool = 'brush';
let currentColor = '#000000';

const STORAGE_PREFIX = 'characterQuest_user_';
const USERLIST_KEY = 'characterQuest_allStudentNames';

document.addEventListener('DOMContentLoaded', () => {
    loadSession();
    initCanvas();
    // Populate form selects
    const compSelect = document.getElementById('edit-comp-input');
    if (compSelect) {
        libraryData.components.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id; opt.innerText = `${c.symbol} ${c.name}`;
            compSelect.appendChild(opt);
        });
    }
    const gradeSelect = document.getElementById('edit-grade-input');
    if (gradeSelect) {
        libraryData.grades.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id; opt.innerText = g.name;
            gradeSelect.appendChild(opt);
        });
    }
});

function loadSession() {
    const activeUserId = sessionStorage.getItem('characterQuestCurrentUserId');
    if (activeUserId === 'teacher') {
        currentUser = { name: '導師', role: 'teacher', id: 'teacher' };
        showDashboard();
    } else if (activeUserId) {
        const saved = localStorage.getItem(STORAGE_PREFIX + activeUserId);
        if (saved) {
            currentUser = JSON.parse(saved);
            selectedGrade = currentUser.grade || '1A';
            showDashboard();
        }
    }
}

function selectGrade(grade, btn) {
    selectedGrade = grade;
    document.querySelectorAll('.btn-grade').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function login(role) {
    console.log('Login attempt:', role);
    const nameInput = document.getElementById('usernameInput').value.trim();
    const name = nameInput || '匿名冒險者';
    console.log('User name:', name);
    
    if (role === 'teacher') {
        document.getElementById('password-modal').style.display = 'flex';
        document.getElementById('teacher-pwd-input').focus();
        return;
    }

    let savedUser = localStorage.getItem(STORAGE_PREFIX + name);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        currentUser.grade = selectedGrade;
        sessionStorage.setItem('characterQuestCurrentUserId', name);
        showDashboard();
        if (currentUser.role === 'student') showIntroManual();
    } else {
        currentUser = {
            name: name, role: 'student', grade: selectedGrade,
            level: 1, xp: 0, mastered: [], drawings: {}, lastActive: Date.now(), stats: {}, abilities: [], badges: []
        };
        saveUser();
        addToUserList(name);
        sessionStorage.setItem('characterQuestCurrentUserId', name);
        showDashboard();
        showIntroManual(); // Show manual on first login
    }
}

function showIntroManual() {
    document.getElementById('intro-modal').style.display = 'flex';
}

function checkTeacherPassword() {
    const pwd = document.getElementById('teacher-pwd-input').value;
    if (pwd === '123') {
        sessionStorage.setItem('characterQuestCurrentUserId', 'teacher');
        currentUser = { name: '導師', role: 'teacher', id: 'teacher' };
        closePasswordModal();
        showDashboard();
    } else {
        alert('密碼錯誤！');
        document.getElementById('teacher-pwd-input').value = '';
    }
}

function closePasswordModal() {
    document.getElementById('password-modal').style.display = 'none';
    document.getElementById('teacher-pwd-input').value = '';
}

function addToUserList(name) {
    let list = JSON.parse(localStorage.getItem(USERLIST_KEY) || '[]');
    if (!list.includes(name)) {
        list.push(name);
        localStorage.setItem(USERLIST_KEY, JSON.stringify(list));
    }
}

function logout() { sessionStorage.removeItem('characterQuestCurrentUserId'); currentUser = null; location.reload(); }
function saveUser() { if (currentUser && currentUser.role === 'student') { localStorage.setItem(STORAGE_PREFIX + currentUser.name, JSON.stringify(currentUser)); } }

// =====================
// Cross-Device Share Code System
// =====================
function exportStudentShareCode() {
    if (!currentUser || currentUser.role !== 'student') return;
    const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + currentUser.name) || 'null');
    if (!data) return;
    // Exclude drawings (too large) - keep stats, mastered, badges, abilities
    const exportData = {
        name: data.name,
        grade: data.grade,
        level: data.level,
        xp: data.xp,
        mastered: data.mastered,
        badges: data.badges || [],
        abilities: data.abilities || [],
        stats: data.stats || {},
        lastActive: data.lastActive
    };
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(exportData))));
    
    const modal = document.getElementById('share-code-modal');
    document.getElementById('share-code-output').value = code;
    modal.style.display = 'flex';
}

function copyShareCode() {
    const el = document.getElementById('share-code-output');
    el.select();
    document.execCommand('copy');
    document.getElementById('share-code-copy-btn').innerText = '✅ 已複製！';
    setTimeout(() => { document.getElementById('share-code-copy-btn').innerText = '📋 複製代碼'; }, 2000);
}

function importStudentFromCode() {
    const code = document.getElementById('teacher-import-code').value.trim();
    if (!code) { alert('請貼入學生的進度代碼'); return; }
    try {
        const data = JSON.parse(decodeURIComponent(escape(atob(code))));
        if (!data.name) throw new Error('格式錯誤');
        // Save imported student to local storage so teacher can view them
        const existingList = JSON.parse(localStorage.getItem(USERLIST_KEY) || '[]');
        if (!existingList.includes(data.name)) {
            existingList.push(data.name);
            localStorage.setItem(USERLIST_KEY, JSON.stringify(existingList));
        }
        localStorage.setItem(STORAGE_PREFIX + data.name, JSON.stringify({ ...data, role: 'student' }));
        document.getElementById('teacher-import-code').value = '';
        document.getElementById('import-feedback').innerText = `✅ 已成功匯入「${data.name}」的進度！`;
        document.getElementById('import-feedback').style.color = '#4ade80';
        renderTeacherDashboard();
    } catch(e) {
        document.getElementById('import-feedback').innerText = '❌ 代碼格式不正確，請重新確認。';
        document.getElementById('import-feedback').style.color = '#f87171';
    }
}

function showDashboard() {
    console.log('Showing dashboard for:', currentUser.name);
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('userName').innerText = `${currentUser.name} (${selectedGrade})`;
    if (currentUser.role === 'teacher') { 
        console.log('Role: Teacher');
        showScreen('teacher-screen'); 
        renderTeacherDashboard(); 
    }
    else { 
        console.log('Role: Student');
        updateStats(); 
        showScreen('map-screen'); 
        renderMap(); 
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(screenId);
    if (el) el.classList.add('active');
}

function setDeviceMode(mode) {
    document.body.classList.remove('device-mobile', 'device-tablet', 'device-pc');
    if (mode !== 'pc') document.body.classList.add('device-' + mode);
    
    document.querySelectorAll('.device-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-device-' + mode).classList.add('active');
}

function updateStats() {
    if (!currentUser) return;
    document.getElementById('user-level').innerText = currentUser.level;
    
    // XP Calculation and Progress Bar
    const xpForNextLevel = currentUser.level * 100;
    const progressPercent = (currentUser.xp / xpForNextLevel) * 100;
    
    const xpFill = document.getElementById('user-xp-fill');
    if (xpFill) {
        xpFill.style.width = progressPercent + '%';
    }
    
    const xpText = document.getElementById('user-xp-text');
    if (xpText) {
        xpText.innerText = `${Math.floor(currentUser.xp)} / ${xpForNextLevel}`;
    }

    const milestoneText = document.getElementById('milestone-text');
    if (milestoneText) {
        const remaining = 5 - (currentUser.mastered.length % 5);
        milestoneText.innerText = remaining === 5 && currentUser.mastered.length > 0 
            ? "🛡️ 冒險傳送門已開啟！" 
            : `距冒險還有 ${remaining} 字`;
    }

    document.getElementById('userName').innerText = currentUser.name;
    saveUser();
}

function renderMap() {
    const mapContainer = document.getElementById('area-map');
    if (!mapContainer) return;
    mapContainer.innerHTML = '';
    libraryData.components.forEach(comp => {
        const wordsInGrade = Object.keys(libraryData.characters).filter(char => {
            const data = libraryData.characters[char];
            return data.comp === comp.id && data.grade === currentUser.grade;
        });
        if (wordsInGrade.length === 0 && comp.id !== 'extra') return;
        const card = document.createElement('div');
        card.className = `area-card`;
        card.innerHTML = `<div class="area-img" style="background-color: ${comp.color}; opacity: 0.6"></div>
            <div class="area-info"><div class="area-title">${comp.symbol} ${comp.name}</div>
            <p style="font-size: 0.85rem; color: #94a3b8;">${comp.meaning}</p>
            <p style="font-size: 0.8rem; color: var(--text-gold); margin-top: 5px;">本學期共 ${wordsInGrade.length} 字</p></div>`;
        card.onclick = () => showLibrary(comp);
        mapContainer.appendChild(card);
    });
}

function showLibrary(area) {
    currentArea = area;
    showScreen('library-screen');
    document.getElementById('area-title-display').innerText = `${area.symbol} ${area.name}`;
    const charList = document.getElementById('char-list');
    charList.innerHTML = '';
    const availableChars = Object.keys(libraryData.characters).filter(char => {
        const data = libraryData.characters[char];
        return data.comp === area.id && data.grade === currentUser.grade;
    });
    availableChars.forEach(char => {
        const isMastered = currentUser.mastered.includes(char);
        const card = document.createElement('div');
        card.className = 'character-card';
        if (isMastered) card.style.borderColor = 'var(--primary-color)';
        card.innerHTML = `<div class="char-glyph">${char}</div><div style="font-size: 0.8rem; color: #94a3b8;">${isMastered ? '✅ 已掌握' : '未學習'}</div>`;
        card.onclick = () => openCharModal(char);
        charList.appendChild(card);
    });
}

function openCharModal(char) {
    currentChar = char;
    const modal = document.getElementById('char-modal');
    const body = document.getElementById('modal-body');
    const data = libraryData.characters[char];
    const isMastered = currentUser.mastered.includes(char);

    body.innerHTML = `
        <div style="display: flex; gap: 2rem; align-items: start;">
            <div style="flex: 1; text-align: center;">
                <div style="font-size: 6rem; color: var(--text-gold); line-height: 1; margin-bottom: 0.5rem;">${char}</div>
                <div style="font-size: 1.8rem; color: #94a3b8; font-weight: bold; margin-bottom: 1.5rem;">[ ${data.zhuyin} ]</div>
                <div style="font-size: 1.2rem; margin-bottom: 1.5rem; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; color: white;">
                    <strong style="color: var(--text-gold);">意思是：</strong><br>${data.definition}
                </div>
                ${data.image ? `<div class="char-illustration-container"><img src="${data.image}" class="char-illustration"></div>` : 
                `<div class="char-illustration-placeholder">繪本插圖陸續增加中...</div>`}
            </div>
            <div style="flex: 1.5;">
                <div class="mnemonic-container" style="grid-template-columns: 1fr;">
                    <div class="mnemonic-box box-logic" style="margin-bottom: 1rem;">
                        <div class="box-label">💡 部件大奧祕 (字理)</div>
                        <div class="box-content">${data.logic || "這是一個特別的合體字！"}</div>
                    </div>
                    <div class="mnemonic-box box-story">
                        <div class="box-label">📖 識字小故事</div>
                        <div class="box-content">${data.story || "相傳在古老的文字森林中..."}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
                    <div style="background: rgba(34, 197, 94, 0.1); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2);">
                        <h3 style="color: #4ade80; margin-bottom: 0.5rem; font-size: 1rem;">🍎 造詞小天地</h3>
                        <p style="font-size: 1.1rem; line-height: 1.6;">${Array.isArray(data.phrases) ? data.phrases.join('、') : data.phrases}</p>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
                        <h3 style="color: #60a5fa; margin-bottom: 0.5rem; font-size: 1rem;">✍️ 造句練習場</h3>
                        <p style="font-size: 1.1rem; line-height: 1.6;">${data.sentence}</p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 1.5rem; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn" onclick="masterCharacter('${char}')" style="margin: 0;">${isMastered ? '再挑戰測驗' : '接受挑戰 (+20 XP)'}</button>
                    ${isMastered ? `<button class="btn btn-secondary" onclick="startDrawing('${char}')" style="margin: 0;">🎨 裝飾島嶼</button>` : ''}
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('char-modal').style.display = 'none'; }
function masterCharacter(char) { if (!currentUser.mastered.includes(char)) startQuiz(char); else closeModal(); }

// 4-Level Quiz System + Abilities
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
    
    if (currentQuizStage === 4) {
        modal.style.display = 'none';
        startPuzzleGame(currentChar);
        return;
    }
    
    optionsDiv.innerHTML = '';
    document.getElementById('quiz-feedback').innerText = '';
    modal.style.display = 'flex';

    if (!currentUser.stats) currentUser.stats = {};
    if (!currentUser.stats[currentChar]) currentUser.stats[currentChar] = { attempts: 0, mistakes: 0 };
    currentUser.stats[currentChar].attempts++;
    saveUser();

    if (currentQuizStage === 1) {
        document.getElementById('quiz-question-title').innerText = `【1. 字義理解】「${currentChar}」的意思是？`;
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
        let sentence = charData.sentence || "這個__字非常好學。";
        let maskedSentence = sentence.replace(new RegExp(currentChar, 'g'), "___");
        document.getElementById('quiz-question-title').innerText = `【2. 情境應用】請選出適合填入空格的字：\n\n「 ${maskedSentence} 」`;
        const correctChar = currentChar;
        let allChars = Object.keys(libraryData.characters).filter(c => c !== correctChar);
        allChars = allChars.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [correctChar, ...allChars].sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            const btn = document.createElement('div'); btn.className = 'quiz-option'; btn.innerText = opt;
            btn.onclick = () => handleQuizAnswer(opt === correctChar, btn, charData.logic);
            optionsDiv.appendChild(btn);
        });
    } else if (currentQuizStage === 3) {
        let storyTxt = charData.story || charData.logic;
        document.getElementById('quiz-question-title').innerText = `【3. 故事聯想】哪一個字的故事是：「${storyTxt}」`;
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
    }
}

function handleQuizAnswer(isCorrect, btn, logicText) {
    if (isCorrect) {
        btn.classList.add('correct');
        document.getElementById('quiz-feedback').innerText = '✨ 答對了！繼續前進！';
        setTimeout(() => {
            currentQuizStage++;
            showQuizLevel();
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
    
    modal.style.display = 'flex';
    setTimeout(() => { 
        modal.style.display = 'none'; 
        if (currentUser.mastered.length % 5 === 0 && currentUser.mastered.length > 0) {
            alert('🌟 太棒了！你已經掌握了 5 個新字，勇者大陸出現了新的冒險入口！');
            startRPGMode();
        } else {
            showLibrary(currentArea);
        }
    }, 2000);
}

function checkBadgesAndAbilities() {
    if (!currentUser.badges) currentUser.badges = [];
    if (!currentUser.abilities) currentUser.abilities = [];
    
    let mCount = currentUser.mastered.length;
    // 1. 字數徽章
    if (mCount >= 10 && !currentUser.badges.includes('🥉 銅牌徽章')) currentUser.badges.push('🥉 銅牌徽章');
    if (mCount >= 30 && !currentUser.badges.includes('🥈 銀牌徽章')) currentUser.badges.push('🥈 銀牌徽章');
    if (mCount >= 50 && !currentUser.badges.includes('🥇 金牌徽章')) currentUser.badges.push('🥇 金牌徽章');
    
    // 2. 部件完成度
    const compMastery = {};
    libraryData.components.forEach(c => compMastery[c.id] = { total: 0, mastered: 0 });
    Object.keys(libraryData.characters).forEach(char => {
        let comp = libraryData.characters[char].comp;
        if(comp) compMastery[comp].total++;
    });
    currentUser.mastered.forEach(char => {
        let comp = libraryData.characters[char]?.comp;
        if(comp) compMastery[comp].mastered++;
    });

    let completedCompsCount = 0;
    Object.keys(compMastery).forEach(compId => {
        if(compMastery[compId].total > 0 && compMastery[compId].mastered === compMastery[compId].total) {
            completedCompsCount++;
            let compName = libraryData.components.find(c => c.id === compId).symbol;
            let badgeName = `${compName}部達人`;
            if(!currentUser.badges.includes(badgeName)) currentUser.badges.push(badgeName);
            
            // Unlock corresponding element ability if not already unlocked
            // Require 80% accuracy in this component
            let compAttempts = 0; let compMistakes = 0;
            Object.keys(libraryData.characters).forEach(char => {
                if(libraryData.characters[char].comp === compId && currentUser.stats[char]) {
                    compAttempts += currentUser.stats[char].attempts;
                    compMistakes += currentUser.stats[char].mistakes;
                }
            });
            let accuracy = compAttempts > 0 ? ((compAttempts - compMistakes) / compAttempts) : 0;
            if(accuracy >= 0.8) {
                if (compId === 'water' && !currentUser.abilities.includes('水之能力')) currentUser.abilities.push('水之能力');
                if (compId === 'wood' && !currentUser.abilities.includes('木之能力')) currentUser.abilities.push('木之能力');
            }
        }
    });

    if (completedCompsCount >= 3 && !currentUser.badges.includes('🌟 部件高手')) currentUser.badges.push('🌟 部件高手');
    if (completedCompsCount >= 5 && !currentUser.badges.includes('👑 識字王')) currentUser.badges.push('👑 識字王');

    // 3. 正確率徽章
    let totalAttempts = 0; let totalMistakes = 0;
    if(currentUser.stats) {
        Object.keys(currentUser.stats).forEach(c => {
            if(!currentUser.stats[c]) return;
            totalAttempts += (currentUser.stats[c].attempts || 0);
            totalMistakes += (currentUser.stats[c].mistakes || 0);
        });
    }
    let globalAccuracy = totalAttempts > 0 ? ((totalAttempts - totalMistakes) / totalAttempts) : 1;
    if(mCount >= 10 && globalAccuracy >= 0.9 && !currentUser.badges.includes('🎯 精準小達人')) currentUser.badges.push('🎯 精準小達人');

    // 4. 努力徽章
    let hasRecovered = false;
    currentUser.mastered.forEach(char => {
        if(currentUser.stats[char] && currentUser.stats[char].mistakes > 0) hasRecovered = true;
    });
    if(hasRecovered && !currentUser.badges.includes('💪 不放棄徽章')) currentUser.badges.push('💪 不放棄徽章');

    saveUser();
}


const RPG_MAP_TEMPLATES = [
    [ // 10x10 Map (1 = wall, 0 = floor)
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,1],
        [1,1,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,1],
        [1,0,1,1,1,1,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1],
        [1,1,1,1,1,1,1,1,1,1]
    ]
];

let rpgMap = [];
let rpgPlayer = { x: 1, y: 1 };
let rpgChest = { x: 8, y: 8 };
let rpgItems = {};
let rpgHistoryPos = { x: 1, y: 1 };
const ADVENTURE_EMOJIS = ['💎', '💊', '🗡️', '🏺', '📜', '🛡️', '🧪'];

function startRPGMode() {
    showScreen('rpg-screen');
    initRPGGame();
}

function initRPGGame() {
    const mapTemplate = RPG_MAP_TEMPLATES[0];
    rpgMap = JSON.parse(JSON.stringify(mapTemplate)); // clone
    rpgPlayer = { x: 1, y: 1 };
    rpgHistoryPos = { x: 1, y: 1 };
    rpgItems = {};
    rpgChest = { x: 8, y: 8 };

    const paths = [];
    for(let y=1; y<9; y++) {
        for(let x=1; x<9; x++) {
            if(rpgMap[y][x] === 0 && !(x===1 && y===1) && !(x===8 && y===8)) {
                paths.push({x, y});
            }
        }
    }
    paths.sort(() => 0.5 - Math.random());
    
    // Pick the latest 5 characters for items
    let charsToPlace = currentUser.mastered.slice(-5);
    if(charsToPlace.length === 0) charsToPlace = ['好', '水', '人', '口', '手']; // fallback
    
    charsToPlace.forEach((char, index) => {
        if(index < paths.length) {
            const p = paths[index];
            const emoji = ADVENTURE_EMOJIS[index % ADVENTURE_EMOJIS.length];
            rpgItems[`${p.x},${p.y}`] = { char, emoji };
        }
    });

    document.addEventListener('keydown', handleRPGKey);
    renderRPG();
}

function exitRPGMode() {
    document.removeEventListener('keydown', handleRPGKey);
    showDashboard();
}

function handleRPGKey(e) {
    if(document.getElementById('rpg-screen').classList.contains('active')) {
        if(document.getElementById('quiz-modal').style.display === 'flex' || document.getElementById('word-quiz-modal').style.display === 'flex') return;
        if(e.key === 'ArrowUp') movePlayer(0, -1);
        else if(e.key === 'ArrowDown') movePlayer(0, 1);
        else if(e.key === 'ArrowLeft') movePlayer(-1, 0);
        else if(e.key === 'ArrowRight') movePlayer(1, 0);
    }
}

function renderRPG() {
    const grid = document.getElementById('rpg-grid');
    grid.innerHTML = '';
    for(let y=0; y<10; y++) {
        for(let x=0; x<10; x++) {
            const cell = document.createElement('div');
            let baseClass = 'floor';
            if(rpgMap[y][x] === 1) baseClass = 'wall';
            if(rpgMap[y][x] === 2) baseClass = 'water';
            cell.className = 'rpg-cell ' + baseClass;
            
            if(rpgMap[y][x] === 1) cell.innerText = '';
            else if(x === rpgPlayer.x && y === rpgPlayer.y) {
                cell.classList.add('player');
                cell.innerText = (baseClass === 'water') ? '🏊' : '👸';
            } else if(x === rpgChest.x && y === rpgChest.y) {
                cell.classList.add('chest');
                cell.innerText = '🎁';
            } else if(rpgItems[`${x},${y}`]) {
                cell.classList.add('item');
                cell.innerText = rpgItems[`${x},${y}`].emoji;
            }
            grid.appendChild(cell);
        }
    }
}

function movePlayer(dx, dy) {
    const nx = rpgPlayer.x + dx;
    const ny = rpgPlayer.y + dy;
    
    if(nx<0||nx>=10||ny<0||ny>=10) return;
    
    // 1 is wall (Tree/Mountain)
    if(rpgMap[ny][nx] === 1) return;
    
    // 2 is water (River) - no ability check needed, player can cross freely
    
    rpgHistoryPos = { x: rpgPlayer.x, y: rpgPlayer.y };
    rpgPlayer.x = nx;
    rpgPlayer.y = ny;
    
    const key = `${nx},${ny}`;
    if(rpgItems[key]) {
        renderRPG();
        setTimeout(() => triggerRPGBattle(key), 100);
    } else if(nx === rpgChest.x && ny === rpgChest.y) {
        renderRPG();
        setTimeout(() => winRPGMode(), 100);
    } else {
        renderRPG();
    }
}

function triggerRPGBattle(monsterKey) {
    const itemData = rpgItems[monsterKey];
    if(!itemData) return;
    const char = itemData.char;
    const data = libraryData.characters[char];
    if(!data) { delete rpgItems[monsterKey]; renderRPG(); return; } 
    
    const modal = document.getElementById('quiz-modal');
    const optionsDiv = document.getElementById('quiz-options');
    optionsDiv.innerHTML = '';
    
    // Get correct phrases
    let correctPhrases = data.phrases || data.vocab || [];
    let correctPhrase = correctPhrases.length > 0 ? correctPhrases[0] : `${char}語`;
    
    document.getElementById('quiz-question-title').innerHTML = `⚔️ 勇者，請證明你的實力！<br>「<span style="font-size:2.5rem; color:#000;">${char}</span>」可以用來造哪一個詞呢？`;
    document.getElementById('quiz-feedback').innerText = '';
    
    // Get fake phrases from other characters
    let allFakes = [];
    Object.keys(libraryData.characters).forEach(cKey => {
        if(cKey !== char) {
            const cData = libraryData.characters[cKey];
            const p = cData.phrases || cData.vocab || [];
            p.forEach(phrase => {
                if(!phrase.includes(char)) allFakes.push(phrase);
            });
        }
    });
    allFakes = [...new Set(allFakes)].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    const options = [correctPhrase, ...allFakes].sort(() => 0.5 - Math.random());
    
    options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'quiz-option'; 
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === correctPhrase) {
                btn.classList.add('correct');
                document.getElementById('quiz-feedback').innerText = '✨ 答對了！順利收集到物品，經驗值增加了！';
                delete rpgItems[monsterKey];
                gainXP(20); 
                setTimeout(() => { 
                    modal.style.display = 'none'; 
                    renderRPG();
                }, 1500);
            } else {
                btn.classList.add('incorrect');
                document.getElementById('quiz-feedback').innerText = `💥 答錯了！退後一格！`;
                setTimeout(() => { 
                    modal.style.display = 'none';
                    rpgPlayer.x = rpgHistoryPos.x;
                    rpgPlayer.y = rpgHistoryPos.y;
                    renderRPG();
                }, 1500);
            }
        };
        optionsDiv.appendChild(btn);
    });
    
    modal.style.display = 'flex';
}

function winRPGMode() {
    alert("🎉 恭喜你找到寶箱！！獲得 150 經驗值！");
    gainXP(150);
    exitRPGMode();
}

// Teacher System Functions
function showTeacherSection(sec) {
    document.getElementById('teacher-stats-section').style.display = sec === 'stats' ? 'block' : 'none';
    document.getElementById('teacher-library-section').style.display = sec === 'library' ? 'block' : 'none';
    if (sec === 'library') renderLibraryManager();
}

function renderTeacherDashboard() {
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
}

function previewStudentMap(studentName) {
    const saved = localStorage.getItem(STORAGE_PREFIX + studentName);
    if (!saved) return;
    const studentUser = JSON.parse(saved);
    
    // Save teacher session temporarily
    sessionStorage.setItem('teacherReturnState', 'true');
    
    // Set current user to the student
    currentUser = studentUser;
    selectedGrade = currentUser.grade;
    
    // Update navbar for preview mode
    document.getElementById('userName').innerHTML = `<span style="color: #f87171;">(觀察中)</span> ${currentUser.name}`;
    const navBar = document.getElementById('navbar');
    const exitBtn = document.createElement('button');
    exitBtn.id = 'exit-preview-btn';
    exitBtn.className = 'btn';
    exitBtn.style.cssText = 'padding: 5px 15px; font-size: 0.8rem; background: #ef4444;';
    exitBtn.innerText = '返回導師中控室';
    exitBtn.onclick = exitStudentPreview;
    
    // Remove logout and intro manual conditionally or simply prepend exitBtn
    navBar.querySelector('.user-stats').prepend(exitBtn);
    
    showScreen('map-screen'); 
    renderMap();
}

function exitStudentPreview() {
    sessionStorage.removeItem('teacherReturnState');
    const exitBtn = document.getElementById('exit-preview-btn');
    if (exitBtn) exitBtn.remove();
    
    // Restore teacher
    currentUser = { name: '導師', role: 'teacher', id: 'teacher' };
    document.getElementById('userName').innerText = '導師';
    showDashboard();
}

function renderLibraryManager() {
    const list = document.getElementById('library-manager-list');
    const search = document.getElementById('libSearchInput').value.trim().toLowerCase();
    list.innerHTML = '';

    // Group characters by component
    const grouped = {};
    Object.keys(libraryData.characters).forEach(char => {
        const data = libraryData.characters[char];
        if (search && !char.includes(search) &&
            !(data.definition || '').toLowerCase().includes(search) &&
            !(data.zhuyin || '').includes(search)) return;
        const compId = data.comp || 'other';
        if (!grouped[compId]) grouped[compId] = [];
        grouped[compId].push(char);
    });

    // Render grouped
    const compOrder = libraryData.components.map(c => c.id);
    compOrder.push('other');
    compOrder.forEach(compId => {
        const chars = grouped[compId];
        if (!chars || chars.length === 0) return;
        const comp = libraryData.components.find(c => c.id === compId);
        const groupLabel = comp ? `${comp.symbol} ${comp.name}部` : '其他';

        const header = document.createElement('div');
        header.style.cssText = 'grid-column: 1/-1; padding: 10px 5px 5px; border-bottom: 2px solid var(--text-gold); color: var(--text-gold); font-size: 1.2rem; font-weight: bold; margin-top: 15px;';
        header.innerText = groupLabel + ` (${chars.length} 字)`;
        list.appendChild(header);

        chars.forEach(char => {
            const data = libraryData.characters[char];
            const div = document.createElement('div');
            div.className = 'lib-manage-card';
            div.style.cssText = 'display: flex; flex-direction: column; gap: 4px; padding: 10px;';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.8rem; font-weight: bold;">${char}</span>
                    <span style="font-size: 0.85rem; color: #94a3b8;">${data.zhuyin || ''}</span>
                </div>
                <div style="font-size: 0.8rem; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">${data.definition || '（無解釋）'}</div>
                <div style="font-size: 0.75rem; color: #64748b;">${data.sentence ? data.sentence.substring(0, 20) + '…' : ''}</div>
                <button class="btn-sm" onclick="openEditModal('${char}')" style="margin-top: 4px; width: 100%;">✏️ 編輯</button>
            `;
            list.appendChild(div);
        });
    });

    if (list.children.length === 0) {
        list.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#64748b; padding:2rem;">找不到符合的生字</div>';
    }
}

function openEditModal(char) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-char-form');
    const title = document.getElementById('edit-modal-title');
    const delBtn = document.getElementById('delete-char-btn');
    
    form.reset();
    if (char) {
        title.innerText = `編輯生字：${char}`;
        const d = libraryData.characters[char];
        form.char.value = char;
        form.char.readOnly = true;
        form.zhuyin.value = d.zhuyin;
        form.comp.value = d.comp;
        form.grade.value = d.grade;
        form.definition.value = d.definition;
        form.logic.value = d.logic || '';
        form.story.value = d.story || '';
        form.breakdown.value = (d.breakdown || []).join(',');
        form.phrases.value = (Array.isArray(d.phrases) ? d.phrases : [d.phrases]).join(',');
        form.sentence.value = d.sentence;
        form.image.value = d.image || '';
        document.getElementById('edit-image-upload').value = '';
        if (d.image) {
            document.getElementById('edit-image-preview').src = d.image;
            document.getElementById('edit-image-preview-container').style.display = 'block';
        } else {
            document.getElementById('edit-image-preview-container').style.display = 'none';
        }
        delBtn.style.display = 'inline-block';
        delBtn.onclick = () => deleteCharacter(char);
    } else {
        title.innerText = '新增生字';
        form.char.readOnly = false;
        delBtn.style.display = 'none';
        document.getElementById('edit-image-upload').value = '';
        document.getElementById('edit-image-preview-container').style.display = 'none';
    }
    modal.style.display = 'flex';
}

function closeEditModal() { document.getElementById('edit-modal').style.display = 'none'; }

function saveCharacterEdit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const char = fd.get('char');
    const newCharData = {
        grade: fd.get('grade'),
        zhuyin: fd.get('zhuyin'),
        comp: fd.get('comp'),
        definition: fd.get('definition'),
        phrases: fd.get('phrases').split(','),
        sentence: fd.get('sentence'),
        breakdown: fd.get('breakdown').split(','),
        logic: fd.get('logic'),
        story: fd.get('story'),
        image: fd.get('image')
    };

    libraryData.characters[char] = newCharData;
    
    // Save to LocalStorage
    saveLibraryToLocal();
    closeEditModal();
    renderLibraryManager();
    alert('儲存成功！');
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('edit-image-input').value = evt.target.result;
            document.getElementById('edit-image-preview').src = evt.target.result;
            document.getElementById('edit-image-preview-container').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function updateImagePreview() {
    const val = document.getElementById('edit-image-input').value;
    if (val) {
        document.getElementById('edit-image-preview').src = val;
        document.getElementById('edit-image-preview-container').style.display = 'block';
    } else {
        document.getElementById('edit-image-preview-container').style.display = 'none';
    }
}

function deleteCharacter(char) {
    if (confirm(`確定要刪除「${char}」嗎？`)) {
        delete libraryData.characters[char];
        saveLibraryToLocal();
        closeEditModal();
        renderLibraryManager();
    }
}

function saveLibraryToLocal() {
    const customOnly = {};
    // Optional: only save diffs, but for simplicity we save the modified library state
    localStorage.setItem(CUSTOM_LIB_KEY, JSON.stringify(libraryData.characters));
}

function exportLibraryData() {
    const code = `const updatedCharacters = ${JSON.stringify(libraryData.characters, null, 2)};`;
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'updated_characters_data.js';
    a.click();
    alert('已產出更新代碼檔案。您可以下載後將內容貼入 data.js 的 characters 部分。');
}

// Island & Atmosphere Logic ... (unchanged)
function showIsland(forceIslandId = null) { 
    showScreen('island-screen'); 
    if (forceIslandId) activeIslandId = forceIslandId;
    else if (!activeIslandId) activeIslandId = 'all';
    
    renderIslandSidebar(); 
    renderIsland(); 
}

function renderIslandSidebar() {
    const nav = document.getElementById('island-navigator'); if (!nav) return; nav.innerHTML = '';
    const allItem = document.createElement('div');
    allItem.className = `nav-item ${activeIslandId === 'all' ? 'active' : ''}`;
    allItem.innerHTML = `<span class="nav-symbol">🌍</span> 傳說大陸`;
    allItem.onclick = () => { activeIslandId = 'all'; renderIslandSidebar(); renderIsland(); };
    nav.appendChild(allItem);

    libraryData.components.forEach(comp => {
        const masteredInComp = currentUser.mastered.filter(char => libraryData.characters[char]?.comp === comp.id);
        if (masteredInComp.length === 0) return;
        const item = document.createElement('div');
        item.className = `nav-item ${activeIslandId === comp.id ? 'active' : ''}`;
        item.innerHTML = `<span class="nav-symbol">${comp.symbol}</span> ${comp.symbol}部小島`;
        item.onclick = () => { activeIslandId = comp.id; renderIslandSidebar(); renderIsland(); };
        nav.appendChild(item);
    });
}

function renderIsland() {
    const base = document.getElementById('island-base');
    const screen = document.getElementById('island-screen');
    const atmosphere = document.getElementById('island-atmosphere');
    if (!base) return;
    base.innerHTML = ''; atmosphere.innerHTML = '';
    
    screen.className = 'screen active'; 
    base.className = 'island-base';

    if (activeIslandId === 'all') {
        screen.classList.add('theme-all-island');
        document.getElementById('island-title').innerText = '黃金傳說大陸';
    } else {
        const comp = libraryData.components.find(c => c.id === activeIslandId);
        document.getElementById('island-title').innerText = `${comp.symbol}部小島`;
        base.classList.add(comp.id);
        screen.classList.add(`theme-${comp.id}-island`);
        applyAtmosphere(comp.id, atmosphere);
    }

    const charsToDisplay = Object.keys(currentUser.drawings).filter(char => 
        activeIslandId === 'all' || libraryData.characters[char]?.comp === activeIslandId
    );

    charsToDisplay.forEach(char => {
        const obj = document.createElement('div'); obj.className = 'island-object';
        obj.style.left = `${15 + Math.random() * 70}%`; obj.style.top = `${15 + Math.random() * 60}%`;
        obj.innerHTML = `<img src="${currentUser.drawings[char]}" class="stamped-img"><div class="stamped-char">${char}</div>`;
        obj.onclick = () => openCharModal(char);
        base.appendChild(obj);
    });
}

function applyAtmosphere(type, container) {
    const addParticles = (count, emoji, size = '1.5rem', durRange = [4, 8]) => {
        for(let i=0; i<count; i++) {
            const p = document.createElement('div');
            p.className = 'atmos-particle';
            p.innerText = emoji;
            p.style.fontSize = size;
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${50 + Math.random() * 50}%`;
            p.style.animationDelay = `${Math.random() * 5}s`;
            p.style.animationDuration = `${durRange[0] + Math.random() * durRange[1]}s`;
            container.appendChild(p);
        }
    };

    if (type === 'water') addParticles(20, '💧', '1rem', [3, 6]);
    else if (type === 'wood') addParticles(15, '🍃', '1.2rem');
    else if (type === 'sun') {
        const r = document.createElement('div'); r.className = 'sunray'; container.appendChild(r);
        addParticles(10, '✨', '1.5rem', [2, 4]);
    }
    else if (type === 'person') addParticles(6, '🚶', '2rem', [6, 12]);
    else if (type === 'knife') addParticles(8, '🗡️', '1.5rem', [3, 5]);
    else if (type === 'power') addParticles(12, '💥', '1.2rem', [2, 4]);
    else if (type === 'mouth') addParticles(10, '💬', '1.5rem', [4, 8]);
    else if (type === 'foot') addParticles(10, '👣', '1.5rem', [5, 10]);
    else if (type === 'heart') addParticles(15, '❤️', '1.2rem', [3, 6]);
    else if (type === 'speech') addParticles(12, '✏️', '1.5rem', [4, 7]);
    else if (type === 'grass') addParticles(20, '🌱', '1.8rem', [5, 9]);
    else if (type === 'silk') addParticles(12, '〰️', '1.5rem', [4, 8]);
    else if (type === 'insect') addParticles(12, '🦋', '1.5rem', [4, 8]);
    else if (type === 'gate') addParticles(5, '⛩️', '2rem', [8, 15]);
    else if (type === 'rain') addParticles(30, '☔', '1.2rem', [2, 5]);
    else if (type === 'bird') addParticles(8, '🕊️', '1.5rem', [4, 8]);
}

// Drawing logic
function initCanvas() {
    const canvas = document.getElementById('drawing-canvas'); if (!canvas) return; ctx = canvas.getContext('2d');
    canvas.addEventListener('mousedown', (e) => { isDrawing = true; paint(e); });
    canvas.addEventListener('mousemove', paint);
    canvas.addEventListener('mouseup', () => { isDrawing = false; ctx.beginPath(); });
}
function startDrawing(char) { 
    currentChar = char; 
    document.getElementById('drawing-char-display').innerText = char;
    const tv = document.getElementById('drawing-trace-text');
    if (tv) { tv.innerText = char; }
    const logic = libraryData.characters[char]?.logic || '';
    document.getElementById('drawing-desc').innerText = `💡 繪畫靈感：${logic}`;
    closeModal(); 
    showScreen('drawing-screen'); 
    clearCanvas(); 
}
function paint(e) { if (!isDrawing) return; const rect = e.target.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor; if(currentTool==='eraser') ctx.lineWidth = 20; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); }
function setTool(tool) { currentTool = tool; document.querySelectorAll('.tool-item').forEach(i => i.classList.remove('active')); document.getElementById(`tool-${tool}`).classList.add('active'); }
function setColor(color) { currentColor = color; currentTool = 'brush'; setTool('brush'); }
function clearCanvas() { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 800, 600); }
function saveDrawing() { 
    currentUser.drawings[currentChar] = document.getElementById('drawing-canvas').toDataURL(); 
    gainXP(30); 
    saveUser(); 
    
    const compId = libraryData.characters[currentChar]?.comp || 'all';
    showIsland(compId); 
}
function gainXP(amount) { currentUser.xp += amount; if (currentUser.xp >= currentUser.level * 100) { currentUser.xp -= currentUser.level * 100; currentUser.level++; } saveUser(); updateStats(); }

function renderProfile() {
    const container = document.getElementById('avatar-profile-container');
    if (!container) return;
    
    let badgesHtml = (currentUser.badges || []).map(b => `<div class="badge-item">${b}</div>`).join('');
    if(!badgesHtml) badgesHtml = '<span style="color: #64748b;">尚未獲得徽章，繼續加油！</span>';
    
    let abilitiesHtml = (currentUser.abilities || []).map(a => `<div class="ability-pill">${a}</div>`).join('');
    if(!abilitiesHtml) abilitiesHtml = '<span style="color: #64748b;">學習部首以解鎖能力</span>';

    container.innerHTML = `
        <div style="display: flex; gap: 30px; align-items: center; flex-wrap: wrap;">
            <div class="avatar-sprite" style="background: rgba(30, 41, 59, 1);">
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
    
    if (!currentUser.mastered || currentUser.mastered.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; font-size: 1.2rem; padding: 3rem;">尚未收集到任何字卡。快去小島探險吧！</div>';
        return;
    }
    
    [...currentUser.mastered].reverse().forEach(char => {
        const data = libraryData.characters[char];
        if (!data) return;
        
        let isHard = (data.grade === '2A' || data.grade === '2B');
        let cardClass = isHard ? 'card-hard' : 'card-normal';
        let rarityStar = isHard ? '🌟 困難卡' : '⭐ 普通卡';
        
        const div = document.createElement('div');
        div.className = `char-card-item ${cardClass}`;
        div.innerHTML = `
            <div class="card-rarity">${rarityStar}</div>
            <div class="card-char-big">${char}</div>
            <div class="card-zhuyin">${data.zhuyin}</div>
            <div style="font-size: 0.9rem; margin-bottom: 10px; color: #cbd5e1;">${data.definition}</div>
            <div style="font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; color: #94a3b8;">${Array.isArray(data.phrases) ? data.phrases[0] : data.phrases}</div>
        `;
        div.onclick = () => openCharModal(char); // clicking card opens details
        container.appendChild(div);
    });
}

// =======================
// Puzzle Minigame Logic
// =======================
let currentPuzzleChar = null;
let currentPuzzleParts = [];
let puzzleDropZoneParts = [];

function startPuzzleGame(char) {
    currentPuzzleChar = char;
    const data = libraryData.characters[char];
    if(!data || !data.breakdown || data.breakdown.length === 0) {
        // Fallback if no breakdown
        finishQuiz();
        return;
    }

    showScreen('puzzle-screen');
    document.getElementById('puzzle-feedback').innerText = '';
    
    // Auto-generate hint
    document.getElementById('puzzle-hint').innerText = `💡 提示：${data.logic || '這個字是由多個特別的部件組成的唷！'}`;

    // Get correct parts
    let correctParts = data.breakdown.slice();
    
    // Get 2 random fake parts
    const fakes = ['日', '口', '月', '木', '氵', '土', '心', '女'].filter(f => !correctParts.includes(f));
    fakes.sort(() => 0.5 - Math.random());
    const fakeParts = fakes.slice(0, 2);

    currentPuzzleParts = [...correctParts, ...fakeParts].sort(() => 0.5 - Math.random());
    puzzleDropZoneParts = [];
    
    renderPuzzleUI();
}

function renderPuzzleUI() {
    const partsContainer = document.getElementById('puzzle-parts');
    const dropZone = document.getElementById('puzzle-drop-zone');
    
    partsContainer.innerHTML = '';
    dropZone.innerHTML = '';

    // Render source parts
    currentPuzzleParts.forEach((part, i) => {
        const p = document.createElement('div');
        p.className = 'puzzle-piece';
        p.innerText = part;
        if(puzzleDropZoneParts.includes(i)) {
            p.classList.add('placed');
        } else {
            p.onclick = () => {
                puzzleDropZoneParts.push(i);
                renderPuzzleUI();
            };
        }
        partsContainer.appendChild(p);
    });

    // Render drop zone
    const charData = libraryData.characters[currentPuzzleChar];
    const breakdownLen = charData.breakdown.length;
    const structure = charData.structure || 'left-right';
    
    dropZone.className = ''; 
    dropZone.classList.add('layout-' + structure);
    // Extra styles for the zone itself
    dropZone.style.border = '3px dashed var(--text-gold)';
    dropZone.style.borderRadius = '15px';
    dropZone.style.padding = '20px';
    dropZone.style.background = 'rgba(0,0,0,0.5)';
    dropZone.style.minWidth = '200px';
    dropZone.style.minHeight = '120px';
    dropZone.style.display = 'flex';
    dropZone.style.justifyContent = 'center';
    dropZone.style.alignItems = 'center';
    dropZone.style.gap = '10px';

    for(let k=0; k<breakdownLen; k++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        if(k < puzzleDropZoneParts.length) {
            slot.innerText = currentPuzzleParts[puzzleDropZoneParts[k]];
            slot.style.borderStyle = 'solid';
            // Allow clicking to remove
            slot.onclick = () => {
                puzzleDropZoneParts.splice(k, 1);
                renderPuzzleUI();
            };
        }
        dropZone.appendChild(slot);
    }
}

function resetPuzzle() {
    puzzleDropZoneParts = [];
    document.getElementById('puzzle-feedback').innerText = '';
    renderPuzzleUI();
}

function checkPuzzle() {
    const data = libraryData.characters[currentPuzzleChar];
    const fb = document.getElementById('puzzle-feedback');
    if(puzzleDropZoneParts.length !== data.breakdown.length) {
        fb.innerText = '⚠️ 還有空白的格子喔！';
        fb.style.color = '#ef4444';
        return;
    }

    let isCorrect = true;
    for(let i=0; i<data.breakdown.length; i++) {
        if(currentPuzzleParts[puzzleDropZoneParts[i]] !== data.breakdown[i]) {
            isCorrect = false;
        }
    }

    if(isCorrect) {
        fb.innerText = '🎉 拼對了！太厲害了！';
        fb.style.color = '#4ade80';
        setTimeout(() => {
            finishQuiz();
        }, 1500);
    } else {
        fb.innerText = '❌ 好像順序或部件不太對，再試一次吧！';
        fb.style.color = '#ef4444';
        currentUser.stats[currentPuzzleChar].mistakes++;
        saveUser();
        setTimeout(() => {
            resetPuzzle();
        }, 1500);
    }
}

// =======================
// Falling Catch Minigame
// =======================
let fallingGameInterval;
let fallingItems = [];
let fallingScore = 0;
let fallingTime = 30;
let fallingTargetCompId = null;

function startFallingGame() {
    // Determine the target radical based on active island or default to water
    fallingTargetCompId = activeIslandId !== 'all' ? activeIslandId : 'water';
    const compData = libraryData.components.find(c => c.id === fallingTargetCompId);
    
    document.getElementById('falling-game-title').innerText = `🌧️ 捕捉【${compData.symbol}部】的大挑戰！`;
    document.getElementById('btn-start-falling').style.display = 'none';
    document.getElementById('falling-game-over').style.display = 'none';
    
    fallingScore = 0;
    fallingTime = 30;
    fallingItems = [];
    
    document.getElementById('falling-score').innerText = fallingScore;
    document.getElementById('falling-timer').innerText = fallingTime;
    
    const canvas = document.getElementById('falling-canvas');
    canvas.onclick = handleFallingClick;
    
    if(fallingGameInterval) clearInterval(fallingGameInterval);
    fallingGameInterval = setInterval(updateFallingGame, 50); // 20 fps
    
    // Timer
    const timerInt = setInterval(() => {
        fallingTime--;
        document.getElementById('falling-timer').innerText = fallingTime;
        if(fallingTime <= 0) {
            clearInterval(timerInt);
            endFallingGame();
        }
    }, 1000);
}

function updateFallingGame() {
    const canvas = document.getElementById('falling-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    // Spawn new word
    if(Math.random() < 0.05) {
        // Pick a random char
        const allChars = Object.keys(libraryData.characters);
        const randChar = allChars[Math.floor(Math.random() * allChars.length)];
        fallingItems.push({
            char: randChar,
            x: 50 + Math.random() * (canvas.width - 100),
            y: -50,
            speed: 2 + Math.random() * 3,
            comp: libraryData.characters[randChar].comp
        });
    }

    // Draw and update items
    for(let i=fallingItems.length-1; i>=0; i--) {
        let item = fallingItems[i];
        item.y += item.speed;
        
        ctx.font = '40px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.char, item.x, item.y);
        
        if(item.y > canvas.height + 50) {
            fallingItems.splice(i, 1);
        }
    }
}

function handleFallingClick(e) {
    const canvas = document.getElementById('falling-canvas');
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    for(let i=fallingItems.length-1; i>=0; i--) {
        let item = fallingItems[i];
        let dist = Math.sqrt(Math.pow(cx - item.x, 2) + Math.pow(cy - item.y, 2));
        if(dist < 30) {
            // Hit!
            if(item.comp === fallingTargetCompId) {
                fallingScore += 10;
                // Simple visual feedback could go here
            } else {
                fallingScore -= 5;
            }
            document.getElementById('falling-score').innerText = fallingScore;
            fallingItems.splice(i, 1);
            break;
        }
    }
}

function endFallingGame() {
    clearInterval(fallingGameInterval);
    document.getElementById('falling-game-over').style.display = 'block';
    document.getElementById('falling-final-score').innerText = fallingScore;
    document.getElementById('btn-start-falling').style.display = 'inline-block';
    document.getElementById('btn-start-falling').innerText = '再玩一次';
    
    if(fallingScore > 0) {
        gainXP(fallingScore); // Reward user
    }
}

// =======================
// Adventure Word Quiz (New in 2.1)
// =======================
let currentWordQuizChar = null;
let currentWordQuizKey = null;
let currentWordCorrectAns = null;

function triggerWordQuiz(char, key) {
    currentWordQuizChar = char;
    currentWordQuizKey = key;
    const data = libraryData.characters[char];
    
    // Generate a word formation question
    const vocab = data.vocab || data.phrases || ["字卡"];
    const targetWord = vocab[Math.floor(Math.random() * vocab.length)];
    const charIndex = targetWord.indexOf(char);
    
    if(charIndex === -1 || targetWord.length < 2) {
        gainXP(30);
        delete rpgItems[key];
        renderRPG();
        return;
    }
    
    const targetPart = charIndex === 0 ? targetWord[1] : targetWord[0];
    currentWordCorrectAns = targetPart;

    document.getElementById('word-quiz-modal').style.display = 'flex';
    document.getElementById('word-quiz-main-char').innerText = char;
    document.getElementById('word-quiz-feedback').innerText = '';
    
    const slots = document.getElementById('word-quiz-slots');
    slots.innerHTML = '';
    if(charIndex === 0) {
        slots.innerHTML = `<div class="puzzle-slot" style="border-style: solid; color: white;">${char}</div><div class="puzzle-slot" id="word-target-slot" style="color: var(--text-gold);">?</div>`;
    } else {
        slots.innerHTML = `<div class="puzzle-slot" id="word-target-slot" style="color: var(--text-gold);">?</div><div class="puzzle-slot" style="border-style: solid; color: white;">${char}</div>`;
    }

    const options = [targetPart];
    const fakes = ['人', '口', '水', '木', '火', '土', '金', '日', '月', '大', '小'].filter(f => f !== targetPart);
    fakes.sort(() => 0.5 - Math.random());
    options.push(fakes[0], fakes[1]);
    options.sort(() => 0.5 - Math.random());

    const optGrid = document.getElementById('word-quiz-options');
    optGrid.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'word-opt-card';
        btn.innerText = opt;
        btn.onclick = () => checkWordQuiz(opt, btn);
        optGrid.appendChild(btn);
    });
}

function checkWordQuiz(opt, btn) {
    const fb = document.getElementById('word-quiz-feedback');
    if(opt === currentWordCorrectAns) {
        btn.classList.add('correct');
        fb.innerText = '✨ 太棒了！組合成功！';
        fb.style.color = '#4ade80';
        gainXP(40);
        delete rpgItems[currentWordQuizKey];
        setTimeout(() => {
            document.getElementById('word-quiz-modal').style.display = 'none';
            renderRPG();
        }, 1200);
    } else {
        btn.classList.add('wrong');
        fb.innerText = '❌ 好像組不起來喔，再試試看！';
        fb.style.color = '#ef4444';
        // Bounce back
        rpgPlayer.x = rpgHistoryPos.x;
        rpgPlayer.y = rpgHistoryPos.y;
        setTimeout(() => {
            document.getElementById('word-quiz-modal').style.display = 'none';
            renderRPG();
        }, 1200);
    }
}
