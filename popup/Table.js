class Table {
    /**
     * @param {NonNullable<Awaited<ReturnType<Utils.getCurrentMeeting>>>} meeting 
     */
    constructor(meeting) {
        this.meeting = meeting;
        /** @type {TableRow[]} */ this.data = [];
        /** @type {Record<string, TableRow>} */ this.keys = {};
        this.tableNode = /** @type {HTMLElement} */ (document.querySelector(".meeting table tbody"));
        this.tableView = /** @type {HTMLCollectionOf<HTMLElement>} */ (document.getElementsByClassName("participant"));
        this.tableIcons = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("table th"));
        this.meetingNode = /** @type {HTMLElement} */ (document.querySelector(".meeting"));
		this.titleNode = /** @type {HTMLElement} */ (document.querySelector(".meeting .title"));
        this.timeNode = /** @type {HTMLElement} */ (document.querySelector(".meeting .time"));
        this.pageButton = /** @type {HTMLAnchorElement} */ (document.querySelector(".buttons .page")?.parentElement);
		this.meetingNode.dataset.id = meeting.id;
		this.titleNode.textContent = meeting.title;
		this.timeNode.textContent = Utils.milliToHHMMSS(meeting.lastSeen - meeting.firstSeen);
		this.pageButton.href = this.pageButton.href.split("?")[0] + `?meeting=${meeting.dataId}`;
    }

    async load() {
        const participants = await Store.listMeetingParticipants(this.meeting.dataId);
        const participantsData = await Store.getMultipleParticipantsData(this.meeting.dataId, participants.map(x => x.dataId));
        for(const participant of participants) {
            const row = this.getOrCreateRow(participant);
            row.update(participant);
            row.updateData(participantsData[participant.dataId]);
        }
    }

    /**
     * @param {this["meeting"]} meeting 
     */
    update(meeting) {
        Object.assign(this.meeting, meeting);
        this.timeNode.textContent = Utils.milliToHHMMSS(meeting.lastSeen - meeting.firstSeen);
    }

    /**
     * @param {string} id 
     */
    get(id) {
        return this.keys[id];
    }

    /**
     * @param {Awaited<ReturnType<Store.listMeetingParticipants>>[0]} participant 
     */
    getOrCreateRow(participant) {
        let data = this.keys[participant.dataId];
        if(!data) {
            const d = new TableRow(participant);
            this.data.push(d);
            data = this.keys[participant.dataId] = d;
        }
        return data;
    }

    render() {
        const sort = this.meetingNode.dataset.sort;
        const reverse = this.meetingNode.dataset.reverse === "true";

        if(sort) {
            this.data.sort((a,b) => {
                const r = b.state[sort].ren - a.state[sort].ren;
                if(r === 0) {
                    return a.participant.name < b.participant.name ? -1 : a.participant.name > b.participant.name ? 1 : 0;
                }
                return r;
            });
        } else {
            this.data.sort((a,b) => a.participant.name < b.participant.name ? -1 : a.participant.name > b.participant.name ? 1 : 0);
        }
    
        if(reverse) {
            this.data.reverse();
        }
    
        for(let i = 0; i < this.data.length; i++) {
            const cnode = this.data[i].node;
            const vnode = this.tableView[i];
            if(vnode && cnode !== vnode) {
                this.tableNode.insertBefore(cnode, vnode);
            } else if(!vnode) {
                this.tableNode.appendChild(cnode);
            }
        }
    }
}
