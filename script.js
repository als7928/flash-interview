// --- 초기 데이터 및 상태 변수 ---
let interviewData = [
    { "id": "root-1", "category": "기본 질문", "question": "1분 자기소개를 해보세요.", "children": [
            { "id": "child-1-1", "question": "자신의 가장 큰 강점은 무엇인가요?", "children": [] },
            { "id": "child-1-2", "question": "어떤 단점을 가지고 있으며, 어떻게 개선하고 있나요?", "children": [] }
    ]},
    { "id": "root-2", "category": "지원 동기", "question": "우리 회사에 지원한 이유는 무엇인가요?", "children": [] }
];
let currentTimer = null, flipTimeout = null, activeQuestionId = null, currentLanguage = 'ko';

// --- 번역 데이터 ---
const translations = {
    en: {
        editor_title: "Question Graph Editor", add_new_question: "Add New Question", load_settings: "Load Settings",
        save_settings: "Save Settings", language_label: "Language:", theme_label: "Theme:", lang_system: "System",
        theme_system: "System", theme_light: "Light", theme_dark: "Dark", flip_time_label: "Flip Time (s):",
        start_button: "Start / Next", category_ready: "Ready", question_ready: "Press the Start button",
        info_ready: "The card will flip shortly.", answer_start: "Start your answer!",
        tail_questions_title: "💡 Follow-up Questions:", no_tail_questions: "None", add_tail_question_title: "Add follow-up",
        delete_question_title: "Delete question", confirm_delete: "Really delete this question and all its children?"
    },
    ko: {
        editor_title: "질문 그래프 에디터", add_new_question: "새 질문 추가", load_settings: "설정 불러오기",
        save_settings: "설정 저장하기", language_label: "언어:", theme_label: "테마:", lang_system: "시스템",
        theme_system: "시스템", theme_light: "라이트", theme_dark: "다크", flip_time_label: "뒤집기 시간(초):",
        start_button: "시작 / 다음 질문", category_ready: "준비", question_ready: "시작 버튼을 눌러주세요",
        info_ready: "잠시 후 카드가 뒤집힙니다.", answer_start: "답변을 시작하세요!",
        tail_questions_title: "💡 예상 꼬리 질문:", no_tail_questions: "없음", add_tail_question_title: "꼬리 질문 추가",
        delete_question_title: "질문 삭제", confirm_delete: "정말로 이 질문과 모든 하위 질문을 삭제하시겠습니까?"
    }
};

// --- 유틸리티 함수 ---
function setLanguage(lang) {
    if (lang === 'system') {
        currentLanguage = (navigator.language || navigator.userLanguage).startsWith('ko') ? 'ko' : 'en';
    } else {
        currentLanguage = lang;
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
}
function flattenData(nodes) { return nodes.reduce((acc, node) => { acc.push(node); if (node.children) acc.push(...flattenData(node.children)); return acc; }, []); }
function findNodeById(nodes, id) { for (const node of nodes) { if (node.id === id) return node; if (node.children) { const found = findNodeById(node.children, id); if (found) return found; } } return null; }
function deleteNodeById(nodes, id) { for (let i = 0; i < nodes.length; i++) { if (nodes[i].id === id) { nodes.splice(i, 1); return true; } if (nodes[i].children && deleteNodeById(nodes[i].children, id)) return true; } return false; }
function autoResizeTextarea(textarea) { textarea.style.height = 'auto'; textarea.style.height = textarea.scrollHeight + 'px'; }

// --- 그래프 에디터 ---
function renderNode(node, parentElement) {
    const nodeItem = document.createElement('div');
    nodeItem.className = 'node-item';
    nodeItem.setAttribute('data-id', node.id);
    const nodeMain = document.createElement('div');
    nodeMain.className = 'node-main';
    const textarea = document.createElement('textarea');
    textarea.value = node.question;
    textarea.rows = 1;
    textarea.addEventListener('input', () => { autoResizeTextarea(textarea); node.question = textarea.value; });
    setTimeout(() => autoResizeTextarea(textarea), 0);
    const actions = document.createElement('div');
    actions.className = 'node-actions';
    const addChildBtn = document.createElement('button');
    addChildBtn.className = 'btn btn-sm';
    addChildBtn.title = translations[currentLanguage].add_tail_question_title;
    addChildBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`;
    addChildBtn.addEventListener('click', () => addChildQuestion(node.id));
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm';
    deleteBtn.title = translations[currentLanguage].delete_question_title;
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>`;
    deleteBtn.addEventListener('click', () => deleteQuestion(node.id));
    actions.appendChild(addChildBtn);
    actions.appendChild(deleteBtn);
    nodeMain.appendChild(textarea);
    nodeMain.appendChild(actions);
    nodeItem.appendChild(nodeMain);
    if (node.children && node.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'node-children';
        node.children.forEach(child => renderNode(child, childrenContainer));
        nodeItem.appendChild(childrenContainer);
    }
    parentElement.appendChild(nodeItem);
}
function renderGraph() { document.getElementById('graph-editor').innerHTML = ''; interviewData.forEach(n => renderNode(n, document.getElementById('graph-editor'))); }
function addRootQuestion() { interviewData.push({ id: `root-${Date.now()}`, category: "새 질문", question: "새로운 질문을 입력하세요.", children: [] }); renderGraph(); }
function addChildQuestion(id) { const p = findNodeById(interviewData, id); if (p) { p.children = p.children || []; p.children.push({ id: `child-${Date.now()}`, question: "새로운 꼬리 질문을 입력하세요.", children: [] }); renderGraph(); } }
function deleteQuestion(id) { if (confirm(translations[currentLanguage].confirm_delete)) { deleteNodeById(interviewData, id); renderGraph(); } }

// --- 면접 카드 기능 ---
function nextQuestion() {
    stopTimer();
    if (activeQuestionId) { document.querySelector(`.node-item[data-id="${activeQuestionId}"]`)?.classList.remove('is-active'); }
    const card = document.getElementById('card');
    card.classList.remove('is-flipped');
    const allQuestions = flattenData(interviewData);
    if (allQuestions.length === 0) {
        setLanguage(currentLanguage); // Ensure text is translated even on empty
        return;
    }
    const data = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    activeQuestionId = data.id;
    const activeNode = document.querySelector(`.node-item[data-id="${activeQuestionId}"]`);
    if (activeNode) {
        activeNode.classList.add('is-active');
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
        let category = "꼬리 질문";
        const rootParent = interviewData.find(root => findNodeById([root], data.id));
        if (rootParent) {
            category = rootParent.id === data.id ? (rootParent.category || "기본 질문") : (rootParent.category + "의 꼬리질문");
        }
        document.getElementById('q-category').innerText = category;
        document.getElementById('q-text').innerText = data.question;
        const tailList = document.getElementById('q-tail');
        tailList.innerHTML = (data.children && data.children.length > 0) ? data.children.map(q => `<li>${q.question}</li>`).join('') : `<li>${translations[currentLanguage].no_tail_questions}</li>`;
    }, 200);
    const flipTime = document.getElementById('flip-time').value * 1000;
    if (flipTimeout) clearTimeout(flipTimeout);
    flipTimeout = setTimeout(() => { card.classList.add('is-flipped'); startTimer(); }, flipTime);
}
function startTimer() { const t = document.getElementById('timer'); t.innerText = "00.00"; if (currentTimer) clearInterval(currentTimer); const s = Date.now(); currentTimer = setInterval(() => { const d = (Date.now() - s) / 1000; t.innerText = d.toFixed(2) }, 10) }
function stopTimer() { if (currentTimer) clearInterval(currentTimer); if (flipTimeout) clearTimeout(flipTimeout) }

