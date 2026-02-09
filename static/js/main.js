import { getFastParams, isEquationValid } from './equation.js';
import { JuliaSetPresets, getPresetByName } from './presets.js';

const canvasContainer = document.createElement('div');
canvasContainer.id = 'canvas-container';
document.body.appendChild(canvasContainer);

const canvas = document.createElement('canvas');
canvasContainer.appendChild(canvas);

const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
ctx.imageSmoothingEnabled = false;

const lowResCanvas = document.createElement('canvas');
const lowResCtx = lowResCanvas.getContext('2d');

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

let centerX = 0;
let centerY = 0;
let rangeY = 4;
let maxIter = 500;
let resolutionFactor = 4;
let colorPalette = 'original';

let isDragging = false;
let dragStartScreen = { x: 0, y: 0 };
let dragStartCenter = { x: 0, y: 0 };

let lastTouchDistance = 0;
let lastTouchPosition = null;
let isTouchDragging = false;
let touchStartCenter = { x: 0, y: 0 };

const uiPanel = document.getElementById('ui-panel');
const uiToggle = document.getElementById('ui-toggle');
const equationInput = document.getElementById('equation');
const applyButton = document.getElementById('apply');
const colorPaletteSelect = document.getElementById('colorPalette');
const presetsSelect = document.getElementById('presets');

const maxIterSlider = document.getElementById('maxIterSlider');
const maxIterValue = document.getElementById('maxIterValue');
const resolutionFactorSlider = document.getElementById('resolutionFactorSlider');
const resolutionFactorValue = document.getElementById('resolutionFactorValue');

let equationText = equationInput.value;
let fastParams = getFastParams(equationText);

const worker = new Worker(new URL('./worker.js', import.meta.url));
let renderId = 0;
let pending = false;
let lastRenderedId = 0;

function getBounds() {
	const aspect = canvasWidth / canvasHeight;
	const rangeX = rangeY * aspect;
	return {
		minX: centerX - rangeX / 2,
		maxX: centerX + rangeX / 2,
		minY: centerY - rangeY / 2,
		maxY: centerY + rangeY / 2
	};
}

function screenToComplex(sx, sy) {
	const bounds = getBounds();
	return {
		x: bounds.minX + (sx / canvasWidth) * (bounds.maxX - bounds.minX),
		y: bounds.minY + (sy / canvasHeight) * (bounds.maxY - bounds.minY)
	};
}

function scheduleRender() {
	if (pending) return;
	pending = true;
	requestAnimationFrame(() => {
		pending = false;
		render();
	});
}

function render() {
	const bounds = getBounds();
	renderId += 1;
	worker.postMessage({
		type: 'render',
		id: renderId,
		width: canvasWidth,
		height: canvasHeight,
		minX: bounds.minX,
		maxX: bounds.maxX,
		minY: bounds.minY,
		maxY: bounds.maxY,
		maxIter,
		resolutionFactor,
		equationText,
		fastParams,
		paletteName: colorPalette
	});
}

worker.onmessage = (e) => {
	const data = e.data;
	if (data.type !== 'rendered') return;
	if (data.id < lastRenderedId) return;
	lastRenderedId = data.id;
	const buffer = new Uint8ClampedArray(data.buffer);
	lowResCanvas.width = data.width;
	lowResCanvas.height = data.height;
	const imageData = new ImageData(buffer, data.width, data.height);
	lowResCtx.putImageData(imageData, 0, 0);
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.drawImage(lowResCanvas, 0, 0, canvasWidth, canvasHeight);
};

function setBoundsFromMinMax(minX, maxX, minY, maxY) {
	const aspect = canvasWidth / canvasHeight;
	const inputCX = (minX + maxX) / 2;
	const inputCY = (minY + maxY) / 2;
	const inputRangeX = maxX - minX;
	const inputRangeY = maxY - minY;
	const inputAspect = inputRangeX / inputRangeY;
	if (inputAspect > aspect) {
		rangeY = inputRangeX / aspect;
	} else {
		rangeY = inputRangeY;
	}
	centerX = inputCX;
	centerY = inputCY;
}

