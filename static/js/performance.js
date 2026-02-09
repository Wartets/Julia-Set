export class RenderCache {
	constructor(maxCacheSize = 10) {
		this.cache = new Map();
		this.maxSize = maxCacheSize;
	}

	generateKey(minX, maxX, minY, maxY, maxIter, resolutionFactor) {
		return `${minX.toFixed(6)}_${maxX.toFixed(6)}_${minY.toFixed(6)}_${maxY.toFixed(6)}_${maxIter}_${resolutionFactor}`;
	}

	get(key) {
		return this.cache.get(key);
	}

	set(key, value) {
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}
		this.cache.set(key, value);
	}

	clear() {
		this.cache.clear();
	}
}

export function calculateAdaptiveResolution(minX, maxX, minY, maxY, baseResolution = 8) {
	const rangeX = Math.abs(maxX - minX);
	const rangeY = Math.abs(maxY - minY);
	const zoomLevel = Math.log2(6 / Math.max(rangeX, rangeY));
	
	if (zoomLevel > 10) {
		return Math.min(baseResolution * 4, 96);
	} else if (zoomLevel > 5) {
		return Math.min(baseResolution * 2, 96);
	}
	return baseResolution;
}

export function estimateIterationComplexity(minX, maxX, minY, maxY, maxIter) {
	const rangeX = Math.abs(maxX - minX);
	const rangeY = Math.abs(maxY - minY);
	const zoomLevel = Math.log2(6 / Math.max(rangeX, rangeY));
	if (zoomLevel > 15) return maxIter * 1.5;
	if (zoomLevel > 10) return maxIter * 1.2;
	return maxIter;
}

export function getProgressiveRenderingSteps(resolutionFactor) {
	const steps = [];
	let current = Math.max(resolutionFactor * 4, 32);
	while (current >= resolutionFactor) {
		steps.push(current);
		current = Math.floor(current / 2);
	}
	return steps;
}
