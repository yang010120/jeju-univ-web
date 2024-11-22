import axios from 'axios';

// form fields
const form = document.querySelector('.form-data');
const regionInputs = [
    document.querySelector('#region1'),
    document.querySelector('#region2'),
    document.querySelector('#region3')
];
const apiKey = document.querySelector('.api-key');

// results

const resultsContainers = [
    document.getElementById('result1'),
    document.getElementById('result2'),
    document.getElementById('result3')
];

const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');

const results = document.querySelector('.result-container'); //

const clearBtn = document.querySelector('.clear-btn');

// 퀴즈 컨테이너
const quizContainer = document.querySelector('.quiz-container');
const quizQuestion = document.querySelector('.quiz-question');
const quizOptions = document.querySelector('.quiz-options');
const submitQuizBtn = document.querySelector('.submit-quiz');

// 상태 관리
let correctAnswer = null;
let pendingRegions = [];

const sendMessageToRuntime = (message) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(message);
    } else {
        console.warn('chrome.runtime is not available. This may not be a Chrome extension environment.');
    }
};

const calculateColor = async (value) => {
    let co2Scale = [0, 150, 600, 750, 800];
    let colors = ['#2AA364', '#F5EB4D', '#9E4229', '#381D02', '#381D02'];

    let closestNum = co2Scale.sort((a, b) => {
        return Math.abs(a - value) - Math.abs(b - value);
    })[0];
    let scaleIndex = co2Scale.findIndex((element) => element > closestNum);
    let closestColor = colors[scaleIndex];

    sendMessageToRuntime({
        action: 'updateIcon',
        value: { color: closestColor },
    });
};
   
// displayCarbonUsage 함수를 개별 컨테이너 ID에 맞게 수정
async function displayCarbonUsage(apiKey, region, index) {
    loading.style.display = 'block';  // 호출 시작 전에 로딩 표시
    try {
        const response = await axios.get('https://api.co2signal.com/v1/latest', {
            params: { countryCode: region },
            headers: { 'auth-token': apiKey },
        });

        if (!response.data || !response.data.data) {
            throw new Error('데이터가 유효하지 않습니다.');
        }

        const data = response.data.data;

        // 요소 찾기
        const myRegionElement = document.getElementById(`my-region${index}`);
        const carbonUsageElement = document.getElementById(`carbon-usage${index}`);
        const fossilFuelElement = document.getElementById(`fossil-fuel${index}`);

        if (myRegionElement && carbonUsageElement && fossilFuelElement) {
            myRegionElement.textContent = region || 'N/A';
            carbonUsageElement.textContent = `${data.carbonIntensity || 0} grams`;
            fossilFuelElement.textContent = `${data.fossilFuelPercentage || 0}%`;
        } else {
            console.error(`UI 요소를 찾을 수 없습니다: my-region${index}, carbon-usage${index}, fossil-fuel${index}`);
        }

        // 결과 표시
        document.getElementById(`result${index}`).style.display = 'block';
    } catch (error) {
        console.error(`Failed to fetch data for region ${region}:`, error);
        errors.textContent = `지역 ${region}의 데이터를 가져오지 못했습니다.`;
        document.getElementById(`result${index}`).style.display = 'none';
    } finally {
        loading.style.display = 'none';  // 호출이 끝난 후 로딩 숨기기
    }
}

// 퀴즈 데이터 가져오기
const fetchQuiz = async () => {
    try {
        // Open Trivia Database API를 사용하여 퀴즈 데이터 가져옴
        // https://opentdb.com/api.php 퀴즈 질문을 제공하는 무료 API로, 다양한 주제와 유형의 퀴즈를 제공
        // 해당 API는 다지선다형 문제, 진위형 문제(True/False) 등을 제공하며, 여러 가지 주제를 지원
        // 쉽게 퀴즈 질문을 가져와서 응용 프로그램에 표시할 수 있어 선정
        
        // API 호출:
        // `amount=1`: 한 개의 퀴즈를 요청
        // `type=multiple`: 다지선다형 문제를 요청
        const response = await axios.get('https://opentdb.com/api.php', {
            params: { amount: 1, type: 'multiple' }, // 한 개의 다지선다형 질문을 요청
        });

        // 데이터가 없거나 문제 목록이 없으면 오류 발생
        if (!response.data || !response.data.results.length) {
            throw new Error('퀴즈 데이터를 받을 수 없습니다.');
        }

        // 응답에서 첫 번째 퀴즈 데이터 추출
        const quizData = response.data.results[0];

        // 퀴즈 질문을 화면에 출력
        quizQuestion.textContent = quizData.question || '퀴즈 데이터를 불러오지 못했습니다.';
        
        // 정답을 저장 (퀴즈 검증용)
        correctAnswer = quizData.correct_answer;

        // 정답을 포함한 선택지들을 무작위로 섞어서 화면에 표시
        // `incorrect_answers`: 틀린 답변들을 배열로 제공
        // `correct_answer`: 정답을 추가하여 최종적으로 4개의 선택지를 만듦
        const options = [...quizData.incorrect_answers, correctAnswer].sort(() => Math.random() - 0.5);

        quizOptions.innerHTML = ''; // 기존 선택지를 초기화
        options.forEach((option) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('quiz-option');
            quizOptions.appendChild(button);
        });
    } catch (error) {
        console.error('퀴즈 로드 실패:', error);
        quizQuestion.textContent = '퀴즈 로드 실패';
    }
};

