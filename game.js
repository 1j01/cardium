// const gameContainer = document.getElementById('gameContainer');

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function dealCards() {
	const deck = [];
	for (const suit of suits) {
		for (const value of values) {
			deck.push(new StandardPlayingCard(suit, value));
		}
	}
	shuffleArray(deck);

	deck.push(new RollerCard(45));
	deck.push(new RollerCard(-45));
	deck.push(new RollerCard(90));
	deck.push(new RollerCard(-90));
	deck.push(new FractalCard());
	deck.push(new PlayerCard());

	// TODO: start cards flipped, in a stack, and auto-flip when picking them up
	for (const card of deck) {
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
	} else if (event.key === ' ') {
		for (const card of getAllCards()) {
			if (!card.flipped) {
				card.step?.();
			}
		}
	} else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
		for (const card of getAllCards()) {
			if (!card.flipped) {
				card.walk?.(event.key === 'ArrowRight' ? 1 : -1);
			}
		}
	}
}

document.addEventListener('keydown', onKeyDown);

newGame();
