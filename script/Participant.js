class Participant {
	/**
	 * @param {string} id 
	 * @param {Meeting} meeting 
	 */
	constructor(id, meeting) {
		this.id = id;
		this.name = null;
		this.subname = null;
		this.self = null;
		this.avatar = null;

		this.meeting = meeting;
		this.events = [];
		this.hash = "";
		
		this._mic_node = null;
		this._mic_observer = null;
		this._voice_node = null;
		this._voice_observer = null;
		this._cam_node = null;
		this._cam_observer = null;
		this._hand_node = null
		this._hand_observer = null;
		this._tab_mic_node = null;
		this._tab_mic_observer = null;
		this._tab_voice_node = null;
		this._tab_voice_observer = null;
		
		this._main_attached = false;
		this._tab_attached = false;
		this._notself_voice_attached = false;
		this._mic_status = false;
		this._voice_status = -1;
	}

	get _debug() {
		return this.meeting._debug;
	}
	
	/**
	 * @param {Element} node 
	 */
	attachMain(node) {

		if(!this.name) {
			this.name = node.querySelector("div[jsslot] div[style]")?.textContent;
		}
		
		this.self = node.querySelector("div[data-self-name]")?.getAttribute("data-self-name");
		this.avatar = node.querySelector("img")?.getAttribute("src")?.split("=")[0];
		
		this._mic_node = node.firstElementChild?.lastElementChild?.lastElementChild?.firstElementChild;
		if(!this._mic_node) { throw new Error("mic_node not found"); }
		this._mic_observer = new MutationObserver(this._onMicMutation.bind(this));
		this._mic_observer.observe(this._mic_node, {
			attributes: true,
			attributeFilter: ["class"]
		});

		this._mic_status = this._mic_node.classList.length === 2;
		
		this._voice_node = this._mic_node?.querySelector("div[jscontroller][class][jsname][jsaction]")
		if(!this._voice_node) { throw new Error("voice_node not found"); }
		this._voice_observer = new MutationObserver(this._onVoiceMutation.bind(this));
		this._voice_observer.observe(this._voice_node, {
			attributes: true,
			attributeFilter: ["class"]
		});
		
		this._cam_node = node.querySelector("div[data-resolution-cap]");
		if(!this._cam_node) { throw new Error("cam_node not found"); }
		this._cam_observer = new MutationObserver(this._onCamMutation.bind(this));
		this._cam_observer.observe(this._cam_node, {
			attributes: true,
			attributeFilter: ["class"]
		});
		
		this._hand_node = node.querySelector("div[data-self-name]")?.parentElement;
		if(!this._hand_node) { throw new Error("hand_node not found"); }
		this._hand_observer = new MutationObserver(this._onHandMutation.bind(this));
		this._hand_observer.observe(this._hand_node, {
			childList: true
		});
		
		this._main_attached = true;
		
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
		
		this._main_attached = false;
	}
	
	/**
	 * @param {Element} node 
	 */
	attachTab(node) {
		if(!this.name) {
			this.name = node.querySelector("img")?.parentElement?.nextElementSibling?.firstElementChild?.firstElementChild?.textContent;
		}

		if(!this.avatar) {
			this.avatar = node.querySelector("img")?.getAttribute("src")?.split("=")[0];
		}
		
		this.subname = node.querySelector("img")?.parentElement?.nextElementSibling?.lastElementChild?.textContent;

		const selfmic = node.querySelector("div[data-use-tooltip]");
		if(selfmic) {
			this._tab_mic_node = selfmic;
			if(!this._tab_mic_node) { throw new Error("tab_mic_node not found"); }
			this._tab_mic_observer = new MutationObserver(this._onTabmicMutation.bind(this));
			this._tab_mic_observer.observe(this._tab_mic_node, {
				attributes: true,
				attributeFilter: ["class"]
			});

			this._mic_status = this._tab_mic_node.classList.length === 1;

			this._tab_voice_node = this._tab_mic_node?.lastElementChild;
			if(!this._tab_voice_node) { throw new Error("tabvoice_node not found"); }
			this._tab_voice_observer = new MutationObserver(this._onTabvoiceMutation.bind(this));
			this._tab_voice_observer.observe(this._tab_voice_node, {
				attributes: true,
				attributeFilter: ["class"]
			});
		} else {
			this._tab_mic_node = node.lastElementChild?.firstElementChild;
			if(!this._tab_mic_node) { throw new Error("tab_mic_node not found"); }
			this._tab_mic_observer = new MutationObserver(this._onTabmicMutation.bind(this));
			this._tab_mic_observer.observe(this._tab_mic_node, {
				childList: true
			});
		}

		this._tab_attached = true;
		
		if(this._debug) {
			console.log(`participant ${this.name} tab attached`);
		}

		if(!selfmic && this._tab_mic_node.querySelector("i")?.parentElement?.classList.length === 2) {
			this._mic_status = true;
			this.attachTabNotselfVoice();
		}
	}
	
	detachTab() {
		this._tab_mic_observer?.disconnect();
		this._tab_mic_observer = null;
		this._tab_mic_node= null;
		
		this._tab_voice_observer?.disconnect();
		this._tab_voice_observer = null;
		this._tab_voice_node = null;
		
		this._tab_attached = false;
	}

	attachTabNotselfVoice() {
		this._tab_voice_node = this._tab_mic_node?.querySelector("i")?.previousElementSibling;
		if(!this._tab_voice_node) { throw new Error("tab_mic_node not found"); }
		this._tab_voice_observer = new MutationObserver(this._onTabvoiceMutation.bind(this));
		this._tab_voice_observer.observe(this._tab_voice_node, {
			attributes: true,
			attributeFilter: ["class"]
		});

		this._notself_voice_attached = true;

		if(this._debug) {
			console.log(`participant ${this.name} tab notself voice attached`);
		}
	}

	detachTabNotselfVoice() {
		this._tab_voice_observer?.disconnect();
		this._tab_voice_observer = null;
		this._tab_voice_node = null;

		this._notself_voice_attached = true;

		if(this._debug) {
			console.log(`participant ${this.name} tab notself voice detached`);
		}
	}
	
	/**
	 * @param {(MutationRecord & { target: Element })[]} event 
	 */
	_onMicMutation(event) {
		if(this._debug) {
			console.log("mic event", event);
		}
		this._mic_status = event[0].target.classList.length === 2;
		if(!this._mic_status) {
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
			console.log("voice event", event);
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
		}, 1000);
	}
	
	/**
	 * @param {(MutationRecord & { target: Element })[]} event 
	 */
	_onCamMutation(event) {
		if(this._debug) {
			console.log("cam event", event);
		}
		this.events.push({
			time: Date.now(),
			type: "cam",
			action: event[0].target.classList.length === 2 ? "closed" : "opened"
		});
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onHandMutation(event) {
		if(this._debug) {
			console.log("hand event", event);
		}
	}
	
	/**
	 * @param {(MutationRecord & { target: Element })[]} event 
	 */
	_onTabmicMutation(event) {
		if(this._debug) {
			console.log("tab mic event", event);
		}
		if(event[0].type === "childList") {
			if(this._tab_mic_node?.querySelector("i")?.parentElement?.classList.length === 2) {
				this.attachTabNotselfVoice();
			} else {
				this.detachTabNotselfVoice();
			}
		} else {
			if(this._mic_observer) {
				return;
			}
			this._mic_status = event[0].target.classList.length === 1;
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
	}	
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onTabvoiceMutation(event) {
		if(this._debug) {
			console.log("tab voice event", event);
		}
		if(this._main_attached) {
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
		}, 1000);
	}
}
