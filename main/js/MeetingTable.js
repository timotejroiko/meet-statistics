"use strict";

class MeetingTable {
	/**
	 * @param {Main} page 
	 */
	constructor(page) {
		this.page = page;
		this.containerNode = /** @type {HTMLElement} */ (this.page.mainNode.querySelector(".container.main"));

		this.actionNodes = /** @type {NodeListOf<HTMLElement>} */ (this.containerNode.querySelectorAll(".actions > div"));
		this.toolbarNode = /** @type {HTMLElement} */ (this.containerNode.querySelector(".toolbar"));
		this.searchNode = /** @type {HTMLInputElement} */ (this.toolbarNode.querySelector(".search input"));

		this.tableNode = /** @type {HTMLElement} */ (this.containerNode.querySelector("table tbody"));
		this.tableView = /** @type {HTMLCollectionOf<HTMLElement>} */ (this.tableNode.getElementsByClassName("meeting"));
		this.tableHeadNode = /** @type {HTMLElement} */ (this.tableNode.firstElementChild);

		this.nodes = /** @type {MeetingRow[]} */ ([]);
		this.dataSort = "date";
		this.sortReverse = false;

		this.bindMainToolbarButtons();
		this.bindMainTableButtons();
	}

	/**
	 * @param {MeetingData[]} meetings 
	 */
	draw(meetings) {
		for(const node of this.nodes) {
			if(!meetings.includes(node.meeting)) {
				node.delete();
			}
		}
		for(const meeting of meetings) {
			if(typeof meeting.n !== "number") {
				this.page.store.listMeetingParticipants(meeting.dataId).then(x => {
					meeting.n = x.length;
				});
				return this.draw(meetings);
			}
			if(this.nodes.find(x => x.meeting === meeting)) {
				continue;
			}
			const m = new MeetingRow(meeting, this);
			this.nodes.push(m);
			this.tableNode.appendChild(m.node);
		}
		this.sort();
	}

	sort() {
		switch(this.dataSort) {
			case "date": this.nodes.sort((a, b) => {
				return b.meeting.firstSeen - a.meeting.firstSeen;
			}); break;

			case "name": this.nodes.sort((a, b) => {
				return a.meeting.title.localeCompare(b.meeting.title);
			}); break;

			case "participants": this.nodes.sort((a, b) => {
				return b.meeting.n - a.meeting.n;
			}); break;

			case "duration": this.nodes.sort((a, b) => {
				return (b.meeting.lastSeen - b.meeting.firstSeen) - (a.meeting.lastSeen - a.meeting.firstSeen);
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
		this.searchNode.oninput = () => {
			const val = this.searchNode.value.toLowerCase();
			if(val) {
				for(const row of this.tableView) {
					const content = [...row.querySelectorAll("p"), ...row.querySelectorAll("span")];
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

		const [merge, expor, delet] = /** @type {NodeListOf<HTMLElement>} */ (this.toolbarNode.querySelectorAll(".actions > div"));

		merge.onclick = () => {
			const checked = /** @type {NodeListOf<HTMLElement>} */ (this.tableNode.querySelectorAll(".meeting .checkbox input:checked"));
			const selected = /** @type {HTMLElement[]} */ (Array.prototype.map.call(checked, x => x.closest(".meeting")));
			this.page.route(selected.map(x => x.dataset.id).join(","));
		};

		expor.onclick = async () => {
			const checked = /** @type {NodeListOf<HTMLElement>} */ (this.tableNode.querySelectorAll(".meeting .checkbox input:checked"));
			const selected = /** @type {HTMLElement[]} */ (Array.prototype.map.call(checked, x => x.closest(".meeting")));
			const json = this.nodes.filter(x => selected.find(z => x.meeting.dataId === z.dataset.id)).map(x => x.meeting);
			for(const item of json) {
				const participants = await this.page.store.listMeetingParticipants(item.dataId);
				const data = this.page.store.getMultipleParticipantsEncodedData(item.dataId, participants.map(x => x.dataId));
				for(const participant of participants) {
					participant["data"] = data[`D-${item.dataId}-${participant.dataId}`];
				}
				item["participants"] = participants;
			}
			await this.page.export(json, `${json.length}-meetings-${new Date().toISOString()}.mscb`);
		};

		delet.onclick = async () => {
			const checked = /** @type {NodeListOf<HTMLElement>} */ (this.tableNode.querySelectorAll(".meeting .checkbox input:checked"));
			const selected = Array.prototype.map.call(checked, x => x.closest(".meeting"));
			const ok = confirm(`Permanently delete ${selected.length} items?`);
			if(ok) {
				const toDelete = [];
				for(const row of selected) {
					const node = this.nodes.find(x => x.meeting.dataId === row.dataset.id);
					if(node) {
						const participants = await this.page.store.listMeetingParticipants(node.meeting.dataId);
						toDelete.push(`P-${node.meeting.dataId}`, ...participants.map(x => `D-${node.meeting.dataId}-${x.dataId}`));
						node.delete();
					}
				}
				// @ts-ignore
				await Promise.all([chrome.storage.local.set({ list }), chrome.storage.local.remove(toDelete)]);
				this.page.updateSidebarStats();
			}
		};
	}

	bindMainTableButtons() {
		this.tableHeadNode.onclick = event => {
			const target = /** @type {HTMLElement} */ (event.target);
			if(target.closest(".checkbox")) {
				if(target.tagName === "INPUT") {
					const view = this.tableNode.getElementsByClassName("meeting");
					const state = /** @type {HTMLInputElement} */ (target);
					for(const row of view) {
						const checkbox = /** @type {HTMLInputElement} */ (row.querySelector("input"));
						checkbox.checked = state.checked;
					}
					this.toggleActionButtons();
				}
			} else if(target.closest("th[data-sort]")) {
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

	toggleActionButtons() {
		const l = this.tableNode.querySelectorAll(".meeting .checkbox input:checked").length;
		if(l > 0) {
			this.actionNodes[1].classList.remove("disabled");
			this.actionNodes[2].classList.remove("disabled");
			if(l > 1) {
				this.actionNodes[0].classList.remove("disabled");
			} else {
				this.actionNodes[0].classList.add("disabled");
			}
		} else {
			this.actionNodes[0].classList.add("disabled");
			this.actionNodes[1].classList.add("disabled");
			this.actionNodes[2].classList.add("disabled");
		}
	}
}
