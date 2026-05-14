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

// =====================
// 漢語拼音 Pinyin Lookup Table
// =====================
const PINYIN_MAP = {
    // 女部
    "好":"hǎo","媽":"mā","姐":"jiě","妹":"mèi","她":"tā","奶":"nǎi","妙":"miào","姑":"gū","娘":"niáng",
    // 手部
    "手":"shǒu","招":"zhāo","找":"zhǎo","拍":"pāi","拿":"ná","幫":"bāng","拉":"lā","推":"tuī",
    "把":"bǎ","抓":"zhuā","搶":"qiǎng","接":"jiē","搖":"yáo","撥":"bō","指":"zhǐ","甩":"shuǎi",
    "提":"tí","擔":"dān","扭":"niǔ","換":"huàn","捧":"pěng","掉":"diào","抱":"bào","持":"chí",
    "操":"cāo","搗":"dǎo",
    // 人部
    "你":"nǐ","他":"tā","們":"men","人":"rén","像":"xiàng","什":"shén","但":"dàn","借":"jiè",
    "住":"zhù","做":"zuò","健":"jiàn","候":"hòu","件":"jiàn","伸":"shēn","倒":"dǎo","介":"jiè",
    "保":"bǎo","伴":"bàn","傳":"chuán","信":"xìn",
    // 口部
    "吹":"chuī","問":"wèn","叫":"jiào","嗎":"ma","哈":"hā","右":"yòu","和":"hé","呀":"ya",
    "唱":"chàng","呢":"ne","吧":"ba","啊":"a","咬":"yǎo","吃":"chī","哭":"kū","呱":"guā",
    "聞":"wén","嘴":"zuǐ","名":"míng","哪":"nǎ","盒":"hé","口":"kǒu","對":"duì","念":"niàn",
    "巴":"bā","哇":"wā","喝":"hē","呵":"hē","呼":"hū","吵":"chǎo","吐":"tǔ","嚇":"xià","告":"gào",
    // 水部
    "水":"shuǐ","沒":"méi","泡":"pào","池":"chí","涼":"liáng","河":"hé","游":"yóu","溫":"wēn",
    "漂":"piāo","滿":"mǎn","消":"xiāo","法":"fǎ","灘":"tān","海":"hǎi","溪":"xī","活":"huó",
    "清":"qīng","沖":"chōng","澡":"zǎo","浴":"yù","減":"jiǎn","浮":"fú","波":"bō","滴":"dī",
    "浪":"làng","渴":"kě","洗":"xǐ","泥":"ní","漸":"jiàn","淚":"lèi",
    // 木部
    "棵":"kē","樹":"shù","桌":"zhuō","樣":"yàng","材":"cái","桶":"tǒng","木":"mù","植":"zhí",
    "根":"gēn","棍":"gùn","棒":"bàng",
    // 足部
    "走":"zǒu","跑":"pǎo","路":"lù","跳":"tiào","步":"bù","越":"yuè","腳":"jiǎo","跡":"jī",
    "踢":"tī","足":"zú",
    // 心部
    "心":"xīn","想":"xiǎng","快":"kuài","急":"jí","情":"qíng","忍":"rěn","忘":"wàng","怎":"zěn",
    "意":"yì","思":"sī","怪":"guài","總":"zǒng","慢":"màn","煩":"fán","怕":"pà",
    // 言部
    "請":"qǐng","說":"shuō","誰":"shuí","寫":"xiě","話":"huà","課":"kè","記":"jì","試":"shì",
    "習":"xí","證":"zhèng","認":"rèn","識":"shì","讀":"dú","謎":"mí","答":"dá","訴":"sù","託":"tuō",
    // 艸部
    "草":"cǎo","花":"huā","葉":"yè","菜":"cài","苔":"tái","蔬":"shū","荷":"hé","藥":"yào",
    // 糸部
    "綠":"lǜ","紅":"hóng","給":"gěi","緊":"jǐn","線":"xiàn","絲":"sī","終":"zhōng",
    // 虫部
    "蛙":"wā","螃":"páng","蟹":"xiè","蝦":"xiā","蚯":"qiū","蚓":"yǐn","蝌":"kē","蚪":"dǒu",
    "蜘":"zhī","蛛":"zhū",
    // 日部
    "星":"xīng","早":"zǎo","時":"shí","陽":"yáng","晴":"qíng","晚":"wǎn","暗":"àn","昨":"zuó","晨":"chén",
    // 門部
    "間":"jiān","閃":"shǎn","門":"mén","閒":"xián","闖":"chuǎng",
    // 雨部
    "雨":"yǔ","雲":"yún","電":"diàn","雪":"xuě","露":"lù",
    // 鳥部
    "雀":"què","雙":"shuāng","隻":"zhī","雞":"jī","鴨":"yā","鵝":"é","鴿":"gē"
};

function getPinyin(char) {
    return PINYIN_MAP[char] || '';
}

function getZhuyin(char) {
    const data = libraryData.characters[char];
    return data ? data.zhuyin : '';
}

function getRubyHTML(phrase) {
    if (!phrase) return '';
    return phrase.split('').map(c => {
        const z = getZhuyin(c);
        return z ? `<ruby>${c}<rt style="font-size: 0.5em; color: #94a3b8;">${z}</rt></ruby>` : c;
    }).join('');
}

