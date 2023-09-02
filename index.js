class Meeting {
    constructor() {
        /** @type {Map<string, Participant>} */ this.participants = new Map();

        this.grid_node = null;
        this.grid_reactions_node = null;
        this.grid_messages_node = null;
        this.grid_reactions_observer = null;
        this.grid_messages_observer = null;

        this.tab1_node = null;
        this.tab1_hands_container_node = null;
        this.tab1_hands_container_observer = null;
        this.tab1_hands_list_node = null;
        this.tab1_hands_list_observer = null;
        this.tab1_hands_node = null;
        this.tab1_hands_observer = null;
        this.tab1_contributors_list_node = null;
        this.tab1_contributors_list_observer = null;
        this.tab1_contributors_node = null;
        this.tab1_contributors_observer = null;

        this.tab2_node = null;
        this.tab2_chat_node = null;
        this.tab2_chat_observer = null;

        this._main_attached = false;
        this._tab1_attached = false;
        this._tab1_hands_list_attached = false;
        this._tab1_hands_attached = false;
        this._tab1_contributors_attached = false;
        this._tab2_attached = false;
        this._interval = -1;
        this._debug = true;
    }

    get active() {
        return this._interval > -1;
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

    _attachMain() {
        this.grid_node = document.querySelector("div[data-participant-id]:not([role])")?.parentElement?.parentElement;
        if(!this.grid_node) { throw new Error("grid_node not found"); }

        this.grid_reactions_node = this.grid_node.lastElementChild?.previousElementSibling?.previousElementSibling?.firstElementChild?.firstElementChild?.firstElementChild;
        if(!this.grid_reactions_node) { throw new Error("reactions_node not found"); }
        this.grid_reactions_observer = new MutationObserver(this._onReactionMutation.bind(this));
        this.grid_reactions_observer.observe(this.grid_reactions_node, {
            childList: true
        });

        this.grid_messages_node = document.querySelector('div[data-update-corner]')?.firstElementChild;
        if(!this.grid_messages_node) { throw new Error("messages_node not found"); }
        this.grid_messages_observer = new MutationObserver(this._onMessageMutation.bind(this));
        this.grid_messages_observer.observe(this.grid_messages_node, {
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

        this._main_attached = true;

        if(this._debug) {
            console.log("main attached");
        }
    }

    _detachMain() {
        this.grid_reactions_observer?.disconnect();
        this.grid_messages_observer?.disconnect();
        this.grid_reactions_observer = null;
        this.grid_messages_observer = null;
        this.grid_reactions_node = null;
        this.grid_messages_node = null;
        this._main_attached = false;
        this.participants.forEach(participant => participant.detachMain());
        if(this._debug) {
            console.log("main detached");
        }
    }

    _attachTab1() {
        this.tab1_node = document.querySelector("div[data-tab-id='1']");
        if(!this.tab1_node) { throw new Error("tab1_node not found"); }

        this.tab1_hands_container_node = this.tab1_node.querySelectorAll("h2")[1].nextElementSibling;
        if(!this.tab1_hands_container_node) { throw new Error("tab1_hands_node not found"); }
        this.tab1_hands_container_observer = new MutationObserver(this._onTab1HandsContainerMutation.bind(this));
        this.tab1_hands_container_observer.observe(this.tab1_hands_container_node, {
            childList: true
        });

        this.tab1_contributors_list_node = this.tab1_hands_container_node.nextElementSibling?.firstElementChild;
        if(!this.tab1_contributors_list_node) { throw new Error("tab1_contributors_list_node not found"); }
        this.tab1_contributors_list_observer = new MutationObserver(this._onTab1ContributorsListMutation.bind(this));
        this.tab1_contributors_list_observer.observe(this.tab1_contributors_list_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this._tab1_attached = true;

        if(this._debug) {
            console.log("tab1 attached");
        }

        if(this.tab1_hands_container_node.firstElementChild) {
            this._attachTab1HandsList();
        }

        if(this.tab1_contributors_list_node.classList.length > 1) {
            this._attachTab1Contributors();
        }
    }

    _detachTab1() {
        this._detachTab1HandsList();
        this._detachTab1Contributors();
        this.tab1_hands_container_observer?.disconnect();
        this.tab1_contributors_list_observer?.disconnect();
        this.tab1_contributors_list_node = null;
        this.tab1_node = null;
        this._tab1_attached = false;
        this.participants.forEach(participant => participant.detachTab());
        if(this._debug) {
            console.log("tab1 detached");
        }
    }

    _attachTab1HandsList() {
        this.tab1_hands_list_node = this.tab1_hands_container_node?.firstElementChild;
        if(!this.tab1_hands_list_node) { throw new Error("hands_node not found"); }

        this.tab1_hands_list_observer = new MutationObserver(this._onTab1HandsListMutation.bind(this));
        this.tab1_hands_list_observer.observe(this.tab1_hands_list_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this._tab1_hands_list_attached = true;

        if(this._debug) {
            console.log("tab1 hands list attached");
        }

        if(this.tab1_hands_list_node.classList.length > 1) {
            this._attachTab1Hands();
        }
    }

    _detachTab1HandsList() {
        this._detachTab1Hands();
        this.tab1_hands_list_observer?.disconnect();
        this.tab1_hands_list_node = null;
        this._tab1_hands_list_attached = false;

        if(this._debug) {
            console.log("tab1 hands list detached");
        }
    }

    _attachTab1Hands() {
        this.tab1_hands_node = this.tab1_hands_list_node?.querySelector("div[role='list']");
        if(!this.tab1_hands_node) { throw new Error("hands_node not found"); }
        this.hands_observer = new MutationObserver(this._onTab1HandsMutation.bind(this));
        this.hands_observer.observe(this.tab1_hands_node, {
            childList: true
        });

        this._tab1_hands_attached = true;

        if(this._debug) {
            console.log("tab1 hands attached");
        }
    }

    _detachTab1Hands() {
        this.hands_observer?.disconnect();
        this.tab1_hands_node = null;
        this._tab1_hands_attached = false;

        if(this._debug) {
            console.log("tab1 hands detached");
        }
    }

    _attachTab1Contributors() {

        this.tab1_contributors_node = this.tab1_contributors_list_node?.querySelector("div[role='list']");
        if(!this.tab1_contributors_node) { throw new Error("contributors_node not found"); }
        this.contributors_observer = new MutationObserver(this._onTab1ContributorsMutation.bind(this));
        this.contributors_observer.observe(this.tab1_contributors_node, {
            childList: true
        });

        this._tab1_contributors_attached = true;

        if(this._debug) {
            console.log("tab1 contributors attached");
        }

        /*
        for(const node of this.tab1_contributors_list_node.children) {
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
        */
    }

    _detachTab1Contributors() {
        this.contributors_observer?.disconnect();
        this.tab1_contributors_node = null;
        this._tab1_contributors_attached = false;
        
        if(this._debug) {
            console.log("tab1 contributors detached");
        }
    }

    _attachTab2() {
        this.tab2_node = document.querySelector("div[data-tab-id='2']");
        if(!this.tab2_node) { throw new Error("tab2_node not found"); }

        this.tab2_chat_node = this.tab2_node.querySelector("div[data-tv]");
        if(!this.tab2_chat_node) { throw new Error("chat_node not found"); }

        this.tab2_chat_observer = new MutationObserver(this._onChatMutation.bind(this));
        this.tab2_chat_observer.observe(this.tab2_chat_node, {
            childList: true,
            subtree: true
        });

        this._tab2_attached = true;

        if(this._debug) {
            console.log("tab2 attached");
        }
    }

    _detachTab2() {
        this.tab2_chat_observer?.disconnect();
        this.tab2_chat_observer = null;
        this.tab2_chat_node = null;
        this.tab2_node = null;
        this._tab2_attached = false;
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
