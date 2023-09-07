(async () => {
    const list = await Store.listMeetings();
    const data = await chrome.storage.local.get(list.map(x => x.uniqueId || ""));
    for(const item of list) {
        item.data = data[item.dataId];
    }
    const elem = document.createElement("code");
    elem.innerText = JSON.stringify(list, null, "\t");
    document.body.appendChild(elem);
})()