"use strict";

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
	* @param {number} milliseconds 
	*/
	static milliToHHMMSSFull(milliseconds) {
		const time = Math.round(milliseconds / 1000);
		const s = (time % 60).toString().padStart(2, "0");
		const m = (Math.floor(time / 60) % 60).toString().padStart(2, "0");
		const h = Math.floor(time / 3600).toString().padStart(2, "0");
		return `${h}:${m}:${s}`;
	}

	/**
	 * @param {Awaited<ReturnType<Store.listMeetingParticipants>>[0]} participant 
	 * @param {Awaited<ReturnType<Store.getParticipantData>>} events 
	 * @param {*} s 
	 * @returns {{
	 * 		time: number,
	 * 		cam: number,
	 * 		mic: number,
	 * 		voice: number,
	 * 		presentation: number,
	 * 		hands: number,
	 * 		emojis: number,
	 * 		texts: number
	 * }}
	 */
	static parseData(participant, events, s = null) {
		const state = s || {
			time: {
				on: true,
				t: 0,
				acc: 0,
				ren: 0,
				d: []
			},
			cam: {
				on: false,
				t: 0,
				acc: 0,
				ren: 0
			},
			mic: {
				on: false,
				t: 0,
				acc: 0,
				ren: 0
			},
			voice: {
				on: false,
				t: 0,
				acc: 0,
				ren: 0
			},
			presentation: {
				on: false,
				t: 0,
				acc: 0,
				ren: 0
			},
			hands: { ren: 0 },
			emojis: { ren: 0 },
			texts: { ren: 0 }
		};
		for(const event of events) {
			if(event.type.endsWith("on")) {
				const ev = event.type.split(" ")[0];
				if(state[ev].on === false) {
					state[ev].on = true;
					state[ev].t = event.time;
				}
			} else if(event.type.endsWith("off")) {
				const ev = event.type.split(" ")[0];
				state[ev].acc += event.time - state[ev].t;
				state[ev].on = false;
				state[ev].t = event.time;
			} else {
				switch(event.type) {
					case "hand": state.hands.ren++; break;
					case "emoji": state.emojis.ren++; break;
					case "chat": state.texts.ren++; break;
					case "join": {
						if(state.time.on === false) {
							state.time.on = true;
							state.time.t = event.time;
						}
						state.time.d.push(event.data);
						break;
					}
					case "leave": {
						state.time.d.splice(state.time.d.indexOf(event.data), 1)[0];
						if(!state.time.d.length) {
							state.time.acc += event.time - state.time.t;
							state.time.on = false;
							state.time.t = event.time;
						}
						break;
					}
				}
			}
		}
		for(const key of ["time", "cam", "mic", "voice", "presentation"]) {
			if(state[key].on === true) {
				if(state.time.on === false && state.time.t > state[key].t) {
					state[key].ren = state[key].acc + (state.time.t - state[key].t);
				} else if(participant.lastSeen > state[key].t) {
					state[key].ren = state[key].acc + (participant.lastSeen - state[key].t);
				}
			}
			if(state[key].acc > state[key].ren) {
				state[key].ren = state[key].acc;
			}
		}

		return Object.entries(state).reduce((a, t) => {
			a[t[0]] = t[1].ren;
			return a;
		}, /** @type {typeof state} */ ({}));
	}

	/**
	 * @param {(ParticipantData & { data: ReturnType<typeof Utils.parseData> })[]} participants 
	 * @param {string} filename 
	 */
	static exportCSV(participants, filename) {
		let csv = `"Participant","Attendance time","Camera time","Mic time","Time speaking","Time presenting","Hands raised","Emojis sent","Messages sent"`;
		for(const participant of participants) {
			csv += "\n" + `"${participant.name}"`;
			for(const key of ["time", "cam", "mic", "voice", "presentation"]) {
				csv += "," + `"${Utils.milliToHHMMSSFull(participant.data[key])}"`;
			}
			for(const key of ["hands", "emojis", "texts"]) {
				csv += "," + `"${participant.data[key].toString()}"`;
			}
		}
		const link = document.createElement('a');
		link.href = `data:text/plain,${csv}`;
		link.download = `${filename}.csv`;
		link.dispatchEvent(new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		}));
	}

	/**
	 * @param {MeetingData & { participants: (ParticipantData & { data: ReturnType<typeof Utils.parseData>, events: EventData[] })[] }} meeting 
	 * @param {string} filename 
	 */
	static exportJSON(meeting, filename) {
		const link = document.createElement("a");
		link.href = `data:text/plain,${JSON.stringify(meeting)}`;
		link.download = `${filename}.json`;
		link.dispatchEvent(new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window
		}));
	}
}
