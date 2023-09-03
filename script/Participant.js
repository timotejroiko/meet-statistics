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
