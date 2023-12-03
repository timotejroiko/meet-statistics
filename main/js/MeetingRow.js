"use strict";

class MeetingRow {
    /**
     * @param {MeetingData} meeting 
     * @param {MeetingTable} table 
     */
    constructor(meeting, table) {
        this.meeting = meeting;
        this.table = table;
        const date = new Date(meeting.firstSeen);
        const d1 = date.toLocaleDateString();
        const d2 = date.toLocaleTimeString();
        const d3 = Utils.milliToHHMMSSFull(meeting.lastSeen - meeting.firstSeen);
        const n = meeting.n;
        this.node = document.createElement("tr");
		this.node.classList.add("meeting");
        this.node.innerHTML = "<td class=\"checkbox\"><label><input type=\"checkbox\"/></label></td>"
            + `<td class="left"><div class="break"><p class="title">${meeting.title || "?"}</p><p class="id">${meeting.id}</p></div></td>`
            + `<td class="left"><div class="break"><p class="date">${d1}</p><p class="time">${d2}</p></div></td>`
            + `<td class="center n"><p>${n}</p><span class="material-symbols-rounded" title="Participants">person</span></td>`
            + `<td class="center"><div class="break"><p>${d3}</p></div></td>`
            + "<td class=\"center actions\">"
                + "<span class=\"material-symbols-rounded\" title=\"Download CSV\" data-content=\"CSV\">download</span>"
                + "<span class=\"material-symbols-rounded\" title=\"Download JSON\" data-content=\"JSON\">download</span>"
                + "<span class=\"material-symbols-rounded delete\" title=\"Delete\">delete</span>"
            + "</td>";
        this.bindButtons();
    }

    delete() {
        const index1 = this.table.nodes.findIndex(x => x.meeting === this.meeting);
        if(index1 > -1) {
            this.table.nodes.splice(index1, 1);
        }
        const index2 = this.table.page.list.indexOf(this.meeting);
        if(index2 > -1) {
            this.table.page.list.splice(index2, 1);
        }
        this.node.remove();
    }

    bindButtons() {
        this.csvNode.onclick = async () => {
            const participants = /** @type {Parameters<typeof Utils.exportCSV>[0]} */ (await Store.listMeetingParticipants(this.meeting.dataId));
            const participantsData = await Store.getMultipleParticipantsData(this.meeting.dataId, participants.map(x => x.dataId));
            for(const participant of participants) {
                const data = participantsData[participant.dataId];
                const parsed = Utils.parseData(participant, data);
                participants["data"] = parsed;
            }
            const filename = `${this.meeting.title} - ${new Date(this.meeting.firstSeen).toISOString()}`;
            Utils.exportCSV(participants, filename);
        }

        this.jsonNode.onclick = async () => {
            const meeting = /** @type {Parameters<typeof Utils.exportJSON>[0]} */ (Object.assign({ participants: [] }, this.meeting));
			const participants = await this.table.page.store.listMeetingParticipants(meeting.dataId);
			const participantsData = await this.table.page.store.getMultipleParticipantsData(meeting.dataId, participants.map(x => x.dataId));
			for(const participant of participants) {
                const data = participantsData[participant.dataId];
				meeting.participants.push({
					...participant,
					data: Utils.parseData(participant, data),
					events: data
				});
			}
			const filename = `${meeting.title} - ${new Date(meeting.firstSeen).toISOString()}`;
			Utils.exportJSON(meeting, filename);
        }

        this.deleteNode.onclick = async () => {
            const ok = confirm(`Permanently delete ${this.meeting.title}?`);
            if(ok) {
                this.delete();
                await this.table.page.store.setRaw({ list: this.table.page.list });
            };
        }

        this.node.onclick = event => {
            const target = /** @type {HTMLElement} */ (event.target);
            if(target.closest(".checkbox")) {
                this.table.toggleActionButtons();
            } else if(!target.closest(".break")) {
                this.table.page.route(this.meeting.dataId);
            }
        }
    }

    get checkboxNode() {
        return /** @type {HTMLElement} */ (this.node.children[0].firstElementChild?.firstElementChild);
    }

    get titleNode() {
        return /** @type {HTMLElement} */ (this.node.children[1].firstElementChild?.children[0]);
    }

    get idNode() {
        return /** @type {HTMLElement} */ (this.node.children[1].firstElementChild?.children[1]);
    }

    get dateNode() {
        return /** @type {HTMLElement} */ (this.node.children[2].firstElementChild?.children[0]);
    }

    get timeNode() {
        return /** @type {HTMLElement} */ (this.node.children[2].firstElementChild?.children[1]);
    }

    get participantsNode() {
        return /** @type {HTMLElement} */ (this.node.children[3].firstElementChild);
    }

    get durationNode() {
        return /** @type {HTMLElement} */ (this.node.children[4].firstElementChild?.firstElementChild);
    }

    get csvNode() {
        return /** @type {HTMLElement} */ (this.node.children[5].children[0]);
    }

    get jsonNode() {
        return /** @type {HTMLElement} */ (this.node.children[5].children[1]);
    }

    get deleteNode() {
        return /** @type {HTMLElement} */ (this.node.children[5].children[2]);
    }
}