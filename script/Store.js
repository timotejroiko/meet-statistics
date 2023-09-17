/*

data structure pseudocode:

chrome.storage.sync = AsyncMap<{
	meet_options: object
}>

chrome.storage.local = AsyncMap<{
	list: Array<MeetingObject>
	[P-meeting_id]: Array<ParticipantObject>
	[D-meeting_id-participant_id]: Array<EventObject>
}>

*/


class Store {
	static defaultOptions = {
		debug: false,
		track_mic: true,
		track_cam: true,
		track_voice: true,
		track_reactions: true,
		track_messages: true,
		track_message_content: true,
		track_hands: true,
		track_presentation: true
	}

	/**
	 * DJB2 hash, not the best but simple and fast
	 * @param {string} str 
	 */
	static hash(str) {
		let len = str.length;
		let h = 5381;
		for (let i = 0; i < len; i++) {
			h = h * 33 ^ str.charCodeAt(i);
		}
		return (h >>> 0).toString(36);
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
	 * @param {boolean} update
	 */
	static async findOrCreateMeeting(id, update = false) {
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
			title: "",
			dataId: Store.hash(`${id}-${now.toString(36)}`),
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
		const list = await chrome.storage.local.get("list");
		return list?.list || [];
	}

	/**
	 * @param {string} dataId 
	 * @return {Promise<Parameters<Store.updateParticipants>[1]>}
	 */
	static async listMeetingParticipants(dataId) {
		const id = `P-${dataId}`;
		// @ts-ignore
		const list = await chrome.storage.local.get(id);
		return list[id] || [];
	}

	/**
	 * @param {string[]} dataIds 
	 * @return {Promise<Record<string,Parameters<Store.updateParticipants>[1]>>}
	 */
	static async listAllMeetingsParticipants(dataIds) {
		// @ts-ignore
		const list = await chrome.storage.local.get(dataIds.map(x => `P-${x}`));
		return list || {};
	}

	/**
	 * 
	 * @param {string} meetingId 
	 * @param {{
	 * 		name: string,
	 * 		subname: string,
	 * 		self: boolean,
	 * 		avatar: string,
	 * 		firstSeen: number,
	 * 		lastSeen: number,
	 * 		dataId: string
	 * }[]} data 
	 */
	static updateParticipants(meetingId, data) {
		// @ts-ignore
		return chrome.storage.local.set({
			[`P-${meetingId}`]: data
		});
	}

	/**
	 * 
	 * @param {string} meetingId 
	 * @param {string} participantId 
	 * @returns {Promise<Parameters<Store.updateParticipantData>[2]>}
	 */
	static async getParticipantData(meetingId, participantId) {
		const id = `D-${meetingId}-${participantId}`;
		// @ts-ignore
		const data = await chrome.storage.local.get(id);
		return data[id] || [];
	}

	/**
	 * @param {string} meetingId 
	 * @return {Promise<Record<string,Parameters<Store.updateParticipantData>[2]>>}
	 */
	static async getAllParticipantsData(meetingId) {
		const list = await Store.listMeetingParticipants(meetingId);
		const ids = list.map(x => `D-${meetingId}-${x.dataId}`);
		// @ts-ignore
		const data = await chrome.storage.local.get(ids);
		for(const key of Object.keys(data)) {
			data[key.slice(key.indexOf("-"))] = data[key];
			delete data[key];
		}
		return data;
	}

	/**
	 * 
	 * @param {string} meetingId 
	 * @param {string} participantId 
	 * @param {{
	 * 		type: string,
	 * 		time: number,
	 * 		action: string
	 * }[]} data 
	 * @returns 
	 */
	static updateParticipantData(meetingId, participantId, data) {
		// @ts-ignore
		return chrome.storage.local.set({
			[`D-${meetingId}-${participantId}`]: data
		});
	}
}
