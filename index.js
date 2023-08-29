class Meeting {
    constructor() {
        this.participants = new Map();
        this.grid_node = null;
        this.reactions_node = null;
        this.messages_node = null;
        this.chat_node = null;
        this.reactions_observer = null;
        this._mainmap = false;
        this._tab1map = false;
        this._tab2map = false;
        this._interval = -1;
    }
    get active() {
        return this._interval > -1;
    }
    start() {
        this._interval = setInterval(() => {
            const main = document.querySelector("div[data-participant-id]:not([role])");
            if(this._mainmap && !main) {
                if(this._mainmap) {
                    this._mainmap = false;
                    this.reactions_observer?.disconnect();
                    this.messages_observer?.disconnect();
                    this.reactions_observer = null;
                    this.messages_observer = null;
                    this.reactions_node = null;
                    this.messages_node = null;
                }
            } else if(main && !this._mainmap) {
                this._mainmap = true;

                this.grid_node = document.querySelector("div[data-participant-id]:not([role])")?.parentElement?.parentElement;
                if(!this.grid_node) { throw new Error("grid_node not found"); }

                this.reactions_node = this.grid_node.lastElementChild?.previousElementSibling?.previousElementSibling?.firstElementChild?.firstElementChild?.firstElementChild;
                if(!this.reactions_node) { throw new Error("reactions_node not found"); }

                this.messages_node = document.querySelector('div[data-update-corner]')?.firstElementChild;
                if(!this.messages_node) { throw new Error("messages_node not found"); }

                const reactions = new MutationObserver(this.onreaction.bind(this));
                reactions.observe(this.reactions_node, {
                    childList: true
                });

                const messages = new MutationObserver(this.onmessage.bind(this));
                messages.observe(this.messages_node, {
                    childList: true
                });
            }

            const tab1 = document.querySelectorAll("div[data-tab-id='1']");
            if(this._tab1map && !tab1) {
                this._tab1map = false;

            } else if(tab1 && !this._tab1map) {

            }

            const tab2 = document.querySelectorAll("div[data-tab-id='2']");
            if(this._tab2map && !tab2) {

            } else if(tab2 && !this._tab2map) {
                
            }
        }, 1000);
    }
    stop() {
        clearInterval(this._interval);
        this._interval = -1;
    }
    async mapNodes() {
        while(!document.querySelector("div[data-participant-id]:not([role])")) {
            await new Promise(r => setTimeout(r, 500));
        }
        this.grid_node = document.querySelector("div[data-participant-id]:not([role])")?.parentElement?.parentElement;
        this.reactions_node = this.grid_node?.lastElementChild?.previousElementSibling?.previousElementSibling?.firstElementChild?.firstElementChild?.firstElementChild;
        this.messages_node = document.querySelector('div[data-update-corner]')?.firstElementChild;
    }
    registerParticipants() {
        const nodes = [];
        for(const node of this.grid_node.children) {
            if(node.classList[0] === this.grid_node?.firstElementChild.classList[0]) {
                const participant = new Participant(node);
                if(!this.participants.has(participant.id)) {
                    this.participants.set(participant.id, participant);
                }
            }
        }
    }
    attachObservers() {
        const reactions = new MutationObserver(this.onreaction.bind(this));
        reactions.observe(this.reactions_node, {
            childList: true
        });
        const messages = new MutationObserver(this.onmessage.bind(this));
        messages.observe(this.messages_node, {
            childList: true
        });
        const participants = new MutationObserver(this.onparticipant.bind(this));
        participants.observe(this.grid_node, {
            childList: true
        });
        this.reactions_observer = reactions;
        this.messages_observer = messages;
    }
    onreaction(event) {
        console.log("reaction event", event)
    }
    onmessage(event) {
        console.log("message event", event)
    }
    onchat(event) {
        console.log("chat event", event)
    }
    onparticipant(event) {
        console.log("participant event", event);

    }
}

class Participant {
    /**
     * 
     * @param {Element} node 
     */
    constructor(node) {
        this.id = node.firstElementChild?.getAttribute("data-participant-id");
        this.self = node.querySelector("div[data-self-name]")?.getAttribute("data-self-name");
        this.name = node.querySelector("div[jsslot] div[style]")?.textContent;
        this.avatar = node.querySelector("img")?.getAttribute("src");
        this.mic_node = node.querySelector("div[data-use-tooltip]");
        this.voice_node = this.mic_node?.firstChild?.nextSibling;
        this.cam_node = node.querySelector("div[data-resolution-cap]");
        this.hand_node = this.cam_node?.firstChild?.firstChild;
        this.mic_observer = null;
        this.voice_observer = null;
        this.cam_observer = null;
        this.hand_observer = null;
    }
    attachObservers() {
        const mic = new MutationObserver(this.onmic.bind(this));
        mic.observe(this.mic_node, {
            attributes: true,
            attributeFilter: ["class"]
        });
        const voice = new MutationObserver(this.onvoice.bind(this));
        voice.observe(this.voice_node, {
            attributes: true,
            attributeFilter: ["class"]
        });
        const cam = new MutationObserver(this.oncam.bind(this));
        cam.observe(this.cam_node, {
            attributes: true,
            attributeFilter: ["class"]
        });
        const hand = new MutationObserver(this.onhand.bind(this));
        hand.observe(this.hand_node, {
            attributes: true,
            attributeFilter: ["class"]
        });
        this.mic_observer = mic;
        this.voice_observer = voice;
        this.cam_observer = cam;
        this.hand_observer = hand;
    }
    detachObservers() {
        this.mic_observer?.disconnect();
        this.voice_observer?.disconnect();
        this.cam_observer?.disconnect();
        this.hand_observer?.disconnect();
        this.mic_observer = null;
        this.voice_observer = null;
        this.cam_observer = null;
        this.hand_observer = null;
    }
    onmic(event) {
        console.log("mic event", event)
    }
    onvoice(event) {
        console.log("voice event", event)
    }
    oncam(event) {
        console.log("cam event", event)
    }
    onhand(event) {
        console.log("hand event", event)
    }
}
