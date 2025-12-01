// Github Pages localStorage module. copy-pasted from 'https://tomashubelbauer.github.io/github-pages-local-storage/index.js'
const setItem = localStorage.setItem;
localStorage.constructor.prototype.setItem = (key, value) => setItem.apply(localStorage, [location.pathname + ':' + key, value])

const getItem = localStorage.getItem;
localStorage.constructor.prototype.getItem = (key) => getItem.apply(localStorage, [location.pathname + ':' + key]);

const removeItem = localStorage.removeItem;
localStorage.constructor.prototype.removeItem = (key) => removeItem.apply(localStorage, [location.pathname + ':' + key]);

// --- 초기 데이터 및 상태 변수 ---
let interviewData;
const defaultInterviewData = [
    { "id": "root-1", "question": "1분 자기소개를 해보세요.", "answer": "저는 어떤 상황에서도 빠르게 적응하는 개발자입니다.", "children": [
            { "id": "child-1-1", "question": "자신의 가장 큰 강점은 무엇인가요?", "answer": "저의 가장 큰 강점은 탁월한 문제 해결 능력입니다.", "children": [] },
            { "id": "child-1-2", "question": "어떤 단점을 가지고 있으며, 어떻게 개선하고 있나요?", "answer": "", "children": [] }
    ]},
    { "id": "root-2", "question": "우리 회사에 지원한 이유는 무엇인가요?", "answer": "", "children": [] }
];

try {
    const savedData = localStorage.getItem('FLASH_INTERVIEW_QUESTIONS');
    if (savedData) {
        interviewData = JSON.parse(savedData);
        // Basic validation to ensure it's an array
        if (!Array.isArray(interviewData)) {
            interviewData = defaultInterviewData;
        }
    } else {
        interviewData = defaultInterviewData;
    }
} catch (e) {
    console.error("Error loading or parsing interview data from local storage, using default data.", e);
    interviewData = defaultInterviewData;
}


let currentTimer = null, flipTimeout = null, activeQuestionId = null, currentLanguage = 'ko';
let dfsOrderedQuestions = [], dfsCurrentIndex = -1;

// --- 번역 데이터 ---
const translations = {
    en: {
        editor_title: "Question Editor", add_new_question: "Add New Question", load_settings: "Import",
        save_settings: "Export", language_label: "Language:", theme_label: "Theme:", lang_system: "System",
        theme_system: "System", theme_light: "Light", theme_dark: "Dark", flip_time_label: "Flip Time (s):",
        max_answer_time_label: "Max Answer Time (s):",
        start_button: "Start / Next", question_ready: "Press the Start button",
        info_ready: "The card will flip shortly.", answer_start: "Start your answer!",
        new_question_placeholder: "Enter new question.", new_tail_question_placeholder: "Enter new follow-up question.",
        new_question_category: "New Question",
        order_mode_label: "Order:",
        order_random: "Random",
        order_dfs: "In Order",
        add_tail_question_title: "Add tail question",
        delete_question_title: "delete question",
        alert_load_success: "Settings file loaded successfully!",
        alert_invalid_json: "Invalid JSON format.",
        alert_file_read_error: "Error reading file: ",
        confirm_delete: "Are you sure you want to delete this question and all its sub-questions?",
        answer_placeholder: "Edit your answer.",
        edit_answer_title: "Edit Answer",
    },
    ko: {
        editor_title: "질문 에디터", add_new_question: "새 질문 추가", load_settings: "불러오기",
        save_settings: "저장하기", language_label: "언어:", theme_label: "테마:", lang_system: "시스템",
        theme_system: "시스템", theme_light: "라이트", theme_dark: "다크", flip_time_label: "뒤집기 시간(초):",
        max_answer_time_label: "최대 답변 시간(초):",
        start_button: "시작 / 다음 질문", question_ready: "시작 버튼을 눌러주세요",
        info_ready: "잠시 후 카드가 뒤집힙니다.", answer_start: "답변을 시작하세요!",
        new_question_placeholder: "새로운 질문을 입력하세요.", new_tail_question_placeholder: "새로운 꼬리 질문을 입력하세요.",
        new_question_category: "새 질문",
        order_mode_label: "질문 순서:",
        order_random: "랜덤",
        order_dfs: "순서대로",
        add_tail_question_title: "꼬리 질문 추가",
        delete_question_title: "질문 삭제",
        alert_load_success: "설정 파일이 성공적으로 로드되었습니다!",
        alert_invalid_json: "올바른 JSON 형식이 아닙니다.",
        alert_file_read_error: "파일을 읽는 중 오류가 발생했습니다: ",
        confirm_delete: "정말로 이 질문과 모든 하위 질문을 삭제하시겠습니까?",
        answer_placeholder: "답변을 입력하세요.",
        edit_answer_title: "답변 수정",
    }
};

