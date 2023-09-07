class Participant {
	/**
	 * @param {string} id 
	 */
	constructor(id) {
		this.id = id;
		this.name = null;
		this.subname = null;
		this.self = null;
		this.avatar = null;
		this.data = {
			reactions: [],
			messages: [],
			hands: [],
			mic: [],
			voice: [],
			cam: []
		};
		
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
		this._debug = true;
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
	 * @param {MutationRecord[]} event 
	 */
	_onMicMutation(event) {
		console.log("mic event", event)
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onVoiceMutation(event) {
		console.log("voice event", event)
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onCamMutation(event) {
		console.log("cam event", event)
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onHandMutation(event) {
		console.log("hand event", event)
	}
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onTabmicMutation(event) {
		console.log("tab mic event", event)
		if(event[0].type === "childList") {
			if(this._tab_mic_node?.querySelector("i")?.parentElement?.classList.length === 2) {
				this.attachTabNotselfVoice();
			} else {
				this.detachTabNotselfVoice();
			}
		} else {

		}
	}	
	
	/**
	 * @param {MutationRecord[]} event 
	 */
	_onTabvoiceMutation(event) {
		console.log("tab voice event", event)
	}
}
