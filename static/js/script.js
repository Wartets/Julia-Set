// script.js

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Canvas configuration
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let width = canvas.width;
let height = canvas.height;

// Complex plane bounds
let minX = -2, maxX = 2, minY = -2, maxY = 2;
let maxIter = 200;
let resolutionFactor = 8; // Reduce resolution by this factor

// Parse equation input
const controls = document.getElementById('controls');
const equationInput = document.getElementById('equation');
const applyButton = document.getElementById('apply');

// Default Julia set function
let juliaFunction = (z) => math.add(math.multiply(z, z), math.complex(0.355, 0.355));

// Add listeners
applyButton.addEventListener('click', () => {
    try {
        const equation = equationInput.value;

        // Try to parse the input equation and create a valid JavaScript function for complex numbers
        juliaFunction = new Function('z', `
            const math = window.math;
            let realPart = z.re || z.re === 0 ? z.re : 0; // If z is complex, use its real part
            let imagPart = z.im || z.im === 0 ? z.im : 0; // If z is complex, use its imaginary part
            let result = ${equation}; // Use the input expression
            return math.complex(result.re || 0, result.im || 0); // Return as complex number
        `);
        resetView();
    } catch (e) {
        alert("Erreur dans la fonction entrée. Assurez-vous que l'équation est valide.");
    }
});

// Convert pixel to complex number
function pixelToComplex(x, y) {
    return math.complex(
        minX + (x / width) * (maxX - minX),
        minY + (y / height) * (maxY - minY)
    );
}

// Julia set calculation
function computeJuliaSet() {
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

            const color = iteration === maxIter ? [0, 0, 0] : colorMapping(iteration);
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

// Reset view and redraw
function resetView() {
    minX = -2; maxX = 2; minY = -2; maxY = 2;
    computeJuliaSet();
}

// Handle zoom
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();

    const zoomFactor = event.deltaY < 0 ? 0.8 : 1.2;
    const { offsetX, offsetY } = event;

    const { re: centerX, im: centerY } = pixelToComplex(offsetX, offsetY);

    const rangeX = (maxX - minX) * zoomFactor;
    const rangeY = (maxY - minY) * zoomFactor;

    minX = centerX - rangeX / 2;
    maxX = centerX + rangeX / 2;
    minY = centerY - rangeY / 2;
    maxY = centerY + rangeY / 2;

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

// Initial rendering
resetView();
