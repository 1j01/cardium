const gameContainer = document.getElementById('gameContainer');

const cardByElement = new WeakMap();
window.cardByElement = cardByElement;

const MAX_SNAP_DISTANCE = 20;

function findSnap(card) {
	let closestSnap = null;
	let closestDistance = MAX_SNAP_DISTANCE;
	const cards = [...document.querySelectorAll('.card')].map(cardElement => cardByElement.get(cardElement));
	for (const otherCard of cards) {
		if (otherCard === card) continue;
		if (!document.body.contains(otherCard.element)) continue;
		for (const snap of otherCard.getSnaps()) {
			const distance = Math.hypot(snap.center.x - card.center.x, snap.center.y - card.center.y);
			if (distance < closestDistance) { // && snap.rotation === card.rotation
				closestSnap = snap;
				closestDistance = distance;
			}
		}
	}
	return closestSnap;
}

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
// @FIXME: offset breaks when zooming during drag
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
		cardElement.classList.add('lifted');
		cardElement.setPointerCapture(event.pointerId);
	}
	event.preventDefault();
});

window.addEventListener('pointermove', (event) => {
	if (draggingCard) {
		let targetPosition = {
			x: event.clientX - offset.x,
			y: event.clientY - offset.y
		};
		// Have to set the position before using findSnap here.
		// Kinda awkward, could design it to be more functional
		// with targetPosition being a CardPosition object perhaps,
		// and passing targetPosition to findSnap.
		draggingCard.setPosition(targetPosition);
		const snap = findSnap(draggingCard);
		if (snap) {
			targetPosition = snap.center;
		}
		draggingCard.setPosition(targetPosition);
	}
});

window.addEventListener('pointerup', () => {
	if (draggingCard) {
		draggingCard.element.classList.remove('lifted');
		draggingCard = null;
		document.body.classList.remove('dragging');
	}
	mouseWheelAccumulator = 0;
});

