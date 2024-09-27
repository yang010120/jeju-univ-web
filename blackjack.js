let cardOne = 7;
let cardTwo = 5;
let cardThree = 7;
let sum = cardOne + cardTwo + cardThree; // 플레이어 카드 합계, 19

let cardOneBank = 7;
let cardTwoBank = 5;
let cardThreeBank = 4;
let bankSum = cardOneBank + cardTwoBank + cardThreeBank; // 딜러 카드 합계, 16

// 플레이어 Bust 또는 블랙잭 판정
if (sum > 21) {
    console.log('You lost');
} else if (sum === 21) {
    console.log('Blackjack! Player wins!');
} else {
    // 딜러는 17점 이상일 때 멈추고 그 이하일 때 추가 카드를 뽑음
    while (bankSum < 17) {
        let extraCard = Math.floor(Math.random() * 11) + 1; // 딜러 추가 카드 (1~11)
        bankSum += extraCard;
        console.log(`Dealer draws an extra card: ${extraCard}`);
    }

    // 딜러의 Bust 판정
    if (bankSum > 21) {
        console.log('Dealer Bust! Player wins!');
    } else if (sum === bankSum) {
        console.log('It\'s a draw!');
    } else if (sum > bankSum) {
        console.log('Player wins!');
    } else {
        console.log('Bank wins!');
    }
}

console.log(`Player has ${sum} points.`);
console.log(`Bank has ${bankSum} points.`);
