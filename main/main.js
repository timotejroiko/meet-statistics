
router();
load();

window.onpopstate = () => {
    router();
    load();
}

async function loadMain() {
    const mainNode = /** @type {HTMLElement} */ (document.getElementById("main"));
    if(!mainNode.classList.contains("loaded")) {
        const statsNode = /** @type {HTMLElement} */ (mainNode.querySelector(".sidebar .lower .stats"));
        const tableNode = /** @type {HTMLElement} */ (mainNode.querySelector(".content .container table tbody"));
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
            newNode.dataset.id = meeting.dataId;
            let html = `<td class="checkbox"><label><input type="checkbox"/></label></td>`
                + `<td class="left"><p class="title">${meeting.title || "N/A"}</p><p class="id">${meeting.id}</p></td>`
                + `<td class="left"><p class="date">${d1}</p><p class="time">${d2}</p></td>`
                + `<td class="center n"><p>${participants.length}</p><span class="material-symbols-rounded" title="Participants">person</span></td>`
                + `<td class="center"><p>${d3}</p></td>`
                + `<td class="center actions">`
                    + `<span class="material-symbols-rounded" title="Download CSV" data-content="CSV">download</span>`
                    + `<span class="material-symbols-rounded" title="Download JSON" data-content="JSON">download</span>`
                    + `<span class="material-symbols-rounded delete" title="Delete">delete</span>`
                + `</td>`;
            newNode.innerHTML = html;
            tableNode.appendChild(newNode);
        }
    
        bindMainSidebarButtons();
        bindMainToolbarButtons()
        bindMainTableButtons();

        mainNode.classList.add("loaded");
    }
}
