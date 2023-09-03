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

        this._mic_node = null;
        this._mic_observer = null;
        this._voice_node = null;
        this._voice_observer = null;
        this._cam_node = null;
        this._cam_observer = null;
        this._hand_node = null
        this._hand_observer = null;
        this._tabmic_node = null;
        this._tabmic_observer = null;
        this._tabvoice_node = null;
        this._tabvoice_observer = null;

        this._mainattached = false;
        this._tabattached = false;
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
        this.avatar = node.querySelector("img")?.getAttribute("src");

        this._mic_node = node.querySelector("div[data-use-tooltip]");
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

        this._mainattached = true;

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

        this._mainattached = false;
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

        this._tabmic_node = node.querySelector("div[data-use-tooltip]");
        if(!this._tabmic_node) { throw new Error("mic_node not found"); }
        this._tabmic_observer = new MutationObserver(this._onTabmicMutation.bind(this));
        this._tabmic_observer.observe(this._tabmic_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this._tabvoice_node = this._tabmic_node?.lastElementChild;
        if(!this._tabvoice_node) { throw new Error("voice_node not found"); }
        this._tabvoice_observer = new MutationObserver(this._onTabvoiceMutation.bind(this));
        this._tabvoice_observer.observe(this._tabvoice_node, {
            attributes: true,
            attributeFilter: ["class"]
        });

        this._tabattached = true;

        if(this._debug) {
            console.log(`participant ${this.name} tab attached`);
        }
    }

    detachTab() {
        this._tabmic_observer?.disconnect();
        this._tabmic_observer = null;
        this._tabmic_node= null;

        this._tabvoice_observer?.disconnect();
        this._tabvoice_observer = null;
        this._tabvoice_node = null;

        this._tabattached = false;
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
    }

    /**
     * @param {MutationRecord[]} event 
     */
    _onTabvoiceMutation(event) {
        console.log("tab voice event", event)
    }
}
