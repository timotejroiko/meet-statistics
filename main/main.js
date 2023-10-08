
router();
load();

function load() {
    const active = document.querySelector(".show")?.id;
    switch(active) {
        case "main": return loadMain();
        case "meeting": return loadMain();
        case "participant": return loadMain();
    }
}

async function loadMain() {
    const statsNode = /** @type {HTMLElement} */ (document.getElementById("main")?.querySelector(".sidebar .lower .stats"));
    // @ts-ignore
    const stats = await chrome.storage.local.getBytesInUse();
    const meetings = await Store.listMeetings();
    statsNode.children[0].children[1].textContent = meetings.length.toString();
    statsNode.children[1].children[1].textContent = `${(stats / 1024).toFixed(2)}KB`;
    for(const meeting of meetings) {
    }
}
