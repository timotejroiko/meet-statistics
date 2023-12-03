"use strict";

class Main {
	/**
	 * @param {typeof Store} store 
	 */
	constructor(store) {
		this.store = store;
		this.list = /** @type {MeetingData[]} */ ([]);

		/** @type {MeetingTable | null} */ this.meetings = null;
		/** @type {ParticipantTable | null} */ this.participants = null;

		this.mainNode = /** @type {HTMLElement} */ (document.getElementById("main"));
		this.sidebarNode = /** @type {HTMLElement} */ (this.mainNode.querySelector(".sidebar"));
		this.statsNode = /** @type {HTMLElement} */ (this.sidebarNode.querySelector(".lower .stats"));

		this.optionsNode = /** @type {HTMLElement} */ (this.mainNode.querySelector(".options"));
		this.optionsView = /** @type {HTMLCollectionOf<HTMLElement>} */ (this.optionsNode.getElementsByClassName("option"));

		this.bindMainSidebarButtons();
	}

	async init() {
		this.list = await this.store.listMeetings();
		await this.updateSidebarStats();

		this.route();
		window.onpopstate = () => {
			this.route();
		};
	}

	/**
	 * @param {string} meeting 
	 * @param {string} participant 
	 */
	async route(meeting = "", participant = "") {
		if(meeting) {
			let str = `?meeting=${meeting}`;
			if(participant) {
				str += `&participant=${participant}`;
			}
			history.pushState(null, "", str);
		}

		const urlParams = new URLSearchParams(window.location.search);
		const meetID = urlParams.get("meeting");
		const participantID = urlParams.get("participant");

		if(meetID) {
			const split = meetID.split(",");
			const selected = this.list.filter(x => split.includes(x.dataId));
			if(selected.length) {
				if(selected.length > 1) {
					// TODO
					this.setPage("meeting");
					// loadMeeting(m, participants);
				} else {
					const m = selected[0];
					const participants = await this.store.listMeetingParticipants(m.dataId);
					if(participantID) {
						// TODO
						const participant = participants.find(x => x.dataId === participantID);
						document.title = `${m.title} - ${participant?.name}`;
						this.setPage("participant");
						//this.participant ??= new Participant(this);
						//this.participant.draw(participant);
					} else {
						document.title = m.title;
						this.setPage("meeting");
						this.participants ??= new ParticipantTable(this);
						this.participants.draw(participants, m);
					}
				}
			} else {
				history.replaceState(null, "", "?");
				this.route();
			}
		} else {
			this.setPage("main");
			this.meetings ??= new MeetingTable(this);
			this.meetings.draw(this.list);
		}
	}

	/**
	 * @param {string} page 
	 */
	setPage(page) {
		for(const p of ["main", "meeting", "participant"]) {
			if(page === p) {
				this.mainNode.classList.add(p);
			} else {
				this.mainNode.classList.remove(p);
			}
		}
	}

	async updateSidebarStats() {
		// @ts-ignore
		const s = await chrome.storage.local.getBytesInUse();
		this.statsNode.children[0].children[1].textContent = this.list.length.toString();
		this.statsNode.children[1].children[1].textContent = `${(s / 1024).toFixed(2)}KB`;
	}

