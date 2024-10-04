const gameContainer = document.getElementById('gameContainer');

const cardByElement = new WeakMap();
window.cardByElement = cardByElement;

const MAX_SNAP_DISTANCE = 20;

// TODO: find multiple snaps of near-equal distance, for highlighting multiple edges
function findSnap(card) {
	let closestSnap = null;
	let closestDistance = MAX_SNAP_DISTANCE;
	const cards = [...document.querySelectorAll('.card')].map(cardElement => cardByElement.get(cardElement));
	for (const otherCard of cards) {
		if (otherCard === card) continue;
		if (!document.body.contains(otherCard.element)) continue;
		for (const snap of otherCard.getSnaps()) {
			const distance = Math.hypot(snap.center.x - card.center.x, snap.center.y - card.center.y);
			// Note: remainder operator only works here if
			// the values are already constrained to within 0-360
			// otherwise negative numbers would be a problem.
			if (distance < closestDistance && (snap.rotation % 180) === (card.rotation % 180)) {
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
		// TODO: update snap with same logic as pointermove
		mouseWheelAccumulator = 0;
	}
});

let topZIndex = 0;
// @FIXME: offset breaks when zooming during drag
let offset = { x: 0, y: 0 };
/** @type {Card | null} */
let draggingCard = null;

let edgeHighlight = document.createElement('div');
edgeHighlight.classList.add('edge-highlight');
gameContainer.appendChild(edgeHighlight);
edgeHighlight.style.display = 'none';

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
			edgeHighlight.style.display = 'block';
			const edgeAngle = Math.atan2(snap.edge[1].y - snap.edge[0].y, snap.edge[1].x - snap.edge[0].x) * 180 / Math.PI;
			const edgeLength = Math.hypot(snap.edge[1].x - snap.edge[0].x, snap.edge[1].y - snap.edge[0].y);
			const midX = (snap.edge[0].x + snap.edge[1].x) / 2;
			const midY = (snap.edge[0].y + snap.edge[1].y) / 2;
			edgeHighlight.style.transform = `translate(-50%, -50%) rotate(${edgeAngle}deg)`;
			edgeHighlight.style.width = `${edgeLength}px`;
			edgeHighlight.style.left = `${midX}px`;
			edgeHighlight.style.top = `${midY}px`;
		} else {
			edgeHighlight.style.display = 'none';
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
	edgeHighlight.style.display = 'none';
});

