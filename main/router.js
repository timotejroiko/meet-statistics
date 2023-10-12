/**
 * @param {string} meeting 
 * @param {string} participant 
 */
async function router(meeting = "", participant = "") {
    if(meeting) {
        let str = `?meeting=${meeting}`;
        if(participant) {
            str += `&participant=${participant}`;
        }
        history.pushState(null, '', str);
    }
    const mainNode = /** @type {HTMLElement} */ (document.getElementById("main"));
    const meetingNode = /** @type {HTMLElement} */ (document.getElementById("meeting"));
    const participantNode = /** @type {HTMLElement} */ (document.getElementById("participant"));

    const urlParams = new URLSearchParams(window.location.search);
    const meetID = urlParams.get('meeting');
    const participantID = urlParams.get('participant');

    const list = await Store.listMeetings();
    updateSidebarStats(list.length);

    if(meetID) {
        const split = meetID.split(",");
        const selected = list.filter(x => split.includes(x.dataId));
        if(selected.length) {
            if(selected.length > 1) {

            } else {
                const m = selected[0];
                const participants = await Store.listMeetingParticipants(m.dataId);
                if(participantID) {
                    const participant = participants.find(x => x.dataId === participantID);
                    document.title = `${m.title} - ${participant?.name}`;
                    mainNode.classList.remove("show");
                    meetingNode.classList.remove("show");
                    participantNode.classList.add("show");
                    // loadMeetingParticipant(m, participant);
                } else {
                    document.title = `${m.title}`;
                    mainNode.classList.remove("show");
                    participantNode.classList.remove("show");
                    meetingNode.classList.add("show");
                    // loadMeeting(m, participants);
                }   
            }
        }
    } else {
        meetingNode.classList.remove("show");
        participantNode.classList.remove("show");
        mainNode.classList.add("show");
        loadMain(list);
    }
}

/**
 * 
 * @param {number} [length] 
 * @param {number} [size] 
 */
async function updateSidebarStats(length, size) {
    // @ts-ignore
    const s = typeof size !== "number" ? await chrome.storage.local.getBytesInUse() : size;
    const l = typeof length !=="number" ? (await Store.listMeetings()).length : length;
    const statsNode = /** @type {HTMLElement} */ (document.querySelector("#main .sidebar .lower .stats"));
    statsNode.children[0].children[1].textContent = l.toString();
    statsNode.children[1].children[1].textContent = `${(s / 1024).toFixed(2)}KB`;
}
