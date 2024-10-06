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
class Card {
	FLIP_LERP_FACTOR = 0.1;

	constructor(suit, value) {
		/** @type {'♠'|'♥'|'♦'|'♣'} */
		this.suit = suit;
		/** @type {'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'} */
		this.value = value;
		/** @type {CardLoc} */
		this.loc = new CardLoc();
		/** @type {boolean} */
		this.flipped = false;
		/** @type {HTMLElement} */
		this.element = this.createElement();
		/** @type {number} */
		this._smoothedFlip = 0
		/** @type {number} */
		this._animId = 0
	}

	createElement() {
		const card = document.createElement('div');
		card.classList.add('card');

		const front = document.createElement('div');
		front.classList.add('card-face', 'card-front');
		front.style.color = (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black';
		front.textContent = `${this.value}${this.suit}`;

		const back = document.createElement('div');
		back.classList.add('card-face', 'card-back');

		card.appendChild(front);
		card.appendChild(back);

		return card;
	}

	updateTransform() {
		const { center, rotation } = this.loc;
		this.element.style.transform = `translate(-50%, -50%) translate(${center.x}px, ${center.y}px) rotate(${rotation}deg) rotateY(${this._smoothedFlip}deg)`;
	}

	/** @param {number} deltaDegrees */
	rotate(deltaDegrees) {
		this.loc.rotation = (this.loc.rotation + deltaDegrees + 360) % 360;
		this.updateTransform();
	}

	/** @param {Point} newCenter */
	setPosition(newCenter) {
		this.loc.center = newCenter;
		this.updateTransform();
	}

	flip() {
		this.flipped = !this.flipped;
		this.element.classList.toggle('is-flipped', this.flipped);
		if (this._animId) {
			cancelAnimationFrame(this._animId)
		}
		const animateFlip = () => {
			const target = this.flipped ? 180 : 0;
			// TODO: use delta time, and perhaps a different easing function
			// (Could use a CSS transition, but it would have to apply to the card faces (ugly) or a separate wrapper (ugly))
			this._smoothedFlip += (target - this._smoothedFlip) * this.FLIP_LERP_FACTOR;
			if (Math.abs(this._smoothedFlip - target) < 0.01) {
				this._smoothedFlip = target;
			}
			this.updateTransform();
			if (this._smoothedFlip !== target) {
				this._animId = requestAnimationFrame(animateFlip);
			}
		}
		animateFlip();
	}
}

/**
 * Represents a playing card's position and orientation. A 2D oriented bounding box.
 * 
 * (Might want to dissolve this into a typedef...)
 */
class CardLoc {
	constructor(center = { x: 0, y: 0 }, rotation = 0) {
		/** @type {Point} */
		this.center = center;
		/** @type {number} */
		this.rotation = rotation; // in degrees
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
		return corners.map(pt => ({
			x: cx + pt.x * cos - pt.y * sin,
			y: cy + pt.x * sin + pt.y * cos
		}));
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
	 * @returns {EdgeSnap[]} a list of snapping positions
	 * relative to this card's edges, assuming the same dimensions for the card to be snapped.
	 * For each side, there are two valid perpendicular snaps (aligning one corner, with an overhang),
	 * and one valid parallel snap (aligning two corners),
	 * plus equivalent snaps for half-turn (180 degree) rotations of the card to be snapped.
	 */
	getSnaps() {
		const snaps = [];
		const edges = this.getEdges();
		edges.forEach(edge => {
			const midX = (edge[0].x + edge[1].x) / 2;
			const midY = (edge[0].y + edge[1].y) / 2;
			const edgeLength = Math.hypot(edge[1].x - edge[0].x, edge[1].y - edge[0].y);
			const perpendicular = {
				x: (edge[1].y - edge[0].y) / edgeLength,
				y: (edge[0].x - edge[1].x) / edgeLength,
			};
			// parallel snap
			// TODO: rename dist, mixedDist, anotherDist
			const dist = edgeLength < CARD_MEAN_SIDE_LENGTH ? CARD_HEIGHT / 2 : CARD_WIDTH / 2;
			snaps.push(new EdgeSnap({
				center: { x: midX + perpendicular.x * dist, y: midY + perpendicular.y * dist },
				rotation: this.rotation,
				edge,
			}));
			// perpendicular snaps
			const mixedDist = (CARD_HEIGHT - CARD_WIDTH) / 2;
			const parallel = {
				x: (edge[1].x - edge[0].x) / edgeLength,
				y: (edge[1].y - edge[0].y) / edgeLength
			};
			const anotherDist = edgeLength < CARD_MEAN_SIDE_LENGTH ? CARD_WIDTH / 2 : CARD_HEIGHT / 2;
			[-1, 1].forEach(sign => {
				snaps.push(new EdgeSnap({
					center: {
						x: midX + perpendicular.x * anotherDist + parallel.x * sign * mixedDist,
						y: midY + perpendicular.y * anotherDist + parallel.y * sign * mixedDist,
					},
					// rotation: this.rotation + 90 * sign,
					rotation: (this.rotation + 90) % 360,
					edge,
				}));
			});

		});
		return snaps;
	}

	/**
	 * Checks if this rectangle collides with another rectangle.
	 * @param {CardLoc} otherPosition The other card's oriented rectangle.
	 * @returns {boolean} Whether this card collides with the other card.
	 */
	collidesWith(otherPosition) {
		const verticesA = this.getCorners();
		const verticesB = otherPosition.getCorners();
		const centerA = this.center;
		const centerB = otherPosition.center;

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

class EdgeSnap extends CardLoc {
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

class CombinedSnap extends CardLoc {
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

// window.Card = Card;
// window.CardLoc = CardLoc;
// window.EdgeSnap = EdgeSnap;
// window.CombinedSnap = CombinedSnap;
