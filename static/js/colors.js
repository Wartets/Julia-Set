const ColorPalettes = {
	vibrant: {
		name: 'Vibrant',
		generate: (maxIter) => {
			const palette = new Uint8ClampedArray((maxIter + 1) * 3);
			for (let iter = 0; iter <= maxIter; iter++) {
				const t = iter / maxIter;
				const s = (iter / Math.sqrt(maxIter)) % 1;
				const idx = iter * 3;
				palette[idx] = Math.floor(Math.sin(t * Math.PI) * 255);
				palette[idx + 1] = Math.floor(Math.sin((t + 1/3) * Math.PI) * 255);
				palette[idx + 2] = Math.floor(Math.sin((t + 2/3) * Math.PI) * 255);
			}
			return palette;
		}
	},
	
	cool: {
		name: 'Cool',
		generate: (maxIter) => {
			const palette = new Uint8ClampedArray((maxIter + 1) * 3);
			for (let iter = 0; iter <= maxIter; iter++) {
				const t = iter / maxIter;
				const idx = iter * 3;
				palette[idx] = Math.floor(t * 100);
				palette[idx + 1] = Math.floor(t * 150 + 100);
				palette[idx + 2] = Math.floor(255 - t * 50);
			}
			return palette;
		}
	},
	
	warm: {
		name: 'Warm',
		generate: (maxIter) => {
			const palette = new Uint8ClampedArray((maxIter + 1) * 3);
			for (let iter = 0; iter <= maxIter; iter++) {
				const t = iter / maxIter;
				const idx = iter * 3;
				palette[idx] = Math.floor(255 - t * 100);
				palette[idx + 1] = Math.floor(t * 150 + 50);
				palette[idx + 2] = Math.floor(t * 100);
			}
			return palette;
		}
	},
	
	dark: {
		name: 'Dark',
		generate: (maxIter) => {
			const palette = new Uint8ClampedArray((maxIter + 1) * 3);
			for (let iter = 0; iter <= maxIter; iter++) {
				const t = iter / maxIter;
				const s = (iter / Math.sqrt(maxIter)) % 1;
				const idx = iter * 3;
				palette[idx] = Math.floor(t * 200);
				palette[idx + 1] = Math.floor(t * t * 255);
				palette[idx + 2] = Math.floor(Math.sqrt(t) * 255);
			}
			return palette;
		}
	},
	
	sunset: {
		name: 'Sunset',
		generate: (maxIter) => {
			const palette = new Uint8ClampedArray((maxIter + 1) * 3);
			for (let iter = 0; iter <= maxIter; iter++) {
				const t = iter / maxIter;
				const idx = iter * 3;
				palette[idx] = Math.floor(255);
				palette[idx + 1] = Math.floor(165 * (1 - t * 0.5));
				palette[idx + 2] = Math.floor(100 * Math.sin(t * Math.PI));
			}
			return palette;
		}
	},
	
	ocean: {
		name: 'Ocean',
		generate: (maxIter) => {
			const palette = new Uint8ClampedArray((maxIter + 1) * 3);
			for (let iter = 0; iter <= maxIter; iter++) {
				const t = iter / maxIter;
				const idx = iter * 3;
				palette[idx] = Math.floor(0 + t * 100);
				palette[idx + 1] = Math.floor(100 + t * 155);
				palette[idx + 2] = Math.floor(200 + t * 55);
			}
			return palette;
		}
	},
	
	fire: {
		name: 'Fire',
		generate: (maxIter) => {
			const palette = new Uint8ClampedArray((maxIter + 1) * 3);
			for (let iter = 0; iter <= maxIter; iter++) {
				const t = iter / maxIter;
				const idx = iter * 3;
				palette[idx] = Math.floor(255);
				palette[idx + 1] = Math.floor(t * 255);
				palette[idx + 2] = Math.floor(Math.pow(1 - t, 2) * 255);
			}
			return palette;
		}
	},

	original: {
		name: 'Original',
		generate: (maxIter) => {
			const palette = new Uint8ClampedArray((maxIter + 1) * 3);
			for (let iter = 0; iter <= maxIter; iter++) {
				const t = iter / Math.sqrt(maxIter);
				const s = iter / maxIter;
				const idx = iter * 3;
				palette[idx] = Math.floor(9 * (1 - t) * t * t * t * 255);
				palette[idx + 1] = Math.floor(15 * (1 - s) * (1 - s) * s * s * 255);
				palette[idx + 2] = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * s * 255);
			}
			return palette;
		}
	}
};

export function getPalette(paletteName, maxIter) {
	const palette = ColorPalettes[paletteName] || ColorPalettes.original;
	return palette.generate(maxIter);
}

export function getPaletteNames() {
	return Object.keys(ColorPalettes);
}

export function getPaletteDisplayName(paletteName) {
	const palette = ColorPalettes[paletteName];
	return palette ? palette.name : 'Original';
}
