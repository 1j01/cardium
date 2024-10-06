
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
