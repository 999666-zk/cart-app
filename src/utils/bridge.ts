export const bridgeScript = `(function(window) {
	if(window.qfCustomJsApi) return;
	var api = { version: '0.1.0' };
	function uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			let r = (Math.random() * 16) | 0,
				v = c == 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}
	function _bridge(type, options={}) {
		var successKey = '';
		var failKey = '';
		if (!window.bridgeCallBacks) window.bridgeCallBacks = {};

		if(typeof options.success === 'function') {
			successKey = uuidv4();
			window.bridgeCallBacks[successKey] = options.success;
		}
		if(typeof options.fail === 'function') {
			failKey = uuidv4();
			window.bridgeCallBacks[failKey] = options.fail;
		}

		delete options.success;
		delete options.fail;

		var msg = { type: type, options: options, successCallback: successKey, failCallback: failKey};
		window.ReactNativeWebView.postMessage(JSON.stringify(msg));
	}
	api.barCodeScan = function(options={}) {
		options.barCodeTypes = ['aztec','codabar','code39','code93','code128','code39mod43','datamatrix','ean13','ean8','interleaved2of5','itf14','maxicode','pdf417','rss14','rssexpanded','upc_a','upc_e','upc_ean','qr'];
		var opts = Object.assign({ success: null, fail: null }, options);
		_bridge('barCodeScan', opts);
	};
	api.scanCode = api.barCodeScan;
	window.qfCustomJsApi = api;
	window.ReactNativeJsApi = api;
})(window);`;
export default {
	bridgeScript
};
