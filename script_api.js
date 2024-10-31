let highestZIndex = 2; 
// 각 요소가 드래그될 때 가장 앞에 나타나도록 하기 위한 z-index 값을 저장하는 변수
// 드래그될 때마다 이 값이 증가해 현재 요소가 다른 요소들 위에 위치하도록 한다.

// 아래 코드는 web drag drop api에서 제공하는 이벤트를 활용해 식물의 드래그 드롭을 구현한 코드이다.

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.plant').forEach(plant => {
        plant.draggable = true;
        plant.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData("text/plain", e.target.id);
            highestZIndex += 1;
            e.target.style.zIndex = highestZIndex;
        });
    });
});
// HTML 문서가 완전히 로드된 후, 모든 plant 클래스 요소에 dragstart 이벤트를 등록한다.
// DOMContentLoaded 이벤트는 HTML 문서가 완전히 로드된 후 실행되는 이벤트이다.
// querySelectorAll('.plant') 함수로 css plant 클래스 모드 요소에 리스너 등록을 진행한다.
// 데이터 전송 관리를 위해 dataTransfer 객체를 사용하며, 
// 해당 객체의 setData와 getData 함수를 사용해 요소의 드래그 드롭된 요소와 해당 요소의 좌표를 계산한다.
// e.dataTransfer.setData("text/plain", e.target.id) 드래그하는 요소의 id값을 text/plain 옵션으로 저장해,
// 드롭 시 해당 요소에 접근할 수 있다.
// 드래그할 때마다, z-index를 증가시켜 현재 요소가 다른 요소보다 앞에 위치하도록 한다.
// 드래그 시작 시 이 요소의 z-index를 highestZIndex로 설정한다.

document.addEventListener('dragover', (e) => {
    e.preventDefault(); 
});
// 요소가 드롭 가능한 영역 위로 이동할 때 dragover 이벤트가 계속해서 발생하며 
// e.preventDefault() 메소드로 브라우저의 기본 드롭 동작을 막아 drop 이벤트가 
// 정상적으로 발생할 수 있게 한다.

document.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text");
    const draggedElement = document.getElementById(id);

    draggedElement.style.left = `${e.clientX - draggedElement.offsetWidth / 2}px`;
    draggedElement.style.top = `${e.clientY - draggedElement.offsetHeight / 2}px`;
});
// drop 이벤트가 발생할 때, dragstart 이벤트에서 저장된 요소의 id를 가져온 후
// document.getElementById(id), 해당 id를 사용해 드래그된 요소를 찾는다.
// 드래그된 요소의 위치를 드롭 시 마우스 포인터의 위치를 활용해 지정한다.
// e.clientX, e.clientY는 드롭 시 마우스 포인터의 위치를 의미하고, 
// 해당 값에 드래그된 요소의 너비와 높이의 절반을 빼줌으로써, 
// 드래그된 요소가 드롭될 좌상단 좌표를 계산해 지정한다.

// 기존 이벤트 기반 코드는 이벤트를 직접 정의하여 드래그 동작을 구현했다. 
// 하지만, Drag and Drop API를 활용해 api에서 제공되는 dragstart, dragover, drop 이벤트를
// 사용하여 드래그 앤 드롭을 구현함에 따라 간결하고 표준화된 방식으로 구현할 수 있었다.
// 하지만, 더 복잡한 드래그 로직이 필요할 경우에는 api의 제한이 있으므로 직접 이벤트를 구현하는
// 방식도 고려할 필요가 있다. 해당 과제를 수행하며 두 가지 방식의 방법을 다 접해봄으로써, 각 상황에
// 적합한 방식 선택의 중요성과 api 활용 방법 등을 직접 경험해볼 수 있었다.

// 감사합니다.
