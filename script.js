// --- 초기 데이터 및 상태 변수 ---
let interviewData = [
    {
        "id": "root-1",
        "category": "기본 질문",
        "question": "1분 자기소개를 해보세요.",
        "children": [
            {
                "id": "child-1-1",
                "question": "자신의 가장 큰 강점은 무엇인가요?",
                "children": []
            },
            {
                "id": "child-1-2",
                "question": "어떤 단점을 가지고 있으며, 어떻게 개선하고 있나요?",
                "children": []
            }
        ]
    },
    {
        "id": "root-2",
        "category": "지원 동기",
        "question": "우리 회사에 지원한 이유는 무엇인가요?",
        "children": []
    }
];

let currentTimer = null;
let flipTimeout = null;

// --- 유틸리티 함수 ---

// 데이터 트리에서 모든 노드를 플랫 리스트로 변환
function flattenData(nodes) {
    let flat = [];
    nodes.forEach(node => {
        flat.push(node);
        if (node.children && node.children.length > 0) {
            flat = flat.concat(flattenData(node.children));
        }
    });
    return flat;
}

// 데이터 트리에서 ID로 노드 찾기
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

// 데이터 트리에서 노드 삭제
function deleteNodeById(nodes, id) {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
            nodes.splice(i, 1);
            return true;
        }
        if (nodes[i].children) {
            if (deleteNodeById(nodes[i].children, id)) return true;
        }
    }
    return false;
}

// 텍스트 영역 높이 자동 조절
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
    textarea.setAttribute('rows', '1');
    textarea.addEventListener('input', () => {
        autoResizeTextarea(textarea);
        node.question = textarea.value; // 실시간 데이터 업데이트
    });
    // 초기 로드 시 높이 조절
    setTimeout(() => autoResizeTextarea(textarea), 0);

    const actions = document.createElement('div');
    actions.className = 'node-actions';
    actions.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="addChildQuestion('${node.id}')">+</button>
        <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${node.id}')">-</button>
    `;

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
    const newQuestion = {
        id: `root-${Date.now()}`,
        category: "새 질문",
        question: "새로운 질문을 입력하세요.",
        children: []
    };
    interviewData.push(newQuestion);
    renderGraph();
}

function addChildQuestion(parentId) {
    const parentNode = findNodeById(interviewData, parentId);
    if (parentNode) {
        if (!parentNode.children) {
            parentNode.children = [];
        }
        const newChild = {
            id: `child-${Date.now()}`,
            question: "새로운 꼬리 질문을 입력하세요.",
            children: []
        };
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
    const card = document.getElementById('card');
    card.classList.remove('is-flipped');

    const allQuestions = flattenData(interviewData);
    if (allQuestions.length === 0) {
        document.getElementById('q-text').innerText = "질문을 추가해주세요.";
        document.getElementById('q-category').innerText = "준비";
        return;
    }

    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    const data = allQuestions[randomIndex];

    setTimeout(() => {
        // 루트 질문의 카테고리를 찾아서 표시
        let category = "꼬리 질문";
        const rootParent = interviewData.find(root => findNodeById([root], data.id));
        if (rootParent && rootParent.id === data.id) {
             category = rootParent.category || "기본 질문";
        } else if (rootParent) {
            category = rootParent.category + "의 꼬리질문";
        }

        document.getElementById('q-category').innerText = category;
        document.getElementById('q-text').innerText = data.question;

        const tailList = document.getElementById('q-tail');
        tailList.innerHTML = '';
        const tailQuestions = data.children || [];

        if (tailQuestions.length > 0) {
            tailQuestions.forEach(q => {
                const li = document.createElement('li');
                li.innerText = q.question;
                tailList.appendChild(li);
            });
        } else {
            tailList.innerHTML = '<li>예상 꼬리 질문이 없습니다.</li>';
        }
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


// --- 파일 저장/불러오기 기능 ---

function saveToFile() {
    const dataStr = JSON.stringify(interviewData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "interview_questions_graph.json";
    a.click();
    URL.revokeObjectURL(url);
}

function loadFromFile(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            if (Array.isArray(json)) {
                interviewData = json;
                renderGraph(); // 에디터 다시 그리기
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

// --- 앱 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    renderGraph();
});