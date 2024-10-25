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
        messageElement.innerText = message;
        isGameActive = false;
        typedValueElement.removeEventListener('input', handleInput);
        typedValueElement.disabled = true;
        startButton.disabled = false; // 게임 종료 시 Start 버튼 활성화
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

startButton.addEventListener('click', () => {
    startGame();
    typedValueElement.addEventListener('input', handleInput);
});
