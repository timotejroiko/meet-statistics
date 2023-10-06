
bindOptionsButtons();

(async () => {
	const containerNode = /** @type {HTMLElement} */ (document.querySelector(".container"));
	const meeting = await Utils.getCurrentMeeting();
	if(meeting) {
		const meetingNode = /** @type {HTMLElement} */ (document.querySelector(".meeting"));
		const titleNode = /** @type {HTMLElement} */ (document.querySelector(".meeting .title"));
		const timeNode = /** @type {HTMLElement} */ (document.querySelector(".meeting .time"));

		containerNode.classList.add("has-meeting");
		meetingNode.dataset.id = meeting.id;
		titleNode.textContent = meeting.title;
		timeNode.textContent = Utils.milliToHHMMSS(meeting.lastSeen - meeting.firstSeen);

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

		const participants = await Store.listMeetingParticipants(meeting.dataId);
		const participantsData = await Store.getMultipleParticipantsData(meeting.dataId, participants.map(x => x.dataId));
		for(const participant of participants) {
			const data = updateParticipant(participant, collection);
			const updated = Utils.parseData(participantsData[participant.dataId]);
			updateParticipantData(data, updated);
		}

		updateTable(collection, meetingNode.dataset.sort, meetingNode.dataset.reverse === "true");

		// @ts-ignore
		chrome.storage.onChanged.addListener((/** @type {Record<string, { oldValue: *, newValue: * }>} */ changes, /** @type {string} */ namespace) => {
			if(namespace === "local") {
				for(const id in changes) {
					if(id === "list") {
						const found = changes.list.newValue.find(x => x.dataId === meeting.dataId);
						if(found) {
							Object.assign(meeting, found);
							timeNode.textContent = Utils.milliToHHMMSS(meeting.lastSeen - meeting.firstSeen);
						}
					} else if(id[0] === "P") {
						for(const participant of changes[id].newValue) {
							updateParticipant(participant, collection);
						}
					} else if(id[0] === "D") {
						const dataId = id.split("-")[2];
						const participant = collection.keys[dataId];
						const updated = Utils.parseData(changes[id].newValue.map(x => Store.decodeEvent(x)));
						updateParticipantData(participant, updated);
					}
				}
				updateTable(collection, meetingNode.dataset.sort, meetingNode.dataset.reverse === "true");
			}
		});

		bindDowloadButtons();
		bindTableButtons(collection);

	}
})();

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
