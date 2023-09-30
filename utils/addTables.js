function addMeetingsTableData(tableData, meetings) {
    for (let meet of meetings) {
        const dataId = meet["dataId"];
        const queryId = `meet-${dataId}`;
        const attrObj = {
            id: dataId,
            name: meet["title"],
            date: milliToDate(meet["firstSeen"]),
            startTime: milliToHHMMSS(meet["firstSeen"]),
            endTime: milliToHHMMSS(meet["lastSeen"]),
            totalParticipants: meet["participants"].length,
        }

        const elemsArray = [];
        for (const attrKey in attrObj) {
            let elem = document.querySelector(`#${queryId} td.${attrKey}`);
            if (!elem) {
                elem = document.createElement("td");
                elem.className = `${attrKey}`;
            }
            elem.textContent = attrObj[attrKey];
            elemsArray.push(elem);
        }

        let downloadBtn = document.querySelector(`#${queryId} td.download`);
        if (!downloadBtn) {
            downloadBtn = document.createElement("td");
            downloadBtn.id = `#btn-${queryId}`;
            downloadBtn.className = "download";
            downloadBtn.addEventListener("click", () => downloadJSON(meet["participants"]));
        }
        downloadBtn.innerHTML = "<span class='material-symbols-outlined'>download</span>";
        elemsArray.push(downloadBtn);

        const rowElem = document.querySelector(`#${queryId}`);
        if (!rowElem) {
            const newRow = document.createElement("tr");
            newRow.id = queryId;
            newRow.className = "meeting";

            newRow.append(...elemsArray);
            
            tableData.append(newRow);
        }
    }
}

function addTableData(tableData, participant) {
    const [firstName, secondName] = participant["name"].split(" ");
    const talkNum = getTimeTalking(participant);
    const camNum = getTimeWithCameraOn(participant);
    const reactNum = totalReactionsDuringCall(participant);
    const chatNum = totalChatInteractions(participant);

    const timeTalking = milliToHHMMSS(talkNum);
    const timeCameraOn = milliToHHMMSS(camNum);
    const dataId = participant["dataId"];
    const queryId = `student-${dataId}`;
    
    const elemsArray = [];
    const attrObj = {
        talk: timeTalking,
        cam: timeCameraOn,
        react: reactNum,
        chat: chatNum,
    }

    let infoElem = document.querySelector(`#${queryId} td.info`);
    if (!infoElem) {
        infoElem = document.createElement("td");
        infoElem.className = "info";

        const infoImg = document.createElement("img");
        infoImg.className = "avatar";
        infoImg.src = participant["avatar"];

        const infoName = document.createElement("span");
        infoName.textContent = `${firstName} ${secondName || ""}`;

        infoElem.append(infoImg, infoName);
    }
    
    elemsArray.push(infoElem);
    for (const attrKey in attrObj) {
        let elem = document.querySelector(`#${queryId} td.${attrKey}`);
        if (!elem) {
            elem = document.createElement("td");
            elem.className = `${attrKey}`;
        }
        elem.textContent = attrObj[attrKey];
        elemsArray.push(elem);
    }

    const rowElem = document.querySelector(`#${queryId}`);
    if (!rowElem) {
        const newRow = document.createElement("tr");
        newRow.id = queryId;
        newRow.className = "participant";

        newRow.append(...elemsArray);

        tableData.append(newRow);
    }
}