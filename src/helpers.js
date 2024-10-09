
/**
 * @param {Array<any>} array
 */
export function shuffleArray(array) {
	for (let i = array.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

/**
 * @param {number} n
 * @param {number} m
 * @returns {number} The remainder of n divided by m, always in the range [0, m).
 */
export function mod(n, m) {
	return ((n % m) + m) % m;
}

/**
 * Calculate the shortest signed difference between two angles.
 * @param {number} currentAngle A starting angle in degrees.
 * @param {number} targetAngle An ending angle in degrees.
 * @returns {number} The signed difference between the angles in degrees.
 * @see https://stackoverflow.com/a/69593373/2624876
 */
export function angleDifference(currentAngle, targetAngle) {
	// Subtract the angles, constraining the value to [0, 360)
	let diff = mod(targetAngle - currentAngle, 360);

	// If we are more than 180 we're taking the long way around.
	// Let's instead go in the shorter, negative direction.
	if (diff > 180) {
		diff = -(360 - diff);
	}
	return diff;
}

/**
 * @param {import("./Card").Point} point 
 * @param {import("./Card").Edge} lineSegment
 * @returns {import("./Card").Point} The point on the line segment closest to the given point.
 */
export function closestPointOnLineSegment(point, lineSegment) {
	// https://stackoverflow.com/a/3122532/2624876
	const [a, b] = lineSegment;
	const a_to_p = { x: point.x - a.x, y: point.y - a.y };
	const a_to_b = { x: b.x - a.x, y: b.y - a.y };
	const atb2 = a_to_b.x ** 2 + a_to_b.y ** 2;
	const atp_dot_atb = a_to_p.x * a_to_b.x + a_to_p.y * a_to_b.y;
	let t = atp_dot_atb / atb2;
	t = Math.max(0, Math.min(1, t)); // remove this line to treat as infinite line
	return { x: a.x + a_to_b.x * t, y: a.y + a_to_b.y * t };
}

/**
 * @param {import("./Card").Edge} line
 * @param {number} fraction A fraction of the distance along the line
 * @returns {import("./Card").Point} A point on the line. If the fraction is within 0-1, the point is within the line segment.
 */
export function alongLine(line, fraction) {
	const [a, b] = line;
	return {
		x: a.x + (b.x - a.x) * fraction,
		y: a.y + (b.y - a.y) * fraction
	};
}

/**
 * Asserts that an array is a tuple of exactly 4 elements of the same type.
 * 
 * @template T
 * @param {readonly T[]} arr  The array to assert as a tuple of length 4
 * @throws {Error}  If the array length is not 4
 * @returns {asserts arr is [T, T, T, T]}
 */
export function assertTupleOf4(arr) {
	if (arr.length !== 4) {
		throw new Error(`Expected array of length 4, but got length ${arr.length}`);
	}
}

/**
 * Asserts that an array is a tuple of exactly 4 elements of the same type and returns the array.
 * 
 * @template T
 * @param {readonly T[]} arr  The array to assert as a tuple of length 4
 * @throws {Error}  If the array length is not 4
 * @returns {[T, T, T, T]}  The same array, now typed as a tuple of exactly 4 elements
 */
export function asTupleOf4(arr) {
	assertTupleOf4(arr);
	return arr;
}
