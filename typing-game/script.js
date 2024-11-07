const quotes = [
    'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
    'There is nothing more deceptive than an obvious fact.',
    'I ought to know by this time that when a fact appears to be opposed to along train of deductions it invariably proves to be capable of bearing someother interpretation.',
    'I never make exceptions. An exception disproves the rule.',
    'What one man can invent another can discover.',
    'Nothing clears up a case so much as stating it to another person.',
    'Education never ends, Watson. It is a series of lessons, with the greatest for the last.'
];

let words = [];
let wordIndex = 0; 
let startTime = Date.now();
let isGameActive = false;
let bestScore = localStorage.getItem('bestScore') || 100000; // 저장된 최고 점수를 불러온다.
// 저장된 점수가 없을 때 기본값은 100초로 설정.

const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');
const startButton = document.getElementById('start');

function startGame() {
    startButton.disabled = true; // 게임 시작 시 Start 버튼 비활성화
    const quoteIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[quoteIndex];
    words = quote.split(' ');
    wordIndex = 0;
    const spanWords = words.map(function(word) {
        return `<span>${word} </span>`;
    });
    quoteElement.innerHTML = spanWords.join('');
    quoteElement.childNodes[0].className = 'highlight';
    messageElement.innerText = '';
    typedValueElement.value = '';
    typedValueElement.focus();
    typedValueElement.disabled = false;
    startTime = new Date().getTime();
    isGameActive = true;
}

function handleInput() {
    if (!isGameActive) return;

    const currentWord = words[wordIndex];
    const typedValue = typedValueElement.value;

    if (typedValue === currentWord && wordIndex === words.length - 1) {
        const elapsedTime = new Date().getTime() - startTime;
        const message = `CONGRATULATIONS! You finished in ${elapsedTime / 1000} seconds.`;
        if(elapsedTime < bestScore) { // 최고 점수 갱신시 localStorage에 저장 
            bestScore = elapsedTime;
            localStorage.setItem('bestScore', bestScore); // setItem 함수 사용해 bestScore라는 키로 데이터 저장.
            messageElement.innerText = `New best score: ${bestScore / 1000} seconds!`;
        }
        else {
            messageElement.innerText = message;
        }
        isGameActive = false;
        typedValueElement.removeEventListener('input', handleInput);
        typedValueElement.disabled = true;
        startButton.disabled = false; 
        showModal(elapsedTime);
    } 
    else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) {
        typedValueElement.value = '';
        wordIndex++;
        for (const wordElement of quoteElement.childNodes) {
            wordElement.className = '';
        }
        quoteElement.childNodes[wordIndex].className = 'highlight';
    } 
    else if (currentWord.startsWith(typedValue)) {
        typedValueElement.className = '';
    } 
    else {
        typedValueElement.className = 'error';
    }
}

function showModal(time) { // 모달을 열고 기록을 업데이트 함
    document.getElementById('elapsed-time').textContent = (time / 1000).toFixed(2);
    document.getElementById('best-time').textContent = (bestScore / 1000).toFixed(2);
    document.getElementById('modal').style.display = 'block'; 
}

document.querySelector('.close-btn').onclick = function() { // 클릭 시 모달이 닫힘.
    document.getElementById('modal').style.display = 'none';
};

document.getElementById('restart').onclick = function() {
    document.getElementById('modal').style.display = 'none';
    main();
};

function main() {
    startButton.addEventListener('click', () => {
        startGame();
        typedValueElement.addEventListener('input', handleInput);

        // 게임 진행 중 사용자가 입력할 때마다 input 필드의 배경색을 변경해 시각적 효과를 준다.
        typedValueElement.addEventListener('input', () => { 
            typedValueElement.style.backgroundColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
            // 랜덤한 색상 생성
            typedValueElement.style.transition = "background-color 0.5s ease";
            // 배경색이 부드럽게 변경되도록 효과를 추가한다.
        });
    });
}

main();
