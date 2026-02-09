const mathRef = globalThis.math;

function containsSymbol(node, name) {
	if (!node) return false;
	if (node.type === 'SymbolNode' && node.name === name) return true;
	if (node.args && node.args.length) return node.args.some((arg) => containsSymbol(arg, name));
	if (node.content) return containsSymbol(node.content, name);
	if (node.object) return containsSymbol(node.object, name);
	if (node.params && node.params.length) return node.params.some((arg) => containsSymbol(arg, name));
	return false;
}

function evalConstant(node) {
	if (!node || containsSymbol(node, 'z')) return null;
	const compiled = node.compile();
	const value = compiled.evaluate({});
	if (typeof value === 'number') return { re: value, im: 0 };
	if (value && typeof value.re === 'number') return { re: value.re, im: value.im };
	return null;
}

function getPower(node) {
	if (!node) return null;
	if (node.type === 'OperatorNode' && node.op === '^' && node.args.length === 2) {
		const base = node.args[0];
		const exponent = node.args[1];
		if (base.type === 'SymbolNode' && base.name === 'z' && !containsSymbol(exponent, 'z')) {
			const expValue = evalConstant(exponent);
			if (expValue && expValue.im === 0 && Number.isInteger(expValue.re)) {
				return expValue.re;
			}
		}
	}
	if (node.type === 'FunctionNode' && node.fn && node.fn.name === 'pow' && node.args.length === 2) {
		const base = node.args[0];
		const exponent = node.args[1];
		if (base.type === 'SymbolNode' && base.name === 'z' && !containsSymbol(exponent, 'z')) {
			const expValue = evalConstant(exponent);
			if (expValue && expValue.im === 0 && Number.isInteger(expValue.re)) {
				return expValue.re;
			}
		}
	}
	return null;
}

function collectAddTerms(node, sign, terms) {
	if (node.type === 'ParenthesisNode') return collectAddTerms(node.content, sign, terms);
	if (node.type === 'OperatorNode' && node.op === '+' && node.args.length === 2) {
		collectAddTerms(node.args[0], sign, terms);
		collectAddTerms(node.args[1], sign, terms);
		return;
	}
	if (node.type === 'OperatorNode' && node.op === '-' && node.args.length === 2) {
		collectAddTerms(node.args[0], sign, terms);
		collectAddTerms(node.args[1], -sign, terms);
		return;
	}
	terms.push({ node, sign });
}

export function getFastParams(equationText) {
	try {
		const node = mathRef.parse(equationText);
		const terms = [];
		collectAddTerms(node, 1, terms);
		let power = null;
		let coeff = 1;
		let cRe = 0;
		let cIm = 0;
		for (const term of terms) {
			const termPower = getPower(term.node);
			if (termPower !== null) {
				if (power !== null) return null;
				power = termPower;
				coeff = term.sign;
				continue;
			}
			const constant = evalConstant(term.node);
			if (!constant) return null;
			cRe += constant.re * term.sign;
			cIm += constant.im * term.sign;
		}
		if (power === null) return null;
		if (!Number.isInteger(power) || power < 2 || power > 8) return null;
		if (coeff !== 1 && coeff !== -1) return null;
		return { power, cRe, cIm, coeff };
	} catch (e) {
		return null;
	}
}

export function isEquationValid(equationText) {
	try {
		mathRef.compile(equationText);
		return true;
	} catch (e) {
		return false;
	}
}
