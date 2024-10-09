import { cardByElement, findCollisions, gameContainer, getAllCards } from "./board.js";
import { alongLine, asTupleOf4, closestPointOnLineSegment } from "./helpers.js";

const CARD_WIDTH = 100;
const CARD_HEIGHT = 150;
const CARD_MEAN_SIDE_LENGTH = (CARD_WIDTH + CARD_HEIGHT) / 2;
const CARD_BOUNDING_DIAMETER = Math.hypot(CARD_WIDTH, CARD_HEIGHT);

document.body.style.setProperty('--card-width', `${CARD_WIDTH}px`);
document.body.style.setProperty('--card-height', `${CARD_HEIGHT}px`);

/**
 * @typedef {{x: number, y: number}} Point
 * @typedef {[Point, Point]} Edge
 */

/**
 * Represents a playing card.
 */
export class Card {
	FLIP_LERP_FACTOR = 0.1;
	POSITION_LERP_FACTOR = 0.2;
	ROTATION_LERP_FACTOR = 0.3;

	constructor() {
		/** @type {CardLoc} */
		this.logicalLoc = new CardLoc();
		/** @type {CardLoc} */
		this.visualLoc = new CardLoc();
		/** @type {CardLoc} */
		this.targetVisualLoc = new CardLoc();
		/** @type {boolean} */
		this.flipped = false;
		/** @type {HTMLElement} */
		this.element = this.createElement();
		/** @type {HTMLElement} */
		this.front = this.element.querySelector('.card-front');
		/** @type {HTMLElement} */
		this.back = this.element.querySelector('.card-back');
		/** @type {number} */
		this._smoothedFlip = 0;
		/** @type {number} */
		this._animId = 0;
	}

	createElement() {
		const card = document.createElement('div');
		card.classList.add('card');

		const front = document.createElement('div');
		front.classList.add('card-face', 'card-front');

		const back = document.createElement('div');
		back.classList.add('card-face', 'card-back');

		card.appendChild(front);
		card.appendChild(back);

		return card;
	}

	updateTransform() {
		const { center, rotation } = this.visualLoc;
		this.element.style.transform = `translate(-50%, -50%) translate(${center.x}px, ${center.y}px) rotate(${rotation}deg) rotateY(${this._smoothedFlip}deg)`;
	}

	/**
	 * Moves the card to a new location.
	 * @param {CardLoc} newLoc The new location.
	 * @param {Object} options
	 * @param {boolean} [options.animate=true] Whether to animate the movement.
	 */
	moveTo(newLoc, { animate = true } = {}) {
		this.logicalLoc.copy(newLoc);
		this.targetVisualLoc.copy(newLoc);
		if (animate) {
			this.animate();
		} else {
			this.visualLoc.copy(newLoc);
			this.updateTransform();
		}
	}

	flip() {
		this.flipped = !this.flipped;
		this.element.classList.toggle('is-flipped', this.flipped);
		this.animate();
	}

	/**
	 * Animates the card's movement.
	 * 
	 * This should be called any time the card's targetVisualLoc changes separately from its visualLoc.
	 * (Otherwise, you can just call updateTransform once.)
	 * 
	 * The animation loop will continue until the motion is settled.
	 * 
	 * This method is nearly idempotent. It won't start parallel animation loops, but will tick the animation forward each time it's called.
	 * (Maybe I could return instead of canceling the animation frame if it's already animating...)
	 * (Or if I make it use delta time, it also shouldn't matter if it's called many times, since repeated ticks would be super small.)
	 */
	animate() {
		if (this._animId) {
			cancelAnimationFrame(this._animId);
		}
		// Note: might want to wait to animate flip until after move animation is complete, in the future
		const targetFlip = this.flipped ? 180 : 0;
		const targetCenter = this.targetVisualLoc.center;
		const targetRotation = this.targetVisualLoc.rotation;

		// TODO: use delta time, and perhaps a different easing function
		// (Could use a CSS transition for flipping, but it would have to apply to the card faces (ugly) or a separate wrapper (ugly))
		this._smoothedFlip += (targetFlip - this._smoothedFlip) * this.FLIP_LERP_FACTOR;
		this.visualLoc.center.x += (targetCenter.x - this.visualLoc.center.x) * this.POSITION_LERP_FACTOR;
		this.visualLoc.center.y += (targetCenter.y - this.visualLoc.center.y) * this.POSITION_LERP_FACTOR;
		this.visualLoc.rotation += (targetRotation - this.visualLoc.rotation) * this.ROTATION_LERP_FACTOR;

		if (Math.abs(this._smoothedFlip - targetFlip) < 0.01) {
			this._smoothedFlip = targetFlip;
		}
		if (Math.abs(this.visualLoc.center.x - targetCenter.x) < 0.01) {
			this.visualLoc.center.x = targetCenter.x;
		}
		if (Math.abs(this.visualLoc.center.y - targetCenter.y) < 0.01) {
			this.visualLoc.center.y = targetCenter.y;
		}
		if (Math.abs(this.visualLoc.rotation - targetRotation) < 0.01) {
			this.visualLoc.rotation = targetRotation;
		}

		this.updateTransform();

		if (
			this._smoothedFlip !== targetFlip ||
			this.visualLoc.center.x !== targetCenter.x ||
			this.visualLoc.center.y !== targetCenter.y ||
			this.visualLoc.rotation !== targetRotation
		) {
			this._animId = requestAnimationFrame(() => this.animate());
		}
	}

