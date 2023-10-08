function bindOptionsButtons() {
	const optionsButton = /** @type {HTMLElement} */ (document.getElementById("options"));
	const optionsOKButton = /** @type {HTMLElement} */ (document.querySelector(".options .ok"));
	const containerNode = /** @type {HTMLElement} */ (document.querySelector(".container"));
	const optionsView = /** @type {HTMLCollectionOf<HTMLElement>} */ (document.getElementsByClassName("option"));

	optionsButton.onclick = () => {
		containerNode.classList.toggle("has-options");
	};
	
	optionsOKButton.onclick = () => {
		containerNode.classList.toggle("has-options");
	};

	Store.getOptions().then(options => {
		for(const optionNode of optionsView) {
			const key = optionNode.dataset.option;
			const button = /** @type {HTMLElement} */ (optionNode.children[1]);
			button.textContent = options[key] ? "toggle_on" : "toggle_off";
			optionNode.dataset.enabled = Boolean(options[key]).toString();
			button.onclick = () => {
				const oldstate = optionNode.dataset.enabled;
				optionNode.dataset.enabled = oldstate === "true" ? "false" : "true";
				button.textContent = oldstate === "false" ? "toggle_on" : "toggle_off";
				if((oldstate === "false" && !options[key]) || (oldstate === "true" && options[key])) {
					options[key] = !options[key];
					Store.setOptions(options).catch(console.error);
				}
			}
		}
	});
}

function bindDowloadButtons() {
	const csvButton = /** @type {HTMLElement} */ (document.querySelector(".buttons .csv"));
	const jsonButton = /** @type {HTMLElement} */ (document.querySelector(".buttons .json"));
	const titleNode = /** @type {HTMLElement} */ (document.querySelector(".meeting .title"));
	const tableNode = /** @type {HTMLElement} */ (document.querySelector(".meeting table tbody"));
	const tableView = /** @type {HTMLCollectionOf<HTMLElement>} */ (document.getElementsByClassName("participant"));

	csvButton.onclick = () => {
		let csv = `sep=,\n`;
		csv += Array.prototype.map.call(tableNode.querySelectorAll("tr th span"), x => `"${x.getAttribute("title")}"`).join(",") + "\n";
		for(const row of tableView) {
			csv += Array.prototype.map.call(row.querySelectorAll("td"), x => `"${x.innerText}"`).join(",") + "\n";
		}
		const link = document.createElement('a');
		link.href = `data:text/plain,${csv}`;
		link.download = `${titleNode.textContent}.csv`;
		link.dispatchEvent(new MouseEvent('click', { 
			bubbles: true, 
			cancelable: true, 
			view: window 
		}));
	}
	
	jsonButton.onclick = async () => {
		const meeting = await Utils.getCurrentMeeting();
		if(meeting) {
			const participants = await Store.listMeetingParticipants(meeting.dataId);
			const participantsData = await Store.getMultipleParticipantsData(meeting.dataId, participants.map(x => x.dataId));
			meeting["participants"] = participants;
			for(const participant of participants) {
				participant["data"] = Utils.parseData(participant, participantsData[participant.dataId]);
				participant["data"].time = participant.lastSeen - participant.firstSeen;
				participant["events"] = participantsData[participant.dataId];
			}
			const link = document.createElement('a');
			link.href = `data:text/plain,${JSON.stringify(meeting)}`;
			link.download = `${titleNode.textContent}.json`;
			link.dispatchEvent(new MouseEvent('click', { 
				bubbles: true, 
				cancelable: true, 
				view: window 
			}));
		}
	}
}

function bindTableButtons(collection) {
	const tableIcons = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("table th"));
	const meetingNode = /** @type {HTMLElement} */ (document.querySelector(".meeting"));

	for(const icon of tableIcons) {
		icon.onclick = () => {
			if(meetingNode.dataset.sort === icon.dataset.sort) {
				const old = meetingNode.dataset.reverse;
				meetingNode.dataset.reverse = old === "true" ? "false" : "true";
				icon.dataset.ui = old === "true" ? "▼" : "▲";
			} else {
				meetingNode.dataset.sort = icon.dataset.sort;
				meetingNode.dataset.reverse = "false";
				icon.dataset.ui = "▼";
				for(const i of tableIcons) {
					if(i === icon) {
						continue;
					}
					i.dataset.ui = "";
				}
			}
			updateTable(collection, meetingNode.dataset.sort, meetingNode.dataset.reverse === "true");
		}
	}
}