function resetView() {
	centerX = 0;
	centerY = 0;
	rangeY = 4;
	scheduleRender();
}

applyButton.addEventListener('click', () => {
	const text = equationInput.value.trim();
	if (!isEquationValid(text)) {
		alert('Error in the function entered. Make sure the equation is valid.');
		return;
	}
	equationText = text;
	fastParams = getFastParams(text);
	localStorage.setItem('equation', text);
	resetView();
});

colorPaletteSelect.addEventListener('change', () => {
	colorPalette = colorPaletteSelect.value;
	localStorage.setItem('colorPalette', colorPalette);
	scheduleRender();
});

presetsSelect.addEventListener('change', () => {
	if (!presetsSelect.value) return;
	const preset = getPresetByName(presetsSelect.value);
	if (preset) {
		equationInput.value = preset.equation;
		equationText = preset.equation;
		fastParams = getFastParams(preset.equation);
		setBoundsFromMinMax(preset.minX, preset.maxX, preset.minY, preset.maxY);
		maxIter = preset.maxIter;
		resolutionFactor = preset.resolutionFactor;
		maxIterSlider.value = maxIter;
		maxIterValue.textContent = maxIter;
		resolutionFactorSlider.value = resolutionFactor;
		resolutionFactorValue.textContent = resolutionFactor;
		localStorage.setItem('equation', equationText);
		localStorage.setItem('maxIter', maxIter);
		localStorage.setItem('resolutionFactor', resolutionFactor);
		scheduleRender();
	}
	presetsSelect.value = '';
});

maxIterSlider.addEventListener('input', () => {
	maxIter = parseInt(maxIterSlider.value, 10);
	maxIterValue.textContent = maxIter;
	localStorage.setItem('maxIter', maxIter);
	scheduleRender();
});

resolutionFactorSlider.addEventListener('input', () => {
	resolutionFactor = parseInt(resolutionFactorSlider.value, 10);
	resolutionFactorValue.textContent = resolutionFactor;
	localStorage.setItem('resolutionFactor', resolutionFactor);
	scheduleRender();
});

window.addEventListener('resize', () => {
	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	scheduleRender();
});

canvas.addEventListener('touchstart', (e) => {
	if (e.touches.length === 1) {
		isTouchDragging = true;
		lastTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		touchStartCenter = { x: centerX, y: centerY };
	} else if (e.touches.length === 2) {
		isTouchDragging = false;
		lastTouchDistance = Math.hypot(
			e.touches[0].clientX - e.touches[1].clientX,
			e.touches[0].clientY - e.touches[1].clientY
		);
	}
});

canvas.addEventListener('touchmove', (e) => {
	e.preventDefault();
	if (e.touches.length === 1 && isTouchDragging && lastTouchPosition) {
		const dx = e.touches[0].clientX - lastTouchPosition.x;
		const dy = e.touches[0].clientY - lastTouchPosition.y;
		const aspect = canvasWidth / canvasHeight;
		centerX -= dx * (rangeY * aspect) / canvasWidth;
		centerY -= dy * rangeY / canvasHeight;
		lastTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		scheduleRender();
	} else if (e.touches.length === 2) {
		const currentDistance = Math.hypot(
			e.touches[0].clientX - e.touches[1].clientX,
			e.touches[0].clientY - e.touches[1].clientY
		);
		const scale = lastTouchDistance > 0 ? currentDistance / lastTouchDistance : 1;
		if (scale !== 1) {
			const rect = canvas.getBoundingClientRect();
			const midScreenX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
			const midScreenY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
			const pivot = screenToComplex(midScreenX, midScreenY);
			rangeY /= scale;
			centerX = pivot.x + (centerX - pivot.x) / scale;
			centerY = pivot.y + (centerY - pivot.y) / scale;
			lastTouchDistance = currentDistance;
			scheduleRender();
		}
	}
});

