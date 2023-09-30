const table = document.querySelector(".table");
const tableData = document.querySelector(".table tbody");

(async () => {
    const list = await Store.listMeetings();
    for(const item of list) {
        item["participants"] = await Store.listMeetingParticipants(item.dataId);
        for(const participant of item["participants"]) {
            participant.data = await Store.getParticipantData(item.dataId, participant.dataId);
        }
    }

    console.log(list);

    // const elem = document.createElement("pre");
    // elem.innerText = JSON.stringify(list, null, "\t");
    // document.body.appendChild(elem);

    if(list.length > 0) {
        table.style.display = "table";
        addMeetingsTableData(tableData, list);
    } else {
        const elem = document.createElement("div");
        const text = document.createElement("b");
        text.innerText = "No Meetings Available";

        elem.appendChild(text);
        document.body.appendChild(elem);
    }
})();