const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Canvas configuration
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let width = canvas.width;
let height = canvas.height;

// Complex plane bounds
let minX = -3, maxX = 3, minY = -3, maxY = 3;
let maxIter = 250;
let resolutionFactor = 8;

// Variables for moving and zooming
let isDragging = false;
let dragStart = { x: 0, y: 0 };

let lastTouchDistance = 0;
let lastTouchCenter = null;
let isTouchDragging = false;
let lastTouchPosition = null;

let offsetX = 0, offsetY = 0;
let zoomFactor = 1;
let zoomCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// Parse equation input
const controls = document.getElementById('controls');
const equationInput = document.getElementById('equation');
const applyButton = document.getElementById('apply');

// Sliders
const maxIterSlider = document.getElementById('maxIterSlider');
const maxIterValue = document.getElementById('maxIterValue');
const resolutionFactorSlider = document.getElementById('resolutionFactorSlider');
const resolutionFactorValue = document.getElementById('resolutionFactorValue');

// Default Julia set function
let juliaFunction = (z) => math.add(math.multiply(z, z), math.complex(0.355, 0.355));

// Add listeners
applyButton.addEventListener('click', () => {
	try {
		let equationText = equationInput.value;

		localStorage.setItem('equation', equationText);

		const compiledEquation = math.compile(equationText);
		juliaFunction = (z) => compiledEquation.evaluate({ z: z });

		resetView();
	} catch (e) {
		alert("Error in the function entered. Make sure the equation is valid.");
	}
});

// Update maxIter and resolutionFactor on slider change
maxIterSlider.addEventListener('input', () => {
	maxIter = parseInt(maxIterSlider.value);
	maxIterValue.textContent = maxIter;
	localStorage.setItem('maxIter', maxIter);
	computeColorPalette()
	computeJuliaSet();
});

resolutionFactorSlider.addEventListener('input', () => {
	resolutionFactor = parseInt(resolutionFactorSlider.value);
	resolutionFactorValue.textContent = resolutionFactor;
	localStorage.setItem('resolutionFactor', resolutionFactor);  
	computeJuliaSet();
});

// Convert pixel to complex number
function pixelToComplex(x, y) {
	return math.complex(
		minX + (x / width) * (maxX - minX) + offsetX,
		minY + (y / height) * (maxY - minY) + offsetY
	);
}

// Compute color palette
let colorPalette = [];

function computeColorPalette() {
	colorPalette = Array.from({ length: maxIter }, (_, iter) => {
		const t = iter / Math.sqrt(maxIter);
		const s = iter / (maxIter);
		return [
			Math.floor(9 * (1 - t) * t * t * t * 255),
			Math.floor(15 * (1 - s) * (1 - s) * s * s * 255),
			Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * s * 255)
		];
	});
	colorPalette[maxIter] = [0, 0, 0];
}

function adjustComplexBounds() {
	const aspectRatio = width / height;
	if (aspectRatio > 1) {
		const rangeX = maxX - minX;
		const centerY = (minY + maxY) / 2;
		const rangeY = rangeX / aspectRatio;
		minY = centerY - rangeY / 2;
		maxY = centerY + rangeY / 2;
	} else {
		const rangeY = maxY - minY;
		const centerX = (minX + maxX) / 2;
		const rangeX = rangeY * aspectRatio;
		minX = centerX - rangeX / 2;
		maxX = centerX + rangeX / 2;
	}
}

// Julia set calculation
function computeJuliaSet() {
	adjustComplexBounds();
	const lowResWidth = Math.floor(width / resolutionFactor);
	const lowResHeight = Math.floor(height / resolutionFactor);
	const imageData = ctx.createImageData(lowResWidth, lowResHeight);

	for (let px = 0; px < lowResWidth; px++) {
		for (let py = 0; py < lowResHeight; py++) {
			const z = pixelToComplex(
				px * resolutionFactor,
				py * resolutionFactor
			);

			let iteration = 0;
			let value = z;

			while (math.abs(value) <= 2 && iteration < maxIter) {
				value = juliaFunction(value);
				iteration++;
			}

			// const colorPalette = computeColorPalette();
			const color = iteration === maxIter ? [0, 0, 0] : colorPalette[iteration];

			const index = (px + py * lowResWidth) * 4;
			imageData.data[index] = color[0];
			imageData.data[index + 1] = color[1];
			imageData.data[index + 2] = color[2];
			imageData.data[index + 3] = 255; // Alpha channel
		}
	}

	// Scale up to full resolution
	const scaledCanvas = document.createElement('canvas');
	scaledCanvas.width = lowResWidth;
	scaledCanvas.height = lowResHeight;
	scaledCanvas.getContext('2d').putImageData(imageData, 0, 0);

	ctx.clearRect(0, 0, width, height);
	ctx.drawImage(scaledCanvas, 0, 0, width, height);
}

function getDistance(touch1, touch2) {
	return Math.sqrt(
		Math.pow(touch2.clientX - touch1.clientX, 2) +
		Math.pow(touch2.clientY - touch1.clientY, 2)
	);
}

function getTouchCenter(touch1, touch2) {
	return {
		x: (touch1.clientX + touch2.clientX) / 2,
		y: (touch1.clientY + touch2.clientY) / 2,
	};
}

// Reset view and redraw
function resetView() {
	minX = -3, maxX = 3, minY = -3, maxY = 3;
	computeColorPalette();
	computeJuliaSet();
}

