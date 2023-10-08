/**
 * @param {string} meeting 
 * @param {string} participant 
 */
function router(meeting = "", participant = "") {
    if(meeting) {
        if(participant) {
            history.pushState(null, '', `?meeting=${meeting}`);
            document.title = `Meeting ${meeting}`;
        } else {
            history.pushState(null, '', `?meeting=${meeting}&participant=${participant}`);
            document.title = `Meeting ${meeting} - Participant ${participant}`;
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
        } else {
            meetingNode.classList.add("show");
        }
    } else {
        mainNode.classList.add("show");
    }
}
