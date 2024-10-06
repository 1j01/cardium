const gameContainer = document.getElementById('gameContainer');

/** @type {WeakMap<HTMLElement, Card>} */
const cardByElement = new WeakMap();
window.cardByElement = cardByElement;

const MAX_SNAP_DISTANCE = 20;
const SNAP_EQUIVALENCE_THRESHOLD = 0.1;
const ANGLE_EQUIVALENCE_THRESHOLD = 0.1;

function getAllCards() {
	return [...document.querySelectorAll('.card')]
		.map(cardElement => cardByElement.get(cardElement));
}

function anglesNearEqualOrOpposite(angle1, angle2) {
	// Alternatively, could add a cycle parameter to angleDifference, and use 180 as the cycle. Would probably want to rename it cyclicDifference or something.
	return (
		Math.abs(angleDifference(angle1, angle2)) < ANGLE_EQUIVALENCE_THRESHOLD ||
		Math.abs(angleDifference(angle1, angle2 + 180)) < ANGLE_EQUIVALENCE_THRESHOLD
	);
}

/**
 * @param {CardLoc} cardLoc  location to check for snaps
 * @param {Card} ignoreCard  card to exclude from snap detection
 */
function findSnap(cardLoc, ignoreCard) {
	const allSnaps = [];
	let closestSnap = null;
	let closestDistance = MAX_SNAP_DISTANCE;
	const cards = getAllCards();
	for (const otherCard of cards) {
		if (otherCard === ignoreCard) continue;
		if (!document.body.contains(otherCard.element)) continue;
		for (const snap of otherCard.logicalLoc.getSnaps()) {
			const distance = Math.hypot(snap.center.x - cardLoc.center.x, snap.center.y - cardLoc.center.y);
			if (
				distance < closestDistance &&
				anglesNearEqualOrOpposite(snap.rotation, cardLoc.rotation)
			) {
				closestSnap = snap;
				closestDistance = distance;
			}
			allSnaps.push(snap);
		}
	}
	// In order to highlight multiple edges when snapping into a corner,
	// find the edges from multiple snaps close enough to be considered equivalent.
	if (!closestSnap) return null;
	const combinedSnap = new CombinedSnap({
		center: {
			x: closestSnap.center.x,
			y: closestSnap.center.y,
		},
		rotation: closestSnap.rotation,
		edges: [],
	});
	for (const snap of allSnaps) {
		if (
			Math.hypot(snap.center.x - combinedSnap.center.x, snap.center.y - combinedSnap.center.y) < SNAP_EQUIVALENCE_THRESHOLD &&
			anglesNearEqualOrOpposite(snap.rotation, combinedSnap.rotation)
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

/** 
 * @param {CardLoc} cardLoc  location to check for collisions
 * @param {Card} ignoreCard  card to exclude from collision detection
 */
function findCollisions(cardLoc, ignoreCard) {
	const collisions = [];
	for (const otherCard of getAllCards()) {
		if (otherCard === ignoreCard) continue;
		if (cardLoc.collidesWith(otherCard.logicalLoc)) {
			collisions.push(otherCard);
		}
	}
	return collisions;
}

// Most scroll wheels are discrete but some are continuous, particularly touchpads.
// Simply snapping the delta to 45 degree angles risks "snapping to" no rotation at all
// for continuous scrolling inputs.
// Instead, the inputs should be accumulated until it snaps to the next angle.
let mouseWheelAccumulator = 0;

window.addEventListener('wheel', (event) => {
	if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
		return; // don't rotate when zooming
	}
	mouseWheelAccumulator += event.deltaY;
	// One scroll wheel notch gives 120 one desktop computer I tested,
	// and on another, 100 in Chrome, and 102 in Firefox.
	// I also tested this on a laptop with a touchpad to make sure it felt reasonable with continuous scrolling.
	// Devices may vary, though.
	if (Math.abs(mouseWheelAccumulator) > 50) {
		if (draggingCard) {
			const deltaDegrees = Math.sign(mouseWheelAccumulator) * 45;
			draggingCard.targetVisualLoc.rotation += deltaDegrees;
			// Update snapped position and highlights and card transform
			updateDraggedCard(event);
			// Animate the rotation
			draggingCard.animate();
		}
		mouseWheelAccumulator = 0;
	}
});

let topZIndex = 0;
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
		const card = cardByElement.get(cardElement);
		if (event.button === 0) {
			draggingCard = card;
			offset = {
				x: event.clientX - draggingCard.visualLoc.center.x,
				y: event.clientY - draggingCard.visualLoc.center.y
			};
			document.body.classList.add('dragging');
			cardElement.style.zIndex = ++topZIndex;
			cardElement.classList.add('lifted');
			cardElement.setPointerCapture(event.pointerId);
		} else if (event.button === 2) {
			card.flip();
		} else if (event.button === 1) {
			// create cards at each snap location
			for (const snap of card.logicalLoc.getSnaps()) {
				const newCard = card instanceof StandardPlayingCard ? new StandardPlayingCard(card.suit, card.value) : new Card();
				newCard.moveTo(card.logicalLoc, { animate: false });
				newCard.moveTo(snap, { animate: true });
				cardByElement.set(newCard.element, newCard);
				gameContainer.appendChild(newCard.element);
			}
		}
	}
	event.preventDefault();
});

