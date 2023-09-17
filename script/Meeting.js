class MeetStatisticsError extends Error {
	constructor(...args) {
		super(...args);
		this.name = this.constructor.name;
	}
}

class Meeting {
	/**
	 * @param {Awaited<ReturnType<typeof Store.findOrCreateMeeting>>} info
	 * @param {typeof Store.defaultOptions} options 
	 * @param {typeof Store} store 
	 */
	constructor(info, options, store) {
		/** @type {Map<string, Participant>} */ this.participants = new Map();
		this.info = info;
		this.options = options;
		this.store = store;
		
		this._grid_node = null;
		this._grid_observer = null;
		this._grid_reactions_node = null;
		this._grid_reactions_observer = null;
		this._grid_messages_node = null;
		this._grid_messages_observer = null;
		
		this._tab1_node = null;
		this._tab1_hands_container_node = null;
		this._tab1_hands_container_observer = null;
		this._tab1_hands_list_node = null;
		this._tab1_hands_list_observer = null;
		this._tab1_hands_node = null;
		this._tab1_hands_observer = null;
		this._tab1_contributors_list_node = null;
		this._tab1_contributors_list_observer = null;
		this._tab1_contributors_node = null;
		this._tab1_contributors_observer = null;
		
		this._tab2_node = null;
		this._tab2_chat_node = null;
		this._tab2_chat_observer = null;
		
		this._interval = -1;
		this._self_name = document.querySelector("div[data-self-name]")?.getAttribute("data-self-name") || "You";
	}
	
	get active() {
		return this._interval > -1;
	}

	get _debug() {
		return this.options.debug;
	}
	
	start() {
		this._interval = setInterval(() => {
			const grid = document.querySelector("div[data-participant-id]:not([role])");
			if(this._grid_node && !grid) {
				this._detachMain();
			} else if(grid && !this._grid_node) {
				this._attachMain();
			}
			const tab1 = document.querySelector("div[data-tab-id='1']");
			if(this._tab1_node && !tab1) {
				this._detachTab1();
			} else if(tab1 && !this._tab1_node) {
				this._attachTab1();
			}
			const tab2 = document.querySelector("div[data-tab-id='2']");
			if(this._tab2_node && !tab2) {
				this._detachTab2();
			} else if(tab2 && !this._tab2_node) {
				this._attachTab2();
			}
			// dont wanna deal with background process and messaging, so we just sync every second lol
			this.syncData().catch(e => {
				console.error(e);
				this.stop();
			});
		}, 1000);
		if(this._debug) {
			console.log("monitoring started");
		}
	}
	
	stop() {
		clearInterval(this._interval);
		this._interval = -1;
		if(this._grid_node) {
			this._detachMain();
		}
		if(this._tab1_node) {
			this._detachTab1();
		}
		if(this._tab2_node) {
			this._detachTab2();
		}
		if(this._debug) {
			console.log("monitoring stopped");
		}
	}

	async syncData() {
		const now = Date.now();
		const list = await this.store.listMeetings();
		const meeting = list.find(x => x.dataId === this.info.dataId);
		if(meeting) {
			meeting.lastSeen = now;
			// @ts-ignore
			await chrome.storage.local.set({ list });
		}
		const existing = await this.store.listMeetingParticipants(this.info.dataId);
		this.participants.forEach(participant => {
			let hash = participant.hash;
			if(!hash) {
				hash = participant.hash = this.store.hash(`${participant.name}-${participant.avatar}`);
				participant.events.unshift({
					type: "connection",
					date: Date.now(),
					action: `join (${this.store.hash(participant.id)})`
				});
			}
			if(participant._deleted) {
				participant.events.push({
					type: "connection",
					date: Date.now(),
					action: `leave (${this.store.hash(participant.id)})`
				});
				this.participants.delete(participant.id);
			}
			const old = existing.find(x => x.dataId === hash);
			if(old) {
				if(participant.subname && old.subname !== participant.subname) {
					old.subname = participant.subname;
				}
				if(participant.self && old.self !== participant.self) {
					old.self = participant.self;
				}
				old.lastSeen = now;
			} else {
				existing.push({
					name: participant.name || "",
					avatar: participant.avatar || "",
					subname: participant.subname || "",
					self: participant.self,
					firstSeen: now,
					lastSeen: now,
					dataId: hash
				});
			}
			
			if(participant.events.length) {
				(async () => {
					const data = await this.store.getParticipantData(this.info.dataId, hash);
					data.push(...participant.events);
					participant.events.length = 0;
					await this.store.updateParticipantData(this.info.dataId, hash, data);
				})().catch(console.error);
			}
			
		});
		await this.store.updateParticipants(this.info.dataId, existing);
		this.options = await this.store.getOptions();
	}
	