	bindMainSidebarButtons() {
		const menuItems = /** @type {NodeListOf<HTMLElement>} */ (this.sidebarNode.querySelectorAll(".menu div"));
		const settingsOk = /** @type {HTMLElement} */ (this.optionsNode.querySelector(".ok"));

		const settings = menuItems[0];
		settings.onclick = () => {
			this.mainNode.classList.toggle("opts");
		};
		settingsOk.onclick = () => {
			this.mainNode.classList.toggle("opts");
		}
		this.store.getOptions().then(options => {
			for(const optionNode of this.optionsView) {
				const key = /** @type {string} */ (optionNode.dataset.option);
				const button = /** @type {HTMLElement} */ (optionNode.children[1]);
				button.textContent = options[key] ? "toggle_on" : "toggle_off";
				optionNode.dataset.enabled = Boolean(options[key]).toString();
				button.onclick = () => {
					const oldstate = optionNode.dataset.enabled;
					optionNode.dataset.enabled = oldstate === "true" ? "false" : "true";
					button.textContent = oldstate === "false" ? "toggle_on" : "toggle_off";
					if(oldstate === "false" && !options[key] || oldstate === "true" && options[key]) {
						options[key] = !options[key];
						this.store.setOptions(options).catch(console.error);
					}
				};
			}
		});

		const imprt = menuItems[1];
		imprt.onclick = () => {
			const input = document.createElement("input");
			input.type = "file";
			input.multiple = true;
			input.accept = ".mscb";
			input.onchange = async e => {
				const target = /** @type {typeof input} */ (e.target);
				const files = /** @type {FileList} */ (target.files);
				const newlist = [];
				const data = {};
				for(const file of files) {
					const string = await new Response(file.stream().pipeThrough(new DecompressionStream("deflate"))).text();
					const list = JSON.parse(string);
					newlist.push(...list);
				}
				if(newlist.length) {
					const ok = confirm(`Importing ${newlist.length} meetings:\n\n${newlist.map(x => x.title).join("\n")}`);
					if(!ok) {
						return;
					}
				} else {
					alert("File is corrupt or empty");
					return;
				}
				const oldlist = this.list;
				const toreplace = [];
				for(const meeting of newlist) {
					const oldmeeting = oldlist.find(x => x.dataId === meeting.dataId);
					if(oldmeeting) {
						toreplace.push({
							meeting,
							oldmeeting
						});
					} else {
						for(const participant of meeting.participants) {
							data[`D-${meeting.dataId}-${participant.dataId}`] = participant.data;
							delete participant.data;
						}
						data[`P-${meeting.dataId}`] = meeting.participants;
						delete meeting.participants;
						oldlist.push(meeting);
					}
				}
				if(toreplace.length) {
					const ok = confirm(`${toreplace.length} meetings already exist:\n\n${toreplace.map(x => x.oldmeeting.title).join("\n")}\n\nOverwrite them?`);
					if(ok) {
						for(const { meeting, oldmeeting } of toreplace) {
							const oldmeetingparticipants = await this.store.listMeetingParticipants(oldmeeting.dataId);
							// @ts-ignore
							chrome.storage.local.remove(oldmeetingparticipants.map(x => `D-${oldmeeting.dataId}-${x.dataId}`));
							for(const participant of meeting.participants) {
								data[`D-${meeting.dataId}-${participant.dataId}`] = participant.data;
								delete participant.data;
							}
							data[`P-${meeting.dataId}`] = meeting.participants;
							delete meeting.participants;
							oldlist.splice(oldlist.indexOf(oldmeeting), 1);
							oldlist.push(meeting);
						}
					}
				}
				alert(`Imported ${oldlist.length} meetings!`);
				this.list = oldlist;
				data.list = oldlist;
				this.store.setRaw(data);
				this.route();
			};
			input.dispatchEvent(new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				view: window
			}));
		};

		const exprt = menuItems[2];
		exprt.onclick = async () => {
			const newlist = [];
			for(const item of this.list) {
				const newitem = Object.assign({}, item);
				const participants = await this.store.listMeetingParticipants(item.dataId);
				const data = this.store.getMultipleParticipantsEncodedData(item.dataId, participants.map(x => x.dataId));
				for(const participant of participants) {
					participant["data"] = data[`D-${item.dataId}-${participant.dataId}`];
				}
				newitem["participants"] = participants;
				newlist.push(newitem);
			}
			await this.export(newlist, `${newlist.length}-meetings-${new Date().toISOString()}.mscb`);
		};

		const delet = menuItems[3];
		delet.onclick = () => {
			const ok = confirm("Permanently delete all meetings?");
			if(ok) {
				const reallyok = confirm("Are you sure?");
				if(reallyok) {
					// @ts-ignore
					chrome.storage.local.clear();
					this.list = [];
					this.updateSidebarStats();
					this.route();
				}
			}
		};
	}

	/**
	 * @param {Record<string, any>[]} data 
	 * @param {string} name 
	 */
	async export(data, name) {
		const blob = await (await new Response(new Blob([JSON.stringify(data)]).stream().pipeThrough(new CompressionStream("deflate")))).blob();
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = name;
		link.dispatchEvent(new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window
		}));
	}
}
