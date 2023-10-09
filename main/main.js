
router();
load();

function load() {
    const active = document.querySelector(".show");
    if(active && !active.classList.contains("loaded")) {
        switch(active.id) {
            case "main": return loadMain();
            case "meeting": return loadMain();
            case "participant": return loadMain();
        }
    }
}

async function loadMain() {
    const mainNode = /** @type {HTMLElement} */ (document.getElementById("main"));
    const statsNode = /** @type {HTMLElement} */ (mainNode.querySelector(".sidebar .lower .stats"));
    const tableNode = /** @type {HTMLElement} */ (mainNode.querySelector(".content .container table"));
    // @ts-ignore
    const stats = await chrome.storage.local.getBytesInUse();
    const meetings = await Store.listMeetings();
    statsNode.children[0].children[1].textContent = meetings.length.toString();
    statsNode.children[1].children[1].textContent = `${(stats / 1024).toFixed(2)}KB`;
    for(const meeting of meetings.reverse()) {
        const participants = await Store.listMeetingParticipants(meeting.dataId);
        const date = new Date(meeting.firstSeen);
        const d1 = date.toLocaleDateString();
        const d2 = date.toLocaleTimeString();
        const d3 = Utils.milliToHHMMSSFull(meeting.lastSeen - meeting.firstSeen);
        const newNode = document.createElement("tr");
        newNode.classList.add("participant");
        newNode.innerHTML = `<td><label><input type="checkbox"/></label></td><td><p>${meeting.title || "N/A"}</p><p>${meeting.id}</p></td><td><p>${d1}</p><p>${d2}</p></td><td><span class="material-symbols-rounded" title="Participants">person</span><p>${participants.length}</p></td><td><p>${d3}</p></td><td></td>`;
        tableNode.appendChild(newNode);
    }
}