// --- 파일 저장/불러오기 ---
function saveToFile() { const d = JSON.stringify(interviewData, null, 2), b = new Blob([d], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "interview_questions.json"; a.click(); URL.revokeObjectURL(a.href) }
function loadFromFile(i) { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = e => { try { const j = JSON.parse(e.target.result); if (Array.isArray(j)) { interviewData = j; renderGraph(); alert("설정 파일이 성공적으로 로드되었습니다!") } else alert("올바른 JSON 형식이 아닙니다.") } catch (err) { alert("파일을 읽는 중 오류가 발생했습니다: " + err.message) } }; r.readAsText(f) }

// --- UI 상호작용 초기화 ---
function initializeSettings() {
    const themeSelect = document.getElementById('theme-select');
    const langSelect = document.getElementById('language-select');
    const applyTheme = (theme) => { document.documentElement.setAttribute('data-theme', theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme); };
    
    themeSelect.addEventListener('change', () => { const val = themeSelect.value; localStorage.setItem('theme', val); applyTheme(val); });
    langSelect.addEventListener('change', () => { const val = langSelect.value; localStorage.setItem('language', val); setLanguage(val); renderGraph(); });

    const savedTheme = localStorage.getItem('theme') || 'system';
    const savedLang = localStorage.getItem('language') || 'system';
    themeSelect.value = savedTheme;
    langSelect.value = savedLang;
    applyTheme(savedTheme);
    setLanguage(savedLang);
}

function initializeResizer() {
    const resizer = document.getElementById('resizer');
    const editorPanel = document.querySelector('.editor-panel');
    const collapseBtn = document.getElementById('collapse-btn');
    let isResizing = false;

    const handleMouseMove = (e) => {
        if (!isResizing) return;
        let newWidth = e.clientX;
        if (newWidth < 250) newWidth = 250;
        if (newWidth > window.innerWidth * 0.8) newWidth = window.innerWidth * 0.8;
        editorPanel.style.flexBasis = `${newWidth}px`;
        collapseBtn.style.left = `${newWidth}px`;
    };
    const handleMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    resizer.addEventListener('mousedown', () => { isResizing = true; document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); });
}

function initializeCollapser() {
    const collapseBtn = document.getElementById('collapse-btn');
    const editorPanel = document.querySelector('.editor-panel');
    collapseBtn.addEventListener('click', () => {
        const isCollapsed = editorPanel.classList.toggle('collapsed');
        if (isCollapsed) {
            collapseBtn.style.left = '0px';
        } else {
            const currentWidth = editorPanel.getBoundingClientRect().width;
            collapseBtn.style.left = `${currentWidth}px`;
        }
    });
     // Set initial position
    const initialWidth = editorPanel.getBoundingClientRect().width;
    collapseBtn.style.left = `${initialWidth}px`;
}

// --- 앱 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    renderGraph();
    initializeResizer();
    initializeCollapser();
});