	_attachMain() {
		this._grid_node = document.querySelector("div[data-participant-id]:not([role])")?.parentElement?.parentElement;
		if(this._grid_node) {
			this._grid_observer = new MutationObserver(this._onGridMutation.bind(this));
			this._grid_observer.observe(this._grid_node, {
				childList: true
			});

			this._grid_reactions_node = this._grid_node.lastElementChild?.previousElementSibling?.previousElementSibling?.firstElementChild?.firstElementChild?.firstElementChild;
			if(this._grid_reactions_node) {
				this._grid_reactions_observer = new MutationObserver(this._onReactionMutation.bind(this));
				this._grid_reactions_observer.observe(this._grid_reactions_node, {
					childList: true
				});
			} else {
				console.error(new MeetStatisticsError("reactions_node not found"));
			}
		} else {
			console.error(new MeetStatisticsError("grid_node not found"));
		}

		this._grid_messages_node = document.querySelector('div[data-update-corner]')?.firstElementChild;
		if(this._grid_messages_node) {
			this._grid_messages_observer = new MutationObserver(this._onMessageMutation.bind(this));
			this._grid_messages_observer.observe(this._grid_messages_node, {
				childList: true
			});
		} else {
			console.error(new MeetStatisticsError("messages_node not found"));
		}
		
		if(this._debug) {
			console.log("grid attached");
		}

		if(this._grid_node) {
			for(const node of this._grid_node.children) {
				if(node.classList[0] === this._grid_node.firstElementChild?.classList[0]) {
					const id = node.firstElementChild?.getAttribute("data-participant-id");
					if(!id) { continue; }
					const existing = this.participants.get(id);
					if(existing) {
						if(!existing._main_attached) {
							existing.attachMain(node);
						}
					} else {
						const participant = new Participant(id, this);
						participant.attachMain(node);
						this.participants.set(id, participant);
					}
				}
			}
	
			if(this._grid_node.lastElementChild?.previousElementSibling?.firstElementChild) {
				const selfmic = this._grid_node.lastElementChild?.previousElementSibling?.firstElementChild.querySelector("div[data-use-tooltip]")?.parentElement
				// TODO attach miniself
			}
		}
	}
	
	_detachMain() {
		this._grid_reactions_observer?.disconnect();
		this._grid_reactions_observer = null;
		this._grid_reactions_node = null;

		this._grid_messages_observer?.disconnect();
		this._grid_messages_observer = null;
		this._grid_messages_node = null;

		this._grid_node = null;

		this.participants.forEach(participant => participant.detachMain());
		
		if(this._debug) {
			console.log("grid detached");
		}
	}
	
	_attachTab1() {
		this._tab1_node = document.querySelector("div[data-tab-id='1']");
		if(this._tab1_node) {
			this._tab1_hands_container_node = this._tab1_node.querySelector(":scope > div > div > h2")?.nextElementSibling;
			if(this._tab1_hands_container_node) {
				this._tab1_hands_container_observer = new MutationObserver(this._onTab1HandsContainerMutation.bind(this));
				this._tab1_hands_container_observer.observe(this._tab1_hands_container_node, {
					childList: true
				});
			} else {
				console.error(new MeetStatisticsError("tab1_hands_node not found"));
			}
	
			this._tab1_contributors_list_node = this._tab1_hands_container_node?.nextElementSibling?.firstElementChild;
			if(this._tab1_contributors_list_node) {
				this._tab1_contributors_list_observer = new MutationObserver(this._onTab1ContributorsListMutation.bind(this));
				this._tab1_contributors_list_observer.observe(this._tab1_contributors_list_node, {
					attributes: true,
					attributeFilter: ["class"]
				});
			} else {
				console.error(new MeetStatisticsError("tab1_contributors_list_node not found"));
			}
		} else {
			console.error(new MeetStatisticsError("tab1_node not found"));
		}
		
		if(this._debug) {
			console.log("tab1 attached");
		}
		
		if(this._tab1_hands_container_node?.firstElementChild) {
			this._attachTab1HandsList();
		}
		
		if(this._tab1_contributors_list_node && this._tab1_contributors_list_node.classList.length > 1) {
			this._attachTab1Contributors();
		}
	}
	
	_detachTab1() {
		this._detachTab1HandsList();
		this._detachTab1Contributors();

		this._tab1_hands_container_observer?.disconnect();
		this._tab1_hands_container_observer = null;

		this._tab1_contributors_list_observer?.disconnect();
		this._tab1_contributors_list_observer = null;
		this._tab1_contributors_list_node = null;

		this._tab1_node = null;
		
		if(this._debug) {
			console.log("tab1 detached");
		}
	}
	