// Drawing State... (existing unchanged code)
let isDrawing = false;
let ctx = null;
let currentTool = 'brush';
let currentColor = '#000000';

// =====================
// Text-to-Speech (TTS) System
// =====================
let ttsVoice = null;
function initTTS() {
    const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        // Prefer zh-TW, then zh-CN, then any Chinese voice
        ttsVoice = voices.find(v => v.lang === 'zh-TW')
                || voices.find(v => v.lang.startsWith('zh'))
                || null;
    };
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function speakText(text, rate = 0.8) {
    if (!('speechSynthesis' in window)) {
        console.warn('此瀏覽器不支援語音合成');
        return;
    }
    speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = rate;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    if (ttsVoice) utterance.voice = ttsVoice;
    
    // Visual feedback - find and animate the clicked button
    const activeBtn = document.querySelector('.speak-btn.speaking');
    if (activeBtn) activeBtn.classList.remove('speaking');
    
    speechSynthesis.speak(utterance);
}

function speakChar(char) {
    speakText(char, 0.6); // Slower for single character
}

function speakPhrase(text) {
    speakText(text, 0.85);
}

function speakSentence(text) {
    speakText(text, 0.9);
}

// Speak button with animation helper
function createSpeakBtnHTML(text, size = '1.2rem', label = '', rate = 0.8) {
    const escaped = text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const title = label || `朗讀「${text}」`;
    return `<button class="speak-btn" onclick="event.stopPropagation(); this.classList.add('speaking'); speakText('${escaped}', ${rate}); setTimeout(() => this.classList.remove('speaking'), 1200);" title="${title}" style="font-size: ${size};" aria-label="${title}">🔊</button>`;
}

const STORAGE_PREFIX = 'characterQuest_user_';
const USERLIST_KEY = 'characterQuest_allStudentNames';

