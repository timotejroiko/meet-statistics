(async () => {
    const list = await Store.listMeetings();
    for(const item of list) {
        item["participants"] = await Store.listMeetingParticipants(item.dataId);
        for(const participant of item["participants"]) {
            participant.data = await Store.getParticipantData(item.dataId, participant.dataId);
        }
    }

    const elem = document.createElement("code");
    elem.innerText = JSON.stringify(list, null, "\t");
    document.body.appendChild(elem);
})()