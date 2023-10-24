
bindMainSidebarButtons();
bindMainToolbarButtons();
bindMainTableButtons();

router();
window.onpopstate = () => {
    router();
}

/**
 * @param {Awaited<ReturnType<Store.listMeetings>>} meetings 
 */
async function loadMain(meetings) {
    const mainNode = /** @type {HTMLElement} */ (document.getElementById("main"));
    const tableNode = /** @type {HTMLElement} */ (mainNode.querySelector(".content .container table tbody"));
    const head = /** @type {HTMLElement} */ (tableNode.firstElementChild);
    tableNode.replaceChildren(head);
    meetings.sort((a,b) => b.firstSeen - a.firstSeen);
    for(const meeting of meetings) {
        const date = new Date(meeting.firstSeen);
        const d1 = date.toLocaleDateString();
        const d2 = date.toLocaleTimeString();
        const d3 = Utils.milliToHHMMSSFull(meeting.lastSeen - meeting.firstSeen);
        const n = meeting.n ?? (await Store.listMeetingParticipants(meeting.dataId)).length;
        const newNode = document.createElement("tr");
        newNode.classList.add("participant");
        newNode.dataset.id = meeting.dataId;
        newNode.dataset.sort = "date";
        let html = `<td class="checkbox"><label><input type="checkbox"/></label></td>`
            + `<td class="left"><div class="break"><p class="title">${meeting.title || "?"}</p><p class="id">${meeting.id}</p></div></td>`
            + `<td class="left" data-sort="${meeting.firstSeen}"><div class="break"><p class="date">${d1}</p><p class="time">${d2}</p></div></td>`
            + `<td class="center n" data-sort="${n}"><p>${n}</p><span class="material-symbols-rounded" title="Participants">person</span></td>`
            + `<td class="center" data-sort="${meeting.lastSeen - meeting.firstSeen}"><div class="break"><p>${d3}</p></div></td>`
            + `<td class="center actions">`
                + `<span class="material-symbols-rounded" title="Download CSV" data-content="CSV">download</span>`
                + `<span class="material-symbols-rounded" title="Download JSON" data-content="JSON">download</span>`
                + `<span class="material-symbols-rounded delete" title="Delete">delete</span>`
            + `</td>`;
        newNode.innerHTML = html;
        tableNode.appendChild(newNode);
    }
    bindMainTableContentButtons(meetings);
}
