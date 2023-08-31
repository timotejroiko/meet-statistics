class Meeting {
    constructor() {
        /** @type {Map<string, Participant>} */ this.participants = new Map();

        this.grid_node = null;
        this.tab1_node = null;
        this.tab2_node = null;

        this.reactions_node = null;
        this.messages_node = null;
        this.chat_node = null;
        this.participants_node = null;
        this.tabhands_node = null;
        this.tabhands2_node = null;

        this.reactions_observer = null;
        this.messages_observer = null;
        this.chat_observer = null;
        this.participants_observer = null;
        this.tabhands_observer = null;
        this.tabhands2_observer = null;

        this._mainattached = false;
        this._tab1attached = false;
        this._tab2attached = false;
        this._interval = -1;
        this._debug = true;
    }
    get active() {
        return this._interval > -1;
    }
    start() {
        this._interval = setInterval(() => {
            const main = document.querySelector("div[data-participant-id]:not([role])");
            if(this._mainattached && !main) {
                this._detachMain();
            } else if(main && !this._mainattached) {
                this._attachMain();
            }
            const tab1 = document.querySelector("div[data-tab-id='1']");
            if(this._tab1attached && !tab1) {
                this._detachTab1();
            } else if(tab1 && !this._tab1attached) {
                this._attachTab1();
            }
            const tab2 = document.querySelector("div[data-tab-id='2']");
            if(this._tab2attached && !tab2) {
                this._detachTab2();
            } else if(tab2 && !this._tab2attached) {
                this._attachTab2();
            }
        }, 1000);
        if(this._debug) {
            console.log("monitoring started");
        }
    }
    stop() {
        clearInterval(this._interval);
        this._interval = -1;
        if(this._mainattached) {
            this._detachMain();
        }
        if(this._tab1attached) {
            this._detachTab1();
        }
        if(this._tab2attached) {
            this._detachTab2();
        }
        if(this._debug) {
            console.log("monitoring stopped");
        }
    }
    _onReactionMutation(event) {
        if(this._debug) {
            console.log("reaction event", event)
        }
    }
    _onMessageMutation(event) {
        if(this._debug) {
            console.log("message event", event)
        }
    }
    _onChatMutation(event) {
        if(this._debug) {
            console.log("chat event", event)
        }
    }
    _onParticipantMutation(event) {
        if(this._debug) {
            console.log("participant event", event)
        }
    }
    _onTabhandsMutation(event) {
        if(this._debug) {
            console.log("tabhands event", event)
        }
    }
    _attachMain() {
        this.grid_node = document.querySelector("div[data-participant-id]:not([role])")?.parentElement?.parentElement;
        if(!this.grid_node) { throw new Error("grid_node not found"); }

        this.reactions_node = this.grid_node.lastElementChild?.previousElementSibling?.previousElementSibling?.firstElementChild?.firstElementChild?.firstElementChild;
        if(!this.reactions_node) { throw new Error("reactions_node not found"); }
        this.reactions_observer = new MutationObserver(this._onReactionMutation.bind(this));
        this.reactions_observer.observe(this.reactions_node, {
            childList: true
        });

        this.messages_node = document.querySelector('div[data-update-corner]')?.firstElementChild;
        if(!this.messages_node) { throw new Error("messages_node not found"); }
        this.messages_observer = new MutationObserver(this._onMessageMutation.bind(this));
        this.messages_observer.observe(this.messages_node, {
            childList: true
        });

        for(const node of this.grid_node.children) {
            if(node.classList[0] === this.grid_node.firstElementChild?.classList[0]) {
                const id = node.firstElementChild?.getAttribute("data-participant-id");
                if(!id) { throw new Error("id not found"); }
                const existing = this.participants.get(id);
                if(existing) {
                    if(!existing._mainattached) {
                        existing.attachMain(node);
                    }
                } else {
                    const participant = new Participant(id);
                    participant.attachMain(node);
                    this.participants.set(id, participant);
                }
            }
        }

        this._mainattached = true;

        if(this._debug) {
            console.log("main attached");
        }
    }
    _attachTab1() {
        this.tab1_node = document.querySelector("div[data-tab-id='1']");
        if(!this.tab1_node) { throw new Error("tab1_node not found"); }

        this.participants_node = this.tab1_node.querySelector("div[role='list']");
        if(!this.participants_node) { throw new Error("participants_node not found"); }
        this.participants_observer = new MutationObserver(this._onParticipantMutation.bind(this));
        this.participants_observer.observe(this.participants_node, {
            childList: true
        });

        this.tabhands_node = this.tab1_node.querySelector("div[data-expanded-impression]")?.parentElement?.previousElementSibling;
        if(!this.tabhands_node) { throw new Error("hands_node not found"); }
        this.tabhands_observer = new MutationObserver(this._onTabhandsMutation.bind(this));
        this.tabhands_observer.observe(this.tabhands_node, {
            childList: true
        });

        for(const node of this.participants_node.children) {
            const id = node.getAttribute("data-participant-id");
            if(!id) { throw new Error("id not found"); }
            const existing = this.participants.get(id);
            if(existing) {
                if(!existing._tabattached) {
                    existing.attachTab(node);
                }
            } else {
                const participant = new Participant(id);
                participant.attachTab(node);
                this.participants.set(id, participant);
            }
        }

        this._tab1attached = true;

        if(this._debug) {
            console.log("tab1 attached");
        }
    }
    _attachTab2() {
        this.tab2_node = document.querySelector("div[data-tab-id='2']");
        if(!this.tab2_node) { throw new Error("tab2_node not found"); }

        this.chat_node = this.tab2_node.querySelector("div[data-tv]");
        if(!this.chat_node) { throw new Error("chat_node not found"); }

        this.chat_observer = new MutationObserver(this._onChatMutation.bind(this));
        this.chat_observer.observe(this.chat_node, {
            childList: true,
            subtree: true
        });

        this._tab2attached = true;

        if(this._debug) {
            console.log("tab2 attached");
        }
    }
    _detachMain() {
        this.reactions_observer?.disconnect();
        this.messages_observer?.disconnect();
        this.reactions_observer = null;
        this.messages_observer = null;
        this.reactions_node = null;
        this.messages_node = null;
        this._mainattached = false;
        this.participants.forEach(participant => participant.detachMain());
        if(this._debug) {
            console.log("main detached");
        }
    }
    _detachTab1() {
        this.participants_observer?.disconnect();
        this.participants_observer = null;
        this.participants_node = null;
        this.tab1_node = null;
        this._tab1attached = false;
        this.participants.forEach(participant => participant.detachTab());
        if(this._debug) {
            console.log("tab1 detached");
        }
    }
    _detachTab2() {
        this.chat_observer?.disconnect();
        this.chat_observer = null;
        this.chat_node = null;
        this.tab2_node = null;
        this._tab2attached = false;
        if(this._debug) {
            console.log("tab2 detached");
        }
    }
}

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
        this.avatar2 = null;
        this.mic_node = null;
        this.mic_observer = null;
        this.voice_node = null;
        this.voice_observer = null;
        this.cam_node = null;
        this.cam_observer = null;
        this.hand_node = null
        this.hand_observer = null;
        this.tabmic_node = null;
        this.tabmic_observer = null;
        this.tabvoice_node = null;
        this.tabvoice_observer = null;
        this._mainattached = false;
        this._tabattached = false;
    }
    /**
     * @param {Element} node 
     */
    attachMain(node) {
        if(!this.name) {
            this.name = node.querySelector("div[jsslot] div[style]")?.textContent;
        }

        this.self = node.querySelector("div[data-self-name]")?.getAttribute("data-self-name");
        this.avatar = node.querySelector("img")?.getAttribute("src");

        this.mic_node = node.querySelector("div[data-use-tooltip]");
        if(!this.mic_node) { throw new Error("mic_node not found"); }
        this.mic_observer = new MutationObserver(this._onMicMutation.bind(this));
        this.mic_observer.observe(this.mic_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this.voice_node = this.mic_node?.querySelector("div[jscontroller][class][jsname][jsaction]")
        if(!this.voice_node) { throw new Error("voice_node not found"); }
        this.voice_observer = new MutationObserver(this._onVoiceMutation.bind(this));
        this.voice_observer.observe(this.voice_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this.cam_node = node.querySelector("div[data-resolution-cap]");
        if(!this.cam_node) { throw new Error("cam_node not found"); }
        this.cam_observer = new MutationObserver(this._onCamMutation.bind(this));
        this.cam_observer.observe(this.cam_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this.hand_node = node.querySelector("div[data-self-name]")?.parentElement;
        if(!this.hand_node) { throw new Error("hand_node not found"); }
        this.hand_observer = new MutationObserver(this._onHandMutation.bind(this));
        this.hand_observer.observe(this.hand_node, {
            childList: true
        });

        this._mainattached = true;
    }
    /**
     * @param {Element} node 
     */
    attachTab(node) {
        if(!this.name) {
            this.name = node.querySelector("div[avatar-tooltip-id] span[talk-id]")?.textContent
        }

        this.subname = this.self = node.querySelector("div[avatar-tooltip-id]")?.lastElementChild?.lastElementChild?.textContent;
        this.avatar2 = node.querySelector("img")?.getAttribute("src");

        this.tabmic_node = node.querySelector("div[data-use-tooltip]");
        if(!this.tabmic_node) { throw new Error("mic_node not found"); }
        this.tabmic_observer = new MutationObserver(this._onTabmicMutation.bind(this));
        this.tabmic_observer.observe(this.tabmic_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this.tabvoice_node = this.tabmic_node?.lastElementChild;
        if(!this.tabvoice_node) { throw new Error("voice_node not found"); }
        this.tabvoice_observer = new MutationObserver(this._onTabvoiceMutation.bind(this));
        this.tabvoice_observer.observe(this.tabvoice_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this._tabattached = true;
    }
    detachMain() {
        this.mic_observer?.disconnect();
        this.voice_observer?.disconnect();
        this.cam_observer?.disconnect();
        this.hand_observer?.disconnect();
        this.mic_observer = null;
        this.voice_observer = null;
        this.cam_observer = null;
        this.hand_observer = null;
        this.mic_node = null;
        this.voice_node = null;
        this.cam_node = null;
        this.hand_node = null;
    }
    detachTab() {
        this.tabmic_observer?.disconnect();
        this.tabvoice_observer?.disconnect();
        this.tabmic_observer = null;
        this.tabvoice_observer = null;
        this.tabmic_node= null;
        this.tabvoice_node = null;
    }
    _onMicMutation(event) {
        console.log("mic event", event)
    }
    _onVoiceMutation(event) {
        console.log("voice event", event)
    }
    _onCamMutation(event) {
        console.log("cam event", event)
    }
    _onHandMutation(event) {
        console.log("hand event", event)
    }
    _onTabmicMutation(event) {
        console.log("tab mic event", event)
    }
    _onTabvoiceMutation(event) {
        console.log("tab voice event", event)
    }
}