/*
API 설명
Open Trivia Database (OTDB)
https://opentdb.com/는 무료로 제공되는 퀴즈 API로, 사용자에게 다양한 퀴즈 문제를 제공한다. 해당 API는 여러 분야의 퀴즈 질문을 제공하며, 개발자가 손쉽게 퀴즈 데이터를 가져와서 앱에 사용할 수 있도록 한다.

특징:
이 API는 무료로 제공되며, 누구나 사용 가능하고, 별도의 인증키 없이 요청할 수 있다.
다지선다형, 진위형(True/False) 등 다양한 퀴즈 유형을 지원한다.
다양한 카테고리(일반 지식, 스포츠, 영화 등)의 퀴즈를 제공한다.
API는 정답뿐만 아니라 오답도 제공하므로, 퀴즈를 풀기 위한 충분한 데이터를 한 번에 제공할 수 있다.

사용 이유:
Open Trivia Database API는 비용이 들지 않으며, 무료로 퀴즈 데이터를 받을 수 있다. 
API 요청 시 간단한 매개변수를 통해 원하는 퀴즈를 쉽게 가져올 수 있다. 예를 들어, 한 개의 퀴즈와 여러 개의 답변 옵션을 한 번의 API 호출로 받는다.
다양한 주제와 질문 유형: 다양한 주제와 질문 유형을 지원하기 때문에, 다양한 사용자의 관심사에 맞는 퀴즈를 제공한다. 일반 지식, 스포츠, 영화 등 다양한 분야에서 퀴즈 선택이 가능하다.
API 응답은 JSON 포맷으로 잘 구조화되어 있으며, 각 퀴즈의 질문, 답변 옵션, 정답을 쉽게 파싱하여 사용할 수 있다.
API는 여러 퀴즈 질문을 랜덤으로 제공하므로, 매번 새로운 퀴즈를 제공할 수 있다. 
*/

// 퀴즈 제출 이벤트
quizOptions.addEventListener('click', (e) => {
    if (e.target.classList.contains('quiz-option')) {
        const selectedAnswer = e.target.textContent;
        if (selectedAnswer === correctAnswer) {
            quizContainer.style.display = 'none';
            pendingRegions.forEach(([apiKey, region, index]) => {
                displayCarbonUsage(apiKey, region, index);
            });
            pendingRegions = [];
        } else {
            errors.textContent = '퀴즈에 올바르게 답해야 결과를 볼 수 있습니다.';
        }
    }
});

function setUpUser(apiKey, regionName) {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('regionName', regionName);
    loading.style.display = 'block';
    errors.textContent = '';
    clearBtn.style.display = 'block';
    displayCarbonUsage(apiKey, regionName);
}

// 사용자 제출 버튼 클릭 시 처리하는 함수
function handleFormSubmit() {
    // 퀴즈를 표시할 컨테이너 선택
    const quizContainer = document.querySelector('.quiz-container');
    
    // 퀴즈 질문 내용
    const questionText = "What is the impact of carbon usage on your region?";
    
    // 사용자가 선택할 수 있는 답변 옵션을 배열로 정의
    const options = ["High", "Moderate", "Low"];
    
    // 퀴즈 질문을 퀴즈 컨테이너의 .quiz-question 요소에 삽입
    quizContainer.querySelector('.quiz-question').textContent = questionText;
    
    // 퀴즈 선택 옵션을 담을 컨테이너 선택
    const optionsContainer = quizContainer.querySelector('.quiz-options');
    
    // 기존에 존재하는 선택지 버튼들을 삭제하여 초기화
    optionsContainer.innerHTML = ''; // 이전에 렌더링된 선택지들 초기화
    
    // 주어진 옵션들을 각각 버튼으로 만들어 화면에 추가
    options.forEach(option => {
        // 새로운 버튼 요소 생성
        const button = document.createElement('button');
        
        // 버튼에 옵션 텍스트 추가
        button.textContent = option;
        
        // 각 버튼에 클릭 이벤트 리스너 추가
        // 사용자가 이 버튼을 클릭하면 handleAnswer 함수가 실행됨
        button.addEventListener('click', () => handleAnswer(option));
        
        // 버튼을 선택지 컨테이너에 추가
        optionsContainer.appendChild(button);
    });
    
    // 퀴즈 컨테이너를 화면에 보이도록 설정
    quizContainer.style.display = 'block';
}

