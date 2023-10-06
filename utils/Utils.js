class Utils {
	/**
	* @param {number} milliseconds 
	*/
	static milliToHHMMSS(milliseconds) {
		const time = Math.round(milliseconds / 1000);
		const s = (time % 60).toString().padStart(2, "0");
		const m = (Math.floor(time / 60) % 60).toString();
		const h = Math.floor(time / 3600);
		return `${h > 0 ? `${h}:` : ""}${h > 0 ? m.padStart(2, "0") : m}:${s}`;
	}

	/**
	 * @returns {Promise<Awaited<ReturnType<Store.listMeetings>>[0] | undefined>}
	 */
	static async getCurrentMeeting() {
		// @ts-ignore
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true
		});
		const title = tab.title;
		const list = await Store.listMeetings();
		return list.findLast(x => x.title === title);
	}

	/**
	 * @param {Awaited<ReturnType<Store.getParticipantData>>} data
	 */
	static parseData(data) {
		const updated = {
			cam: 0,
			mic: 0,
			voice: 0,
			presentation: 0,
			hands: 0,
			emojis: 0,
			texts: 0
		}
		const states = {
			cam: 0,
			mic: 0,
			voice: 0,
			presentation: 0
		}
		for(const event of data) {
			switch(event.type) {
				case "cam on": states.cam ||= event.time; break;
				case "cam off": updated.cam += event.time - states.cam; states.cam = 0; break;
				case "mic on": states.mic ||= event.time; break;
				case "mic off": updated.mic += event.time - states.mic; states.mic = 0; break;
				case "voice on": states.voice ||= event.time; break;
				case "voice off": updated.voice += event.time - states.voice; states.voice = 0; break;
				case "presentation on": states.presentation ||= event.time; break;
				case "presentation off": updated.presentation += event.time - states.presentation; states.presentation = 0; break;
				case "hand": updated.hands++; break;
				case "emoji": updated.emojis++; break;
				case "chat": updated.texts++; break;
			}
		}
		return updated;
	}

	/**
	 * @param {Awaited<ReturnType<Store.listMeetingParticipants>>[0]} participant 
	 */
	static createNode(participant) {
		const node = document.createElement("tr");
		node.classList.add("participant");
		node.innerHTML = `<td><img src="${participant.avatar + "=s32"}"><p>${participant.name}</p></td><td>0:00</td><td>0:00</td><td>0:00</td><td>0:00</td><td>0:00</td><td>0</td><td>0</td><td>0</td>`;
		return {
			name: participant.name,
			calculated: {
				time: 0,
				cam: 0,
				mic: 0,
				voice: 0,
				presentation: 0,
				hands: 0,
				emojis: 0,
				texts: 0
			},
			node
		};
	}
}
