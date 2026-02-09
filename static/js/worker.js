importScripts('https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.js');

let compiledEquation = null;
let lastEquationText = null;
let palette = null;
let paletteSize = 0;
let currentPaletteName = 'original';

const ColorPalettes = {
	vibrant: (maxIter) => {
		const palette = new Uint8ClampedArray((maxIter + 1) * 3);
		for (let iter = 0; iter <= maxIter; iter++) {
			const t = Math.log(iter + 1) / Math.log(maxIter + 1);
			const idx = iter * 3;
			palette[idx] = Math.floor((Math.sin(t * 6.28 * 3) * 0.5 + 0.5) * 255);
			palette[idx + 1] = Math.floor((Math.sin(t * 6.28 * 3 + 2.09) * 0.5 + 0.5) * 255);
			palette[idx + 2] = Math.floor((Math.sin(t * 6.28 * 3 + 4.19) * 0.5 + 0.5) * 255);
		}
		return palette;
	},
	
	cool: (maxIter) => {
		const palette = new Uint8ClampedArray((maxIter + 1) * 3);
		for (let iter = 0; iter <= maxIter; iter++) {
			const t = Math.sqrt(iter / maxIter);
			const idx = iter * 3;
			palette[idx] = Math.floor(t * 80);
			palette[idx + 1] = Math.floor(t * 180 + 75);
			palette[idx + 2] = Math.floor((1 - t * 0.3) * 255);
		}
		return palette;
	},
	
	warm: (maxIter) => {
		const palette = new Uint8ClampedArray((maxIter + 1) * 3);
		for (let iter = 0; iter <= maxIter; iter++) {
			const t = Math.sqrt(iter / maxIter);
			const idx = iter * 3;
			palette[idx] = Math.floor(255 - t * 60);
			palette[idx + 1] = Math.floor(t * 180 + 40);
			palette[idx + 2] = Math.floor(t * 120);
		}
		return palette;
	},
	
	dark: (maxIter) => {
		const palette = new Uint8ClampedArray((maxIter + 1) * 3);
		for (let iter = 0; iter <= maxIter; iter++) {
			const t = iter / maxIter;
			const s = Math.pow(t, 0.7);
			const idx = iter * 3;
			palette[idx] = Math.floor(s * 180);
			palette[idx + 1] = Math.floor(Math.pow(s, 1.5) * 220);
			palette[idx + 2] = Math.floor(Math.sqrt(s) * 240);
		}
		return palette;
	},
	
	sunset: (maxIter) => {
		const palette = new Uint8ClampedArray((maxIter + 1) * 3);
		for (let iter = 0; iter <= maxIter; iter++) {
			const t = Math.sqrt(iter / maxIter);
			const idx = iter * 3;
			palette[idx] = Math.floor(255 - t * 20);
			palette[idx + 1] = Math.floor(140 - t * 80);
			palette[idx + 2] = Math.floor(80 * Math.sin(t * 3.14));
		}
		return palette;
	},
	
	ocean: (maxIter) => {
		const palette = new Uint8ClampedArray((maxIter + 1) * 3);
		for (let iter = 0; iter <= maxIter; iter++) {
			const t = Math.sqrt(iter / maxIter);
			const idx = iter * 3;
			palette[idx] = Math.floor(20 + t * 80);
			palette[idx + 1] = Math.floor(80 + t * 175);
			palette[idx + 2] = Math.floor(180 + t * 75);
		}
		return palette;
	},
	
	fire: (maxIter) => {
		const palette = new Uint8ClampedArray((maxIter + 1) * 3);
		for (let iter = 0; iter <= maxIter; iter++) {
			const t = Math.sqrt(iter / maxIter);
			const idx = iter * 3;
			palette[idx] = Math.floor(255 - t * 50);
			palette[idx + 1] = Math.floor(t * 200 + 55);
			palette[idx + 2] = Math.floor(Math.pow(t, 2) * 180);
		}
		return palette;
	},

	original: (maxIter) => {
		const palette = new Uint8ClampedArray((maxIter + 1) * 3);
		for (let iter = 0; iter <= maxIter; iter++) {
			const t = Math.log(iter + 1) / Math.log(maxIter + 1);
			const s = iter / maxIter;
			const idx = iter * 3;
			palette[idx] = Math.floor(9 * (1 - t) * t * t * t * 255);
			palette[idx + 1] = Math.floor(15 * (1 - s) * (1 - s) * s * s * 255);
			palette[idx + 2] = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * s * 255);
		}
		return palette;
	}
};

function buildPalette(maxIter, paletteName = 'original') {
	const generator = ColorPalettes[paletteName] || ColorPalettes.original;
	palette = generator(maxIter);
	currentPaletteName = paletteName;
	paletteSize = maxIter;
}

function absSquared(value) {
	if (typeof value === 'number') return value * value;
	if (value && typeof value.re === 'number') return value.re * value.re + value.im * value.im;
	return NaN;
}