document.addEventListener('DOMContentLoaded', () => {
    loadSession();
    initCanvas();
    initTTS();
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

function openStudentImportModal() {
    document.getElementById('student-import-modal').style.display = 'flex';
    document.getElementById('import-feedback').innerText = '';
    document.getElementById('teacher-import-code').value = '';
}

function importStudentFromCode() {
    const code = document.getElementById('teacher-import-code').value.trim();
    if (!code) { alert('請貼入進度代碼'); return; }
    try {
        const data = JSON.parse(decodeURIComponent(escape(atob(code))));
        if (!data.name) throw new Error('格式錯誤');
        
        // Save to LocalStorage
        localStorage.setItem(STORAGE_PREFIX + data.name, JSON.stringify({ ...data, role: 'student' }));
        
        // Add to teacher's user list if not present
        const existingList = JSON.parse(localStorage.getItem(USERLIST_KEY) || '[]');
        if (!existingList.includes(data.name)) {
            existingList.push(data.name);
            localStorage.setItem(USERLIST_KEY, JSON.stringify(existingList));
        }

        document.getElementById('import-feedback').innerText = `✅ 已成功匯入「${data.name}」的進度！`;
        document.getElementById('import-feedback').style.color = '#4ade80';
        
        // If we are on the login screen, optionally update or just let them login manually
        if (document.getElementById('login-screen').classList.contains('active')) {
             document.getElementById('usernameInput').value = data.name;
             document.getElementById('import-feedback').innerText += '（已填入暱稱，請點擊「開始冒險」）';
        }

        if (currentUser && currentUser.role === 'teacher') renderTeacherDashboard();
        
        setTimeout(() => {
            document.getElementById('student-import-modal').style.display = 'none';
        }, 1500);
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
    
    // Hide device switcher after login
    const switcher = document.querySelector('.device-switcher');
    if (switcher) switcher.style.display = 'none';

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
            <div class="area-info"><div class="area-title">${getRubyHTML(comp.symbol)} ${comp.name}</div>
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
        const data = libraryData.characters[char];
        const card = document.createElement('div');
        card.className = 'character-card';
        if (isMastered) card.style.borderColor = 'var(--primary-color)';
        card.innerHTML = `<div class="char-glyph">${char}</div>
            <div class="char-phonetics">
                <span class="card-zhuyin-text">${data.zhuyin}</span>
                <span class="card-pinyin-text">${getPinyin(char)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; justify-content: center;">
                <span style="font-size: 0.8rem; color: #94a3b8;">${isMastered ? '✅ 已掌握' : '未學習'}</span>
                ${createSpeakBtnHTML(char, '1rem', '聽聽看', 0.6)}
            </div>`;
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

    const phrasesText = Array.isArray(data.phrases) ? data.phrases.join('、') : data.phrases;
    const phrasesArr = Array.isArray(data.phrases) ? data.phrases : (data.phrases ? data.phrases.split('、') : []);
    const phraseButtons = phrasesArr.map(p => `<span class="phrase-speak-item" style="display:inline-flex; align-items:center; gap:4px; margin-right:10px;">${getRubyHTML(p)} ${createSpeakBtnHTML(p, '0.85rem', '聽聽「' + p + '」', 0.85)}</span>`).join('');

    body.innerHTML = `
        <div style="display: flex; gap: 2rem; align-items: start;">
            <div style="flex: 1; text-align: center;">
                <div style="position: relative; display: inline-block;">
                    <div style="font-size: 6rem; color: var(--text-gold); line-height: 1; margin-bottom: 0.5rem; cursor: pointer;" onclick="speakChar('${char}')" title="點擊聽發音">${char}</div>
                    ${createSpeakBtnHTML(char, '1.8rem', '聽聽「' + char + '」的發音', 0.6)}
                </div>
                <div style="font-size: 1.8rem; color: #94a3b8; font-weight: bold; margin-bottom: 0.5rem;">[ ${data.zhuyin} ]</div>
                <div style="font-size: 1.1rem; color: #60a5fa; letter-spacing: 2px; margin-bottom: 1.5rem;">${getPinyin(char)}</div>
                <div style="font-size: 1.2rem; margin-bottom: 1.5rem; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; color: white;">
                    <strong style="color: var(--text-gold);">意思是：</strong><br>${data.definition}
                    ${createSpeakBtnHTML(data.definition, '0.9rem', '朗讀解釋', 0.9)}
                </div>
                ${data.image ? `<div class="char-illustration-container"><img src="${data.image}" class="char-illustration"></div>` : 
                `<div class="char-illustration-placeholder">繪本插圖陸續增加中...</div>`}
            </div>
            <div style="flex: 1.5;">
                <div class="mnemonic-container" style="grid-template-columns: 1fr;">
                    <div class="mnemonic-box box-logic" style="margin-bottom: 1rem;">
                        <div class="box-label">💡 部件大奧祕 (字理) ${createSpeakBtnHTML(data.logic || '這是一個特別的合體字', '0.85rem', '朗讀字理', 0.85)}</div>
                        <div class="box-content">${data.logic || "這是一個特別的合體字！"}</div>
                    </div>
                    <div class="mnemonic-box box-story">
                        <div class="box-label">📖 識字小故事 ${createSpeakBtnHTML(data.story || '相傳在古老的文字森林中', '0.85rem', '朗讀故事', 0.85)}</div>
                        <div class="box-content">${data.story || "相傳在古老的文字森林中..."}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
                    <div style="background: rgba(34, 197, 94, 0.1); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2);">
                        <h3 style="color: #4ade80; margin-bottom: 0.5rem; font-size: 1rem;">🍎 造詞小天地</h3>
                        <div style="font-size: 1.1rem; line-height: 2;">${phraseButtons}</div>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
                        <h3 style="color: #60a5fa; margin-bottom: 0.5rem; font-size: 1rem;">✍️ 造句練習場 ${createSpeakBtnHTML(data.sentence, '0.85rem', '朗讀例句', 0.9)}</h3>
                        <p style="font-size: 1.1rem; line-height: 1.8;">${getRubyHTML(data.sentence)}</p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 1.5rem; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
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

function getSimilarDistractors(char, count = 3) {
    const data = libraryData.characters[char];
    if (!data) return [];
    // Prefer characters with the same radical (comp)
    let sameComp = Object.keys(libraryData.characters).filter(c => c !== char && libraryData.characters[c].comp === data.comp);
    if (sameComp.length < count) {
        let others = Object.keys(libraryData.characters).filter(c => c !== char && !sameComp.includes(c));
        sameComp = [...sameComp, ...others.sort(() => 0.5 - Math.random())];
    }
    return sameComp.sort(() => 0.5 - Math.random()).slice(0, count);
}

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
    const feedback = document.getElementById('quiz-feedback');
    const qTitle = document.getElementById('quiz-question-title');
    
    // Total stages: 1.Listening, 2.Meaning, 3.Application, 4.Association, 5.Puzzle
    if (currentQuizStage === 6) {
        finishQuiz();
        return;
    }
    if (currentQuizStage === 5) {
        modal.style.display = 'none';
        startPuzzleGame(currentChar);
        return;
    }
    
    optionsDiv.innerHTML = '';
    feedback.innerText = '';
    modal.style.display = 'flex';

    if (!currentUser.stats) currentUser.stats = {};
    if (!currentUser.stats[currentChar]) currentUser.stats[currentChar] = { attempts: 0, mistakes: 0 };
    currentUser.stats[currentChar].attempts++;
    saveUser();

    if (currentQuizStage === 1) {
        qTitle.innerHTML = `【1. 聽音辨字】聽聽看發音，選出正確的字：<br><br>
            <button class="btn" onclick="speakChar('${currentChar}')">🔊 播放發音</button>`;
        speakChar(currentChar);
        const correctChar = currentChar;
        const options = [correctChar, ...getSimilarDistractors(correctChar)].sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            const btn = document.createElement('div'); btn.className = 'quiz-option'; btn.style.fontSize = '3.5rem'; btn.style.textAlign = 'center';
            btn.innerText = opt;
            btn.onclick = () => handleQuizAnswer(opt === correctChar, btn, charData.logic);
            optionsDiv.appendChild(btn);
        });
    } else if (currentQuizStage === 2) {
        qTitle.innerText = `【2. 字義理解】「${currentChar}」的意思是？`;
        const correctDef = charData.definition;
        let allDefs = Object.values(libraryData.characters).map(c => c.definition).filter(d => d !== correctDef);
        allDefs = [...new Set(allDefs)].sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [correctDef, ...allDefs].sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            const btn = document.createElement('div'); btn.className = 'quiz-option'; btn.innerText = opt;
            btn.onclick = () => handleQuizAnswer(opt === correctDef, btn, charData.logic);
            optionsDiv.appendChild(btn);
        });
    } else if (currentQuizStage === 3) {
        let sentence = charData.sentence || "這個__字非常好學。";
        let maskedSentence = sentence.replace(new RegExp(currentChar, 'g'), "___");
        qTitle.innerText = `【3. 句中識字】請選出正確的字填入：\n「${maskedSentence}」`;
        const correctChar = currentChar;
        let allChars = Object.keys(libraryData.characters).filter(c => c !== correctChar);
        allChars = allChars.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [correctChar, ...allChars].sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            const btn = document.createElement('div'); btn.className = 'quiz-option'; btn.innerText = opt;
            btn.onclick = () => handleQuizAnswer(opt === correctChar, btn, charData.logic);
            optionsDiv.appendChild(btn);
        });
    } else if (currentQuizStage === 4) {
        let storyTxt = charData.story || charData.logic;
        qTitle.innerText = `【4. 故事聯想】哪一個字的故事是：「${storyTxt}」`;
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
    const optionsDiv = document.getElementById('quiz-options');
    optionsDiv.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center;">
            <div style="font-size: 5rem; margin-bottom: 1rem;">${currentChar}</div>
            <p style="font-size: 1.2rem; margin-bottom: 2rem; color: #4ade80;">你已經完美掌握了這個字！獲得 5 顆鑽石 💎</p>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <button class="btn" onclick="startDrawing('${currentChar}')">🎨 幫這個字畫張畫 (裝飾小島)</button>
                <button class="btn btn-secondary" onclick="closeQuizAndGoBack()">📚 繼續學習其他字</button>
            </div>
        </div>
    `;
    document.getElementById('quiz-feedback').innerText = '';
    
    if (!currentUser.mastered.includes(currentChar)) { 
        currentUser.mastered.push(currentChar); 
        gainXP(50); 
        checkBadgesAndAbilities();
    }
    
    if (!currentUser.stats) currentUser.stats = {};
    currentUser.stats.gems = (currentUser.stats.gems || 0) + 5;
    saveUser();
    
    modal.style.display = 'flex';
}

function closeQuizAndGoBack() {
    document.getElementById('quiz-modal').style.display = 'none';
    if (currentUser.mastered.length % 5 === 0 && currentUser.mastered.length > 0) {
        alert('🌟 太棒了！你已經掌握了 5 個新字，勇者大陸出現了新的冒險入口！');
        startRPGMode();
    } else {
        showLibrary(currentArea);
    }
}

function checkBadgesAndAbilities() {
    if (!currentUser.badges) currentUser.badges = [];
    if (!currentUser.abilities) currentUser.abilities = [];
    if (!currentUser.stats) currentUser.stats = {};
    
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
    let masteredCompsSet = new Set();
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
        if(compMastery[compId].mastered > 0) masteredCompsSet.add(compId);
    });

    if (completedCompsCount >= 3 && !currentUser.badges.includes('🌟 部件高手')) currentUser.badges.push('🌟 部件高手');
    if (completedCompsCount >= 5 && !currentUser.badges.includes('👑 識字王')) currentUser.badges.push('👑 識字王');

    // 3. 正確率徽章
    let totalAttempts = 0; let totalMistakes = 0;
    if(currentUser.stats) {
        Object.keys(currentUser.stats).forEach(c => {
            if(typeof currentUser.stats[c] !== 'object' || !currentUser.stats[c]) return;
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

    // 5. 新增：藝術創作徽章
    let drawingCount = Object.keys(currentUser.drawings || {}).length;
    if(drawingCount >= 5 && !currentUser.badges.includes('🎨 初級畫師')) currentUser.badges.push('🎨 初級畫師');
    if(drawingCount >= 20 && !currentUser.badges.includes('🖌️ 傳說繪本家')) currentUser.badges.push('🖌️ 傳說繪本家');

    // 6. 新增：多元探險徽章
    if(masteredCompsSet.size >= 8 && !currentUser.badges.includes('🌈 多元探險家')) currentUser.badges.push('🌈 多元探險家');
    if(masteredCompsSet.size >= 15 && !currentUser.badges.includes('🗺️ 全域開拓者')) currentUser.badges.push('🗺️ 全域開拓者');

    // 7. 新增：地下城徽章
    if((currentUser.stats.rpgWins || 0) >= 1 && !currentUser.badges.includes('🏰 地下城勇者')) currentUser.badges.push('🏰 地下城勇者');
    if((currentUser.stats.rpgItemsCount || 0) >= 20 && !currentUser.badges.includes('💎 寶藏獵人')) currentUser.badges.push('💎 寶藏獵人');

    // 8. 新增：等級里程碑
    if(currentUser.level >= 10 && !currentUser.badges.includes('🚀 突飛猛進')) currentUser.badges.push('🚀 突飛猛進');

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
    
    // The question is now about Zhuyin -> Character
    document.getElementById('quiz-question-title').innerHTML = `⚔️ 勇者，請證明你的實力！<br>請問注音「<span style="font-size:3.5rem; color:#000;">${data.zhuyin}</span>」是對應哪個國字呢？`;
    document.getElementById('quiz-feedback').innerText = '';
    
    // Get fake characters from the library
    let allFakes = Object.keys(libraryData.characters).filter(cKey => cKey !== char);
    allFakes = allFakes.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    const options = [char, ...allFakes].sort(() => 0.5 - Math.random());
    
    options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'quiz-option'; 
        btn.style.fontSize = '2.5rem'; // Larger font for single character options
        btn.style.padding = '15px';
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === char) {
                btn.classList.add('correct');
                document.getElementById('quiz-feedback').innerText = '✨ 答對了！順利收集到物品，經驗值增加了！';
                delete rpgItems[monsterKey];
                
                // Increment RPG items count for badge
                if(!currentUser.stats) currentUser.stats = {};
                currentUser.stats.rpgItemsCount = (currentUser.stats.rpgItemsCount || 0) + 1;
                checkBadgesAndAbilities(); // Check for new badges
                
                gainXP(20); 
                setTimeout(() => { 
                    modal.style.display = 'none'; 
                    renderRPG();
                }, 1500);
            } else {
                btn.classList.add('incorrect');
                const optData = libraryData.characters[opt];
                document.getElementById('quiz-feedback').innerText = `💥 答錯了！那個字念「${optData ? optData.zhuyin : '?'}」，退後一格！`;
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
    
    // Increment RPG wins for badge
    if(!currentUser.stats) currentUser.stats = {};
    currentUser.stats.rpgWins = (currentUser.stats.rpgWins || 0) + 1;
    checkBadgesAndAbilities(); // Check for new badges
    
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

    // Grid-based placement to avoid overlap
    const count = charsToDisplay.length;
    const gridSize = Math.ceil(Math.sqrt(count || 1)) + 1;
    const rows = Math.max(gridSize, 4);
    const cols = Math.max(gridSize, 4);
    
    const cells = [];
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            cells.push({ r, c });
        }
    }
    // Shuffle cells
    cells.sort(() => 0.5 - Math.random());

    charsToDisplay.forEach((char, index) => {
        if (index >= cells.length) return;
        const cell = cells[index];
        const obj = document.createElement('div'); obj.className = 'island-object';
        
        // Distribution with jitter
        const left = 15 + (cell.c * (70/cols)) + (Math.random() * 4 - 2);
        const top = 15 + (cell.r * (60/rows)) + (Math.random() * 4 - 2);
        
        obj.style.left = `${left}%`; 
        obj.style.top = `${top}%`;
        obj.innerHTML = `<img src="${currentUser.drawings[char]}" class="stamped-img"><div class="stamped-char">${getRubyHTML(char)}</div>`;
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
let canvasInitialized = false;
function initCanvas() {
    const canvas = document.getElementById('drawing-canvas'); 
    if (!canvas) return; 
    ctx = canvas.getContext('2d');
    
    if (!canvasInitialized) {
        canvasInitialized = true;
        // Mouse events
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; paint(e); });
        canvas.addEventListener('mousemove', paint);
        canvas.addEventListener('mouseup', () => { isDrawing = false; ctx.beginPath(); });
        canvas.addEventListener('mouseleave', () => { isDrawing = false; ctx.beginPath(); });
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; paintTouch(e); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); paintTouch(e); }, { passive: false });
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); isDrawing = false; ctx.beginPath(); }, { passive: false });
    }
    // Resize canvas for mobile
    resizeCanvas();
}

