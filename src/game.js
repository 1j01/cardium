import { cardByElement, gameContainer, getAllCards } from "./board.js";
import { FractalCard, PlayerCard, RollerCard, StandardPlayingCard } from "./Card.js";
import { shuffleArray } from "./helpers.js";

const suits = /** @type {const} */(['♠', '♥', '♦', '♣']);
const values = /** @type {const} */(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']);

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

function stepGame() {
	for (const visualization of document.querySelectorAll('.location-visualization')) {
		visualization.remove();
	}
	for (const card of getAllCards()) {
		if (!card.flipped) {
			card.step?.();
		}
	}
}

/**
 * @param {1 | -1} direction
 */
function walkPlayer(direction) {
	for (const card of getAllCards()) {
		if (!card.flipped) {
			card.walk?.(direction);
		}
	}
}

/**
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
	if (event.key === 'r') {
		newGame();
	} else if (event.key === ' ') {
		stepGame();
	} else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
		walkPlayer(event.key === 'ArrowRight' ? 1 : -1);
	}
}

document.addEventListener('keydown', onKeyDown);
document.getElementById('resetButton').addEventListener('click', () => newGame());
document.getElementById('stepButton').addEventListener('click', () => stepGame());
document.getElementById('rightButton').addEventListener('click', () => walkPlayer(1));
document.getElementById('leftButton').addEventListener('click', () => walkPlayer(-1));

newGame();
