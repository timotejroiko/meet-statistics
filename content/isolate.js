Store.getOptions().then(async options => {
	const id = window.location.pathname.slice(1);
    console.log(id);
    return
	const info = await Store.findOrCreateMeeting(id);
	const meeting = new Meeting(info, options, Store);
	meeting.start();
});

document.addEventListener('@_@', async (/** @type {CustomEvent} */ e) => {
	const { type, data } = /** @type {{ type: string, data: ArrayBuffer }} */ (e.detail);
	switch(type) {
		case "collections": {
			const d = await decompress(data);
			const o = unpack(d);
			parseCollections(o);
			break;
		}
		case "reactions": {
			const d = new Uint8Array(data);
			const o = unpack(d);
			parseReactions(o);
			break;
		}
		case "send": {
			const d = new Uint8Array(data);
			const check1 = d.indexOf(0x1F);
			if(check1 > -1 && check1 < 5 && d.indexOf(0x8B) === check1 + 1 && d.indexOf(0x08) === check1 + 2) {
				const d2 = await decompress(d.slice(check1));
				const o = unpack(d2);
				parseSend(o);
			} else {
				const o = unpack(d);
				parseSend(o);
			}
			break;
		}
		case "close": {
			console.log("meeting closed");
		}
		case "audio": {
			console.log("audio activity", data);
		}
	}
});

const state = new Map();

function parseCollections(data) {
	let val;
	if(val = data["1"]?.["2"]?.["13"]?.["1"]?.["2"]) {
		const id = val["1"]?.str;
		const name = val["2"]?.str;
		const img = val["3"]?.str;
		const owner = val["21"]?.str;
		const type = val["4"] === "6" ? "leave" : "join";
		if(owner) {
			console.log(`presentation ${type}`, `name=${name}`, `id=${id}`, `img=${img}`, `owner=${owner}`);
		} else {
			console.log(`user ${type}`, `name=${name}`, `id=${id}`, `img=${img}`);
		}
	} else if(val = data["1"]?.["2"]?.["3"]?.["2"]) {
		if(val.length) {
			const id = val[0]?.["6"]?.str;
			const audioState = val[0]?.["10"]?.["1"] === "1" ? "off" : "on";
			const videoState = val[1]?.["10"]?.["1"] === "1" ? "off" : "on";
			const videoId = val["4"]?.str;
			const audioId = val["4"]?.str;
			console.log("user current state", `id=${id}`, `audio=${audioState}`, `audioId=${audioId}`, `video=${videoState}`, `videoId=${videoId}`)
		} else {
			const id = val["6"]?.str;
			const media = val["8"];
			if(media["2"]) {
				const videoState = val["10"]?.["1"] === "1" ? "off" : "on";
				const videoId = val["4"]?.str;
				console.log("user state change", `id=${id}`, `video=${videoState}`, `videoId=${videoId}`)
			} else {
				const audioState = val["10"]?.["1"] === "1" ? "off" : "on";
				const audioId = val["4"]?.str;
				console.log("user state change", `id=${id}`, `audio=${audioState}`, `audioId=${audioId}`)
			}
		}
	} else if(val = data["1"]?.["2"]?.["13"]?.["4"]?.["2"]) {
		const messageId = val["1"]?.str;
		const authorId = val["2"]?.str;
		const authorName = val["8"]?.["1"]?.str;
		const authorImg = val["8"]?.["2"]?.str;
		const content = val["5"]?.["1"]?.str;
		console.log("message", `id=${messageId}, authorId=${authorId}, authorName=${authorName}, authorImg=${authorImg}, content=${content}`)
	} else if(val = data["1"]?.["2"]?.["13"]?.["12"]?.["2"]) {
		const handId = val["1"]?.str;
		const authorId = val["4"]?.str;
		console.log("hand raise", `handId=${handId}`, `authorId=${authorId}`);
	} else if(val = data["1"]?.["2"]?.["13"]?.["12"]?.["3"]) {
		const handId = val.str;
		console.log("hand down", `handId=${handId}`);
	}
}

function parseReactions(data) {
	let val;
	if(val = data["1"]?.["1"]?.["1"]) {
		const reaction = val["1"]?.["1"]?.str;
		const authorId = val["4"]?.["1"]?.str;
		console.log("reaction", `${reaction}`, `author=${authorId}`)
	}
}

function parseSend(data) {
	let val;
	if(val = data["1"]?.["2"]?.["4"]) {
		const type = val["4"]?.str;
		if(type === "audio" || type === "video") {
			const state = val["10"]?.["1"];
			console.log(`self ${type} ${state === "1" ? "off" : "on"}`);
		}
	} else if(val = data["1"]?.["1"]?.["2"]?.["1"]?.["1"]?.str) {
		console.log("self emoji sent", val);
	} else if(val = data["1"]?.["1"]?.["3"]?.["1"]?.["2"]?.["5"]?.["1"]?.str) {
		console.log("self text sent", val);
	} else if(val = data["4"]?.["4"]?.[0] && data["4"]?.["4"]) {
		const audio = val[0];
		const video = val[1];
		if(audio["4"]?.str === "audio" && video["4"].str === "video" && video["8"]?.["1"]?.length) {
			const audioState = audio["10"]?.["1"] === "1" ? "off" : "on";
			const videoState = video["10"]?.["1"] === "1" ? "off" : "on";
			const sourceId = video["8"]?.["1"]?.[0];
			console.log("self join", `audio=${audioState}`, `video=${videoState}`, `videoId=${sourceId}`);
			let id = document.querySelector(`div[data-ssrc="${sourceId}"]`)?.closest("div[data-participant-id]")?.getAttribute("data-participant-id");
			let interval;
			if(!id) {
				interval = setInterval(() => {
					id = document.querySelector(`div[data-ssrc="${sourceId}"]`)?.closest("div[data-participant-id]")?.getAttribute("data-participant-id");
					if(id) {
						clearInterval(interval);
						console.log("obtained self id: ", id);
					}
				}, 100);
			}
		}
	} else if(val = data["2"]?.["4"]?.[0] && data["2"]?.["4"]) {
		const audio = val[0];
		const video = val[1];
		if(audio?.["4"]?.str === "audio" && video?.["4"].str === "video") {
			const audioState = audio["10"]?.["1"] === "1" ? "off" : "on";
			const videoState = video["10"]?.["1"] === "1" ? "off" : "on";
			console.log("self state change", `audio=${audioState}`, `video=${videoState}`);
		}
	} else if(val = data["2"]) {
		const handId = val["1"]?.str;
		const authorId = val["3"]?.str;
		console.log("self hand raise", `handId=${handId}`, `authorId=${authorId}`);
	} else if(val = data["1"]?.str) {
		console.log("self hand down", `handId=${val}`);
	}
}
