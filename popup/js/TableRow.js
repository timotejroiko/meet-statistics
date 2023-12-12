"use strict";

class TableRow {
	/**
     * @param {Awaited<ReturnType<Store.listMeetingParticipants>>[0]} participant 
     * @param {Table} table 
     */
	constructor(participant, table) {
		this.table = table;
		this.node = document.createElement("tr");
		this.node.classList.add("participant");
		this.node.innerHTML = `<td><img src="${`${participant.avatar}=s32`}"><p>${participant.name}</p></td><td>0:00</td><td>0:00</td><td>0:00</td><td>0:00</td><td>0:00</td><td>0</td><td>0</td><td>0</td>`;
		this.participant = participant;
		this.state = {
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
	}

	/**
     * @param {this["participant"]} participant 
     */
	update(participant) {
		Object.assign(this.participant, participant);
		this.updateData([]);
	}

	/**
     * @param {Awaited<ReturnType<Store.getParticipantData>>} data 
     */
	updateData(data) {
		Utils.parseData(this.participant, data, this.state);
		for(const key of ["time", "cam", "mic", "voice", "presentation"]) {
			this[`${key}Node`].textContent = Utils.milliToHHMMSS(this.state[key].ren);
		}
		for(const key of ["hands", "emojis", "texts"]) {
			this[`${key}Node`].textContent = this.state[key].ren.toString();
		}
	}

	get parsedState() {
		return Object.entries(this.state).reduce((a, t) => {
			a[t[0]] = t[1].ren;
			return a;
		}, /** @type {ReturnType<typeof Utils.parseData>} */ ({}));
	}

	get timeNode() {
		return /** @type {HTMLElement} */ (this.node.children[1]);
	}

	get camNode() {
		return /** @type {HTMLElement} */ (this.node.children[2]);
	}

	get micNode() {
		return /** @type {HTMLElement} */ (this.node.children[3]);
	}

	get voiceNode() {
		return /** @type {HTMLElement} */ (this.node.children[4]);
	}

	get presentationNode() {
		return /** @type {HTMLElement} */ (this.node.children[5]);
	}

	get handsNode() {
		return /** @type {HTMLElement} */ (this.node.children[6]);
	}

	get emojisNode() {
		return /** @type {HTMLElement} */ (this.node.children[7]);
	}

	get textsNode() {
		return /** @type {HTMLElement} */ (this.node.children[8]);
	}
}
