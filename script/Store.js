// @ts-nocheck
class Store {
	static loadOptions() {
		return chrome.storage.sync.get(["meet_options"]).then(x => x || {});
	}
	
	static setOptions(options) {
		return chrome.storage.sync.set({ meet_options: options });
	}
	
	static storeData(data) {
		return chrome.storage.local.set({ data });
	}
}
