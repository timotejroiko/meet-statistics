
(async () => {
	bindOptionsButtons();
	const containerNode = /** @type {HTMLElement} */ (document.querySelector(".container"));
	const meeting = await Utils.getCurrentMeeting();
	if(meeting) {
		containerNode.classList.add("has-meeting");

		const table = new Table(meeting);
		await table.load();
		table.render();

		bindDowloadButtons(table);
		bindTableButtons(table);

		// @ts-ignore
		chrome.storage.onChanged.addListener((/** @type {Record<string, { oldValue: *, newValue: * }>} */ changes, /** @type {string} */ namespace) => {
			if(namespace === "local") {
				for(const id in changes) {
					if(id === "list") {
						const found = changes.list.newValue.find(x => x.dataId === meeting.dataId);
						if(found) {
							table.update(found);
						}
					} else if(id[0] === "P") {
						for(const participant of changes[id].newValue) {
							const row = table.getOrCreateRow(participant);
							row.update(participant);
						}
					} else if(id[0] === "D") {
						const row = table.get(id.split("-")[2]);
						const newdata = changes[id].newValue.slice(changes[id].oldValue.length);
						const decoded = newdata.map(x => Store.decodeEvent(x));
						row.updateData(decoded);
					}
				}
				table.render();
			}
		});
	}
})();
