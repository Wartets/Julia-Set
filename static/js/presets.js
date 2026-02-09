export const JuliaSetPresets = [
	{
		name: 'Classic Dragon',
		equation: 'z^2-0.7269+0.1889i',
		minX: -0.8,
		maxX: 0.8,
		minY: -0.8,
		maxY: 0.8,
		maxIter: 256,
		resolutionFactor: 2
	},
	{
		name: 'Spiral Galaxy',
		equation: 'z^2-0.162+1.04i',
		minX: -0.8,
		maxX: 0.8,
		minY: -0.8,
		maxY: 0.8,
		maxIter: 256,
		resolutionFactor: 2
	},
	{
		name: 'Ice Crystal',
		equation: 'z^2-0.8+0.156i',
		minX: -1.5,
		maxX: 1.5,
		minY: -1.5,
		maxY: 1.5,
		maxIter: 256,
		resolutionFactor: 2
	},
	{
		name: 'Twin Spiral',
		equation: 'z^2-0.123+0.745i',
		minX: -0.8,
		maxX: 0.8,
		minY: -0.8,
		maxY: 0.8,
		maxIter: 256,
		resolutionFactor: 2
	},
	{
		name: 'Seahorse Valley',
		equation: 'z^2-0.7435+0.13i',
		minX: -0.748,
		maxX: -0.735,
		minY: 0.098,
		maxY: 0.111,
		maxIter: 256,
		resolutionFactor: 2
	},
	{
		name: 'Mandelbrot Zoom',
		equation: 'z^2-0.7',
		minX: -3,
		maxX: 3,
		minY: -3,
		maxY: 3,
		maxIter: 250,
		resolutionFactor: 2
	},
	{
		name: 'Purple Nebula',
		equation: 'z^2+0.355+0.355i',
		minX: -2,
		maxX: 2,
		minY: -2,
		maxY: 2,
		maxIter: 250,
		resolutionFactor: 2
	},
	{
		name: 'Phoenix Flame',
		equation: 'z^3-0.5+0.5i',
		minX: -1.5,
		maxX: 1.5,
		minY: -1.5,
		maxY: 1.5,
		maxIter: 256,
		resolutionFactor: 2
	},
	{
		name: 'Electric Tentacles',
		equation: 'z^2-0.75+0.25i',
		minX: -1.5,
		maxX: 1.5,
		minY: -1.5,
		maxY: 1.5,
		maxIter: 256,
		resolutionFactor: 2
	},
	{
		name: 'Kaleidoscope',
		equation: 'z^2+(-0.7+0.27015i)',
		minX: -0.8,
		maxX: 0.8,
		minY: -0.8,
		maxY: 0.8,
		maxIter: 256,
		resolutionFactor: 2
	}
];

export function getPresetByName(name) {
	return JuliaSetPresets.find(p => p.name === name);
}

export function getPresetNames() {
	return JuliaSetPresets.map(p => p.name);
}
