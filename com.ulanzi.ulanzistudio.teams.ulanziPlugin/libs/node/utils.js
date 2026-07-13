class UlanziUtils {

	parseJson(jsonString) {
		if (typeof jsonString === 'object') return jsonString;
		try {
			const o = JSON.parse(jsonString);
			if (o && typeof o === 'object') return o;
		} catch (e) {}
		return false;
	}

	joinTimestamp() {
		return { _t: new Date().getTime() };
	}

	getPluginPath() {
		const currentFilePath = process.argv[1];
		let split_tag = '/';
		if (currentFilePath.indexOf('\\') > -1) split_tag = '\\';
		const pathArr = currentFilePath.split(split_tag);
		const idx = pathArr.findIndex(f => f.endsWith('ulanziPlugin'));
		return pathArr.slice(0, idx + 1).join('/');
	}

	log(...msg) {
		console.log(`[${new Date().toLocaleString('zh-CN', {hour12: false})}]`, ...msg);
	}

	warn(...msg) {
		console.warn(`[${new Date().toLocaleString('zh-CN', {hour12: false})}]`, ...msg);
	}

	error(...msg) {
		console.error(`[${new Date().toLocaleString('zh-CN', {hour12: false})}]`, ...msg);
	}
}

const Utils = new UlanziUtils();
export default Utils;