	_attachTab1HandsList() {
		this._tab1_hands_list_node = this._tab1_hands_container_node?.firstElementChild;
		if(this._tab1_hands_list_node) {
			this._tab1_hands_list_observer = new MutationObserver(this._onTab1HandsListMutation.bind(this));
			this._tab1_hands_list_observer.observe(this._tab1_hands_list_node, {
				attributes: true,
				attributeFilter: ["class"]
			});
		} else {
			console.error(new MeetStatisticsError("tab1_hands_list_node not found"));
		}
		
		if(this._debug) {
			console.log("tab1 hands list attached");
		}
		
		if(this._tab1_hands_list_node && this._tab1_hands_list_node.classList.length > 1) {
			this._attachTab1Hands();
		}
	}
	
	_detachTab1HandsList() {
		this._detachTab1Hands();

		this._tab1_hands_list_observer?.disconnect();
		this._tab1_hands_list_observer = null;
		this._tab1_hands_list_node = null;
		
		if(this._debug) {
			console.log("tab1 hands list detached");
		}
	}
	
	_attachTab1Hands() {
		this._tab1_hands_node = this._tab1_hands_list_node?.querySelector("div[role='list']");
		if(this._tab1_hands_node) {
			this._tab1_hands_observer = new MutationObserver(this._onTab1HandsMutation.bind(this));
			this._tab1_hands_observer.observe(this._tab1_hands_node, {
				childList: true
			});
		} else {
			console.error(new MeetStatisticsError("tab1_hands_node not found"));
		}
		
		if(this._debug) {
			console.log("tab1 hands attached");
		}
	}
	
	_detachTab1Hands() {
		this._tab1_hands_observer?.disconnect();
		this._tab1_hands_observer = null;
		this._tab1_hands_node = null;
		
		if(this._debug) {
			console.log("tab1 hands detached");
		}
	}
	
	_attachTab1Contributors() {
		this._tab1_contributors_node = this._tab1_contributors_list_node?.querySelector("div[role='list']");
		if(this._tab1_contributors_node) {
			this._tab1_contributors_observer = new MutationObserver(this._onTab1ContributorsMutation.bind(this));
			this._tab1_contributors_observer.observe(this._tab1_contributors_node, {
				childList: true
			});
		} else {
			console.error(new MeetStatisticsError("tab1_contributors_node not found"));
		}
		
		if(this._debug) {
			console.log("tab1 contributors attached");
		}
		
		if(this._tab1_contributors_node) {
			for(const node of this._tab1_contributors_node.children) {
				const id = node.getAttribute("data-participant-id");
				if(!id) {
					console.error(new MeetStatisticsError("tab1 data-participant-id not found"));
					continue;
				}
				const existing = this.participants.get(id);
				if(existing) {
					if(!existing._tab_attached) {
						existing.attachTab(node);
					}
				} else {
					const participant = new Participant(id, this);
					participant.attachTab(node);
					this.participants.set(id, participant);
				}
			}
		}
	}
	
	_detachTab1Contributors() {
		this._tab1_contributors_observer?.disconnect();
		this._tab1_contributors_observer = null;
		this._tab1_contributors_node = null;

		this.participants.forEach(participant => participant.detachTab());
		
		if(this._debug) {
			console.log("tab1 contributors detached");
		}
	}
	
	_attachTab2() {
		this._tab2_node = document.querySelector("div[data-tab-id='2']");
		if(this._tab2_node) {
			this._tab2_chat_node = this._tab2_node.querySelector("div[aria-live]");
			if(this._tab2_chat_node) {
				this._tab2_chat_observer = new MutationObserver(this._onChatMutation.bind(this));
				this._tab2_chat_observer.observe(this._tab2_chat_node, {
					childList: true,
					subtree: true
				});
			} else {
				console.error(new MeetStatisticsError("tab2_chat_node not found"));
			}
		} else {
			console.error(new MeetStatisticsError("tab2_node not found"));
		}
		
		if(this._debug) {
			console.log("tab2 attached");
		}
	}
	
	_detachTab2() {
		this._tab2_chat_observer?.disconnect();
		this._tab2_chat_observer = null;
		this._tab2_chat_node = null;

		this._tab2_node = null;

		if(this._debug) {
			console.log("tab2 detached");
		}
	}

	/**
	 * @param {MutationRecord[]} event 
	 */
	_onGridMutation(event) {
		if(this._debug) {
			console.log("grid event", event)
		}
		if(!this._grid_node) {
			return;
		}
		const found = [];
		for(const node of this._grid_node.children) {
			if(node.classList[0] === this._grid_node.firstElementChild?.classList[0]) {
				const id = node.firstElementChild?.getAttribute("data-participant-id");
				if(!id) { continue; }
				const existing = this.participants.get(id);
				if(existing) {
					if(!existing._main_attached) {
						existing.attachMain(node);
					}
				} else {
					const participant = new Participant(id, this);
					participant.attachMain(node);
					this.participants.set(id, participant);
				}
				found.push(id);
			}
		}
		this.participants.forEach(x => {
			if(!found.includes(x.id)) {
				x.detachMain();
			};
		});
	}
	
