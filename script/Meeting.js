class Meeting {
	/**
	 * @param {Awaited<ReturnType<typeof Store.findOrCreateMeeting>>} info
	 * @param {typeof Store.defaultOptions} options 
	 */
	constructor(info, options) {
		/** @type {Map<string, Participant>} */ this.participants = new Map();
		this.info = info;
		this.options = options;
		
		this._grid_node = null;
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
		this._main_attached = false;
		this._tab1_attached = false;
		this._tab1_hands_list_attached = false;
		this._tab1_hands_attached = false;
		this._tab1_contributors_attached = false;
		this._tab2_attached = false;
	}
	
	get active() {
		return this._interval > -1;
	}

	get _debug() {
		return this.options.debug;
	}
	
	start() {
		this._interval = setInterval(() => {
			const main = document.querySelector("div[data-participant-id]:not([role])");
			if(this._main_attached && !main) {
				this._detachMain();
			} else if(main && !this._main_attached) {
				this._attachMain();
			}
			const tab1 = document.querySelector("div[data-tab-id='1']");
			if(this._tab1_attached && !tab1) {
				this._detachTab1();
			} else if(tab1 && !this._tab1_attached) {
				this._attachTab1();
			}
			const tab2 = document.querySelector("div[data-tab-id='2']");
			if(this._tab2_attached && !tab2) {
				this._detachTab2();
			} else if(tab2 && !this._tab2_attached) {
				this._attachTab2();
			}
			this.syncData().catch(console.error);
		}, 1000);
		if(this._debug) {
			console.log("monitoring started");
		}
	}
	
	stop() {
		clearInterval(this._interval);
		this._interval = -1;
		if(this._main_attached) {
			this._detachMain();
		}
		if(this._tab1_attached) {
			this._detachTab1();
		}
		if(this._tab2_attached) {
			this._detachTab2();
		}
		if(this._debug) {
			console.log("monitoring stopped");
		}
	}

	async syncData() {
		const existing = await Store.listMeetingParticipants(this.info.dataId);
		let changed = false;
		this.participants.forEach(participant => {
			const hash = participant.hash || (participant.hash = Store.hash(`${participant.name}-${participant.avatar}`));
			const old = existing.find(x => x.dataId === hash);
			if(old) {
				if(participant.subname && old.subname !== participant.subname) {
					old.subname = participant.subname;
					changed = true;
				}
				if(participant.self && old.self !== participant.self) {
					old.self = participant.self;
					changed = true;
				}
			} else {
				existing.push({
					name: participant.name || "",
					avatar: participant.avatar || "",
					subname: participant.subname || "",
					self: participant.self || "",
					dataId: hash
				});
				changed = true;
			}

			(async () => {
				if(participant.events.length) {
					const data = await Store.getParticipantData(this.info.dataId, hash);
					data.push(...participant.events);
					participant.events.length = 0;
					await Store.updateParticipantData(this.info.dataId, hash, data);
				}
			})().catch(console.error);
		});

		if(changed) {
			Store.updateParticipants(this.info.dataId, existing);
		}
	}
	
	_attachMain() {
		this._grid_node = document.querySelector("div[data-participant-id]:not([role])")?.parentElement?.parentElement;
		if(!this._grid_node) { throw new Error("grid_node not found"); }
		
		this._grid_reactions_node = this._grid_node.lastElementChild?.previousElementSibling?.previousElementSibling?.firstElementChild?.firstElementChild?.firstElementChild;
		if(!this._grid_reactions_node) { throw new Error("reactions_node not found"); }
		this._grid_reactions_observer = new MutationObserver(this._onReactionMutation.bind(this));
		this._grid_reactions_observer.observe(this._grid_reactions_node, {
			childList: true
		});
		
		this._grid_messages_node = document.querySelector('div[data-update-corner]')?.firstElementChild;
		if(!this._grid_messages_node) { throw new Error("messages_node not found"); }
		this._grid_messages_observer = new MutationObserver(this._onMessageMutation.bind(this));
		this._grid_messages_observer.observe(this._grid_messages_node, {
			childList: true
		});
		
		this._main_attached = true;
		
		if(this._debug) {
			console.log("main attached");
		}
		
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
					const participant = new Participant(id);
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
	
	_detachMain() {
		this._grid_reactions_observer?.disconnect();
		this._grid_reactions_observer = null;
		this._grid_reactions_node = null;

		this._grid_messages_observer?.disconnect();
		this._grid_messages_observer = null;
		this._grid_messages_node = null;

		this.participants.forEach(participant => participant.detachMain());
		this._main_attached = false;
		
		if(this._debug) {
			console.log("main detached");
		}
	}
	
	_attachTab1() {
		this._tab1_node = document.querySelector("div[data-tab-id='1']");
		if(!this._tab1_node) { throw new Error("tab1_node not found"); }
		
		this._tab1_hands_container_node = this._tab1_node.querySelectorAll("h2")[1].nextElementSibling;
		if(!this._tab1_hands_container_node) { throw new Error("tab1_hands_node not found"); }
		this._tab1_hands_container_observer = new MutationObserver(this._onTab1HandsContainerMutation.bind(this));
		this._tab1_hands_container_observer.observe(this._tab1_hands_container_node, {
			childList: true
		});
		
		this._tab1_contributors_list_node = this._tab1_hands_container_node.nextElementSibling?.firstElementChild;
		if(!this._tab1_contributors_list_node) { throw new Error("tab1_contributors_list_node not found"); }
		this._tab1_contributors_list_observer = new MutationObserver(this._onTab1ContributorsListMutation.bind(this));
		this._tab1_contributors_list_observer.observe(this._tab1_contributors_list_node, {
			attributes: true,
			attributeFilter: ["class"]
		});
		
		this._tab1_attached = true;
		
		if(this._debug) {
			console.log("tab1 attached");
		}
		
		if(this._tab1_hands_container_node.firstElementChild) {
			this._attachTab1HandsList();
		}
		
		if(this._tab1_contributors_list_node.classList.length > 1) {
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
		this._tab1_attached = false;
		
		if(this._debug) {
			console.log("tab1 detached");
		}
	}
	
	_attachTab1HandsList() {
		this._tab1_hands_list_node = this._tab1_hands_container_node?.firstElementChild;
		if(!this._tab1_hands_list_node) { throw new Error("hands_node not found"); }
		
		this._tab1_hands_list_observer = new MutationObserver(this._onTab1HandsListMutation.bind(this));
		this._tab1_hands_list_observer.observe(this._tab1_hands_list_node, {
			attributes: true,
			attributeFilter: ["class"]
		});
		
		this._tab1_hands_list_attached = true;
		
		if(this._debug) {
			console.log("tab1 hands list attached");
		}
		
		if(this._tab1_hands_list_node.classList.length > 1) {
			this._attachTab1Hands();
		}
	}
	
	_detachTab1HandsList() {
		this._detachTab1Hands();

		this._tab1_hands_list_observer?.disconnect();
		this._tab1_hands_list_observer = null;
		this._tab1_hands_list_node = null;

		this._tab1_hands_list_attached = false;
		
		if(this._debug) {
			console.log("tab1 hands list detached");
		}
	}
	
	_attachTab1Hands() {
		this._tab1_hands_node = this._tab1_hands_list_node?.querySelector("div[role='list']");
		if(!this._tab1_hands_node) { throw new Error("hands_node not found"); }
		this._tab1_hands_observer = new MutationObserver(this._onTab1HandsMutation.bind(this));
		this._tab1_hands_observer.observe(this._tab1_hands_node, {
			childList: true
		});
		
		this._tab1_hands_attached = true;
		
		if(this._debug) {
			console.log("tab1 hands attached");
		}
	}
	
	_detachTab1Hands() {
		this._tab1_hands_observer?.disconnect();
		this._tab1_hands_observer = null;
		this._tab1_hands_node = null;

		this._tab1_hands_attached = false;
		
		if(this._debug) {
			console.log("tab1 hands detached");
		}
	}
	
	_attachTab1Contributors() {
		
		this._tab1_contributors_node = this._tab1_contributors_list_node?.querySelector("div[role='list']");
		if(!this._tab1_contributors_node) { throw new Error("contributors_node not found"); }
		this._tab1_contributors_observer = new MutationObserver(this._onTab1ContributorsMutation.bind(this));
		this._tab1_contributors_observer.observe(this._tab1_contributors_node, {
			childList: true
		});
		
		this._tab1_contributors_attached = true;
		
		if(this._debug) {
			console.log("tab1 contributors attached");
		}
		
		for(const node of this._tab1_contributors_node.children) {
			const id = node.getAttribute("data-participant-id");
			if(!id) { throw new Error("id not found"); }
			const existing = this.participants.get(id);
			if(existing) {
				if(!existing._tab_attached) {
					existing.attachTab(node);
				}
			} else {
				const participant = new Participant(id);
				participant.attachTab(node);
				this.participants.set(id, participant);
			}
		}
	}
	
	_detachTab1Contributors() {
		this._tab1_contributors_observer?.disconnect();
		this._tab1_contributors_observer = null;
		this._tab1_contributors_node = null;

		this.participants.forEach(participant => participant.detachTab());
		this._tab1_contributors_attached = false;
		
		if(this._debug) {
			console.log("tab1 contributors detached");
		}
	}
	
	_attachTab2() {
		this._tab2_node = document.querySelector("div[data-tab-id='2']");
		if(!this._tab2_node) { throw new Error("tab2_node not found"); }
		
		this._tab2_chat_node = this._tab2_node.querySelector("div[data-tv]");
		if(!this._tab2_chat_node) { throw new Error("chat_node not found"); }
		
		this._tab2_chat_observer = new MutationObserver(this._onChatMutation.bind(this));
		this._tab2_chat_observer.observe(this._tab2_chat_node, {
			childList: true,
			subtree: true
		});
		
		this._tab2_attached = true;
		
		if(this._debug) {
			console.log("tab2 attached");
		}
	}
	
	_detachTab2() {
		this._tab2_chat_observer?.disconnect();
		this._tab2_chat_observer = null;
		this._tab2_chat_node = null;

		this._tab2_node = null;
		this._tab2_attached = false;

		if(this._debug) {
			console.log("tab2 detached");
		}
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onReactionMutation(event) {
		if(this._debug) {
			console.log("reaction event", event)
		}
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onMessageMutation(event) {
		if(this._debug) {
			console.log("message event", event)
		}
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onChatMutation(event) {
		if(this._debug) {
			console.log("chat event", event)
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

	}
}
