// 기본 데이터 (예시)
let interviewData = [
    {
        "id": 1,
        "category": "자기소개",
        "question": "1분 자기소개를 해보세요.",
        "tailQuestions": ["자신의 강점을 실제 사례와 연결해 보세요.", "단점에 대해 설명해 보세요."]
    },
    {
        "id": 2,
        "category": "지원동기",
        "question": "우리 회사에 지원한 구체적인 이유는 무엇인가요?",
        "tailQuestions": ["경쟁사가 아닌 우리 회사여야 하는 이유는?", "직무와 관련된 본인의 경험은?"]
    },
    {
        "id": 3,
        "category": "인성",
        "question": "동료와 갈등이 생겼을 때 어떻게 해결하셨나요?",
        "tailQuestions": ["상사가 부당한 지시를 내린다면?", "스트레스는 어떻게 관리하나요?"]
    }
];

let currentTimer = null;
let secondsElapsed = 0;
let flipTimeout = null;

// --- 기능 구현 ---

function nextQuestion() {
    // 1. 초기화
    stopTimer();
    const card = document.getElementById('card');
    card.classList.remove('is-flipped'); // 앞면으로 복귀
    
    // 2. 랜덤 질문 뽑기
    const randomIndex = Math.floor(Math.random() * interviewData.length);
    const data = interviewData[randomIndex];

    // 3. UI 업데이트 (앞면)
    setTimeout(() => { // 카드가 돌아온 후 내용 변경
        document.getElementById('q-category').innerText = data.category;
        document.getElementById('q-text').innerText = data.question;
        
        // 뒷면 (꼬리질문) 업데이트
        const tailList = document.getElementById('q-tail');
        tailList.innerHTML = '';
        if(data.tailQuestions && data.tailQuestions.length > 0) {
            data.tailQuestions.forEach(q => {
                const li = document.createElement('li');
                li.innerText = q;
                tailList.appendChild(li);
            });
        } else {
            tailList.innerHTML = '<li>없음</li>';
        }
    }, 200);

    // 4. 자동 뒤집기 로직
    const flipTime = document.getElementById('flip-time').value * 1000;
    
    if(flipTimeout) clearTimeout(flipTimeout);
    
    flipTimeout = setTimeout(() => {
        card.classList.add('is-flipped');
        startTimer();
    }, flipTime);
}

function startTimer() {
    secondsElapsed = 0;
    const timerEl = document.getElementById('timer');
    timerEl.innerText = "00.00";
    
    if(currentTimer) clearInterval(currentTimer);
    
    const startTime = Date.now();
    currentTimer = setInterval(() => {
        const now = Date.now();
        const diff = (now - startTime) / 1000;
        timerEl.innerText = diff.toFixed(2);
    }, 10);
}

function stopTimer() {
    if(currentTimer) clearInterval(currentTimer);
    if(flipTimeout) clearTimeout(flipTimeout);
}

// --- 파일 저장/불러오기 기능 ---

function saveToFile() {
    const dataStr = JSON.stringify(interviewData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = "interview_questions.json";
    a.click();
    URL.revokeObjectURL(url);
}

function loadFromFile(input) {
    const file = input.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            if(Array.isArray(json)) {
                interviewData = json;
                alert("설정 파일이 성공적으로 로드되었습니다!");
                // 데이터 에디터에도 반영
                document.getElementById('json-editor').value = JSON.stringify(interviewData, null, 2);
            } else {
                alert("올바른 JSON 형식이 아닙니다.");
            }
        } catch(err) {
            alert("파일을 읽는 중 오류가 발생했습니다.");
        }
    };
    reader.readAsText(file);
}

// --- 데이터 수정 모달 관련 ---

function renderQuestionEditor(question = { id: Date.now(), category: '', question: '', tailQuestions: [] }) {
    const editor = document.getElementById('question-editor');

    const item = document.createElement('div');
    item.className = 'question-item';
    item.setAttribute('data-id', question.id);

    item.innerHTML = `
        <label>카테고리</label>
        <input type="text" class="q-edit-category" value="${question.category}">
        
        <label>메인 질문</label>
        <input type="text" class="q-edit-question" value="${question.question}">
        
        <label>꼬리 질문 (한 줄에 하나씩)</label>
        <textarea class="q-edit-tail">${question.tailQuestions.join('\n')}</textarea>
        
        <div class="question-item-actions">
            <button class="btn btn-danger" onclick="this.closest('.question-item').remove()">삭제</button>
        </div>
    `;
    editor.appendChild(item);
}

function openEditModal() {
    const editor = document.getElementById('question-editor');
    editor.innerHTML = ''; // 기존 내용 초기화
    
    interviewData.forEach(q => renderQuestionEditor(q));

    document.getElementById('data-modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function addQuestionToEditor() {
    renderQuestionEditor();
    // 새 항목으로 스크롤
    const editor = document.getElementById('question-editor');
    editor.scrollTop = editor.scrollHeight;
}

function closeEditModal() {
    document.getElementById('data-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function applyEditorChanges() {
    const newInterviewData = [];
    const questionItems = document.querySelectorAll('#question-editor .question-item');

    questionItems.forEach((item, index) => {
        const category = item.querySelector('.q-edit-category').value.trim();
        const question = item.querySelector('.q-edit-question').value.trim();
        const tailQuestions = item.querySelector('.q-edit-tail').value.split('\n').map(t => t.trim()).filter(t => t);

        if (!category || !question) {
            // 빈 항목은 무시
            return;
        }

        newInterviewData.push({
            id: item.getAttribute('data-id') || Date.now() + index,
            category,
            question,
            tailQuestions
        });
    });

    interviewData = newInterviewData;
    closeEditModal();
    alert("데이터가 성공적으로 적용되었습니다.");

    // 변경된 데이터를 파일 저장 시에도 사용할 수 있도록 textarea도 업데이트 (선택적)
    // document.getElementById('json-editor').value = JSON.stringify(interviewData, null, 2);
}