	/**
	 * @param {(MutationRecord & { addedNodes: Element[] })[]} event 
	 */
	_onReactionMutation(event) {
		if(this._debug) {
			console.log("reaction event", event)
		}
		const ev = event.find(x => x.addedNodes.length);
		if(!ev) {
			return;
		}
		const blob = ev.addedNodes[0].querySelector("html-blob");
		if(!blob) {
			return;
		}
		const name = blob.nextElementSibling?.textContent;
		const emoji = blob.querySelector("img")?.getAttribute("alt");
		const now = Date.now();
		for(const participant of this.participants.values()) {
			if((participant.name === name || (participant.self && name === this._self_name)) && !participant._main_attached) {
				participant.events.push({
					type: "emoji",
					time: now,
					action: emoji
				});
			}
		}
	}
	
	/**
	 * @param {(MutationRecord & { addedNodes: Element[] })[]} event 
	 */
	_onMessageMutation(event) {
		if(this._debug) {
			console.log("message event", event)
		}
		if(this._tab2_chat_node) {
			return;
		}
		const ev = event.find(x => x.addedNodes.length);
		if(!ev) {
			return;
		}
		const inode = ev.addedNodes[0].querySelector("i");
		if(!inode) {
			return;
		}
		const author = inode?.parentElement?.nextElementSibling?.textContent;
		const content = inode?.parentElement?.parentElement?.nextElementSibling?.textContent;
		const now = Date.now();
		for(const participant of this.participants.values()) {
			if((participant.self && author === this._self_name) || participant.name === author) {
				participant.events.push({
					type: "chat",
					date: now,
					action: content
				});
				break;
			}
		}
	}
	
	/**
	 * @param {(MutationRecord & { addedNodes: Element[] })[]} event 
	 */
	_onChatMutation(event) {
		if(this._debug) {
			console.log("chat event", event)
		}
		const text = event.find(x => x.addedNodes.length);
		if(!text) {
			return;
		}
		const node = text.addedNodes[0].querySelector("div[data-is-tv]");
		if(!node) {
			return;
		}
		const content = node?.textContent;
		const author = node?.parentElement?.parentElement?.parentElement?.getAttribute("data-sender-name");
		const now = Date.now();
		for(const participant of this.participants.values()) {
			if((participant.self && author === this._self_name) || participant.name === author) {
				participant.events.push({
					type: "chat",
					date: now,
					action: content
				});
				break;
			}
		}
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onTab1HandsContainerMutation([event]) {
		if(this._debug) {
			console.log("tab1 hands container event", event)
		}
		if(event.addedNodes.length && !event.removedNodes.length) {
			this._attachTab1HandsList();
		} else if(event.removedNodes.length && !event.addedNodes.length) {
			this._detachTab1HandsList();
		}
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onTab1HandsListMutation([event]) {
		if(this._debug) {
			console.log("tab1 hands list event", event)
		}
		if(/** @type {Element} */ (event.target).classList.length > 1) {
			this._attachTab1Hands();
		} else {
			this._detachTab1Hands();
		}
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onTab1HandsMutation(event) {
		if(this._debug) {
			console.log("tab1 hand event", event)
		}
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onTab1ContributorsListMutation([event]) {
		if(this._debug) {
			console.log("tab1 contributor list event", event)
		}
		if(/** @type {Element} */ (event.target).classList.length > 1) {
			this._attachTab1Contributors();
		} else {
			this._detachTab1Contributors();
		}
	}
	
	/**
	 * @param {MutationRecord} event 
	 */
	_onTab1ContributorsMutation(event) {
		if(this._debug) {
			console.log("tab1 contributor event", event)
		}
		if(!this._tab1_contributors_node) {
			return;
		}
		const found = [];
		for(const node of this._tab1_contributors_node.children) {
			const id = node.getAttribute("data-participant-id");
			if(!id) {
				console.error(new MeetStatisticsError("tab1 data-participant-id not found"));
				continue;
			}
			const existing = this.participants.get(id);
			if(existing) {
				if(!existing._tab_attached) {
					existing.attachTab(node);
				}
			} else {
				const participant = new Participant(id, this);
				participant.attachTab(node);
				this.participants.set(id, participant);
			}
			found.push(id);
		}
		this.participants.forEach(x => {
			if(!found.includes(x.id)) {
				x.detachTab();
			}
		});
	}
}
