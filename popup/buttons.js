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

/**
 * @param {Table} table 
 */
function bindDowloadButtons(table) {
	const csvButton = /** @type {HTMLElement} */ (document.querySelector(".buttons .csv"));
	const jsonButton = /** @type {HTMLElement} */ (document.querySelector(".buttons .json"));

	csvButton.onclick = () => {
		let csv = "";
		csv += Array.prototype.map.call(table.tableNode.querySelectorAll("tr th span"), x => `${x.getAttribute("title")}`).join(",") + "\n";
		for(const row of table.tableView) {
			csv += Array.prototype.map.call(row.querySelectorAll("td"), x => `${x.innerText}`).join(",") + "\n";
		}
		const link = document.createElement('a');
		link.href = `data:text/plain,${csv}`;
		link.download = `${table.titleNode.textContent}.csv`;
		link.dispatchEvent(new MouseEvent('click', { 
			bubbles: true, 
			cancelable: true, 
			view: window 
		}));
	}
	
	jsonButton.onclick = async () => {
		const meeting = table.meeting;
		const participants = table.data.map(x => x.participant);
		const participantsData = await Store.getMultipleParticipantsData(table.meeting.dataId, participants.map(x => x.dataId));
		meeting["participants"] = participants;
		for(const participant of participants) {
			participant["data"] = Object.entries(table.get(participant.dataId).state).reduce((a, t) => { a[t[0]] = t[1].ren; return a }, {});
			participant["events"] = participantsData[participant.dataId];
		}
		const link = document.createElement('a');
		link.href = `data:text/plain,${JSON.stringify(meeting)}`;
		link.download = `${table.titleNode.textContent}.json`;
		link.dispatchEvent(new MouseEvent('click', { 
			bubbles: true, 
			cancelable: true, 
			view: window 
		}));
	}
}

/**
 * @param {Table} table 
 */
function bindTableButtons(table) {
	for(const icon of table.tableIcons) {
		icon.onclick = () => {
			if(table.meetingNode.dataset.sort === icon.dataset.sort) {
				const old = table.meetingNode.dataset.reverse;
				table.meetingNode.dataset.reverse = old === "true" ? "false" : "true";
				icon.dataset.ui = old === "true" ? "▼" : "▲";
			} else {
				table.meetingNode.dataset.sort = icon.dataset.sort;
				table.meetingNode.dataset.reverse = "false";
				icon.dataset.ui = "▼";
				for(const i of table.tableIcons) {
					if(i === icon) {
						continue;
					}
					i.dataset.ui = "";
				}
			}
			table.render();
		}
	}
}
