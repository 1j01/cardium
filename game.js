const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const gameContainer = document.getElementById('gameContainer');

function shuffleArray(array) {
	for (let i = array.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

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
		const card = new Card(suit, value);
		gameContainer.appendChild(card.element);
		card.element.addEventListener('click', () => {
			card.flip();
		});
	}
}

dealCards();
