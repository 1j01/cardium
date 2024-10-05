const gameContainer = document.getElementById('gameContainer');

const cardByElement = new WeakMap();
window.cardByElement = cardByElement;

const MAX_SNAP_DISTANCE = 20;
const SNAP_EQUIVALENCE_THRESHOLD = 0.1;

function findSnap(card) {
	const allSnaps = [];
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
			allSnaps.push(snap);
		}
	}
	// In order to highlight multiple edges when snapping into a corner,
	// find the edges from multiple snaps close enough to be considered equivalent.
	if (!closestSnap) return null;
	const combinedSnap = {
		center: {
			x: closestSnap.center.x,
			y: closestSnap.center.y,
		},
		rotation: closestSnap.rotation,
		edges: [],
	};
	for (const snap of allSnaps) {
		if (
			Math.hypot(snap.center.x - combinedSnap.center.x, snap.center.y - combinedSnap.center.y) < SNAP_EQUIVALENCE_THRESHOLD &&
			(snap.rotation % 180) === (combinedSnap.rotation % 180)
		) {
			combinedSnap.edges.push(snap.edge);
		}
	}
	// Filter out equivalent edges
	// to handle cards that are stacked on top of each other.
	// This may be impossible in the final game.
	combinedSnap.edges = combinedSnap.edges.filter((edge, index, self) => {
		return self.findIndex(other => {
			return (
				(
					Math.hypot(edge[0].x - other[0].x, edge[0].y - other[0].y) < SNAP_EQUIVALENCE_THRESHOLD &&
					Math.hypot(edge[1].x - other[1].x, edge[1].y - other[1].y) < SNAP_EQUIVALENCE_THRESHOLD
				) || (
					Math.hypot(edge[0].x - other[1].x, edge[0].y - other[1].y) < SNAP_EQUIVALENCE_THRESHOLD &&
					Math.hypot(edge[1].x - other[0].x, edge[1].y - other[0].y) < SNAP_EQUIVALENCE_THRESHOLD
				)
			);
		}) === index;
	});

	return combinedSnap;
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
		// Update snapped position and highlights
		updateDraggedCard(event);

		mouseWheelAccumulator = 0;
	}
});

let topZIndex = 0;
// @FIXME: offset breaks when zooming during drag
let offset = { x: 0, y: 0 };
/** @type {Card | null} */
let draggingCard = null;

/** @type {HTMLDivElement[]} */
const edgeHighlights = [];

function makeEdgeHighlight(edge) {
	let edgeHighlight = document.createElement('div');
	edgeHighlight.classList.add('edge-highlight');
	const edgeAngle = Math.atan2(edge[1].y - edge[0].y, edge[1].x - edge[0].x) * 180 / Math.PI;
	const edgeLength = Math.hypot(edge[1].x - edge[0].x, edge[1].y - edge[0].y);
	const midX = (edge[0].x + edge[1].x) / 2;
	const midY = (edge[0].y + edge[1].y) / 2;
	edgeHighlight.style.transform = `translate(-50%, -50%) rotate(${edgeAngle}deg) var(--edge-highlight-scale)`;
	edgeHighlight.style.width = `${edgeLength}px`;
	edgeHighlight.style.left = `${midX}px`;
	edgeHighlight.style.top = `${midY}px`;
	gameContainer.appendChild(edgeHighlight);
	edgeHighlights.push(edgeHighlight);
	return edgeHighlight;
}

function clearEdgeHighlights() {
	for (const edgeHighlight of edgeHighlights) {
		edgeHighlight.remove();
	}
	edgeHighlights.length = 0;
}

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
	updateDraggedCard(event);
});

function updateDraggedCard(event) {
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
		clearEdgeHighlights();
		if (snap) {
			targetPosition = snap.center;
			for (const edge of snap.edges) {
				makeEdgeHighlight(edge);
			}
		}
		draggingCard.setPosition(targetPosition);
	}
}

window.addEventListener('pointerup', () => {
	if (draggingCard) {
		draggingCard.element.classList.remove('lifted');
		draggingCard = null;
		document.body.classList.remove('dragging');
	}
	mouseWheelAccumulator = 0;
	clearEdgeHighlights();
});

