
function shuffleArray(array) {
	for (let i = array.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function mod(n, m) {
	return ((n % m) + m) % m;
}

/**
 * Calculate the shortest signed difference between two angles.
 * @param {number} currentAngle A starting angle in degrees.
 * @param {number} targetAngle An ending angle in degrees.
 * @returns {number} The signed difference between the angles in degrees.
 * @see https://stackoverflow.com/a/69593373/2624876
 */
function angleDifference(currentAngle, targetAngle) {
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
 * @param {Point} point 
 * @param {Edge} lineSegment
 * @returns {Point} The point on the line segment closest to the given point.
 */
function closestPointOnLineSegment(point, lineSegment) {
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
