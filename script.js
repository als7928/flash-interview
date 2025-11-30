// --- 초기 데이터 및 상태 변수 ---
let interviewData = [
    {
        "id": "root-1",
        "category": "기본 질문",
        "question": "1분 자기소개를 해보세요.",
        "children": [
            { "id": "child-1-1", "question": "자신의 가장 큰 강점은 무엇인가요?", "children": [] },
            { "id": "child-1-2", "question": "어떤 단점을 가지고 있으며, 어떻게 개선하고 있나요?", "children": [] }
        ]
    },
    { "id": "root-2", "category": "지원 동기", "question": "우리 회사에 지원한 이유는 무엇인가요?", "children": [] }
];

let currentTimer = null;
let flipTimeout = null;
let activeQuestionId = null;

// --- 유틸리티 함수 ---
function flattenData(nodes) {
    return nodes.reduce((acc, node) => {
        acc.push(node);
        if (node.children) acc.push(...flattenData(node.children));
        return acc;
    }, []);
}

function findNodeById(nodes, id) {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

function deleteNodeById(nodes, id) {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
            nodes.splice(i, 1);
            return true;
        }
        if (nodes[i].children && deleteNodeById(nodes[i].children, id)) return true;
    }
    return false;
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// --- 그래프 에디터 기능 ---
function renderNode(node, parentElement) {
    const nodeItem = document.createElement('div');
    nodeItem.className = 'node-item';
    nodeItem.setAttribute('data-id', node.id);

    const nodeMain = document.createElement('div');
    nodeMain.className = 'node-main';

    const textarea = document.createElement('textarea');
    textarea.value = node.question;
    textarea.rows = 1;
    textarea.addEventListener('input', () => {
        autoResizeTextarea(textarea);
        node.question = textarea.value;
    });
    setTimeout(() => autoResizeTextarea(textarea), 0);

    const actions = document.createElement('div');
    actions.className = 'node-actions';
    
    const addChildBtn = document.createElement('button');
    addChildBtn.className = 'btn btn-sm';
    addChildBtn.title = '꼬리 질문 추가';
    addChildBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`;
    addChildBtn.addEventListener('click', () => addChildQuestion(node.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm';
    deleteBtn.title = '질문 삭제';
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
    const editor = document.getElementById('graph-editor');
    editor.innerHTML = '';
    interviewData.forEach(rootNode => renderNode(rootNode, editor));
}

function addRootQuestion() {
    const newQuestion = { id: `root-${Date.now()}`, category: "새 질문", question: "새로운 질문을 입력하세요.", children: [] };
    interviewData.push(newQuestion);
    renderGraph();
}

function addChildQuestion(parentId) {
    const parentNode = findNodeById(interviewData, parentId);
    if (parentNode) {
        parentNode.children = parentNode.children || [];
        const newChild = { id: `child-${Date.now()}`, question: "새로운 꼬리 질문을 입력하세요.", children: [] };
        parentNode.children.push(newChild);
        renderGraph();
    }
}

function deleteQuestion(id) {
    if (confirm("정말로 이 질문과 모든 하위 질문을 삭제하시겠습니까?")) {
        deleteNodeById(interviewData, id);
        renderGraph();
    }
}

// --- 면접 카드 기능 ---
function nextQuestion() {
    stopTimer();
    if (activeQuestionId) {
        document.querySelector(`.node-item[data-id="${activeQuestionId}"]`)?.classList.remove('is-active');
    }

    const card = document.getElementById('card');
    card.classList.remove('is-flipped');

    const allQuestions = flattenData(interviewData);
    if (allQuestions.length === 0) {
        document.getElementById('q-text').innerText = "질문을 추가해주세요.";
        document.getElementById('q-category').innerText = "준비";
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
        tailList.innerHTML = (data.children && data.children.length > 0)
            ? data.children.map(q => `<li>${q.question}</li>`).join('')
            : '<li>예상 꼬리 질문이 없습니다.</li>';
    }, 200);

    const flipTime = document.getElementById('flip-time').value * 1000;
    if (flipTimeout) clearTimeout(flipTimeout);
    flipTimeout = setTimeout(() => {
        card.classList.add('is-flipped');
        startTimer();
    }, flipTime);
}

function startTimer() {
    const timerEl = document.getElementById('timer');
    timerEl.innerText = "00.00";
    if (currentTimer) clearInterval(currentTimer);

    const startTime = Date.now();
    currentTimer = setInterval(() => {
        const diff = (Date.now() - startTime) / 1000;
        timerEl.innerText = diff.toFixed(2);
    }, 10);
}

function stopTimer() {
    if (currentTimer) clearInterval(currentTimer);
    if (flipTimeout) clearTimeout(flipTimeout);
}

// --- 파일 저장/불러오기 ---
function saveToFile() {
    const dataStr = JSON.stringify(interviewData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "interview_questions_graph.json";
    a.click();
    URL.revokeObjectURL(a.href);
}

function loadFromFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            if (Array.isArray(json)) {
                interviewData = json;
                renderGraph();
                alert("설정 파일이 성공적으로 로드되었습니다!");
            } else {
                alert("올바른 JSON 형식이 아닙니다.");
            }
        } catch (err) {
            alert("파일을 읽는 중 오류가 발생했습니다: " + err.message);
        }
    };
    reader.readAsText(file);
}

// --- UI 상호작용 초기화 ---
function initializeSettings() {
    const themeSelect = document.getElementById('theme-select');
    const applyTheme = (theme) => {
        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    };
    themeSelect.addEventListener('change', () => {
        const selectedTheme = themeSelect.value;
        localStorage.setItem('theme', selectedTheme);
        applyTheme(selectedTheme);
    });
    const savedTheme = localStorage.getItem('theme') || 'system';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
}

function initializeResizer() {
    const resizer = document.querySelector('.resizer');
    const editorPanel = document.querySelector('.editor-panel');
    let isResizing = false;

    const handleMouseMove = (e) => {
        if (!isResizing) return;
        const newWidth = e.clientX;
        if (newWidth > 250 && newWidth < window.innerWidth * 0.8) {
            editorPanel.style.flexBasis = `${newWidth}px`;
        }
    };

    const handleMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

function initializeCollapser() {
    const collapseBtn = document.querySelector('.collapse-btn');
    const editorPanel = document.querySelector('.editor-panel');
    collapseBtn.addEventListener('click', () => {
        editorPanel.classList.toggle('collapsed');
    });
}

// --- 앱 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    renderGraph();
    initializeSettings();
    initializeResizer();
    initializeCollapser();
});