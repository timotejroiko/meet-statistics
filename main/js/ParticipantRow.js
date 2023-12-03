"use strict";

class ParticipantRow {
    /**
     * @param {ParticipantData} participant 
	 * @param {ParticipantTable} table 
     */
    constructor(participant, table) {
		this.participant = participant;
		this.table = table;

        this.node = document.createElement("tr");
		this.node.classList.add("participant");
		const m = this.table.meeting?.self === this.participant.dataId ? `<span class="material-symbols-rounded" title="Me">person</span>` : "";
		const s = Array.isArray(participant.subname) && participant.subname.length ? `<span>${participant.subname.filter(x => x !== "domain_disabled").join("</span><span>")}</span>` : "";
		this.node.innerHTML = `<td><img src="${`${participant.avatar}=s48`}"><div class="break"><p>${participant.name}</p>${m + s}</div></td><td>0:00</td><td>0:00</td><td>0:00</td><td>0:00</td><td>0:00</td><td>0</td><td>0</td><td>0</td>`;

		this.data = /** @type {ReturnType<typeof Utils.parseData>} */ ({});
		this.events = /** @type {EventData[]} */ ([]);
    }

	async load() {
		const data = await this.table.page.store.getParticipantData(this.table.meeting?.dataId || "", this.participant.dataId);
		const d = Utils.parseData(this.participant, data);
		for(const key of ["time", "cam", "mic", "voice", "presentation"]) {
			this[`${key}Node`].textContent = Utils.milliToHHMMSS(d[key]);
		}
		for(const key of ["hands", "emojis", "texts"]) {
			this[`${key}Node`].textContent = d[key].toString();
		}

		this.data = d;
		this.events = data;
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
