function bindMainSidebarButtons() {
    
}

function bindMainToolbarButtons() {
    const toolbar = /** @type {HTMLElement} */ (document.querySelector("#main .content .container .toolbar"));
    const tableNode = /** @type {HTMLElement} */ (document.querySelector("#main .content .container table"));
    const tableView = /** @type {HTMLCollectionOf<HTMLElement>} */ (tableNode.getElementsByClassName("participant"));

    const search = /** @type {HTMLInputElement} */ (toolbar.querySelector(".search input"));
    search.oninput = () => {
        const val = search.value.toLowerCase();
        if(val) {
            for(const row of tableView) {
                const content = row.querySelectorAll("p");
                if(Array.prototype.some.call(content, x => x.textContent.toLowerCase().includes(val))) {
                    row.classList.remove("hide");
                } else {
                    row.classList.add("hide");
                }
            }
        } else {
            for(const row of tableView) {
                row.classList.remove("hide");
            }
        }
    }

    const [merge, expor, delet] = /** @type {NodeListOf<HTMLElement>} */ (toolbar.querySelectorAll(".actions > div"));
    merge.onclick = () => {
        const checked = /** @type {NodeListOf<HTMLElement>} */ (tableNode.querySelectorAll(".participant .checkbox input:checked"));
        const selected = /** @type {HTMLElement[]} */ (Array.prototype.map.call(checked, x => x.closest(".participant")));
        router(selected.map(x => x.dataset.id).join(","));
    }
    expor.onclick = async () => {
        const checked = /** @type {NodeListOf<HTMLElement>} */ (tableNode.querySelectorAll(".participant .checkbox input:checked"));
        const selected = /** @type {HTMLElement[]} */ (Array.prototype.map.call(checked, x => x.closest(".participant")));
        const list = await Store.listMeetings();
        const json = list.filter(x => selected.find(z => x.dataId === z.dataset.id));
        for(const item of json) {
            const participants = await Store.listMeetingParticipants(item.dataId);
            const data = Store.getMultipleParticipantsEncodedData(item.dataId, participants.map(x => x.dataId));
            for(const participant of participants) {
                participant["data"] = data[`D-${item.dataId}-${participant.dataId}`];
            }
            item["participants"] = participants;
        }
        const blob = await (await new Response(new Blob([JSON.stringify(json)]).stream().pipeThrough(new CompressionStream("deflate")))).blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${json.length}-meetings-${new Date().toISOString()}.mscb`;
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    }
    delet.onclick = async () => {
        const checked = /** @type {NodeListOf<HTMLElement>} */ (tableNode.querySelectorAll(".participant .checkbox input:checked"));
        const selected = Array.prototype.map.call(checked, x => x.closest(".participant"));
        const ok = confirm(`Permanently delete ${selected.length} items?`);
        if(ok) {
            const list = await Store.listMeetings();
            const toDelete = [];
            for(const row of selected) {
                const meeting = list.find(x => x.dataId === row.dataset.id);
                if(meeting) {
                    const participants = await Store.listMeetingParticipants(meeting.dataId);
                    toDelete.push(`P-${meeting.dataId}`, ...participants.map(x => `D-${meeting.dataId}-${x.dataId}`));
                    list.splice(list.indexOf(meeting), 1);
                    // @ts-ignore
                    await Promise.all([chrome.storage.local.set({ list }), chrome.storage.local.remove(toDelete)]);
                    row.remove();
                    updateSidebarStats(list.length);
                }
            }
        }
    }
}

function bindMainTableButtons() {
    const tableNode = /** @type {HTMLElement} */ (document.querySelector("#main .content .container table"));
    const tableHeader = /** @type {HTMLElement} */ (tableNode.querySelector(".head"));
    tableHeader.onclick = event => {
        const target = /** @type {HTMLElement} */ (event.target);
        if(target.closest("th")) {
            if(target.closest(".checkbox")) {
                if(target.tagName === "INPUT") {
                    const view = tableNode.getElementsByClassName("participant");
                    const state = /** @type {HTMLInputElement} */ (target);
                    for(const row of view) {
                        const checkbox = /** @type {HTMLInputElement} */ (row.querySelector("input"));
                        checkbox.checked = state.checked;
                    }
                    toggleActionButtons(tableNode.querySelectorAll(".participant .checkbox input:checked").length);
                }
            } else {
                const rows = [...tableNode.getElementsByClassName("participant")];
                rows.sort((a, b) => {
                    return -1;
                });
            }
        }
    }
}

/**
 * @param {Awaited<ReturnType<Store.listMeetings>>} meetings 
 */
function bindMainTableContentButtons(meetings) {
    const tableNode = /** @type {HTMLElement} */ (document.querySelector("#main .content .container table"));
    const rows = /** @type {HTMLCollectionOf<HTMLElement>} */ (tableNode.getElementsByClassName("participant"));
    for(const row of rows) {
        row.onclick = async event => {
            const target = /** @type {HTMLElement} */ (event.target);
            if(target.closest(".checkbox")) {
                if(target.tagName === "INPUT") {
                    toggleActionButtons(tableNode.querySelectorAll(".participant .checkbox input:checked").length);
                }
            } else if(target.closest(".actions") && target.tagName === "SPAN") {
                const row = /** @type {HTMLElement} */ (target.closest(".participant"));
                const id = /** @type {string} */ (row.dataset.id);
                const meeting = meetings.find(x => x.dataId === id);
                if(meeting) {
                    if(target.dataset.content === "CSV") {
                        let csv = "Participant,Attendance time,Camera time,Mic time,Time speaking,Time presenting,Hands raised,Emojis sent,Messages sent";
                        const participants = await Store.listMeetingParticipants(id);
                        const participantsData = await Store.getMultipleParticipantsData(id, participants.map(x => x.dataId));
                        for(const participant of participants) {
                            const data = participantsData[participant.dataId];
                            const parsed = Utils.parseData(participant, data);
                            csv += "\n" + participant.name;
                            for(const key of ["time", "cam", "mic", "voice", "presentation"]) {
                                csv += "," + Utils.milliToHHMMSS(parsed[key]);
                            }
                            for(const key of ["hands", "emojis", "texts"]) {
                                csv += "," + parsed[key].toString();
                            }
                        }
                        const link = document.createElement('a');
                        link.href = `data:text/plain,${csv}`;
                        link.download = `${meeting.title} - ${new Date(meeting.firstSeen).toISOString()}.csv`;
                        link.dispatchEvent(new MouseEvent('click', { 
                            bubbles: true, 
                            cancelable: true, 
                            view: window 
                        }));
                    } else if(target.dataset.content === "JSON") {
                        const participants = await Store.listMeetingParticipants(id);
                        const participantsData = await Store.getMultipleParticipantsData(id, participants.map(x => x.dataId));
                        meeting["participants"] = participants;
                        for(const participant of participants) {
                            const data = participantsData[participant.dataId];
                            participant["data"] = Utils.parseData(participant, data);
                            participant["events"] = data;
                        }
                        const link = document.createElement('a');
                        link.href = `data:text/plain,${JSON.stringify(meeting)}`;
                        link.download = `${meeting.title} - ${new Date(meeting.firstSeen).toISOString()}.json`;
                        link.dispatchEvent(new MouseEvent('click', { 
                            bubbles: true, 
                            cancelable: true, 
                            view: window 
                        }));
                    } else if(target.title === "Delete") {
                        const ok = confirm(`Permanently delete ${meeting.title}?`);
                        if(ok) {
                            meetings.splice(meetings.indexOf(meeting), 1);
                            Store.setRaw({ list: meetings });
                        };
                    }
                }
            } else if(!target.closest(".break")) {
                const id = target.closest("tr")?.dataset.id;
                if(id) {
                    router(id);
                }
            }
        }
    }
}

/**
 * @param {number} l 
 */
function toggleActionButtons(l) {
    const actionNodes = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("#main .content .container .actions > div"));
    if(l > 0) {
        actionNodes[1].classList.remove("disabled");
        actionNodes[2].classList.remove("disabled");
        if(l > 1) {
            actionNodes[0].classList.remove("disabled");
        } else {
            actionNodes[0].classList.add("disabled");
        }
    } else {
        actionNodes[0].classList.add("disabled");
        actionNodes[1].classList.add("disabled");
        actionNodes[2].classList.add("disabled");
    }
}
