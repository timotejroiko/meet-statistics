class Participant {
	/**
	 * @param {string} id 
	 * @param {Meeting} meeting 
	 */
	constructor(id, meeting) {
		this.id = id;
		this.name = null;
		this.avatar = null;
		this.subname = null;
		this.self = false;

		this.status = null;
		this.created = Date.now();

		this.meeting = meeting;
		/** @type {Awaited<ReturnType<Store.getParticipantData>>} */ this.events = [];

		this._main_node = null;
		this._main_observer = null;
		this._tab_node = null;
		
		this._mic_node = null;
		this._mic_observer = null;
		this._voice_node = null;
		this._voice_observer = null;
		this._cam_node = null;
		this._cam_observer = null;
		this._hand_node = null
		this._hand_observer = null;
		this._emoji_node = null;
		this._emoji_observer = null;
		this._tab_mic_node = null;
		this._tab_mic_observer = null;
		this._tab_voice_node = null;
		this._tab_voice_observer = null;

		this._mic_status = false;
		this._cam_status = false;
		this._voice_status = -1;
		this._voice_stop_timeout = 5000;
	}

	get _debug() {
		return this.meeting._debug;
	}

	get _deleted() {
		if(this.meeting._grid_node) {
			if(this.meeting._tab1_contributors_node) {
				return !this._main_node && !this._tab_node;
			} else {
				return !this._main_node;
			}
		} else {
			if(this.meeting._tab1_contributors_node) {
				return !this._tab_node;
			} else {
				return false;
			}
		}
	}
	
	/**
	 * @param {Element} node 
	 */
	attachMain(node) {
		this._main_node = node;
		const child = this._main_node.firstElementChild;
		if(child) {
			this._main_observer = new MutationObserver(() => {
				this.detachMain();
				const found = this.meeting._grid_node?.querySelector(`div[data-participant-id="${this.id}"]`)?.parentElement;
				if(found) {
					this.attachMain(found);
				}
			});
			this._main_observer.observe(child, {
				attributes: true,
				attributeFilter: ["data-participant-id"]
			});
		}

		const name = node.querySelector("div[jsslot] div[style]")?.textContent;
		if(name) {
			const words = name.split(/\s+/g);
			this.name = words.map(x => x[0].toUpperCase() + x.slice(1)).join(" ");
		} else {
			console.error(new MeetStatisticsError("name not found"));
		}

		const avatar = node.querySelector("img")?.getAttribute("src")?.split("=")[0];
		if(avatar) {
			this.avatar = avatar;
		} else {
			console.error(new MeetStatisticsError("avatar not found"));
		}

		if(!this.self && !node.querySelector('button[disabled]')) {
			this.self = true;
		}
		
		this._mic_node = node.firstElementChild?.lastElementChild?.lastElementChild?.firstElementChild;
		if(this._mic_node) {
			this._mic_observer = new MutationObserver(this._onMicMutation.bind(this));
			this._mic_observer.observe(this._mic_node, {
				attributes: true,
				attributeFilter: ["class"]
			});
			const micstatus = this._mic_node.classList.length === 2;
			if(micstatus !== this._mic_status) {
				this._mic_status = micstatus;
				this.events.push({
					time: Date.now(),
					type: "mic",
					action: micstatus ? "enabled" : "disabled"
				});
			}
		} else {
			console.error(new MeetStatisticsError("mic_node not found"));
		}
		
		
		this._voice_node = this._mic_node?.querySelector("div[jscontroller][class][jsname][jsaction]");
		if(this._voice_node) {
			this._voice_observer = new MutationObserver(this._onVoiceMutation.bind(this));
			this._voice_observer.observe(this._voice_node, {
				attributes: true,
				attributeFilter: ["class"]
			});
		} else {
			console.error(new MeetStatisticsError("voice_node not found"));
		}
		
		this._cam_node = node.querySelector("div[data-resolution-cap]");
		if(this._cam_node) {
			this._cam_observer = new MutationObserver(this._onCamMutation.bind(this));
			this._cam_observer.observe(this._cam_node, {
				attributes: true,
				attributeFilter: ["class"]
			});
			const camstatus = this._cam_node.classList.length !== 2;
			if(camstatus !== this._cam_status) {
				this._cam_status = camstatus;
				this.events.push({
					time: Date.now(),
					type: "cam",
					action: camstatus ? "opened" : "closed"
				});
			}
		} else {
			console.error(new MeetStatisticsError("cam_node not found"));
		}
		
		this._hand_node = node.querySelector("div[data-self-name]")?.parentElement;
		if(this._hand_node) {
			this._hand_observer = new MutationObserver(this._onHandMutation.bind(this));
			this._hand_observer.observe(this._hand_node, {
				childList: true
			});
		} else {
			console.error(new MeetStatisticsError("hand_node not found"));
		}
		

		this._emoji_node = node.firstElementChild?.lastElementChild?.firstElementChild?.firstElementChild;
		if(this._emoji_node) {
			this._emoji_observer = new MutationObserver(this._onEmojiMutation.bind(this));
			this._emoji_observer.observe(this._emoji_node, {
				childList: true,
				subtree: true
			});
		} else {
			console.error(new MeetStatisticsError("emoji_node not found"));
		}
		
		if(this._debug) {
			console.log(`participant ${this.name} main attached`);
		}
	}
	
	detachMain() {
		this._mic_observer?.disconnect();
		this._mic_observer = null;
		this._mic_node = null;
		
		this._voice_observer?.disconnect();
		this._voice_observer = null;
		this._voice_node = null;
		
		this._cam_observer?.disconnect();
		this._cam_observer = null;
		this._cam_node = null;
		
		this._hand_observer?.disconnect();
		this._hand_observer = null;
		this._hand_node = null;

		this._emoji_observer?.disconnect();
		this._emoji_observer = null;
		this._emoji_node = null;

		this._main_observer?.disconnect();
		this._main_observer = null;
		this._main_node = null;

		if(this._voice_status > -1 && !this._tab_node) {
			clearTimeout(this._voice_status);
			this.events.push({
				time: Date.now(),
				type: "voice",
				action: "stop"
			});
		}

		if(this._debug) {
			console.log(`participant ${this.name} main detached`);
		}
	}
	
	/**
	 * @param {Element} node 
	 */
	attachTab(node) {
		this._tab_node = node;

		const name = node.querySelector("img")?.parentElement?.nextElementSibling?.firstElementChild?.firstElementChild?.textContent;
		if(name) {
			const words = name.split(/\s+/g);
			this.name = words.map(x => x[0].toUpperCase() + x.slice(1)).join(" ");
		} else {
			console.error(new MeetStatisticsError("name not found"));
		}

		const avatar = node.querySelector("img")?.getAttribute("src")?.split("=")[0];
		if(avatar) {
			this.avatar = avatar;
		} else {
			console.error(new MeetStatisticsError("avatar not found"));
		}

		this.subname ||= node.querySelector("img")?.parentElement?.nextElementSibling?.lastElementChild?.textContent;

		const selfmic = node.querySelector("div[data-use-tooltip]");
		if(selfmic) {
			this.self = true;

			this._tab_mic_node = selfmic;
			this._tab_mic_observer = new MutationObserver(this._onTabmicMutation.bind(this));
			this._tab_mic_observer.observe(this._tab_mic_node, {
				attributes: true,
				attributeFilter: ["class"]
			});

			const micstatus = this._tab_mic_node.classList.length === 1;
			if(micstatus !== this._mic_status) {
				this._mic_status = micstatus;
				this.events.push({
					time: Date.now(),
					type: "mic",
					action: micstatus ? "enabled" : "disabled"
				});
			}

			this._tab_voice_node = this._tab_mic_node?.lastElementChild;
			if(this._tab_voice_node) {
				this._tab_voice_observer = new MutationObserver(this._onTabvoiceMutation.bind(this));
				this._tab_voice_observer.observe(this._tab_voice_node, {
					attributes: true,
					attributeFilter: ["class"]
				});
			} else {
				console.error(new MeetStatisticsError("tab_voice_node not found"));
			}
		} else {
			this.self = false;
			
			this._tab_mic_node = node.lastElementChild?.firstElementChild;
			if(this._tab_mic_node) {
				this._tab_mic_observer = new MutationObserver(this._onTabmicMutation.bind(this));
				this._tab_mic_observer.observe(this._tab_mic_node, {
					childList: true
				});
				const micstatus = this._tab_mic_node.querySelector("i")?.parentElement?.classList.length === 2;
				if(micstatus !== this._mic_status) {
					this._mic_status = micstatus;
					this.events.push({
						time: Date.now(),
						type: "mic",
						action: micstatus ? "enabled" : "disabled"
					});
				}
				if(micstatus) {
					this.attachTabNotselfVoice();
				}
			} else {
				console.error(new MeetStatisticsError("tab_mic_node not found"));
			}
		}
		
		if(this._debug) {
			console.log(`participant ${this.name} tab attached`);
		}
	}
	
	detachTab() {
		this._tab_mic_observer?.disconnect();
		this._tab_mic_observer = null;
		this._tab_mic_node= null;
		
		this._tab_voice_observer?.disconnect();
		this._tab_voice_observer = null;
		this._tab_voice_node = null;
		
		this._tab_node = null;

		if(this._voice_status > -1 && !this._main_node) {
			clearTimeout(this._voice_status);
			this.events.push({
				time: Date.now(),
				type: "voice",
				action: "stop"
			});
		}

		if(this._debug) {
			console.log(`participant ${this.name} tab detached`);
		}
	}

	attachTabNotselfVoice() {
		this._tab_voice_node = this._tab_mic_node?.querySelector("i")?.previousElementSibling;
		if(this._tab_voice_node) {
			this._tab_voice_observer = new MutationObserver(this._onTabvoiceMutation.bind(this));
			this._tab_voice_observer.observe(this._tab_voice_node, {
				attributes: true,
				attributeFilter: ["class"]
			});
		} else {
			console.error(new MeetStatisticsError("tab_voice_node (notself) not found"));
		}

		if(this._debug) {
			console.log(`participant ${this.name} tab notself voice attached`);
		}
	}

	detachTabNotselfVoice() {
		this._tab_voice_observer?.disconnect();
		this._tab_voice_observer = null;
		this._tab_voice_node = null;

		if(this._debug) {
			console.log(`participant ${this.name} tab notself voice detached`);
		}
	}
	
	/**
	 * @param {(MutationRecord & { target: Element })[]} event 
	 */
	_onMicMutation(event) {
		if(this._debug) {
			console.log("mic event", this, event);
		}
		this._mic_status = event[0].target.classList.length === 2;
		if(!this._mic_status && this._voice_status > -1) {
			clearTimeout(this._voice_status);
			this._voice_status = -1;
			this.events.push({
				time: Date.now(),
				type: "voice",
				action: "stop"
			});
		}
		this.events.push({
			time: Date.now(),
			type: "mic",
			action: this._mic_status ? "enabled" : "disabled"
		});
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onVoiceMutation(event) {
		if(this._debug) {
			console.log("voice event", this, event);
		}
		if(!this._mic_status) {
			return;
		}
		if(this._voice_status > -1) {
			clearTimeout(this._voice_status);
		} else {
			this.events.push({
				time: Date.now(),
				type: "voice",
				action: "start"
			});
		}
		this._voice_status = setTimeout(() => {
			this._voice_status = -1;
			this.events.push({
				time: Date.now(),
				type: "voice",
				action: "stop"
			});
		}, this._voice_stop_timeout);
	}
	
	/**
	 * @param {(MutationRecord & { target: Element })[]} event 
	 */
	_onCamMutation(event) {
		if(this._debug) {
			console.log("cam event", this, event);
		}
		this._cam_status = event[0].target.classList.length !== 2;
		this.events.push({
			time: Date.now(),
			type: "cam",
			action: this._cam_status ? "opened" : "closed"
		});
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onHandMutation(event) {
		if(this._debug) {
			console.log("hand event", this, event);
		}
		const ev = event.find(x => x.addedNodes.length && x.addedNodes[0].nodeName === "I");
		if(ev) {
			this.events.push({
				time: Date.now(),
				type: "hand",
				action: "up"
			});
		}
	}

	/**
	 * @param {(MutationRecord & { addedNodes: Element[] })[]} event 
	 */
	_onEmojiMutation(event) {
		if(this._debug) {
			console.log("emoji event", this, event);
		}
		const ev = event.find(x => x.addedNodes.length && x.target.nodeName === "HTML-BLOB");
		if(ev) {
			this.events.push({
				time: Date.now(),
				type: "emoji",
				action: ev.addedNodes[0].getAttribute("data-emoji") || "?"
			});
		}
	}
	
	/**
	 * @param {(MutationRecord & { target: Element })[]} event 
	 */
	_onTabmicMutation(event) {
		if(this._debug) {
			console.log("tab mic event", this, event);
		}
		// is not self
		if(event[0].type === "childList") {
			const mic = this._tab_mic_node?.querySelector("i")?.parentElement?.classList.length === 2;
			if(mic) {
				this.attachTabNotselfVoice();
			} else {
				this.detachTabNotselfVoice();
			}
			if(this._mic_observer) {
				return;
			}
			this._mic_status = mic;
		} else {
			// is self
			if(this._mic_observer) {
				return;
			}
			this._mic_status = event[0].target.classList.length === 1;
		}
		if(!this._mic_status && this._voice_status > -1) {
			clearTimeout(this._voice_status);
			this._voice_status = -1;
			this.events.push({
				time: Date.now(),
				type: "voice",
				action: "stop"
			});
		}
		this.events.push({
			time: Date.now(),
			type: "mic",
			action: this._mic_status ? "enabled" : "disabled"
		});
	}	
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onTabvoiceMutation(event) {
		if(this._debug) {
			console.log("tab voice event", this, event);
		}
		if(this._main_node) {
			return;
		}
		if(!this._mic_status) {
			return;
		}
		if(this._voice_status > -1) {
			clearTimeout(this._voice_status);
		} else {
			this.events.push({
				time: Date.now(),
				type: "voice",
				action: "start"
			});
		}
		this._voice_status = setTimeout(() => {
			this._voice_status = -1;
			this.events.push({
				time: Date.now(),
				type: "voice",
				action: "stop"
			});
		}, this._voice_stop_timeout);
	}
}

class Presentation {
	/**
	 * @param {string} id 
	 * @param {Meeting} meeting 
	 */
	constructor(id, meeting) {
		this.id = id;
		this.name = null;
		this.avatar = null;
		this.meeting = meeting;

		this.status = null;
		this.created = Date.now();

		this._tab_node = null;
		this._main_node = null;
		this._main_observer = null;
	}
	get _debug() {
		return this.meeting._debug;
	}

	get _deleted() {
		if(this.meeting._grid_node) {
			if(this.meeting._tab1_contributors_node) {
				return !this._main_node && !this._tab_node;
			} else {
				return !this._main_node;
			}
		} else {
			if(this.meeting._tab1_contributors_node) {
				return !this._tab_node;
			} else {
				return false;
			}
		}
	}

	/**
	 * @param {Element} node 
	 */
	attachMain(node) {
		this._main_node = node;
		const child = this._main_node.firstElementChild;
		if(child) {
			this._main_observer = new MutationObserver(() => {
				this.detachMain();
				const found = this.meeting._grid_node?.querySelector(`div[data-participant-id="${this.id}"]`)?.parentElement;
				if(found) {
					this.attachMain(found);
				}
			});
			this._main_observer.observe(child, {
				attributes: true,
				attributeFilter: ["data-participant-id"]
			});
		}

		this.name ||= node.querySelector("div[jsslot] div[style]")?.textContent || null;
		this.avatar ||= node.querySelector("img")?.getAttribute("src")?.split("=")[0];
		
		if(this._debug) {
			console.log(`presentation ${this.name} main attached`);
		}
	}

	detachMain() {
		this._main_observer?.disconnect();
		this._main_observer = null;
		this._main_node = null;

		if(this._debug) {
			console.log(`presentation ${this.name} main detached`);
		}
	}

	/**
	 * @param {Element} node 
	 */
	attachTab(node) {
		this._tab_node = node;
		this.name ||= node.querySelector("img")?.parentElement?.nextElementSibling?.firstElementChild?.firstElementChild?.textContent;
		this.avatar ||= node.querySelector("img")?.getAttribute("src")?.split("=")[0];
		
		if(this._debug) {
			console.log(`presentation ${this.name} tab attached`);
		}
	}
	
	detachTab() {
		this._tab_node = null;

		if(this._debug) {
			console.log(`presentation ${this.name} tab detached`);
		}
	}
}
