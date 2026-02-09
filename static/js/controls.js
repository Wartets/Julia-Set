export function setupCanvasControls(canvas, onRender, getCurrentBounds, setBounds) {
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };

	canvas.addEventListener('mousedown', (e) => {
		if (e.button === 0) {
			isDragging = true;
			dragStart = { x: e.clientX, y: e.clientY };
		}
	});

	canvas.addEventListener('mousemove', (e) => {
		if (!isDragging) return;
		const bounds = getCurrentBounds();
		const dx = e.clientX - dragStart.x;
		const dy = e.clientY - dragStart.y;
		const rangeX = bounds.maxX - bounds.minX;
		const rangeY = bounds.maxY - bounds.minY;
		const deltaX = (dx / canvas.width) * rangeX;
		const deltaY = (dy / canvas.height) * rangeY;
		
		setBounds({
			minX: bounds.minX - deltaX,
			maxX: bounds.maxX - deltaX,
			minY: bounds.minY - deltaY,
			maxY: bounds.maxY - deltaY,
			resolutionFactor: Math.max(bounds.resolutionFactor, 16)
		});
		
		dragStart = { x: e.clientX, y: e.clientY };
		onRender();
	});

	canvas.addEventListener('mouseup', () => {
		isDragging = false;
		const bounds = getCurrentBounds();
		setBounds({ resolutionFactor: bounds.resolutionFactor });
		onRender();
	});

	canvas.addEventListener('wheel', (e) => {
		e.preventDefault();
		const bounds = getCurrentBounds();
		const scale = e.deltaY < 0 ? 0.95 : 1.05;
		const mouseX = e.clientX;
		const mouseY = e.clientY;
		const zoomX = bounds.minX + (mouseX / canvas.width) * (bounds.maxX - bounds.minX);
		const zoomY = bounds.minY + (mouseY / canvas.height) * (bounds.maxY - bounds.minY);
		
		setBounds({
			minX: zoomX + (bounds.minX - zoomX) * scale,
			maxX: zoomX + (bounds.maxX - zoomX) * scale,
			minY: zoomY + (bounds.minY - zoomY) * scale,
			maxY: zoomY + (bounds.maxY - zoomY) * scale
		});
		
		onRender();
	});

	let lastTouchDistance = 0;
	let lastTouchPosition = null;
	let isTouchDragging = false;

	canvas.addEventListener('touchstart', (e) => {
		if (e.touches.length === 1) {
			const bounds = getCurrentBounds();
			isTouchDragging = true;
			lastTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			setBounds({ resolutionFactor: Math.max(bounds.resolutionFactor, 16) });
		} else if (e.touches.length === 2) {
			const bounds = getCurrentBounds();
			lastTouchDistance = Math.hypot(
				e.touches[0].clientX - e.touches[1].clientX,
				e.touches[0].clientY - e.touches[1].clientY
			);
			setBounds({ resolutionFactor: Math.max(bounds.resolutionFactor, 16) });
		}
	});

	canvas.addEventListener('touchmove', (e) => {
		e.preventDefault();
		const bounds = getCurrentBounds();
		
		if (e.touches.length === 1 && isTouchDragging && lastTouchPosition) {
			const dx = e.touches[0].clientX - lastTouchPosition.x;
			const dy = e.touches[0].clientY - lastTouchPosition.y;
			const rangeX = bounds.maxX - bounds.minX;
			const rangeY = bounds.maxY - bounds.minY;
			const deltaX = (dx / canvas.width) * rangeX;
			const deltaY = (dy / canvas.height) * rangeY;
			
			setBounds({
				minX: bounds.minX - deltaX,
				maxX: bounds.maxX - deltaX,
				minY: bounds.minY - deltaY,
				maxY: bounds.maxY - deltaY
			});
			
			lastTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			onRender();
		} else if (e.touches.length === 2) {
			const currentDistance = Math.hypot(
				e.touches[0].clientX - e.touches[1].clientX,
				e.touches[0].clientY - e.touches[1].clientY
			);
			const scale = lastTouchDistance > 0 ? currentDistance / lastTouchDistance : 1;
			
			if (scale !== 1) {
				const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
				const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
				const zoomX = bounds.minX + (centerX / canvas.width) * (bounds.maxX - bounds.minX);
				const zoomY = bounds.minY + (centerY / canvas.height) * (bounds.maxY - bounds.minY);
				
				setBounds({
					minX: zoomX + (bounds.minX - zoomX) / scale,
					maxX: zoomX + (bounds.maxX - zoomX) / scale,
					minY: zoomY + (bounds.minY - zoomY) / scale,
					maxY: zoomY + (bounds.maxY - zoomY) / scale
				});
				
				lastTouchDistance = currentDistance;
				onRender();
			}
		}
	});

	canvas.addEventListener('touchend', (e) => {
		if (e.touches.length === 0) {
			isTouchDragging = false;
			lastTouchDistance = 0;
			lastTouchPosition = null;
			const bounds = getCurrentBounds();
			const originalFactor = parseInt(
				document.getElementById('resolutionFactorSlider').value, 10
			);
			setBounds({ resolutionFactor: originalFactor });
			onRender();
		}
	});
}

export function setupKeyboardShortcuts(onRender, getCurrentBounds, setBounds, onReset) {
	document.addEventListener('keydown', (e) => {
		const bounds = getCurrentBounds();
		const panAmount = (bounds.maxX - bounds.minX) * 0.1;
		
		switch(e.key) {
			case 'r':
			case 'R':
				onReset();
				break;
			case '+':
			case '=':
				e.preventDefault();
				setBounds({
					minX: bounds.minX + panAmount / 2,
					maxX: bounds.maxX - panAmount / 2,
					minY: bounds.minY + panAmount / 2,
					maxY: bounds.maxY - panAmount / 2
				});
				onRender();
				break;
			case '-':
			case '_':
				e.preventDefault();
				setBounds({
					minX: bounds.minX - panAmount / 2,
					maxX: bounds.maxX + panAmount / 2,
					minY: bounds.minY - panAmount / 2,
					maxY: bounds.maxY + panAmount / 2
				});
				onRender();
				break;
			case 'ArrowUp':
				e.preventDefault();
				const upAmount = (bounds.maxY - bounds.minY) * 0.1;
				setBounds({
					minY: bounds.minY + upAmount,
					maxY: bounds.maxY + upAmount
				});
				onRender();
				break;
			case 'ArrowDown':
				e.preventDefault();
				const downAmount = (bounds.maxY - bounds.minY) * 0.1;
				setBounds({
					minY: bounds.minY - downAmount,
					maxY: bounds.maxY - downAmount
				});
				onRender();
				break;
			case 'ArrowLeft':
				e.preventDefault();
				const leftAmount = (bounds.maxX - bounds.minX) * 0.1;
				setBounds({
					minX: bounds.minX - leftAmount,
					maxX: bounds.maxX - leftAmount
				});
				onRender();
				break;
			case 'ArrowRight':
				e.preventDefault();
				const rightAmount = (bounds.maxX - bounds.minX) * 0.1;
				setBounds({
					minX: bounds.minX + rightAmount,
					maxX: bounds.maxX + rightAmount
				});
				onRender();
				break;
		}
	});
}
