
/**
 * @typedef {{x: number, y: number}} Point
 * @typedef {[Point, Point]} Edge
 * @typedef {{center: Point, rotation: number}} CardPosition
 */

/**
 * Represents a playing card.
 */
class Card {
	constructor(suit, value, center = { x: 0, y: 0 }, rotation = 0) {
		/** @type {'♠'|'♥'|'♦'|'♣'} */
		this.suit = suit;
		/** @type {'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'} */
		this.value = value;
		/** @type {Point} */
		this.center = center;
		/** @type {number} */
		this.rotation = rotation; // in degrees
		/** @type {boolean} */
		this.flipped = false;
		/** @type {HTMLElement} */
		this.element = this.createElement();
	}

	createElement() {
		// Note: it may be better to separate card rendering from card placement logic,
		// possibly with a CardPosition class for the placement logic (which might also be used for the return value of getSnaps()).
		// or simply exposing elements for the front and back of the card, to be populated externally.

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
	 * @TODO: find perpendicular snaps
	 * @returns {CardPosition[]} a list of snapping positions
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
				y: (edge[0].x - edge[1].x) / edgeLength
			};
			// parallel snap
			const dist = edgeLength < 125 ? 150 / 2 : 100 / 2;
			snaps.push({
				center: { x: midX + perpendicular.x * dist, y: midY + perpendicular.y * dist },
				rotation: this.rotation,
				edge,
			});
		});
		return snaps;
	}

	updatePosition() {
		this.element.style.transform = `translate(-50%, -50%) translate(${this.center.x}px, ${this.center.y}px) rotate(${this.rotation}deg)`;
	}

	/** @param {number} deltaDegrees */
	rotate(deltaDegrees) {
		this.rotation = (this.rotation + deltaDegrees + 360) % 360;
		this.updatePosition();
	}

	/** @param {Point} newCenter */
	setPosition(newCenter) {
		this.center = newCenter;
		this.updatePosition();
	}

	flip() {
		this.flipped = !this.flipped;
		this.element.classList.toggle('is-flipped', this.flipped);
	}
}

window.Card = Card;