// 사용자가 퀴즈 선택지 중 하나를 클릭했을 때 호출되는 함수
function handleAnswer(answer) {
    console.log(`Selected Answer: ${answer}`);
    // 사용자가 선택한 답변을 콘솔에 출력
}

function init() {
    const storedApiKey = localStorage.getItem('apiKey');
    const storedRegion = localStorage.getItem('regionName');
    
    //set icon to be generic green
    chrome.runtime.sendMessage({
        action: 'updateIcon',
        value: {
        color: 'green',
        },
    });
    //todo

    if (storedApiKey === null || storedRegion === null) {
        form.style.display = 'block';
        results.style.display = 'none';
        loading.style.display = 'none';
        clearBtn.style.display = 'none';
        errors.textContent = '';
    } else {
        displayCarbonUsage(storedApiKey, storedRegion);
        results.style.display = 'none';
        form.style.display = 'none';
        clearBtn.style.display = 'block';
    }
};

function reset(e) {
    e.preventDefault();
    localStorage.removeItem('regionName');
    init();
}

document.addEventListener("DOMContentLoaded", () => {
    // 요소 선택
    const targetElement = document.querySelector("#yourElementID"); // 수정 필요

    // 요소가 존재하는지 확인
    if (targetElement) {
        targetElement.textContent = "새로운 내용"; // textContent 설정
    } else {
        console.warn("지정한 요소를 찾을 수 없습니다.");
    }
});

document.querySelector('.form-data').addEventListener('submit', function (e) {
    e.preventDefault(); // 기본 동작(새로고침) 방지
    handleFormSubmit();
});


// 폼 제출 이벤트 리스너
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // 폼 제출 시 브라우저의 기본 동작(페이지 새로 고침)을 방지
    
    // 지역 정보를 저장할 배열 초기화
    pendingRegions = [];
    
    // 각 지역 입력값을 순차적으로 검사하여 유효한 지역을 pendingRegions 배열에 추가
    regionInputs.forEach((regionInput, index) => {
        if (regionInput.value.trim()) {
            // 지역 입력값이 비어 있지 않으면 배열에 추가 (API 키와 지역, 그리고 지역 인덱스를 저장)
            pendingRegions.push([apiKey.value, regionInput.value, index + 1]);
        }
    });
    
    // 사용자가 적어도 하나의 지역을 입력했다면 퀴즈를 가져와서 표시
    if (pendingRegions.length > 0) {
        // 퀴즈 데이터를 API에서 가져오고, 퀴즈 컨테이너를 표시
        await fetchQuiz();
        quizContainer.style.display = 'block'; // 퀴즈를 화면에 보이도록 설정
    } else {
        // 지역을 하나도 입력하지 않으면 에러 메시지를 표시
        errors.textContent = '적어도 한 개의 지역을 입력해야 합니다.';
    }
});

searchBtn.addEventListener("click", async function(event) {
    event.preventDefault();  // 폼 제출 방지

    const region1 = document.getElementById("region1").value;
    const region2 = document.getElementById("region2").value;
    const region3 = document.getElementById("region3").value;
    const apiKey = document.getElementById("api").value;

    loading.style.display = 'block'; // 로딩 시작

    // 각 지역의 데이터를 가져와서 결과를 표시
    await Promise.all([
        displayCarbonUsage(apiKey, region1, 1),
        displayCarbonUsage(apiKey, region2, 2),
        displayCarbonUsage(apiKey, region3, 3)
    ]);

    loading.style.display = 'none';  // 로딩 끝
});

clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    resultsContainers.forEach((container) => (container.style.display = 'none'));
    quizContainer.style.display = 'none';
    errors.textContent = '';
    form.reset();
});

init();
