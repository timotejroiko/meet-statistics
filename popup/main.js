/**
 * @typedef {{
 * 		name: string,
 * 		calculated: {
 * 			time: number,
 * 			cam: number,
 * 			mic: number,
 * 			voice: number,
 * 			presentation: number,
 * 			hands: number,
 * 			emojis: number,
 * 			texts: number
 * 		}
 * 		node: HTMLElement
 * }} CollectionData
 */

/**
 * @type {{
 * 		data: CollectionData[],
 * 		keys: Record<string, CollectionData>
 * }}
 */
const collection = {
	data: [],
	keys: {}
};

const containerNode = /** @type {HTMLElement} */ (document.querySelector(".container"));
const meetingNode = /** @type {HTMLElement} */ (document.querySelector(".meeting"));
const titleNode = /** @type {HTMLElement} */ (document.querySelector(".meeting .title"));
const timeNode = /** @type {HTMLElement} */ (document.querySelector(".meeting .time"));
const tableNode = /** @type {HTMLElement} */ (document.querySelector(".meeting table tbody"));
const tableView = /** @type {HTMLCollectionOf<HTMLElement>} */ (document.getElementsByClassName("participant"));

loop();

let globalInterval = setInterval(loop, 1000);

async function loop() {
	const meeting = await Utils.getCurrentMeeting();
	if(meeting) {
		if(!containerNode.classList.contains("has-meeting")) {
			containerNode.classList.add("has-meeting");
		}
		if(!meetingNode.dataset.id) {
			meetingNode.dataset.id = meeting.id;
			titleNode.textContent = meeting.title;
		}
		if(meetingNode.dataset.id !== meeting.id) {
			meetingNode.dataset.id = meeting.id;
			titleNode.textContent = meeting.title;
			tableNode.innerHTML = tableNode.firstElementChild?.outerHTML || "";
		}
		
		timeNode.textContent = Utils.milliToHHMMSS(meeting.lastSeen - meeting.firstSeen);
		
		const participants = await Store.listMeetingParticipants(meeting.dataId);
		const participantsData = await Store.getMultipleParticipantsData(meeting.dataId, participants.map(x => x.dataId));
		
		for(const participant of participants) {
			let data = collection.keys[participant.dataId];
			if(!data) {
				const d = Utils.createNode(participant);
				collection.data.push(d);
				data = collection.keys[participant.dataId] = d;
			}
			const updated = Utils.parseData(participantsData[participant.dataId]);
			updated["time"] = participant.lastSeen - participant.firstSeen;
			const keys = ["time", "cam", "mic", "voice", "presentation", "hands", "emojis", "texts"];
			for(let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if(updated[key] !== data.calculated[key]) {
					if(key !== "time") {
						data.calculated[key] = updated[key];
					}
					data.node.children[i + 1].textContent = ["time", "cam", "mic", "voice", "presentation"].includes(key) ? Utils.milliToHHMMSS(updated[key]) : updated[key].toString();
				}
			}
		}

		switch(meetingNode.dataset.sort) {
			default: collection.data.sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0); break;
		}

		for(let i = 0; i < collection.data.length; i++) {
			const cnode = collection.data[i].node;
			const vnode = tableView[i];
			if(vnode && cnode !== vnode) {
				tableNode.insertBefore(cnode, vnode);
			} else if(!vnode) {
				tableNode.appendChild(cnode);
			}
		}
	} else {
		if(containerNode.classList.contains("has-meeting")) {
			containerNode.classList.remove("has-meeting");
		}
	}
}
