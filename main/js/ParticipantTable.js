"use strict";

class ParticipantTable {
    /**
     * @param {Main} page 
     */
    constructor(page) {
        this.page = page;
        this.containerNode = /** @type {HTMLElement} */ (this.page.mainNode.querySelector(".container.meeting"));

        this.backNode = /** @type {HTMLElement} */ (this.containerNode.querySelector(".back"));
        this.titleNode = /** @type {HTMLElement} */ (this.containerNode.querySelector("h2"));
        this.subtitleNode = /** @type {HTMLElement} */ (this.containerNode.querySelector("h3"));

        this.actionNodes = /** @type {NodeListOf<HTMLElement>} */ (this.containerNode.querySelectorAll(".actions > div"));
		this.toolbarNode = /** @type {HTMLElement} */ (this.containerNode.querySelector(".toolbar"));
		this.searchNode = /** @type {HTMLInputElement} */ (this.toolbarNode.querySelector(".search input"));

        this.tableNode = /** @type {HTMLElement} */ (this.containerNode.querySelector("table tbody"));
        this.tableView = /** @type {HTMLCollectionOf<HTMLElement>} */ (this.tableNode.getElementsByClassName("participant"));
		this.tableHeadNode = /** @type {HTMLElement} */ (this.tableNode.firstElementChild);

        this.nodes = /** @type {ParticipantRow[]} */ ([]);
        this.dataSort = "name";
		this.sortReverse = false;

		this.bindMainToolbarButtons();
		this.bindMainTableButtons();
    }

    /**
     * @param {ParticipantData[]} participants 
     * @param {MeetingData} meeting 
     */
    draw(participants, meeting) {
        this.participants = participants;
        this.meeting = meeting;
        this.tableNode.replaceChildren(this.tableHeadNode);
        this.nodes = [];

        this.subtitleNode.innerText = `${new Date(meeting.firstSeen).toLocaleString()} - ${new Date(meeting.lastSeen).toLocaleString()} (${meeting.n} participants)`;
        this.titleNode.innerText = meeting.title;

        const promises = []

		for(const participant of participants) {
			const m = new ParticipantRow(participant, this);
            promises.push(m.load().then(() => {
                this.nodes.push(m);
                this.tableNode.appendChild(m.node);
            }));
		}

        Promise.all(promises).then(() => this.sort());
    }

    sort() {
		switch(this.dataSort) {
            case "name": this.nodes.sort((a, b) => {
				return a.participant.name.localeCompare(b.participant.name);
			}); break;

			case "time": this.nodes.sort((a, b) => {
				return b.data.time - a.data.time;
			}); break;

			case "cam": this.nodes.sort((a, b) => {
				return b.data.cam - a.data.cam;
			}); break;

			case "mic": this.nodes.sort((a, b) => {
				return b.data.mic - a.data.mic;
			}); break;

            case "voice": this.nodes.sort((a, b) => {
				return b.data.voice - a.data.voice;
			}); break;

            case "presentation": this.nodes.sort((a, b) => {
				return b.data.presentation - a.data.presentation;
			}); break;

            case "hands": this.nodes.sort((a, b) => {
				return b.data.hands - a.data.hands;
			}); break;

            case "emojis": this.nodes.sort((a, b) => {
				return b.data.emojis - a.data.emojis;
			}); break;

            case "texts": this.nodes.sort((a, b) => {
				return b.data.texts - a.data.texts;
			}); break;
		}

		if(this.sortReverse) {
			this.nodes.reverse();
		}

		for(let i = 0; i < this.nodes.length; i++) {
			const cnode = this.nodes[i].node;
			const vnode = this.tableView[i];
			if(vnode && cnode !== vnode) {
				this.tableNode.insertBefore(cnode, vnode);
			} else if(!vnode) {
				this.tableNode.appendChild(cnode);
			}
		}
    }

    bindMainToolbarButtons() {
        this.backNode.onclick = () => {
            location.replace(location.pathname);
        }

		this.searchNode.oninput = () => {
			const val = this.searchNode.value.toLowerCase();
			if(val) {
				for(const row of this.tableView) {
					const content = row.querySelectorAll("p");
					if(Array.prototype.some.call(content, x => x.textContent.toLowerCase().includes(val))) {
						row.classList.remove("hide");
					} else {
						row.classList.add("hide");
					}
				}
			} else {
				for(const row of this.tableView) {
					row.classList.remove("hide");
				}
			}
		};

        const csvButton =  this.actionNodes[0];
        csvButton.onclick = () => {
            const participants = [];
            for(const node of this.nodes) {
                participants.push({
                    ...node.participant,
                    data: node.data
                });
            }
            const filename = `${this.titleNode.textContent} - ${new Date(this.meeting?.firstSeen || Date.now()).toISOString()}`;
            Utils.exportCSV(participants, filename);
		};

        const jsonButton = this.actionNodes[1];
        jsonButton.onclick = () => {
            const meeting = /** @type {Parameters<typeof Utils.exportJSON>[0]} */ (Object.assign({ participants: [] }, this.meeting));
			for(const node of this.nodes) {
				meeting.participants.push({
					...node.participant,
					data: node.data,
					events: node.events
				});
			}
			const filename = `${meeting.title} - ${new Date(meeting.firstSeen).toISOString()}`;
			Utils.exportJSON(meeting, filename);
        }

        const pdfButton = this.actionNodes[2];
        pdfButton.onclick = () => {
            this.page.sidebarNode.style.display = "none";
            this.backNode.style.display = "none";
            this.toolbarNode.style.display = "none";
            this.subtitleNode.style.marginBottom = "20px";
            this.tableNode.style.pointerEvents = "none";
            /** @type {HTMLElement} */ (this.containerNode.parentElement).style.height = "auto";
            window.print();
            this.page.sidebarNode.style.display = "";
            this.backNode.style.display = "";
            this.toolbarNode.style.display = "";
            this.subtitleNode.style.marginBottom = "";
            this.tableNode.style.pointerEvents = "";
            /** @type {HTMLElement} */ (this.containerNode.parentElement).style.height = "";
        }
    }

    bindMainTableButtons() {
		this.tableHeadNode.onclick = event => {
			const target = /** @type {HTMLElement} */ (event.target);
			if(target.closest("th")) {
				const th = /** @type {HTMLElement} */ (target.closest("th"));
                if(th.dataset.ui) {
                    this.sortReverse = !this.sortReverse;
                    th.dataset.ui = this.sortReverse ? "▲" : "▼";
                } else {
                    const old = /** @type {NodeListOf<HTMLElement>} */ (this.tableHeadNode.querySelectorAll("th[data-ui]"));
                    for(const item of old) {
                        if(item?.dataset.ui) {
                            item.dataset.ui = "";
                        }
                    }
                    this.sortReverse = false;
                    th.dataset.ui = "▼";
                    this.dataSort = /** @type {string} */ (th.dataset.sort);
                }
                this.sort();
			}
		};
	}
}
