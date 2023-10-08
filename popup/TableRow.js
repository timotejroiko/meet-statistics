class TableRow {
    /**
     * @param {Awaited<ReturnType<Store.listMeetingParticipants>>[0]} participant 
     */
    constructor(participant) {
        this.node = document.createElement("tr");
        this.node.classList.add("participant");
        this.node.innerHTML = `<td><img src="${participant.avatar + "=s32"}"><p>${participant.name}</p></td><td>0:00</td><td>0:00</td><td>0:00</td><td>0:00</td><td>0:00</td><td>0</td><td>0</td><td>0</td>`;
        this.participant = participant;
        this.state = {
            time: { on: true, t: 0, acc: 0, ren: 0 },
            cam: { on: false, t: 0, acc: 0, ren: 0 },
            mic: { on: false, t: 0, acc: 0, ren: 0 },
            voice: { on: false, t: 0, acc: 0, ren: 0 },
            presentation: { on: false, t:0, acc: 0, ren: 0 },
            hands: { ren: 0 },
            emojis: { ren: 0 },
            texts: { ren: 0 }
        };
        console.log(this)
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
        for(const event of data) {
            if(event.type.endsWith("on")) {
                const ev = event.type.split(" ")[0];
                if(this.state[ev].on === false) {
                    this.state[ev].on = true;
                    this.state[ev].t = event.time;
                }
            } else if(event.type.endsWith("off")) {
                const ev = event.type.split(" ")[0];
                this.state[ev].acc += event.time - this.state[ev].t;
                this.state[ev].on = false;
                this.state[ev].t = event.time;
            } else {
                switch(event.type) {
                    case "hand": this.state.hands.ren++; break;
                    case "emoji": this.state.emojis.ren++; break;
                    case "chat": this.state.texts.ren++; break;
                    case "join": {
                        if(this.state.time.on === false) {
                            this.state.time.on = true;
                            this.state.time.t = event.time;
                        }
                        break;
                    }
                    case "leave": {
                        this.state.time.acc += event.time - this.state.time.t;
                        this.state.time.on = false;
                        this.state.time.t = event.time;
                        break;
                    }
                }
            }
        }
        for(const key of ["time", "cam", "mic", "voice", "presentation"]) {
            if(this.state[key].on === true) {
                if(this.state.time.on === false && this.state.time.t > this.state[key].t) {
                    this.state[key].ren = this.state[key].acc + (this.state.time.t - this.state[key].t);
                } else if(this.participant.lastSeen > this.state[key].t) {
                    this.state[key].ren = this.state[key].acc + (this.participant.lastSeen - this.state[key].t);
                }
            }
            if(this.state[key].acc > this.state[key].ren) {
                this.state[key].ren = this.state[key].acc;
            }
            this[`${key}Node`].textContent = Utils.milliToHHMMSS(this.state[key].ren);
        }
        for(const key of ["hands", "emojis", "texts"]) {
            this[`${key}Node`].textContent = this.state[key].ren.toString();
        }
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