function resizeCanvas() {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    const container = canvas.parentElement;
    const maxW = Math.min(container.offsetWidth - 20, 600);
    canvas.style.width = maxW + 'px';
    canvas.style.height = Math.round(maxW * 2/3) + 'px';
}

function paintTouch(e) {
    if (!isDrawing) return;
    const canvas = document.getElementById('drawing-canvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    ctx.lineWidth = currentTool === 'eraser' ? 30 : 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}
function startDrawing(char) { 
    currentChar = char;
    // 1. 先關閉所有 modals
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    // 2. 先切換畫面，讓 canvas 變成可見狀態
    showScreen('drawing-screen');
    // 3. 更新 UI 文字
    const charDisplay = document.getElementById('drawing-char-display');
    if (charDisplay) charDisplay.innerText = char;
    const tv = document.getElementById('drawing-trace-text');
    if (tv) tv.innerText = char;
    const logic = libraryData.characters[char]?.logic || '';
    const descEl = document.getElementById('drawing-desc');
    if (descEl) descEl.innerText = `💡 繪畫靈感：${logic}`;
    // 4. 畫面顯示後才初始化/重置 canvas
    requestAnimationFrame(() => {
        initCanvas();
        clearCanvas();
    });
}
function paint(e) { 
    if (!isDrawing) return; 
    const canvas = document.getElementById('drawing-canvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX; 
    const y = (e.clientY - rect.top) * scaleY; 
    ctx.lineWidth = currentTool === 'eraser' ? 30 : 5; 
    ctx.lineCap = 'round'; 
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor; 
    ctx.lineTo(x, y); 
    ctx.stroke(); 
    ctx.beginPath(); 
    ctx.moveTo(x, y); 
}
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

const EQUIPMENT_DATA = [
    // --- HEAD ---
    { id: 'cap_1',    name: '🎓 學者帽',     desc: '好學不倦的冒險者專屬帽，知識就是力量！',     cost: 40,  type: 'head',   unlock: 0  },
    { id: 'crown_1',  name: '👑 智者皇冠',   desc: '象徵最高榮譽的皇冠，戴上就是識字王！',       cost: 150, type: 'head',   unlock: 20 },
    { id: 'hat_1',    name: '🪄 魔法高帽',   desc: '神秘的魔法師高帽，讓你思路更清晰。',         cost: 80,  type: 'head',   unlock: 10 },

    // --- WEAPON ---
    { id: 'brush_1',  name: '🖊️ 文字之筆',   desc: '將每個漢字寫得優美流暢，無往不利！',         cost: 30,  type: 'weapon', unlock: 0  },
    { id: 'sword_1',  name: '⚔️ 識字之劍',   desc: '每掌握一字，劍刃就更加鋒利！',               cost: 70,  type: 'weapon', unlock: 5  },
    { id: 'staff_1',  name: '🪄 部首法杖',   desc: '凝聚各部件力量的強大法杖！',                 cost: 120, type: 'weapon', unlock: 15 },
    { id: 'bow_1',    name: '🏹 注音神弓',   desc: '以注音符號為箭，百發百中！',                  cost: 100, type: 'weapon', unlock: 10 },

    // --- SHIELD ---
    { id: 'shield_1', name: '🛡️ 識字護盾',   desc: '在測驗中守護你的智慧，抵擋錯誤攻擊。',       cost: 50,  type: 'shield', unlock: 0  },
    { id: 'barrier_1',name: '✨ 星光魔盾',   desc: '閃耀星光的神奇護盾，錯誤傷害減半！',         cost: 110, type: 'shield', unlock: 12 },

    // --- CAPE ---
    { id: 'cape_1',   name: '📜 部首披風',   desc: '刻滿古老部首的神奇披風，隨風飄動。',          cost: 60,  type: 'cape',   unlock: 0  },
    { id: 'cape_2',   name: '🌌 星河披風',   desc: '由無數文字星光編織而成的夢幻披風！',          cost: 130, type: 'cape',   unlock: 20 },
    { id: 'cape_3',   name: '🐉 龍族戰袍',   desc: '傳說中龍族守護者所穿的神聖戰袍！',            cost: 200, type: 'cape',   unlock: 30 },

    // --- BOOTS ---
    { id: 'boots_1',  name: '👟 探險跑鞋',   desc: '讓你在冒險地圖上移動得更快！',               cost: 40,  type: 'boots',  unlock: 0  },
    { id: 'boots_2',  name: '🥾 傳說戰靴',   desc: '踏遍每座部件小島的勇者之靴！',               cost: 90,  type: 'boots',  unlock: 8  },
    { id: 'boots_3',  name: '🌟 黃金戰靴',   desc: '識字達人的最高榮耀，黃金打造！',              cost: 170, type: 'boots',  unlock: 25 },

    // --- RING ---
    { id: 'ring_1',   name: '💍 水晶戒指',   desc: '提升記憶力，讓你牢記每個漢字！',              cost: 45,  type: 'ring',   unlock: 0  },
    { id: 'ring_2',   name: '🔮 先知寶環',   desc: '傳說能看穿漢字奧秘的神秘寶環！',              cost: 140, type: 'ring',   unlock: 18 },
];

const SLOT_INFO = {
    head:   { label: '頭部', default: '👑', empty: '空（等待裝備）' },
    weapon: { label: '武器', default: '🗡️', empty: '空（等待裝備）' },
    shield: { label: '護盾', default: '🛡️', empty: '空（等待裝備）' },
    cape:   { label: '披風', default: '🌀', empty: '空（等待裝備）' },
    boots:  { label: '靴子', default: '👢', empty: '空（等待裝備）' },
    ring:   { label: '戒指', default: '💍', empty: '空（等待裝備）' },
};

const HERO_TITLES = [
    { minMastered: 0,  title: '初學者', emoji: '🧙' },
    { minMastered: 5,  title: '文字學徒', emoji: '🧝' },
    { minMastered: 15, title: '識字探險家', emoji: '🦸' },
    { minMastered: 30, title: '部件守護者', emoji: '🧙‍♂️' },
    { minMastered: 50, title: '傳說識字王', emoji: '🤴' },
    { minMastered: 80, title: '千字無敵勇者', emoji: '👑' },
];

function getHeroInfo() {
    const mastered = (currentUser.mastered || []).length;
    let info = HERO_TITLES[0];
    for (const t of HERO_TITLES) {
        if (mastered >= t.minMastered) info = t;
    }
    return info;
}

function switchEquipTab(tab) {
    const isAvatar = tab === 'avatar';
    document.getElementById('eq-panel-avatar').style.display = isAvatar ? 'flex' : 'none';
    document.getElementById('eq-panel-shop').style.display = isAvatar ? 'none' : 'block';
    const avatarBtn = document.getElementById('eq-tab-avatar');
    const shopBtn = document.getElementById('eq-tab-shop');
    avatarBtn.style.background = isAvatar ? 'rgba(251,191,36,0.1)' : 'transparent';
    avatarBtn.style.color = isAvatar ? 'var(--text-gold)' : '#64748b';
    avatarBtn.style.borderBottom = isAvatar ? '3px solid var(--text-gold)' : '3px solid transparent';
    shopBtn.style.background = !isAvatar ? 'rgba(251,191,36,0.1)' : 'transparent';
    shopBtn.style.color = !isAvatar ? 'var(--text-gold)' : '#64748b';
    shopBtn.style.borderBottom = !isAvatar ? '3px solid var(--text-gold)' : '3px solid transparent';
}

function showEquipment() {
    const modal = document.getElementById('equipment-modal');
    if (!currentUser.inventory) currentUser.inventory = [];
    if (!currentUser.equipped) currentUser.equipped = {};
    if (!currentUser.stats) currentUser.stats = {};
    // Sync gems from RPG items collected
    if (currentUser.stats.gems === undefined) {
        currentUser.stats.gems = currentUser.stats.rpgItemsCount || 0;
    }

    document.getElementById('user-gems-count').innerText = currentUser.stats.gems || 0;

    // Render hero avatar
    const heroInfo = getHeroInfo();
    document.getElementById('hero-body-emoji').innerText = heroInfo.emoji;
    document.getElementById('hero-title-display').innerText = `✨ ${heroInfo.title}`;
    document.getElementById('hero-stats-display').innerHTML =
        `已掌握：${(currentUser.mastered || []).length} 個漢字<br>等級：Lv.${currentUser.level}<br>💎 寶石：${currentUser.stats.gems || 0}`;

    // Update slot visuals on avatar
    Object.keys(SLOT_INFO).forEach(slotType => {
        const el = document.getElementById(`slot-${slotType}-display`);
        if (!el) return;
        const equippedId = currentUser.equipped[slotType];
        if (equippedId) {
            const item = EQUIPMENT_DATA.find(i => i.id === equippedId);
            if (item) {
                el.innerText = item.name.split(' ')[0]; // emoji
                el.style.opacity = '1';
                el.style.filter = 'none';
                el.style.textShadow = '0 0 12px rgba(251,191,36,0.8)';
            }
        } else {
            el.innerText = SLOT_INFO[slotType].default;
            el.style.opacity = '0.25';
            el.style.filter = 'grayscale(1)';
            el.style.textShadow = 'none';
        }
    });

    // Render equipped slots panel
    renderEquippedSlots();

    // Render shop
    renderEquipmentShop();

    // Reset to avatar tab
    switchEquipTab('avatar');
    modal.style.display = 'flex';
}

function renderEquippedSlots() {
    const list = document.getElementById('equipped-slots-list');
    list.innerHTML = '';
    Object.keys(SLOT_INFO).forEach(slotType => {
        const info = SLOT_INFO[slotType];
        const equippedId = currentUser.equipped[slotType];
        const item = equippedId ? EQUIPMENT_DATA.find(i => i.id === equippedId) : null;

        const row = document.createElement('div');
        row.style.cssText = `display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; 
            background: ${item ? 'rgba(251,191,36,0.08)' : 'rgba(30,41,59,0.4)'}; 
            border: 1px solid ${item ? 'rgba(251,191,36,0.3)' : '#1e293b'};`;

        const slotIcon = document.createElement('div');
        slotIcon.style.cssText = 'font-size: 2rem; width: 40px; text-align: center; flex-shrink: 0;';
        slotIcon.innerText = item ? item.name.split(' ')[0] : info.default;
        if (!item) slotIcon.style.opacity = '0.2';

        const textDiv = document.createElement('div');
        textDiv.style.flex = '1';
        if (item) {
            textDiv.innerHTML = `<div style="font-size: 0.9rem; color: var(--text-gold); font-weight: bold;">${item.name.split(' ').slice(1).join(' ')}</div>
                <div style="font-size: 0.75rem; color: #64748b;">${info.label} · ${item.desc}</div>`;
        } else {
            textDiv.innerHTML = `<div style="font-size: 0.9rem; color: #334155;">${info.label}</div>
                <div style="font-size: 0.75rem; color: #1e293b;">空槽 — 前往商店購買裝備</div>`;
        }

        const actionBtn = document.createElement('button');
        actionBtn.style.cssText = 'padding: 5px 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.8rem; font-family: inherit; flex-shrink: 0;';
        if (item) {
            actionBtn.innerText = '卸下';
            actionBtn.style.background = '#334155';
            actionBtn.style.color = '#94a3b8';
            actionBtn.onclick = () => { equipItem(item.id, slotType); };
        } else {
            actionBtn.innerText = '🏪 購買';
            actionBtn.style.background = 'var(--text-gold)';
            actionBtn.style.color = '#000';
            actionBtn.onclick = () => switchEquipTab('shop');
        }

        row.appendChild(slotIcon);
        row.appendChild(textDiv);
        row.appendChild(actionBtn);
        list.appendChild(row);
    });
}

function renderEquipmentShop() {
    const list = document.getElementById('equipment-list');
    list.innerHTML = '';
    const mastered = (currentUser.mastered || []).length;

    EQUIPMENT_DATA.forEach(item => {
        const isOwned = (currentUser.inventory || []).includes(item.id);
        const isEquipped = currentUser.equipped[item.type] === item.id;
        const isLocked = mastered < item.unlock;

        const card = document.createElement('div');
        card.style.cssText = `
            padding: 14px; border-radius: 14px; text-align: center;
            background: ${isEquipped ? 'rgba(251,191,36,0.15)' : isLocked ? 'rgba(15,23,42,0.5)' : 'rgba(30,41,59,0.8)'};
            border: 1px solid ${isEquipped ? 'var(--text-gold)' : isLocked ? '#1e293b' : '#334155'};
            transition: transform 0.15s; cursor: ${isLocked ? 'default' : 'pointer'};
            opacity: ${isLocked ? '0.5' : '1'};
        `;

        const slotLabel = SLOT_INFO[item.type]?.label || item.type;
        const itemEmoji = item.name.split(' ')[0];
        const itemName = item.name.split(' ').slice(1).join(' ');

        card.innerHTML = `
            <div style="font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${slotLabel}</div>
            <div style="font-size: 2.8rem; margin-bottom: 6px;">${itemEmoji}</div>
            <div style="font-size: 0.85rem; color: ${isEquipped ? 'var(--text-gold)' : '#e2e8f0'}; font-weight: bold; margin-bottom: 6px;">${itemName}</div>
            <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 10px; line-height: 1.4;">${item.desc}</div>
            ${isLocked ? `<div style="font-size: 0.72rem; color: #ef4444;">🔒 需掌握 ${item.unlock} 字</div>` : ''}
        `;

        if (!isLocked) {
            if (isOwned) {
                const btn = document.createElement('button');
                btn.style.cssText = `padding: 5px 14px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.8rem; font-family: inherit; width: 100%;
                    background: ${isEquipped ? '#334155' : 'var(--accent-blue)'}; color: white;`;
                btn.innerText = isEquipped ? '✅ 使用中' : '裝備';
                btn.onclick = () => equipItem(item.id, item.type);
                card.appendChild(btn);
            } else {
                const btn = document.createElement('button');
                btn.style.cssText = `padding: 5px 14px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.8rem; font-family: inherit; width: 100%;
                    background: var(--text-gold); color: #000; font-weight: bold;`;
                btn.innerText = `💎 ${item.cost} 購買`;
                btn.onclick = () => buyItem(item.id, item.cost);
                card.appendChild(btn);
            }
        }

        card.addEventListener('mouseover', () => { if (!isLocked) card.style.transform = 'translateY(-3px)'; });
        card.addEventListener('mouseout', () => { card.style.transform = 'none'; });

        list.appendChild(card);
    });
}

function closeEquipmentModal() { document.getElementById('equipment-modal').style.display = 'none'; }

function buyItem(id, cost) {
    if (!currentUser.stats) currentUser.stats = {};
    const gems = currentUser.stats.gems || 0;
    if (gems < cost) {
        alert(`❌ 寶石不夠！目前有 ${gems} 💎，需要 ${cost} 💎\n快去 RPG 冒險模式收集更多寶石吧！`);
        return;
    }
    currentUser.stats.gems -= cost;
    if (!currentUser.inventory) currentUser.inventory = [];
    currentUser.inventory.push(id);
    saveUser();
    showEquipment();
    const item = EQUIPMENT_DATA.find(i => i.id === id);
    alert(`🎉 成功購入「${item ? item.name : id}」！`);
}

function equipItem(id, type) {
    if (!currentUser.equipped) currentUser.equipped = {};
    if (currentUser.equipped[type] === id) {
        delete currentUser.equipped[type]; // Unequip
    } else {
        currentUser.equipped[type] = id;
    }
    saveUser();
    showEquipment();
    renderProfile(); // Update profile avatar
}

function renderProfile() {
    const container = document.getElementById('avatar-profile-container');
    if (!container) return;
    
    let badgesHtml = (currentUser.badges || []).map(b => `<div class="badge-item">${b}</div>`).join('');
    if(!badgesHtml) badgesHtml = '<span style="color: #64748b;">尚未獲得徽章，繼續加油！</span>';
    
    let abilitiesHtml = (currentUser.abilities || []).map(a => `<div class="ability-pill">${a}</div>`).join('');
    if(!abilitiesHtml) abilitiesHtml = '<span style="color: #64748b;">學習部首以解鎖能力</span>';

    // Get equipped items
    const head = EQUIPMENT_DATA.find(i => i.id === currentUser.equipped?.head)?.name.split(' ')[0] || '';
    const weapon = EQUIPMENT_DATA.find(i => i.id === currentUser.equipped?.weapon)?.name.split(' ')[0] || '';
    
    container.innerHTML = `
        <div style="display: flex; gap: 30px; align-items: center; flex-wrap: wrap;">
            <div class="avatar-sprite" style="background: rgba(30, 41, 59, 1); position: relative;">
                🤴
                ${head ? `<div style="position: absolute; top: -20px; font-size: 2.5rem;">${head}</div>` : ''}
                ${weapon ? `<div style="position: absolute; right: -20px; bottom: 10px; font-size: 2.5rem;">${weapon}</div>` : ''}
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
            <div class="card-char-big" style="cursor: pointer;" onclick="event.stopPropagation(); speakChar('${char}');">${char}</div>
            <div class="card-zhuyin">${data.zhuyin} ${createSpeakBtnHTML(char, '1rem', '聽聽看', 0.6)}</div>
            <div style="font-size: 0.85rem; color: #60a5fa; letter-spacing: 1px; margin-bottom: 6px;">${getPinyin(char)}</div>
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
        fb.innerText = '✨ 太棒了！組合成功！獲得 5 顆鑽石 💎';
        fb.style.color = '#4ade80';
        gainXP(40);
        
        if (!currentUser.stats) currentUser.stats = {};
        currentUser.stats.gems = (currentUser.stats.gems || 0) + 5;
        saveUser();
        
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

function cancelDrawing() {
    clearCanvas();
    if (currentArea) {
        showLibrary(currentArea);
    } else {
        showScreen('map-screen');
    }
}