	// Optional methods for subclasses. Defining here was the easiest way to get the type checking to work,
	// but it's not very sustainable.
	step() { }
	/** @param {-1|1} direction */
	walk(direction) { }
}

/**
 * Represents a playing card's position and orientation. A 2D oriented box with a fixed size.
 */
export class CardLoc {
	constructor(center = { x: 0, y: 0 }, rotation = 0) {
		/** @type {Point} */
		this.center = { x: 0, y: 0 };
		Object.assign(this.center, center);

		/** @type {number} */
		this.rotation = rotation; // in degrees

		// For safety, prevent re-assigning the center object
		// Otherwise subtle bugs can be introduced, e.g. `visualLoc.center = targetVisualLoc.center` to skip an animation might prevent all future animations
		const _center = this.center; // (don't want to use the `center` argument here, as reusing the object passed to the constructor would allow similar bugs)
		Object.defineProperty(this, 'center', {
			set: () => { throw new Error('Cannot re-assign center property. Use Object.assign to set x and y values to a new point.'); },
			get: () => _center, // (can't use `this.center` here, as it would recurse infinitely, calling the getter)
		});
	}

	/** @param {CardLoc} source */
	copy(source) {
		Object.assign(this.center, source.center);
		this.rotation = source.rotation;
	}

	/**
	 * @param {number} deltaDegrees The amount to rotate by, in degrees.
	 * @param {Point} [pivot=this.center] The point to rotate around.
	 * @returns {CardLoc} A new CardLoc with the rotation applied.
	 */
	getRotatedLoc(deltaDegrees, pivot = this.center) {
		const deltaRadians = deltaDegrees * Math.PI / 180;

		// Translate the card so that the pivot becomes the origin
		const translatedCenter = {
			x: this.center.x - pivot.x,
			y: this.center.y - pivot.y
		};

		// Rotate the translated center point
		const rotatedCenter = {
			x: translatedCenter.x * Math.cos(deltaRadians) - translatedCenter.y * Math.sin(deltaRadians),
			y: translatedCenter.x * Math.sin(deltaRadians) + translatedCenter.y * Math.cos(deltaRadians)
		};

		// Translate the rotated center back to the original coordinate system
		const newCenter = {
			x: rotatedCenter.x + pivot.x,
			y: rotatedCenter.y + pivot.y
		};

		return new CardLoc(newCenter, this.rotation + deltaDegrees);
	}

