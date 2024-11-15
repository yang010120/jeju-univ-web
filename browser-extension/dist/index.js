import axios from 'axios';

// form fields
const form = document.querySelector('.form-data');
const region = document.querySelector('.region-name');
const apiKey = document.querySelector('.api-key');

// results

const resultsContainers = [
    document.getElementById('result1'),
    document.getElementById('result2'),
    document.getElementById('result3')
];

const regions = [
    document.getElementById('region1'),
    document.getElementById('region2'),
    document.getElementById('region3')
];

const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const results = document.querySelector('.result-container');
const usage = document.querySelector('.carbon-usage');
const fossilfuel = document.querySelector('.fossil-fuel');
const myregion = document.querySelector('.my-region');
const clearBtn = document.querySelector('.clear-btn');

const calculateColor = async (value) => {
    let co2Scale = [0, 150, 600, 750, 800];
    let colors = ['#2AA364', '#F5EB4D', '#9E4229', '#381D02', '#381D02'];
    
    let closestNum = co2Scale.sort((a, b) => {
        return Math.abs(a - value) - Math.abs(b - value);
    })[0];
    console.log(value + ' is closest to ' + closestNum);
    let num = (element) => element > closestNum;
    let scaleIndex = co2Scale.findIndex(num);

    let closestColor = colors[scaleIndex];
    console.log(scaleIndex, closestColor);

    chrome.runtime.sendMessage({ action: 'updateIcon', value: { color: closestColor } });
};
   
// displayCarbonUsage 함수를 개별 컨테이너 ID에 맞게 수정
const displayCarbonUsage = async (apiKey, region, index) => {
    try {
        const response = await axios.get('https://api.co2signal.com/v1/latest', {
            params: { countryCode: region },
            headers: { 'auth-token': apiKey }
        });
        const data = response.data.data;

        // 각각의 결과 컨테이너에 데이터 표시
        document.getElementById(`my-region${index}`).textContent = region;
        document.getElementById(`carbon-usage${index}`).textContent = `${data.carbonIntensity} grams`;
        document.getElementById(`fossil-fuel${index}`).textContent = `${data.fossilFuelPercentage}%`;

        resultsContainers[index - 1].style.display = 'block';
    } catch (error) {
        console.log(error);
        document.querySelector('.errors').textContent = '해당 지역에 대한 데이터를 찾을 수 없습니다.';
    }
}; // 간단한 함수 구현시 사용.

function setUpUser(apiKey, regionName) {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('regionName', regionName);
    loading.style.display = 'block';
    errors.textContent = '';
    clearBtn.style.display = 'block';
    displayCarbonUsage(apiKey, regionName);
}

function handleSubmit(e) {
    e.preventDefault();
    setUpUser(apiKey.value, region.value);
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

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKeyValue = apiKey.value;
    
    regions.forEach((region, index) => {
        if (region.value) {
            displayCarbonUsage(apiKeyValue, region.value, index + 1);
        }
    });
});
clearBtn.addEventListener('click', (e) => reset(e));

init();


