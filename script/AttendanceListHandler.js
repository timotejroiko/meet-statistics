
"use strict";

class AttendanceListHandler {

    /**
	 * @param {Array<string>} namesList 
	 * @param {string} targetName 
	 * @returns {boolean}
	 */
    isMatch(namesList, targetName) {
        const [targetFirstName] = targetName.split(' ');
    
        if (namesList.includes(targetName)) return true;
    
        const firstNameMatch = namesList.some(name => name.startsWith(targetFirstName));
        return firstNameMatch;
    }

    addListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.command === "commit-attendance-list") {
        
                const elementosLabel = document.querySelectorAll('[type="checkbox"] + span + label');
                if(!elementosLabel) {
                    sendResponse({ result: "Failed", ok: false });
                    return;
                }
        
                elementosLabel.forEach(label => {
                    const input = label.parentElement.querySelector('[type="checkbox"]');
                    const name = label.innerText.toLowerCase();
                    
                    if(this.isMatch(request.participants, name)) {
                        input.checked = true;
                    }
                });
        
                sendResponse({ result: "Done", ok: true });
            }
        });
    }
}

const attendanceListHandler = new AttendanceListHandler();
attendanceListHandler.addListener();