class Store {
	static defaultOptions = {
		debug: false,
		track_mic: true,
		track_tab_mic: true,
		track_cam: true,
		track_voice: true,
		track_tab_voice: true,
		track_reactions: true,
		track_messages: true,
		track_hands: true
	}

	/**
	 * @returns {Promise<Store.defaultOptions>}
	 */
	static async getOptions() {
		// @ts-ignore
		let options = await chrome.storage.sync.get(["meet_options"]).then(x => x?.meet_options);
		if(!options) {
			options = Store.defaultOptions;
			await Store.setOptions(options);
		}
		return options;
	}
	
	/**
	 * @param {Partial<Store.defaultOptions>} options 
	 * @returns 
	 */
	static setOptions(options) {
		// @ts-ignore
		return chrome.storage.sync.set({ meet_options: { ...this.defaultOptions, ...options } });
	}

	/**
	 * @param {string} id 
	 * @param {string} title 
	 * @param {boolean} update
	 */
	static async findOrCreateMeeting(id, title = "no title", update = false) {
		const now = Date.now();
		const list = await Store.listMeetings();
		const existing = list.find(x => x.id === id && x.lastSeen + 3600000 > now);
		if(existing) {
			if(update) {
				existing.lastSeen = now;
				// @ts-ignore
				await chrome.storage.local.set({ list });
			}
			return existing;
		}
		const obj = {
			id,
			title,
			dataId: `${id}-${now.toString(36)}`,
			firstSeen: now,
			lastSeen: now,
		};
		if(update) {
			list.push(obj);
			// @ts-ignore
			await chrome.storage.local.set({ list });
		}
		return obj;
	}

	/**
	 * @returns {Promise<{
	 * 		id: string,
	 * 		title: string,
	 * 		dataId: string,
	 * 		firstSeen: number,
	 * 		lastSeen: number
	 * }[]>}
	 */
	static async listMeetings() {
		// @ts-ignore
		const list = await chrome.storage.local.get(["list"]);
		return list?.list || [];
	}
}