function computePow(zr, zi, power) {
	if (power === 2) {
		return [zr * zr - zi * zi, 2 * zr * zi];
	}
	if (power === 3) {
		const zr2 = zr * zr - zi * zi;
		const zi2 = 2 * zr * zi;
		return [zr2 * zr - zi2 * zi, zr2 * zi + zi2 * zr];
	}
	if (power === 4) {
		const zr2 = zr * zr - zi * zi;
		const zi2 = 2 * zr * zi;
		return [zr2 * zr2 - zi2 * zi2, 2 * zr2 * zi2];
	}
	let pr = zr;
	let pi = zi;
	for (let p = 1; p < power; p++) {
		const tr = pr * zr - pi * zi;
		const ti = pr * zi + pi * zr;
		pr = tr;
		pi = ti;
	}
	return [pr, pi];
}

function renderFast(buffer, width, height, minX, maxX, minY, maxY, maxIter, fastParams) {
	const stepX = (maxX - minX) / width;
	const stepY = (maxY - minY) / height;
	let offset = 0;
	const escapeThreshold = 4;
	const cRe = fastParams.cRe;
	const cIm = fastParams.cIm;
	const power = fastParams.power;
	const coeff = fastParams.coeff;
	
	for (let py = 0; py < height; py++) {
		const y0 = minY + py * stepY;
		for (let px = 0; px < width; px++) {
			let zr = minX + px * stepX;
			let zi = y0;
			let iter = 0;
			let zr2 = zr * zr;
			let zi2 = zi * zi;
			
			while (iter < maxIter && zr2 + zi2 <= escapeThreshold) {
				let pr, pi;
				
				switch(power) {
					case 2:
						pr = zr2 - zi2;
						pi = 2 * zr * zi;
						break;
					case 3:
						const temp_r = zr2 - zi2;
						const temp_i = 2 * zr * zi;
						pr = temp_r * zr - temp_i * zi;
						pi = temp_r * zi + temp_i * zr;
						break;
					case 4:
						const t_r = zr2 - zi2;
						const t_i = 2 * zr * zi;
						pr = t_r * t_r - t_i * t_i;
						pi = 2 * t_r * t_i;
						break;
					default:
						const pow = computePow(zr, zi, power);
						pr = pow[0];
						pi = pow[1];
				}
				
				if (coeff === -1) {
					pr = -pr;
					pi = -pi;
				}
				
				zr = pr + cRe;
				zi = pi + cIm;
			zr2 = zr * zr;
			zi2 = zi * zi;
			iter++;
		}
		
		const colorIdx = iter === maxIter ? maxIter * 3 : iter * 3;
		buffer[offset] = palette[colorIdx];
			buffer[offset + 1] = palette[colorIdx + 1];
			buffer[offset + 2] = palette[colorIdx + 2];
			buffer[offset + 3] = 255;
			offset += 4;
		}
	}
}

function renderGeneral(buffer, width, height, minX, maxX, minY, maxY, maxIter, equationText) {
	if (equationText !== lastEquationText || !compiledEquation) {
		try {
			compiledEquation = math.compile(equationText);
			lastEquationText = equationText;
		} catch (e) {
			for (let i = 0; i < buffer.length; i += 4) {
				buffer[i] = 128;
				buffer[i + 1] = 128;
				buffer[i + 2] = 128;
				buffer[i + 3] = 255;
			}
			return;
		}
	}
	
	const stepX = (maxX - minX) / width;
	const stepY = (maxY - minY) / height;
	let offset = 0;
	const escapeThreshold = 4;
	
	for (let py = 0; py < height; py++) {
		const y0 = minY + py * stepY;
		for (let px = 0; px < width; px++) {
			const x0 = minX + px * stepX;
			let value = math.complex(x0, y0);
			let iter = 0;
			let absVal = 0;
			
			while (iter < maxIter && absVal <= escapeThreshold) {
				value = compiledEquation.evaluate({ z: value });
				absVal = absSquared(value);
				iter++;
			}
			
			const colorIdx = iter === maxIter ? maxIter * 3 : iter * 3;
			buffer[offset] = palette[colorIdx];
			buffer[offset + 1] = palette[colorIdx + 1];
			buffer[offset + 2] = palette[colorIdx + 2];
			buffer[offset + 3] = 255;
			offset += 4;
		}
	}
}

self.onmessage = (e) => {
	const data = e.data;
	if (data.type !== 'render') return;
	if (paletteSize !== data.maxIter || currentPaletteName !== (data.paletteName || 'original')) {
		buildPalette(data.maxIter, data.paletteName || 'original');
	}
	const lowResWidth = Math.max(1, Math.floor(data.width / data.resolutionFactor));
	const lowResHeight = Math.max(1, Math.floor(data.height / data.resolutionFactor));
	const buffer = new Uint8ClampedArray(lowResWidth * lowResHeight * 4);
	if (data.fastParams) {
		renderFast(buffer, lowResWidth, lowResHeight, data.minX, data.maxX, data.minY, data.maxY, data.maxIter, data.fastParams);
	} else {
		renderGeneral(buffer, lowResWidth, lowResHeight, data.minX, data.maxX, data.minY, data.maxY, data.maxIter, data.equationText);
	}
	self.postMessage({
		type: 'rendered',
		id: data.id,
		width: lowResWidth,
		height: lowResHeight,
		buffer: buffer.buffer
	}, [buffer.buffer]);
};