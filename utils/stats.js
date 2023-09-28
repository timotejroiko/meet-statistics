function getTimeTalking(participant) {
    const voiceData = participant["data"].filter((data) => data["type"] == "voice");

    let timeTalking = 0;
    for (let i = 0; i < voiceData.length; i++) {
        if (voiceData[i]["action"] == "start") {
        const timeStart = new Date(voiceData[i]["time"]).getTime();
        while (voiceData[i]["action"] != "stop" && i < voiceData.length) i++;
        if (i >= voiceData.length) break;

        const timeStop = new Date(voiceData[i]["time"]).getTime();
        timeTalking += timeStop - timeStart;
        }
    }

    return timeTalking;
}

function getTimeWithCameraOn(participant) {
    const cameraData = participant["data"].filter((data) => data["type"] == "cam");

    let timeCameraOn = 0;
    for (let i = 0; i < cameraData.length; i++) {
        if (cameraData[i]["action"] == "opened") {
        let timeStop;
        const timeStart = new Date(cameraData[i]["time"]).getTime();
        while (i < cameraData.length && cameraData[i]["action"] != "closed") i++;
        if (i >= cameraData.length) {
            timeStop = new Date(participant["lastSeen"]).getTime();
        } else {
            timeStop = new Date(cameraData[i]["time"]).getTime();
        }

        timeCameraOn += timeStop - timeStart;
        }
    }

    return timeCameraOn;
}

function totalReactionsDuringCall(participant) {
    return participant["data"].filter((data) => data["type"] == "emoji").length;
}

function totalChatInteractions(participant) {
    return participant["data"].filter((data) => data["type"] == "chat").length;
}