	/** @returns {[Point, Point, Point, Point]} */
	getCorners() {
		const rad = this.rotation * Math.PI / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);
		const cx = this.center.x;
		const cy = this.center.y;
		const corners = [
			{ x: -CARD_WIDTH / 2, y: -CARD_HEIGHT / 2 },
			{ x: CARD_WIDTH / 2, y: -CARD_HEIGHT / 2 },
			{ x: CARD_WIDTH / 2, y: CARD_HEIGHT / 2 },
			{ x: -CARD_WIDTH / 2, y: CARD_HEIGHT / 2 }
		];
		return asTupleOf4(corners.map(pt => ({
			x: cx + pt.x * cos - pt.y * sin,
			y: cy + pt.x * sin + pt.y * cos
		})));
	}

	/** @returns {[Edge, Edge, Edge, Edge]} */
	getEdges() {
		const corners = this.getCorners();
		return [
			[corners[0], corners[1]],
			[corners[1], corners[2]],
			[corners[2], corners[3]],
			[corners[3], corners[0]]
		];
	}

	/** 
	 * @returns {EdgeSnap[]} a list of locations where another card (of equal dimensions) can be snapped to this card.
	 * 
	 * For each side, there are two valid perpendicular snaps (aligning one corner, with an overhang on the opposite side),
	 * and one valid parallel snap (aligning two corners),
	 * plus equivalent snaps for half-turn (180 degree) rotations of the card to be snapped.
	 * By perpendicular snaps I mean snaps where the card is rotated 90 degrees from the card it's snapping to.
	 * The equivalent snaps are not included in the list. External code should allow 180 degree rotations.
	 */
	getSnaps() {
		/** @type {EdgeSnap[]} */
		const snaps = [];
		const edges = this.getEdges();
		for (const edge of edges) {
			const edgeMiddleX = (edge[0].x + edge[1].x) / 2;
			const edgeMiddleY = (edge[0].y + edge[1].y) / 2;
			const edgeLength = Math.hypot(edge[1].x - edge[0].x, edge[1].y - edge[0].y);
			const edgeNormalVector = {
				x: (edge[1].y - edge[0].y) / edgeLength,
				y: (edge[0].x - edge[1].x) / edgeLength,
			};
			const edgeTangentVector = {
				x: (edge[1].x - edge[0].x) / edgeLength,
				y: (edge[1].y - edge[0].y) / edgeLength,
			};
			// Parallel snap (no rotation)
			// There is only one because when the side lengths are equal,
			// aligning one corner or the other is equivalent, as they both line up at once.
			{
				const edgeNormalDist = edgeLength < CARD_MEAN_SIDE_LENGTH ? CARD_HEIGHT / 2 : CARD_WIDTH / 2;
				snaps.push(new EdgeSnap({
					center: {
						x: edgeMiddleX + edgeNormalVector.x * edgeNormalDist,
						y: edgeMiddleY + edgeNormalVector.y * edgeNormalDist
					},
					rotation: this.rotation,
					edge,
				}));
			}
			// Perpendicular snaps (90 degree rotation)
			// There are two because with differing side lengths, when aligning one corner,
			// the other corner must overhang on the opposite side.
			{
				const edgeTangentDist = (CARD_HEIGHT - CARD_WIDTH) / 2;
				const edgeNormalDist = edgeLength < CARD_MEAN_SIDE_LENGTH ? CARD_WIDTH / 2 : CARD_HEIGHT / 2;
				for (const sign of [-1, 1]) {
					snaps.push(new EdgeSnap({
						center: {
							x: edgeMiddleX + edgeNormalVector.x * edgeNormalDist + edgeTangentVector.x * sign * edgeTangentDist,
							y: edgeMiddleY + edgeNormalVector.y * edgeNormalDist + edgeTangentVector.y * sign * edgeTangentDist,
						},
						rotation: this.rotation + 90 * sign,
						edge,
					}));
				}
			}
		}
		return snaps;
	}

	/**
	 * Checks if this rectangle collides with another rectangle.
	 * @param {CardLoc} otherLoc Another card's oriented rectangle.
	 * @returns {boolean} Whether the rectangles overlap.
	 */
	collidesWith(otherLoc) {
		const verticesA = this.getCorners();
		const verticesB = otherLoc.getCorners();
		const centerA = this.center;
		const centerB = otherLoc.center;

		// Bounding circle check
		const distanceBetweenCenters = Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y);
		if (distanceBetweenCenters > CARD_BOUNDING_DIAMETER) {
			return false; // No collision if centers are too far apart
		}

		// Shrink vertices towards centers for slight leniency
		const leniency = 0.01;
		for (const vertex of verticesA) {
			vertex.x += (centerA.x - vertex.x) * leniency;
			vertex.y += (centerA.y - vertex.y) * leniency;
		}
		for (const vertex of verticesB) {
			vertex.x += (centerB.x - vertex.x) * leniency;
			vertex.y += (centerB.y - vertex.y) * leniency;
		}

		// Separating axis theorem (SAT) for collision detection
		/**
		 * @param {Point[]} verticesA
		 * @param {Point[]} verticesB
		 * @returns {boolean}
		 */
		function checkSeparatingAxis(verticesA, verticesB) {
			let siMinus = {
				x: verticesA[3].x - verticesA[0].x,
				y: verticesA[3].y - verticesA[0].y
			};

			for (let i = 0; i < verticesA.length; i++) {
				const siPlus = {
					x: verticesA[(i + 1) % 4].x - verticesA[i].x,
					y: verticesA[(i + 1) % 4].y - verticesA[i].y
				};
				const normal = { x: -siPlus.y, y: siPlus.x };
				const sgni = Math.sign(siMinus.x * normal.x + siMinus.y * normal.y);

				for (let j = 0; j < verticesB.length; j++) {
					const sij = {
						x: verticesB[j].x - verticesA[i].x,
						y: verticesB[j].y - verticesA[i].y
					};
					const sgnj = Math.sign(sij.x * normal.x + sij.y * normal.y);
					if (sgni * sgnj > 0) break; // No separating axis, continue
					if (j === 3) return false; // Separating axis exists, no collision
				}

				// Update siMinus
				siMinus = { x: -siPlus.x, y: -siPlus.y };
			}

			return true; // No separating axis found
		}

		// Check for both rectangles
		return checkSeparatingAxis(verticesA, verticesB) && checkSeparatingAxis(verticesB, verticesA);
	}
}

