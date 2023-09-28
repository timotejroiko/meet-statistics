const title = document.querySelector("#title");
const tableData = document.querySelector(".tableData");

const interval = setInterval(async () => {
    const meeting = await getCurrent();

    if(meeting) {
        title.innerText = meeting.title || "";
        tableData.style.display = "block";

        meeting["participants"] = await Store.listMeetingParticipants(meeting.dataId);
        for(const participant of meeting["participants"]) {
            participant.data = await Store.getParticipantData(meeting.dataId, participant.dataId);
            addTableData(tableData, participant); 
        }
    } else {
        const elem = document.createElement("div");
        const text = document.createElement("b");
        text.innerText = "Start a Meeting to display stats";

        elem.appendChild(text);
        document.body.appendChild(elem);
        clearInterval(interval);
    }
}, 1000);

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
    return list.findLast(x => x.title === title);
}