// --- 유틸리티 함수 ---
function setLanguage(lang) {
    currentLanguage = lang === 'system' ? ((navigator.language || navigator.userLanguage).startsWith('ko') ? 'ko' : 'en') : lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            const translation = translations[currentLanguage][key];
            if (el.tagName === 'BUTTON' && el.classList.contains('btn-sm')) {
                el.title = translation;
            } else if (el.hasAttribute('placeholder')) {
                el.placeholder = translation;
            } else {
                // Check if the element has child nodes that are not elements
                const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
                if (textNode) {
                    textNode.textContent = translation;
                } else if (el.textContent.trim().length > 0 || Object.keys(el.dataset).length > 0) {
                     el.textContent = translation;
                }
            }
        }
    });
    renderGraph();
    // Re-translate placeholder for active card if needed
    if(activeQuestionId) {
        const data = findNodeById(interviewData, activeQuestionId);
        if(!data.answer) {
             document.getElementById('answer-text').textContent = translations[currentLanguage].answer_placeholder;
        }
    } else {
         document.getElementById('q-text').textContent = translations[currentLanguage].question_ready;
    }
     document.getElementById('edit-answer-btn').title = translations[currentLanguage].edit_answer_title;
}

function findNodeAndParent(nodes, id, parent = null) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === id) {
            return { node, parent, index: i };
        }
        if (node.children) {
            const found = findNodeAndParent(node.children, id, node);
            if (found) {
                return found;
            }
        }
    }
    return null;
}


function moveNode(draggedId, targetId, position) {
    if (draggedId === targetId) return;

    const { node: draggedNode, parent: draggedParent, index: draggedIndex } = findNodeAndParent(interviewData, draggedId);
    if (!draggedNode) return;

    // Remove from old position
    const sourceList = draggedParent ? draggedParent.children : interviewData;
    sourceList.splice(draggedIndex, 1);

    // Add to new position
    if (position === 'inside') {
        const { node: targetNode } = findNodeAndParent(interviewData, targetId);
        if (targetNode) {
            targetNode.children = targetNode.children || [];
            targetNode.children.push(draggedNode);
        }
    } else {
        const { parent: targetParent, index: targetIndex } = findNodeAndParent(interviewData, targetId);
        const destList = targetParent ? targetParent.children : interviewData;
        const finalIndex = position === 'before' ? targetIndex : targetIndex + 1;
        destList.splice(finalIndex, 0, draggedNode);
    }

    renderGraph();
}


function flattenData(nodes) { return nodes.reduce((acc, node) => { acc.push(node); if (node.children) acc.push(...flattenData(node.children)); return acc; }, []); }
function findNodeById(nodes, id) { for (const node of nodes) { if (node.id === id) return node; if (node.children) { const found = findNodeById(node.children, id); if (found) return found; } } return null; }
function deleteNodeById(nodes, id) { for (let i = 0; i < nodes.length; i++) { if (nodes[i].id === id) { nodes.splice(i, 1); return true; } if (nodes[i].children && deleteNodeById(nodes[i].children, id)) return true; } return false; }
function autoResizeTextarea(textarea) { textarea.style.height = 'auto'; textarea.style.height = textarea.scrollHeight + 'px'; }

function adjustFontSize(element, text) {
    const baseSize = 1.8; // base font size in rem
    let newSize = baseSize;

    if (text.length > 50) {
        newSize = baseSize * Math.max(0.5, 1 - (text.length - 50) / 150);
    }
    element.style.fontSize = `${newSize}rem`;
}

function saveInterviewDataToLocalStorage() {
    try {
        localStorage.setItem('FLASH_INTERVIEW_QUESTIONS', JSON.stringify(interviewData));
    } catch (e) {
        console.error("Error saving interview data to local storage", e);
    }
}

function saveData() {
    generateDfsOrder();
    saveInterviewDataToLocalStorage();
}

function generateDfsOrder() {
    dfsOrderedQuestions = [];
    const dfs = (node) => {
        // Ensure every node has an 'answer' property
        if (node.answer === undefined) {
            node.answer = '';
        }
        dfsOrderedQuestions.push(node);
        if (node.children) {
            node.children.forEach(dfs);
        }
    };
    interviewData.forEach(dfs);
    dfsCurrentIndex = -1;
    saveInterviewDataToLocalStorage(); // Add this line
}