export class EdgeSnap extends CardLoc {
	/**
	 * @param {Object} options
	 * @param {Point} options.center
	 * @param {number} options.rotation
	 * @param {Edge} options.edge
	 */
	constructor({ center, rotation, edge }) {
		super(center, rotation);
		/** @type {Edge} */
		this.edge = edge;
	}
}

export class CombinedSnap extends CardLoc {
	/**
	 * @param {Object} options
	 * @param {Point} options.center
	 * @param {number} options.rotation
	 * @param {Edge[]} options.edges
	 */
	constructor({ center, rotation, edges }) {
		super(center, rotation);
		/** @type {Edge[]} */
		this.edges = edges;
	}
}


// Should I use composition instead of inheritance?
// It feels like "StandardPlayingCard" should be a "Card" if named as such,
// but thinking about adding more types, it might make more sense to have a Player that owns a Card, rather than a PlayerCard that is a Card, etc.
export class StandardPlayingCard extends Card {
	/**
	 * @param {'♠'|'♥'|'♦'|'♣'} suit
	 * @param {'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'} value
	 */
	constructor(suit, value) {
		super();

		/** @type {'♠'|'♥'|'♦'|'♣'} */
		this.suit = suit;
		/** @type {'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'} */
		this.value = value;

		this.front.style.color = (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black';
		this.front.textContent = `${this.value}${this.suit}`;
	}
}

export class RollerCard extends Card {
	constructor(deltaAngle = 45) {
		super();

		this.deltaAngle = deltaAngle;

		this.renderFront();
	}

	renderFront() {
		this.front.style.color = 'purple';
		const a = this.deltaAngle;
		this.front.textContent = Math.abs(a) === 90 ? (a > 0 ? "↱" : "↰") : (a > 0 ? "↻" : "↺");
	}

	step() {
		const cards = getAllCards();
		// const snap = findSnap(this.logicalLoc, this);
		const pivots = this.logicalLoc.getCorners();
		// Allow pivoting on edge as well
		for (const edge of this.logicalLoc.getEdges()) {
			// Only three fractions are possible with cards with a ratio of 2:3, corresponding to the corners of other cards that might be present along the edge.
			// In fact, depending on the edge length, only the half or only the third fractions might be possible. I could differentiate...
			// But this might be better implemented by actually looking at the cards present for corner pivots. I just don't want to think about doing that (efficiently) right now.
			pivots.push(alongLine(edge, 1 / 2));
			pivots.push(alongLine(edge, 2 / 3));
			pivots.push(alongLine(edge, 1 / 3));
		}
		for (const pivot of pivots) {

			// Check that pivot is anchored to another card
			// (Some old, more strict behaviors commented out.)
			// Most strict: corner of roller on a card's corner
			// if (!snap?.edges.some(edge => edge.some(point => Math.hypot(point.x - corner.x, point.y - corner.y) < 1))) {
			// 	continue;
			// }
			// Medium strict: corner of roller on a card's edge
			// if (!cards.some((card) => card !== this && card.logicalLoc.getCorners().some((corner2) => Math.hypot(corner2.x - corner.x, corner2.y - corner.y) < 1))) {
			// 	continue;
			// }
			// Most lenient: roller's edge on a card's edge
			if (!cards.some((card) => card !== this && card.logicalLoc.getEdges().some((edge) => {
				const closestPoint = closestPointOnLineSegment(pivot, edge);
				return Math.hypot(closestPoint.x - pivot.x, closestPoint.y - pivot.y) < 1;
			}))) {
				continue;
			}

			const rotatedLoc = this.logicalLoc.getRotatedLoc(this.deltaAngle, pivot);

			// Check if the rotation is valid
			if (!findCollisions(rotatedLoc, this).length) {
				// TODO: improve animation; right now position and rotation are animated separately...
				// but I really want the center position to go in a slight arc, not a straight line
				// (I want the pivot to stay anchored.)
				// I could use similar logic for this rotation, with smaller steps, but I'm not sure how to best integrate it with the existing animation system.
				this.moveTo(rotatedLoc);
				return;
			}
		}
		// Disable roller card when it can't move
		// this.flip();
		// Or, reverse direction
		this.deltaAngle *= -1;
		this.renderFront();
	}
}

export class PlayerCard extends Card {
	constructor() {
		super();

		this.renderFront();
	}

