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

    // let timeElem = document.querySelector(`#${queryId} td.talk`);
    // if (!timeElem) {
    //     timeElem = document.createElement("td");
    //     timeElem.className = "talk";
    // }
    // timeElem.textContent = timeTalking;

    // let camElem = document.querySelector(`#${queryId} td.cam`);
    // if (!camElem) {
    //     camElem = document.createElement("td");
    //     camElem.className = "cam";
    // }
    // camElem.textContent = timeCameraOn;

    // let reactElem = document.querySelector(`#${queryId} td.react`);
    // if (!reactElem) {
    //     reactElem = document.createElement("td");
    //     reactElem.className = "react";
    // }
    // reactElem.textContent = reactNum;

    // let chatElem = document.querySelector(`#${queryId} td.chat`);
    // if (!chatElem) {
    //     chatElem = document.createElement("td");
    //     chatElem.className = "chat";
    // }
    // chatElem.textContent = chatNum;

    const rowElem = document.querySelector(`#${queryId}`);
    if (!rowElem) {
        const newRow = document.createElement("tr");
        newRow.id = queryId;
        newRow.className = "participant";

        // newRow.append(infoElem, timeElem, camElem, reactElem);
        newRow.append(...elemsArray);

        tableData.append(newRow);
    }
}