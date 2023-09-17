(async () => {
    const meeting = await getCurrent();
    if(meeting) {
        meeting["participants"] = await Store.listMeetingParticipants(meeting.dataId);
        for(const participant of meeting["participants"]) {
            participant.data = await Store.getParticipantData(meeting.dataId, participant.dataId);
        }
        const elem = document.createElement("pre");
        elem.innerText = JSON.stringify(meeting, null, "\t");
        document.body.appendChild(elem);
    } else {
        const elem = document.createElement("p");
        elem.innerText = "Start a Meeting to display stats";
        document.body.appendChild(elem);
    }
})();

/**
 * @returns {Promise<Awaited<ReturnType<Store.listMeetings>>[0] | undefined>}
 */
async function getCurrent() {
    // @ts-ignore
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    const title = tab.title;
    const list = await Store.listMeetings();
    return list.find(x => x.title === title);
}