// const gameContainer = document.getElementById('gameContainer');

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function dealCards() {
	const deck = [];
	for (const suit of suits) {
		for (const value of values) {
			deck.push({ suit, value });
		}
	}
	shuffleArray(deck);

	for (let i = 0; i < 12; i++) {
		const { suit, value } = deck[i];
		const card = new StandardPlayingCard(suit, value);
		gameContainer.appendChild(card.element);
		cardByElement.set(card.element, card);
	}
}

function clearBoard() {
	for (const card of getAllCards()) {
		card.element.remove();
	}
}

function newGame() {
	clearBoard();
	dealCards();
}

function onKeyDown(event) {
	if (event.key === 'r') {
		newGame();
	}
}

document.addEventListener('keydown', onKeyDown);

newGame();
