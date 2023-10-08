function updateParticipant(participant, collection) {
	let data = collection.keys[participant.dataId];
	if(!data) {
		const d = Utils.createNode(participant);
		collection.data.push(d);
		data = collection.keys[participant.dataId] = d;
	}
	data.calculated.time = participant.lastSeen - participant.firstSeen;
	data.node.children[1].textContent = Utils.milliToHHMMSS(data.calculated.time);
    data.participant = participant;
	return data;
}

function updateParticipantData(participant, updated) {
	const keys = ["cam", "mic", "voice", "presentation", "hands", "emojis", "texts"];
	for(let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if(updated[key] !== participant.calculated[key]) {
			const content = ["cam", "mic", "voice", "presentation"].includes(key) ? Utils.milliToHHMMSS(updated[key]) : updated[key].toString();
			participant.calculated[key] = updated[key];
			participant.node.children[i + 2].textContent = content;
		}
	}
}

function updateTable(collection, sort, reverse) {
	if(sort) {
		collection.data.sort((a,b) => {
			const r = b.calculated[sort] - a.calculated[sort];
			if(r === 0) {
				return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
			}
			return r;
		});
	} else {
		collection.data.sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
	}

	if(reverse) {
		collection.data.reverse();
	}

	const tableNode = /** @type {HTMLElement} */ (document.querySelector(".meeting table tbody"));
	const tableView = /** @type {HTMLCollectionOf<HTMLElement>} */ (document.getElementsByClassName("participant"));

	for(let i = 0; i < collection.data.length; i++) {
		const cnode = collection.data[i].node;
		const vnode = tableView[i];
		if(vnode && cnode !== vnode) {
			tableNode.insertBefore(cnode, vnode);
		} else if(!vnode) {
			tableNode.appendChild(cnode);
		}
	}
}