	renderFront() {
		this.front.style.color = 'red';
		this.front.textContent = "𖨆";
	}

	/**
	 * @TODO DRY with RollerCard
	 * @param {Point} point 
	 * @returns {boolean} Whether a card's edge or corner exists at the given point (ignoring this card).
	 */
	groundAt(point, cards = getAllCards()) {
		return cards.some((card) => card !== this && card.logicalLoc.getEdges().some((edge) => {
			const closestPoint = closestPointOnLineSegment(point, edge);
			return Math.hypot(closestPoint.x - point.x, closestPoint.y - point.y) < 1;
		}));
	}

	/**
	 * @NOTE This method is not used for pivoting over corners, only for walking.
	 * @param {CardLoc} newLoc
	 * @returns {boolean} Whether the card can move to the given location.
	 */
	walkable(newLoc) {
		if (findCollisions(newLoc, this).length) {
			return false;
		}
		const downAngle = this.logicalLoc.rotation + 90;
		const newFooting = {
			x: newLoc.center.x + Math.cos(downAngle * Math.PI / 180) * CARD_HEIGHT / 2,
			y: newLoc.center.y + Math.sin(downAngle * Math.PI / 180) * CARD_HEIGHT / 2,
		};
		return this.groundAt(newFooting);
	}

	/**
	 * @param {-1|1} direction 
	 */
	walk(direction) {
		const walkDistance = 50;
		const walkAngle = this.logicalLoc.rotation;
		const dx = walkDistance * Math.cos(walkAngle * Math.PI / 180) * direction;
		const dy = walkDistance * Math.sin(walkAngle * Math.PI / 180) * direction;
		const forwardCenter = { x: this.logicalLoc.center.x + dx, y: this.logicalLoc.center.y + dy };
		const forwardLoc = new CardLoc(forwardCenter, this.logicalLoc.rotation);
		if (this.walkable(forwardLoc)) {
			this.moveTo(forwardLoc);
			return;
		}

		// Step up/down if there's a step
		// TODO: find arbitrary step up/down height within margins
		// See https://github.com/1j01/janitorial-android/blob/62acc45bc896c4b02e495751dce5bff401987475/src/game.js#L4097-L4152
		// TODO: disable step down as a means to jump gaps while upside down (a sort of handstand jumping trick)
		// perhaps by ensuring the player's bottom edge is on the ground before stepping down
		{
			const upAngle = walkAngle - 90;
			const downAngle = walkAngle + 90;
			const stepUpLoc = new CardLoc({
				x: forwardCenter.x + Math.cos(upAngle * Math.PI / 180) * CARD_HEIGHT / 3,
				y: forwardCenter.y + Math.sin(upAngle * Math.PI / 180) * CARD_HEIGHT / 3,
			}, this.logicalLoc.rotation);
			const stepDownLoc = new CardLoc({
				x: forwardCenter.x + Math.cos(downAngle * Math.PI / 180) * CARD_HEIGHT / 3,
				y: forwardCenter.y + Math.sin(downAngle * Math.PI / 180) * CARD_HEIGHT / 3,
			}, this.logicalLoc.rotation);

			if (this.walkable(stepUpLoc)) {
				this.moveTo(stepUpLoc);
				return;
			}
			if (this.walkable(stepDownLoc)) {
				this.moveTo(stepDownLoc);
				return;
			}
		}

		// TODO: try to rotate upright before rolling forward
		// TODO (maybe related): avoid rotating to where the player is only touching a corner
		// (maybe try translating backward along the edge that the pivot is on, after rotating?
		// uh... if the pivot is a corner, would have to find the correct edge...)

		// TODO: DRY with RollerCard
		const pivots = this.logicalLoc.getCorners();
		// Allow pivoting on edge as well
		for (const edge of this.logicalLoc.getEdges()) {
			// Only three fractions are possible with cards with a ratio of 2:3, corresponding to the corners of other cards that might be present along the edge.
			// In fact, depending on the edge length, only the half or only the third fractions might be possible. I could differentiate...
			// But this might be better implemented by actually looking at the cards present for corner pivots. I just don't want to think about doing that (efficiently) right now.
			pivots.push(alongLine(edge, 1 / 2));
			pivots.push(alongLine(edge, 2 / 3));
			pivots.push(alongLine(edge, 1 / 3));
		}
		for (const pivot of pivots) {
			if (!this.groundAt(pivot)) {
				continue;
			}

			const rotatedLoc = this.logicalLoc.getRotatedLoc(45 * direction, pivot);

			if (!findCollisions(rotatedLoc, this).length) {
				// TODO: anchor the pivot point during animation
				this.moveTo(rotatedLoc);
				return;
			}
		}

		// Animate "bump" if no move is possible
		// Could _perhaps_ improve this with an animation queue, so it can animate forwards and then backwards,
		// although smoother isn't always better. It actually looks pretty good already.
		// Could also DRY by adding a getTranslatedLoc method to CardLoc and maybe a helper function to get a rotated point
		// or a vector math library...
		{
			const bumpDistance = 10;
			const dx = bumpDistance * Math.cos(walkAngle * Math.PI / 180) * direction;
			const dy = bumpDistance * Math.sin(walkAngle * Math.PI / 180) * direction;
			const newCenter = { x: this.logicalLoc.center.x + dx, y: this.logicalLoc.center.y + dy };
			const newLoc = new CardLoc(newCenter, this.logicalLoc.rotation);
			this.visualLoc.copy(newLoc);
			this.animate();
		}
	}
}

export class FractalCard extends Card {
	constructor() {
		super();

		this.element.classList.add('fractal-card');
		this.front.style.color = 'green';
		this.front.textContent = '∞';
	}