// Adjust canvas on resize
window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	width = canvas.width;
	height = canvas.height;
	computeJuliaSet();
});

// Mouse move, drag, and zoom handlers
canvas.addEventListener('touchstart', (e) => {
	if (e.touches.length === 1) {
		resolutionFactor = Math.max(resolutionFactor, 16);
		isTouchDragging = true;
		lastTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	} else if (e.touches.length === 2) {
		resolutionFactor = Math.max(resolutionFactor, 16);
		lastTouchDistance = getDistance(e.touches[0], e.touches[1]);
		lastTouchCenter = getTouchCenter(e.touches[0], e.touches[1]);
	}
});

canvas.addEventListener('touchmove', (e) => {
	e.preventDefault();

	if (e.touches.length === 1 && isTouchDragging) {
		const dx = e.touches[0].clientX - lastTouchPosition.x;
		const dy = e.touches[0].clientY - lastTouchPosition.y;

		const rangeX = maxX - minX;
		const rangeY = maxY - minY;

		const deltaX = (dx / width) * rangeX;
		const deltaY = (dy / height) * rangeY;

		minX -= deltaX;
		maxX -= deltaX;
		minY -= deltaY;
		maxY -= deltaY;

		lastTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };

		computeJuliaSet();
	} else if (e.touches.length === 2) {
		const currentDistance = getDistance(e.touches[0], e.touches[1]);
		const scale = lastTouchDistance > 0 ? currentDistance / lastTouchDistance : 1;

		if (scale !== 1) {
			const center = getTouchCenter(e.touches[0], e.touches[1]);
			const zoomX = minX + (center.x / width) * (maxX - minX);
			const zoomY = minY + (center.y / height) * (maxY - minY);

			minX = zoomX + (minX - zoomX) / scale;
			maxX = zoomX + (maxX - zoomX) / scale;
			minY = zoomY + (minY - zoomY) / scale;
			maxY = zoomY + (maxY - zoomY) / scale;

			lastTouchDistance = currentDistance;

			computeJuliaSet();
		}
	}
});

canvas.addEventListener('touchend', (e) => {
	if (e.touches.length === 0) {
		isTouchDragging = false;
		lastTouchDistance = 0;
		lastTouchCenter = null;
		lastTouchPosition = null;
		resolutionFactor = parseInt(resolutionFactorSlider.value);
	}
});

canvas.addEventListener('mousedown', (e) => {
	if (e.button === 0) {
		isDragging = true;
		dragStart = { x: e.clientX, y: e.clientY };
	}
});

canvas.addEventListener('mousemove', (e) => {
	if (isDragging) {
		resolutionFactor = Math.max(resolutionFactor, 16);
		const dx = e.clientX - dragStart.x;
		const dy = e.clientY - dragStart.y;

		const rangeX = maxX - minX;
		const rangeY = maxY - minY;

		const deltaX = (dx / width) * rangeX;
		const deltaY = (dy / height) * rangeY;

		minX -= deltaX;
		maxX -= deltaX;
		minY -= deltaY;
		maxY -= deltaY;

		dragStart = { x: e.clientX, y: e.clientY };
		
		computeJuliaSet();
	}
});

canvas.addEventListener('mouseup', () => {
	isDragging = false;
	resolutionFactor = parseInt(resolutionFactorSlider.value);
	computeJuliaSet();
});

canvas.addEventListener('wheel', (e) => {
	e.preventDefault();
	const scale = e.deltaY < 0 ? 0.95 : 1.05;

	// Zoom centered on the mouse position
	const mouseX = e.clientX;
	const mouseY = e.clientY;
	const zoomX = minX + (mouseX / width) * (maxX - minX);
	const zoomY = minY + (mouseY / height) * (maxY - minY);

	minX = zoomX + (minX - zoomX) * scale;
	maxX = zoomX + (maxX - zoomX) * scale;
	minY = zoomY + (minY - zoomY) * scale;
	maxY = zoomY + (maxY - zoomY) * scale;

	computeJuliaSet();
});

// Map iteration to color
function colorMapping(iter) {
	const t = iter / maxIter;
	return [
		Math.floor(9 * (1 - t) * t * t * t * 255),
		Math.floor(15 * (1 - t) * (1 - t) * t * t * 255),
		Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255)
	];
}

// Adjust canvas on resize
window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	width = canvas.width;
	height = canvas.height;
	computeJuliaSet();
});

window.addEventListener('load', () => {
	const savedMaxIter = localStorage.getItem('maxIter');
	const savedResolutionFactor = localStorage.getItem('resolutionFactor');
	const savedEquation = localStorage.getItem('equation');

	if (savedMaxIter) {
		maxIter = parseInt(savedMaxIter);
		maxIterSlider.value = maxIter;
		maxIterValue.textContent = maxIter;
	}

	if (savedResolutionFactor) {
		resolutionFactor = parseInt(savedResolutionFactor);
		resolutionFactorSlider.value = resolutionFactor;
		resolutionFactorValue.textContent = resolutionFactor;
	}

	if (savedEquation) {
		equationInput.value = savedEquation;
		try {
			const compiledEquation = math.compile(savedEquation);
			juliaFunction = (z) => compiledEquation.evaluate({ z: z });
		} catch (e) {
			console.warn("The saved equation is invalid, an error has occurred.");
		}
	}
	
	computeColorPalette();

	computeJuliaSet();
});