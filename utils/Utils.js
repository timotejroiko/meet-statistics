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
			cam: { on:false, time:0 },
			mic: { on:false, time:0 },
			voice: { on:false, time:0 },
			presentation: { on:false, time:0 },
			join: 0,
			leave: 0
		}
		for(const event of data) {
			if(event.type.endsWith("on")) {
				const ev = event.type.split(" ")[0];
				if(states[ev].on === false) {
					states[ev].on = true;
					states[ev].time = event.time;
				}
			} else if(event.type.endsWith("off")) {
				const ev = event.type.split(" ")[0];
				updated[ev] += event.time - states[ev].time;
				states[ev].on = false;
				states[ev].time = event.time;
			} else {
				switch(event.type) {
					case "hand": updated.hands++; break;
					case "emoji": updated.emojis++; break;
					case "chat": updated.texts++; break;
					case "join": states.join = event.time;
					case "leave": states.leave = event.time;
				}
			}
		}
		for(const key of ["cam", "mic", "voice", "presentation"]) {
			if(states[key].on === true) {
				if(states.leave > states[key].time) {
					updated[key] += states.leave - states[key].time;
				}
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