	getSpawnLocations() {
		// Simple Diamond
		// return this.logicalLoc.getSnaps().filter(snap => snap.rotation === this.logicalLoc.rotation);

		// Symmetrical for first iteration, but not for subsequent iterations
		// due to collisions
		// return this.logicalLoc.getCorners().map(corner => this.logicalLoc.getRotatedLoc(90, corner));

		// Asymmetrical but kinda cool, creates arrow patterns in negative space that remind me of Conway's Game of Life
		// return this.logicalLoc.getCorners().map(corner => this.logicalLoc.getRotatedLoc(90, corner)).slice(0, 3);

		// Symmetrical braid-like pattern. Every other iteration is a rectangle or a square, overall, in both cases with a 5:1 slant.
		return this.logicalLoc.getCorners().filter((_, index) => index % 2 === 0).map(corner => this.logicalLoc.getRotatedLoc(90, corner)).slice(0, 3)
	}

	step() {
		for (const spawnLoc of this.getSpawnLocations()) {
			if (!findCollisions(spawnLoc, this).length) {
				// TODO: clean way for cards to create new cards
				const newCard = new FractalCard();
				newCard.moveTo(this.logicalLoc, { animate: false });
				newCard.moveTo(spawnLoc, { animate: true });
				cardByElement.set(newCard.element, newCard);
				// gameContainer.appendChild(newCard.element);
				// Insert so the new card is visually below the originating card.
				// This gives a more convincing effect, where you can imagine (infinite) cards were hidden behind the fractal card.
				gameContainer.prepend(newCard.element);
			} else {
				// Debug visualization
				// This helps clarify why asymmetry is introduced.
				const newCard = new Card();
				newCard.element.classList.add("location-visualization");
				newCard.moveTo(this.logicalLoc, { animate: false });
				newCard.moveTo(spawnLoc, { animate: true });
				cardByElement.set(newCard.element, newCard);
				gameContainer.appendChild(newCard.element);
			}
		}
		// Disable the fractal card after one use
		this.flip();
	}
}


// Tests

function testCardLoc() {
	const centerArg = { x: 100, y: 200 };
	const rotationArg = 45;
	const loc = new CardLoc(centerArg, rotationArg);
	console.assert(loc.center.x === centerArg.x);
	console.assert(loc.center.y === centerArg.y);
	console.assert(loc.rotation === rotationArg);
	console.assert(loc.center !== centerArg);
}

testCardLoc();
