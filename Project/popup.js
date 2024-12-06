document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("exerciseButton");
    button.addEventListener("click", async () => {
        await getExerciseInfo(); // 랜덤 운동 정보를 가져옴.
    });

    const translateButton = document.getElementById("translateButton");
    translateButton.addEventListener("click", () => {
        const textToTranslate = document.getElementById("exerciseInfo").innerText;
        const encodedText = encodeURIComponent(textToTranslate);
        const googleTranslateURL = `https://translate.google.com/?sl=auto&tl=ko&text=${encodedText}&op=translate`;

        window.open(googleTranslateURL, "_blank"); // 번역 URL로 리디렉션.
        // 번역 버튼 클릭 시 Google 번역 URL로 텍스트 전송해 사용자는 새로운 탭에서 번역 결과를 확인.
    });
});

// 운동 정보를 가져오는 함수.
//Wger API에서 랜덤 운동 정보를 가져오고 displayExerciseInfo 함수를 사용해 화면에 표시.
async function getExerciseInfo() {
    try {
        const exerciseUrl = `https://wger.de/api/v2/exerciseinfo/`;
        const response = await fetch(exerciseUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const exerciseData = await response.json();
        const randomExercise = exerciseData.results[Math.floor(Math.random() * exerciseData.results.length)];

        displayExerciseInfo(randomExercise.name, randomExercise.description, randomExercise.images?.[0]?.image);
    } catch (error) {
        console.error("Error fetching exercise info:", error);
        alert("Failed to fetch exercise info. Check console for details.");
    }
}

// 운동 정보를 화면에 표시하는 함수.
// 가져온 운동 이름, 설명, 이미지를 사용자 화면에 표시.
// 이미지가 없는 경우 "No Image Available" 메시지를 표시.
function displayExerciseInfo(name, description, imageUrl) {
    const exerciseInfo = document.getElementById("exerciseInfo");
    exerciseInfo.innerHTML = `
        <h3>${name}</h3>
        <p>${description}</p>
        ${
            imageUrl
                ? `<img src="${imageUrl}" alt="Exercise Image" style="max-width: 100%; height: auto;">`
                : "<p>No Image Available</p>"
        }
    `;
}
