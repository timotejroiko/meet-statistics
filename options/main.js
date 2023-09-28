const tableData = document.querySelector(".tableData");

(async () => {
    const list = await Store.listMeetings();
    for(const item of list) {
        item["participants"] = await Store.listMeetingParticipants(item.dataId);
        for(const participant of item["participants"]) {
            participant.data = await Store.getParticipantData(item.dataId, participant.dataId);
        }
    }

    // const elem = document.createElement("pre");
    // elem.innerText = JSON.stringify(list, null, "\t");
    // document.body.appendChild(elem);

    if(list.length > 0) {
        tableData.style.display = "block";
        addMeetingsTableData(tableData, list);
    } else {
        const elem = document.createElement("div");
        const text = document.createElement("b");
        text.innerText = "No Meetings Available";

        elem.appendChild(text);
        document.body.appendChild(elem);
    }
})();