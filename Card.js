
/**
 * @typedef {{x: number, y: number}} Point
 * @typedef {[Point, Point]} Edge
 */

/**
 * Represents a playing card.
 */
class Card {
	constructor(value, suit) {
		/** @type {'♠'|'♥'|'♦'|'♣'} */
		this.suit = suit;
		/** @type {'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'} */
		this.value = value;
		/** @type {CardPosition} */
		this.position = new CardPosition();
		/** @type {boolean} */
		this.flipped = false;
		/** @type {HTMLElement} */
		this.element = this.createElement();
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

	updatePosition() {
		const { center, rotation } = this.position;
		this.element.style.transform = `translate(-50%, -50%) translate(${center.x}px, ${center.y}px) rotate(${rotation}deg)`;
	}

	/** @param {number} deltaDegrees */
	rotate(deltaDegrees) {
		this.position.rotation = (this.position.rotation + deltaDegrees + 360) % 360;
		this.updatePosition();
	}

	/** @param {Point} newCenter */
	setPosition(newCenter) {
		this.position.center = newCenter;
		this.updatePosition();
	}

	flip() {
		this.flipped = !this.flipped;
		this.element.classList.toggle('is-flipped', this.flipped);
	}
}

/**
 * Represents a playing card's position and orientation. A 2D oriented bounding box.
 * 
 * (Might want to dissolve this into a typedef...)
 */
class CardPosition {
	constructor(center = { x: 0, y: 0 }, rotation = 0) {
		/** @type {Point} */
		this.center = center;
		/** @type {number} */
		this.rotation = rotation; // in degrees
	}

	/** @returns {[Point, Point, Point, Point]} */
	getCorners() {
		const width = 100;
		const height = 150;
		const rad = this.rotation * Math.PI / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);
		const cx = this.center.x;
		const cy = this.center.y;
		const corners = [
			{ x: -width / 2, y: -height / 2 },
			{ x: width / 2, y: -height / 2 },
			{ x: width / 2, y: height / 2 },
			{ x: -width / 2, y: height / 2 }
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
			const dist = edgeLength < 125 ? 150 / 2 : 100 / 2;
			snaps.push(new EdgeSnap({
				center: { x: midX + perpendicular.x * dist, y: midY + perpendicular.y * dist },
				rotation: this.rotation,
				edge,
			}));
			// perpendicular snaps
			const mixedDist = (150 - 100) / 2;
			const parallel = {
				x: (edge[1].x - edge[0].x) / edgeLength,
				y: (edge[1].y - edge[0].y) / edgeLength
			};
			const anotherDist = edgeLength < 125 ? 150 - 100 : 150 / 2;
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
}

class EdgeSnap extends CardPosition {
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

class CombinedSnap extends CardPosition {
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
// window.CardPosition = CardPosition;
// window.EdgeSnap = EdgeSnap;
// window.CombinedSnap = CombinedSnap;