// --- 그래프 에디터 ---
function renderNode(node, parentElement) {
    const nodeItem = document.createElement('div');
    nodeItem.className = 'node-item';
    nodeItem.setAttribute('data-id', node.id);
    nodeItem.setAttribute('draggable', 'true');

    nodeItem.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => nodeItem.classList.add('dragging'), 0);
    });

    nodeItem.addEventListener('dragend', (e) => {
        e.stopPropagation();
        nodeItem.classList.remove('dragging');
        document.querySelectorAll('.drag-over-before, .drag-over-after, .drag-over-inside').forEach(el => {
            el.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-inside');
        });
    });

    nodeItem.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = nodeItem.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        nodeItem.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-inside');

        if (y < rect.height * 0.25) {
            nodeItem.classList.add('drag-over-before');
        } else if (y > rect.height * 0.75) {
            nodeItem.classList.add('drag-over-after');
        } else {
            nodeItem.classList.add('drag-over-inside');
        }
    });

    nodeItem.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        nodeItem.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-inside');
    });

    nodeItem.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = node.id;
        
        let position = 'after';
        if (nodeItem.classList.contains('drag-over-before')) {
            position = 'before';
        } else if (nodeItem.classList.contains('drag-over-inside')) {
            position = 'inside';
        }
        
        nodeItem.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-inside');
        
        moveNode(draggedId, targetId, position);
    });


    const nodeMain = document.createElement('div');
    nodeMain.className = 'node-main';
    const textarea = document.createElement('textarea');
    textarea.value = node.question;
    textarea.rows = 1;
    const isRoot = interviewData.some(rootNode => rootNode.id === node.id);
    textarea.placeholder = isRoot 
        ? translations[currentLanguage].new_question_placeholder
        : translations[currentLanguage].new_tail_question_placeholder;
    textarea.addEventListener('input', () => { autoResizeTextarea(textarea); node.question = textarea.value; saveData(); });
    textarea.addEventListener('click', () => showQuestion(node.id));
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
function renderGraph() { 
    document.getElementById('graph-editor').innerHTML = ''; 
    interviewData.forEach(n => renderNode(n, document.getElementById('graph-editor')));
    generateDfsOrder();
}
function addRootQuestion() { 
    interviewData.push({ id: `root-${Date.now()}`, question: '', answer: '', children: [] }); 
    renderGraph(); 
}
function addChildQuestion(id) { 
    const p = findNodeById(interviewData, id); 
    if (p) { 
        p.children = p.children || []; 
        p.children.push({ id: `child-${Date.now()}`, question: '', answer: '', children: [] }); 
        renderGraph(); 
    } 
}
function deleteQuestion(id) { 
    if (confirm(translations[currentLanguage].confirm_delete)) { 
        deleteNodeById(interviewData, id); 
        renderGraph(); 
    } 
}