// TODO: I would use gameContainer instead here,
// but it's not sized to the whole page, and adding `height: 100vh` to it is breaking the layout.
document.body.addEventListener('contextmenu', (event) => {
	event.preventDefault();
});

let infoForZoomHandling = { clientX: 0, clientY: 0, devicePixelRatio: window.devicePixelRatio };

/**
 * Handle zooming in/out during a drag.
 * 
 * When zooming or scrolling, the mouse position in document coordinates changes,
 * even if the mouse stays in the same place on the screen.
 * 
 * The devicePixelRatio can change before a resize event is fired,
 * so this function needs to be called on pointermove too,
 * in case the mouse is moving while zooming while dragging.
 * 
 * I previously did something similar in JS Paint for the cursor position,
 * so I'm copying the strategy from there.
 * @See https://github.com/1j01/jspaint/blob/04804396e187b1bf4af9cc31ca449d18661f97ed/src/functions.js#L183-L189
 */
function rescaleToHandleZooming() {
	if (window.devicePixelRatio !== infoForZoomHandling.devicePixelRatio) {
		const rescale = infoForZoomHandling.devicePixelRatio / devicePixelRatio;
		infoForZoomHandling.clientX *= rescale;
		infoForZoomHandling.clientY *= rescale;
		infoForZoomHandling.devicePixelRatio = devicePixelRatio;
		if (draggingCard) {
			offset.x *= rescale;
			offset.y *= rescale;
		}
	}
}

window.addEventListener('pointermove', (event) => {
	rescaleToHandleZooming();
	updateDraggedCard(event);
	infoForZoomHandling = {
		clientX: event.clientX,
		clientY: event.clientY,
		devicePixelRatio: window.devicePixelRatio
	};
});

function updateDraggedCard({ clientX, clientY }) {
	if (draggingCard) {
		let targetPosition = new CardLoc({
			x: clientX - offset.x,
			y: clientY - offset.y
		}, draggingCard.targetVisualLoc.rotation);
		const snap = findSnap(targetPosition, draggingCard);
		clearEdgeHighlights();
		if (snap) {
			targetPosition = snap;
			for (const edge of snap.edges) {
				makeEdgeHighlight(edge);
			}
		}
		Object.assign(draggingCard.targetVisualLoc.center, targetPosition.center);
		Object.assign(draggingCard.visualLoc.center, targetPosition.center);
		draggingCard.updateTransform();
		const collisions = findCollisions(draggingCard.targetVisualLoc, draggingCard);
		draggingCard.element.classList.toggle('colliding', collisions.length > 0);
	}
}

window.addEventListener('pointerup', () => {
	if (draggingCard) {
		const collisions = findCollisions(draggingCard.targetVisualLoc, draggingCard);
		if (collisions.length > 0) {
			draggingCard.moveTo(draggingCard.logicalLoc);
		} else {
			draggingCard.moveTo(draggingCard.targetVisualLoc);
		}
		draggingCard.element.classList.remove('lifted', 'colliding');
		draggingCard = null;
		document.body.classList.remove('dragging');
	}
	mouseWheelAccumulator = 0;
	clearEdgeHighlights();
});

window.addEventListener('resize', () => {
	rescaleToHandleZooming();
	if (draggingCard) {
		updateDraggedCard(infoForZoomHandling);
	}
});
