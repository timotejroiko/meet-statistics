const title = document.querySelector("#title");
const csvButton = document.querySelector("#btn-csv");
const jsonButton = document.querySelector("#btn-json");
const table = document.querySelector(".table");
const tableData = document.querySelector(".table tbody");
let participants = [];

const interval = setInterval(async () => {
    const meeting = await getCurrent();

    if(meeting) {
        title.innerText = meeting.title || "";
        csvButton.style.display = "block";
        jsonButton.style.display = "block";
        table.style.display = "table";

        meeting["participants"] = await Store.listMeetingParticipants(meeting.dataId);
        participants = meeting["participants"];
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

csvButton.addEventListener('click', async () => {
    const aggStats = [];

    for (let part of participants) {
        const talkNum = getTimeTalking(part);
        const camNum = getTimeWithCameraOn(part);
        const reactNum = totalReactionsDuringCall(part);

        const timeTalking = milliToHHMMSS(talkNum);
        const timeCameraOn = milliToHHMMSS(camNum);

        aggStats.push({
            "Name": part["name"],
            "First Seen At": milliToBrazilLocale(part["firstSeen"]),
            "Last Seen At": milliToBrazilLocale(part["lastSeen"]),
            "Interaction (talking)": talkNum > 0,
            "Time Talking": timeTalking,
            "Interaction (camera)": camNum > 30 * 60000,
            "Camera On During": timeCameraOn,
            "Interaction (emojis)": reactNum > 0,
            "Total Reactions": totalReactionsDuringCall(part),
            "Total Chat Interactions": totalChatInteractions(part),
        });
    }

    const csvData = csvBuilder(aggStats);
    downloadCSV(csvData);
});

jsonButton.addEventListener('click', () => downloadJSON(participants));