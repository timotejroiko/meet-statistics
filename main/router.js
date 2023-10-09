/**
 * @param {string} meeting 
 * @param {string} participant 
 */
function router(meeting = "", participant = "") {
    if(meeting) {
        if(participant) {
            history.pushState(null, '', `?meeting=${meeting}&participant=${participant}`);
        } else {
            history.pushState(null, '', `?meeting=${meeting}`);
        }
    }
    const mainNode = /** @type {HTMLElement} */ (document.getElementById("main"));
    const meetingNode = /** @type {HTMLElement} */ (document.getElementById("meeting"));
    const participantNode = /** @type {HTMLElement} */ (document.getElementById("participant"));
    mainNode.classList.remove("show");
    meetingNode.classList.remove("show");
    participantNode.classList.remove("show");

    const urlParams = new URLSearchParams(window.location.search);
    const meetID = urlParams.get('meeting');
    const participantID = urlParams.get('participant');

    if(meetID) {
        if(participantID) {
            participantNode.classList.add("show");
            document.title = `Meeting ${meetID} - Participant ${participantID}`;
        } else {
            meetingNode.classList.add("show");
            document.title = `Meeting ${meetID}`;
        }
    } else {
        mainNode.classList.add("show");
    }
}

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