canvas.addEventListener('touchend', (e) => {
	if (e.touches.length === 0) {
		isTouchDragging = false;
		lastTouchDistance = 0;
		lastTouchPosition = null;
	}
});

canvas.addEventListener('mousedown', (e) => {
	if (e.button === 0) {
		isDragging = true;
		const rect = canvas.getBoundingClientRect();
		dragStartScreen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
		dragStartCenter = { x: centerX, y: centerY };
	}
});

canvas.addEventListener('mousemove', (e) => {
	if (!isDragging) return;
	const rect = canvas.getBoundingClientRect();
	const currentScreenX = e.clientX - rect.left;
	const currentScreenY = e.clientY - rect.top;
	const dx = currentScreenX - dragStartScreen.x;
	const dy = currentScreenY - dragStartScreen.y;
	const aspect = canvasWidth / canvasHeight;
	centerX = dragStartCenter.x - dx * (rangeY * aspect) / canvasWidth;
	centerY = dragStartCenter.y - dy * rangeY / canvasHeight;
	scheduleRender();
});

canvas.addEventListener('mouseup', () => {
	isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
	e.preventDefault();
	const rect = canvas.getBoundingClientRect();
	const mouseScreenX = e.clientX - rect.left;
	const mouseScreenY = e.clientY - rect.top;
	const pivot = screenToComplex(mouseScreenX, mouseScreenY);
	const zoomFactor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
	rangeY *= zoomFactor;
	centerX = pivot.x + (centerX - pivot.x) * zoomFactor;
	centerY = pivot.y + (centerY - pivot.y) * zoomFactor;
	scheduleRender();
});

document.addEventListener('keydown', (e) => {
	const panAmount = rangeY * 0.1;
	
	switch(e.key) {
		case 'r':
		case 'R':
			resetView();
			break;
		case '+':
		case '=':
			e.preventDefault();
			rangeY /= 1.2;
			scheduleRender();
			break;
		case '-':
		case '_':
			e.preventDefault();
			rangeY *= 1.2;
			scheduleRender();
			break;
		case 'ArrowUp':
			e.preventDefault();
			centerY -= panAmount;
			scheduleRender();
			break;
		case 'ArrowDown':
			e.preventDefault();
			centerY += panAmount;
			scheduleRender();
			break;
		case 'ArrowLeft':
			e.preventDefault();
			centerX -= panAmount;
			scheduleRender();
			break;
		case 'ArrowRight':
			e.preventDefault();
			centerX += panAmount;
			scheduleRender();
			break;
	}
});

window.addEventListener('load', () => {
	const uiHidden = localStorage.getItem('uiHidden') === '1';
	if (uiHidden) {
		uiPanel.classList.add('collapsed');
		uiToggle.textContent = 'Show';
	}
	const savedMaxIter = localStorage.getItem('maxIter');
	const savedResolutionFactor = localStorage.getItem('resolutionFactor');
	const savedEquation = localStorage.getItem('equation');
	const savedColorPalette = localStorage.getItem('colorPalette');
	if (savedMaxIter) {
		maxIter = parseInt(savedMaxIter, 10);
		maxIterSlider.value = maxIter;
		maxIterValue.textContent = maxIter;
	}
	if (savedResolutionFactor) {
		resolutionFactor = parseInt(savedResolutionFactor, 10);
		resolutionFactorSlider.value = resolutionFactor;
		resolutionFactorValue.textContent = resolutionFactor;
	}
	if (savedEquation) {
		equationInput.value = savedEquation;
		equationText = savedEquation;
		fastParams = getFastParams(savedEquation);
	}
	if (savedColorPalette) {
		colorPalette = savedColorPalette;
		colorPaletteSelect.value = colorPalette;
	}
	scheduleRender();
});

uiToggle.addEventListener('click', () => {
	const isCollapsed = uiPanel.classList.toggle('collapsed');
	uiToggle.textContent = isCollapsed ? 'Show' : 'Hide';
	localStorage.setItem('uiHidden', isCollapsed ? '1' : '0');
});