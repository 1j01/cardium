const gameContainer = document.getElementById('gameContainer');

const cardByElement = new WeakMap();
window.cardByElement = cardByElement;

// Most scroll wheels are discrete but some are continuous, particularly touchpads.
// Simply snapping the delta to 45 degree angles risks "snapping to" no rotation at all
// for continuous scrolling inputs.
// Instead, the inputs should be accumulated until it snaps to the next angle.
let mouseWheelAccumulator = 0;

window.addEventListener('wheel', (event) => {
	mouseWheelAccumulator += event.deltaY;
	// One scroll wheel notch gives 120 one desktop computer I tested,
	// and on another, 100 in Chrome, and 102 in Firefox.
	// I also tested this on a laptop with a touchpad to make sure it felt reasonable with continuous scrolling.
	// Devices may vary, though.
	if (Math.abs(mouseWheelAccumulator) > 50) {
		draggingCard?.rotate(Math.sign(mouseWheelAccumulator) * 45);
		mouseWheelAccumulator = 0;
	}
});

let topZIndex = 0;
let offset = { x: 0, y: 0 };
/** @type {Card | null} */
let draggingCard = null;
gameContainer.addEventListener('pointerdown', (event) => {
	const cardElement = event.target.closest('.card');
	if (cardElement) {
		draggingCard = cardByElement.get(cardElement);
		offset = {
			x: event.clientX - draggingCard.center.x,
			y: event.clientY - draggingCard.center.y
		};
		document.body.classList.add('dragging');
		cardElement.style.zIndex = ++topZIndex;
	}
	event.preventDefault();
});

window.addEventListener('pointermove', (event) => {
	if (draggingCard) {
		draggingCard.setPosition({
			x: event.clientX - offset.x,
			y: event.clientY - offset.y
		});
	}
});

window.addEventListener('pointerup', () => {
	draggingCard = null;
	document.body.classList.remove('dragging');
	mouseWheelAccumulator = 0;
});