// --- 면접 카드 기능 ---
function showQuestion(id) {
    stopTimer();
    if (activeQuestionId) {
        const prevActiveNode = document.querySelector(`.node-item[data-id="${activeQuestionId}"]`);
        if (prevActiveNode) prevActiveNode.classList.remove('is-active');
    }

    const data = findNodeById(interviewData, id);
    if (!data) return;
    
    // Update DFS index
    dfsCurrentIndex = dfsOrderedQuestions.findIndex(q => q.id === id);

    activeQuestionId = data.id;
    const activeNode = document.querySelector(`.node-item[data-id="${activeQuestionId}"]`);
    if (activeNode) {
        activeNode.classList.add('is-active');
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const card = document.getElementById('card');
    card.classList.remove('is-flipped');

    const qTextElement = document.getElementById('q-text');
    const answerTextElement = document.getElementById('answer-text');
    const answerEditor = document.querySelector('.answer-editor');
    const answerContainer = document.querySelector('.answer-container');
    
    answerEditor.style.display = 'none';
    answerContainer.style.display = 'flex';

    setTimeout(() => {
        qTextElement.innerText = data.question;
        adjustFontSize(qTextElement, data.question);

        if (data.answer) {
            answerTextElement.innerText = data.answer;
        } else {
            answerTextElement.innerText = translations[currentLanguage].answer_placeholder;
        }
        adjustFontSize(answerTextElement, answerTextElement.innerText);

    }, 200);
}

function nextQuestion() {
    stopTimer();
    if (activeQuestionId) { document.querySelector(`.node-item[data-id="${activeQuestionId}"]`)?.classList.remove('is-active'); }
    const card = document.getElementById('card');
    card.classList.remove('is-flipped');

    const orderMode = document.querySelector('input[name="order-mode"]:checked').value;
    let data;

    if (interviewData.length === 0) {
        document.getElementById('q-text').innerText = translations[currentLanguage].question_ready;
        return;
    }

    if (orderMode === 'dfs') {
        dfsCurrentIndex++;
        if (dfsCurrentIndex >= dfsOrderedQuestions.length) {
            dfsCurrentIndex = 0; // Loop back to the start
        }
        data = dfsOrderedQuestions[dfsCurrentIndex];
    } else { // random mode
        const allQuestions = flattenData(interviewData);
        data = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    
    if (!data) { // Fallback to random, in case dfs array is empty
        const allQuestions = flattenData(interviewData);
        data = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    
    activeQuestionId = data.id;
    // Update DFS index for consistency
    dfsCurrentIndex = dfsOrderedQuestions.findIndex(q => q.id === data.id);

    const activeNode = document.querySelector(`.node-item[data-id="${activeQuestionId}"]`);
    if (activeNode) {
        activeNode.classList.add('is-active');
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const qTextElement = document.getElementById('q-text');
    const answerTextElement = document.getElementById('answer-text');
    const answerEditor = document.querySelector('.answer-editor');
    const answerContainer = document.querySelector('.answer-container');

    answerEditor.style.display = 'none';
    answerContainer.style.display = 'flex';
    
    setTimeout(() => {
        qTextElement.innerText = data.question;
        adjustFontSize(qTextElement, data.question);

        if (data.answer) {
            answerTextElement.innerText = data.answer;
        } else {
            answerTextElement.innerText = translations[currentLanguage].answer_placeholder;
        }
        adjustFontSize(answerTextElement, answerTextElement.innerText);
        
        const flipTime = document.getElementById('flip-time').value;
        const timerEl = document.getElementById('flip-timer-animation');
        timerEl.style.transition = 'none';
        timerEl.style.transform = 'scaleX(1)';
        
        // Force a reflow before applying the transition
        void timerEl.offsetWidth;

        timerEl.style.transition = `transform ${flipTime}s linear`;
        timerEl.style.transform = 'scaleX(0)';

    }, 200);

    const flipTimeMs = document.getElementById('flip-time').value * 1000;
    if (flipTimeout) clearTimeout(flipTimeout);
    flipTimeout = setTimeout(() => { card.classList.add('is-flipped'); startTimer(); }, flipTimeMs);
}

function startTimer() {
    const timerEl = document.getElementById('timer');
    const maxTime = parseInt(document.getElementById('max-answer-time').value, 10);
    timerEl.innerText = "00.00";
    if (currentTimer) clearInterval(currentTimer);
    
    const startTime = Date.now();
    currentTimer = setInterval(() => {
        const diff = (Date.now() - startTime) / 1000;
        timerEl.innerText = diff.toFixed(2);
        if (diff >= maxTime) {
            nextQuestion();
        }
    }, 10);
}

function stopTimer() { 
    if (currentTimer) clearInterval(currentTimer); 
    if (flipTimeout) clearTimeout(flipTimeout);
    const timerEl = document.getElementById('flip-timer-animation');
    if (timerEl) {
        timerEl.style.transition = 'none';
        timerEl.style.transform = 'scaleX(0)';
    }
}

// --- 파일 저장/불러오기 ---
function saveToFile() { const d = JSON.stringify(interviewData, null, 2), b = new Blob([d], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "interview_questions.json"; a.click(); URL.revokeObjectURL(a.href) }
function loadFromFile(i) { 
    const f = i.files[0]; 
    if (!f) return; 
    const r = new FileReader(); 
    r.onload = e => { 
        try { 
            const j = JSON.parse(e.target.result); 
            if (Array.isArray(j)) { 
                // Ensure all loaded items have an 'answer' property
                const ensureAnswer = (nodes) => {
                    nodes.forEach(node => {
                        if (node.answer === undefined) {
                            node.answer = '';
                        }
                        if (node.children) {
                            ensureAnswer(node.children);
                        }
                    });
                };
                ensureAnswer(j);
                interviewData = j; 
                setLanguage(localStorage.getItem('language')||'system'); 
                generateDfsOrder(); 
                alert(translations[currentLanguage].alert_load_success);
            } else {
                alert(translations[currentLanguage].alert_invalid_json);
            } 
        } catch (err) { 
            alert(translations[currentLanguage].alert_file_read_error + err.message);
        } 
    }; 
    r.readAsText(f);
}


// --- UI 상호작용 초기화 ---
function initializeSettings() {
    const themeSelect = document.getElementById('theme-select');
    const langSelect = document.getElementById('language-select');
    const applyTheme = (theme) => { document.documentElement.setAttribute('data-theme', theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme); };
    
    themeSelect.addEventListener('change', () => { const val = themeSelect.value; localStorage.setItem('theme', val); applyTheme(val); });
    langSelect.addEventListener('change', () => { const val = langSelect.value; localStorage.setItem('language', val); setLanguage(val); });

    const savedTheme = localStorage.getItem('theme') || 'system';
    const savedLang = localStorage.getItem('language') || 'system';
    themeSelect.value = savedTheme;
    langSelect.value = savedLang;
    applyTheme(savedTheme);
    setLanguage(savedLang);
}

function initializeResizer() {
    const resizer = document.getElementById('resizer');
    const editorPanel = document.getElementById('editor-panel');
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        let newWidth = e.clientX;
        if (newWidth < 50) newWidth = 50; // Minimum collapsed width
        if (newWidth > window.innerWidth * 0.8) newWidth = window.innerWidth * 0.8;
        editorPanel.style.flexBasis = `${newWidth}px`;
    }

    function handleMouseUp() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
}

function initializeCollapser() {
    const collapseBtn = document.getElementById('collapse-btn');
    const expandBtn = document.getElementById('expand-btn');
    const editorPanel = document.getElementById('editor-panel');
    const resizer = document.getElementById('resizer');

    // Initial state setup
    const isCollapsed = editorPanel.classList.contains('collapsed');
    collapseBtn.style.display = isCollapsed ? 'none' : 'flex';
    expandBtn.style.display = isCollapsed ? 'flex' : 'none';
    if(resizer) {
        resizer.style.display = isCollapsed ? 'none' : 'block';
    }

    collapseBtn.addEventListener('click', () => {
        editorPanel.classList.add('collapsed');
        if(resizer) {
            resizer.style.display = 'none';
        }
        expandBtn.style.display = 'flex';
        collapseBtn.style.display = 'none';
    });

    expandBtn.addEventListener('click', () => {
        editorPanel.classList.remove('collapsed');
        if(resizer) {
            resizer.style.display = 'block';
        }
        expandBtn.style.display = 'none';
        collapseBtn.style.display = 'flex';
    });
}

// --- 앱 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    
    renderGraph();
    initializeResizer();
    initializeCollapser();
    
    const card = document.getElementById('card');
    const answerContainer = document.querySelector('.answer-container');
    const answerEditor = document.querySelector('.answer-editor');
    const answerInput = document.getElementById('answer-input');
    const answerText = document.getElementById('answer-text');
    const editAnswerBtn = document.getElementById('edit-answer-btn');

    card.addEventListener('click', (e) => {
        // Do not flip if the edit button or the editor itself is clicked
        if (e.target === editAnswerBtn || editAnswerBtn.contains(e.target) || e.target === answerInput) {
            return;
        }

        if (card.classList.contains('is-flipped')) return;

        if (flipTimeout) {
            clearTimeout(flipTimeout);
            flipTimeout = null;
        }
        
        card.classList.add('is-flipped');
        startTimer();
    });

    editAnswerBtn.addEventListener('click', () => {
        const isEditing = answerEditor.style.display === 'flex';
        if (isEditing) {
            // Save and switch to view mode
            answerEditor.style.display = 'none';
            answerContainer.style.display = 'flex';
        } else {
            // Switch to edit mode
            if (!activeQuestionId) return;
            const node = findNodeById(interviewData, activeQuestionId);
            if (!node) return;
            
            answerInput.value = node.answer || '';
            adjustFontSize(answerText, answerInput.value); // Adjust font size for the visible text
            answerEditor.style.display = 'flex';
            answerContainer.style.display = 'none';
            answerInput.focus();
        }
    });

    answerInput.addEventListener('input', () => {
        if (!activeQuestionId) return;
        const node = findNodeById(interviewData, activeQuestionId);
        if (node) {
            node.answer = answerInput.value;
            answerText.innerText = answerInput.value || translations[currentLanguage].answer_placeholder;
            adjustFontSize(answerText, answerText.innerText);
            saveData();
        }
    });
});
