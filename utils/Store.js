"use strict";

/*

data structure pseudocode:

chrome.storage.sync = AsyncMap<{
	meet_options: object
}>

chrome.storage.local = AsyncMap<{
	list: Array<MeetingData>
	[P-meeting_id]: Array<ParticipantData>
	[D-meeting_id-participant_id]: Array<EncodedEventData>
}>

*/

/**
 * @typedef {{
 * 		id: string,
 * 		title: string,
 * 		dataId: string,
 * 		firstSeen: number,
 * 		lastSeen: number,
 * 		n: number,
 * 		self: string
 * }} MeetingData
 */

/**
 * @typedef {{
 * 		name: string,
 * 		subname: string[],
 * 		avatar: string,
 * 		firstSeen: number,
 * 		lastSeen: number,
 * 		dataId: string
 * }} ParticipantData
 */

/**
 * @typedef {{
 * 		type: string,
 * 		time: number,
 * 		data?: string
 * }} EventData
 */

/**
 * @typedef {string} EncodedEventData
 */


class Store {

	static defaultOptions = {
		debug: false,
		track_mic: true,
		track_cam: true,
		track_voice: true,
		track_reactions: true,
		track_messages: true,
		track_message_content: false,
		track_hands: true,
		track_presentation: true
	}

	static eventTypes = {
		"join": "0",
		"leave": "1",
		"cam on": "2",
		"cam off": "3",
		"mic on": "4",
		"mic off": "5",
		"voice on": "6",
		"voice off": "7",
		"hand": "8",
		"emoji": "9",
		"chat": "a",
		"presentation on": "b",
		"presentation off": "c"
	}

	static eventMap = Object.entries(Store.eventTypes).reduce((a, t) => (a[t[1]] = t[0]) && a, {});


	/**
	 * DJB2 hash, not the best but simple and fast
	 * @param {string} str 
	 */
	static hash(str) {
		const len = str.length;
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
		let { meet_options: options } = await chrome.storage.sync.get("meet_options");
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
		return chrome.storage.sync.set({
			meet_options: {
				...this.defaultOptions,
				...options
			}
		});
	}

	/**
	 * @param {string} id 
	 */
	static async findOrCreateMeeting(id) {
		const now = Date.now();
		const list = await Store.listMeetings();
		const existing = list.find(x => x.id === id && x.lastSeen + 3600000 > now);
		if(existing) {
			return existing;
		}
		const obj = {
			id,
			title: "",
			dataId: Store.hash(`${id}-${now.toString(36)}`),
			firstSeen: now,
			lastSeen: now,
			n: 0,
			self: ""
		};
		list.push(obj);
		// @ts-ignore
		await chrome.storage.local.set({ list });
		return obj;
	}

	/**
	 * @returns {Promise<MeetingData[]>} 
	 */
	static async listMeetings() {
		// @ts-ignore
		const list = await chrome.storage.local.get("list");
		return list?.list || [];
	}

	/**
	 * @param {string} dataId 
	 * @return {Promise<ParticipantData[]>} 
	 */
	static async listMeetingParticipants(dataId) {
		const id = `P-${dataId}`;
		// @ts-ignore
		const list = await chrome.storage.local.get(id);
		return list[id] || [];
	}

	/**
	 * @param {string} meetingId 
	 * @param {ParticipantData[]} data 
	 */
	static updateMeetingParticipants(meetingId, data) {
		// @ts-ignore
		return chrome.storage.local.set({ [`P-${meetingId}`]: data });
	}

	/**
	 * @param {string} meetingId 
	 * @param {string} participantId 
	 * @returns {Promise<EventData[]>} 
	 */
	static async getParticipantData(meetingId, participantId) {
		const data = await Store.getParticipantEncodedData(meetingId, participantId);
		return data.map(x => Store.decodeEvent(x));
	}

	/**
	 * @param {string} meetingId 
	 * @param {string} participantId 
	 * @returns {Promise<string[]>} 
	 */
	static async getParticipantEncodedData(meetingId, participantId) {
		const id = `D-${meetingId}-${participantId}`;
		// @ts-ignore
		const data = await chrome.storage.local.get(id);
		return data[id] || [];
	}

	/**
	 * @param {string} meetingId 
	 * @param {string[]} participantIds 
	 * @returns {Promise<Record<string, EventData[]>>}
	 */
	static async getMultipleParticipantsData(meetingId, participantIds) {
		const data = await Store.getMultipleParticipantsEncodedData(meetingId, participantIds);
		return Object.entries(data).reduce((a, t) => {
			const events = t[1].map(x => Store.decodeEvent(x));
			a[t[0].split("-")[2]] = events;
			return a;
		}, {});
	}

	/**
	 * @param {string} meetingId 
	 * @param {string[]} participantIds 
	 * @returns {Promise<Record<string, string[]>>}
	 */
	static async getMultipleParticipantsEncodedData(meetingId, participantIds) {
		// @ts-ignore
		const data = await chrome.storage.local.get(participantIds.map(x => `D-${meetingId}-${x}`));
		return data;
	}

	/**
	 * @param {string} x 
	 */
	static decodeEvent(x) {
		return {
			type: Store.eventMap[x[0]],
			time: (x.charCodeAt(1) << 24) + (x.charCodeAt(2) << 16) + (x.charCodeAt(3) << 8) + x.charCodeAt(4),
			...x.length > 5 ? { data: x.slice(5) } : {}
		};
	}

	/**
	 * @param {Record<string, any>} data 
	 */
	static setRaw(data) {
		// @ts-ignore
		return chrome.storage.local.set(data);
	}
}
