const ___onmessage = Object.getOwnPropertyDescriptor(RTCDataChannel.prototype, "onmessage");
Object.defineProperty(RTCDataChannel.prototype, "onmessage", {
	get() {
		return ___onmessage.get.call(this);
	},
	set(val) {
		const fn = function(d) {
			if(d.target.label === "collections" || d.target.label === "reactions") {
				document.dispatchEvent(new CustomEvent('@_@', { detail: { type: d.target.label, data: d.data } }));
			} else if(d.target.label === "audioprocessor") {
				if(d.data.byteLength > 2) {
					document.dispatchEvent(new CustomEvent('@_@', { detail: { type: "audio", data: "self" } }))
				}
			}
			return val(d);
		}
		return ___onmessage.set.call(this, fn);
	}
});

const ___onclose = Object.getOwnPropertyDescriptor(RTCDataChannel.prototype, "onclose");
Object.defineProperty(RTCDataChannel.prototype, "onclose", {
	get() {
		return ___onclose.get.call(this);
	},
	set(val) {
		const fn = function(d) {
			document.dispatchEvent(new CustomEvent('@_@', { detail: { type: "close" } }));
			return val(d);
		}
		return ___onclose.set.call(this, fn);
	}
});

const ___send = Object.getOwnPropertyDescriptor(RTCDataChannel.prototype, "send");
Object.defineProperty(RTCDataChannel.prototype, "send", {
	value: function(d) {
		document.dispatchEvent(new CustomEvent('@_@', { detail: { type: "send", data: d } }));
		return ___send.value.call(this, d);
	}
});

const ___fetch = Object.getOwnPropertyDescriptor(window, "fetch");
Object.defineProperty(window, "fetch", {
	value: function() {
		if(arguments[0].includes("HandRaise")) {
			document.dispatchEvent(new CustomEvent('@_@', { detail: { type: "send", data: arguments[1].body } }))
		}
		return ___fetch.value.apply(this, arguments);
	}
});

/** @type {Map<string, RTCRtpReceiver>} */
const ___receivers = new Map();

const ___peer = Object.getOwnPropertyDescriptor(window, "RTCPeerConnection");
Object.defineProperty(window, "RTCPeerConnection", {
	value: function() {
		const p = new ___peer.value(arguments);
		p.addEventListener("track", trackEvent => {
			if(trackEvent.track.kind === "audio" && ["6666", "6667", "6668"].includes(trackEvent.streams[0].id)) {
				___receivers.set(trackEvent.streams[0].id, trackEvent.transceiver.receiver);
			}
		})
		return p;
	}
});

setInterval(() => {
	for(const receiver of ___receivers.values()) {
		const contributors = receiver.getContributingSources();
		const active = contributors.filter(x => x.source > 100 && x.audioLevel > 0.001);
		for(const source of active) {
			document.dispatchEvent(new CustomEvent('@_@', { detail: { type: "audio", data: source.source } }))
		}
	}
}, 200);
