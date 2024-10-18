"use strict";

class AttendanceList {
    /**
     * @param {typeof Store} store 
     */
    constructor(store) {
        this.containerNode = /** @type {HTMLElement} */ (document.querySelector(".container"));
        this.store = store;
    }

    async render() {
        const meetings = await this.store.listMeetings();

        // TODO: Slice 3 most recent meetings

        if(!meetings.length) return;

        const containerList = document.createElement('ul');
        containerList.classList.add('attendance-list');
        

        meetings.forEach(meeting => {
            // Item class 
            const attendanceItem = document.createElement('li');

            // Class Date
            const attendanceDate = document.createElement('span');
            attendanceDate.innerText = new Date(meeting.firstSeen).toLocaleDateString();
            attendanceItem.appendChild(attendanceDate);

            // Class date details (Option page)
            const attendanceDetails = document.createElement('a');
            attendanceDetails.target = '_blank';
            attendanceDetails.innerText = 'Details';
            attendanceDetails.title = meeting.title;
            attendanceDetails.href = '/main/index.html?meeting='+meeting.dataId;
            attendanceItem.appendChild(attendanceDetails);

            const attendanceCommit = document.createElement('button');
            attendanceCommit.innerText = 'Commit';
            attendanceCommit.onclick = () => this.commit(meeting.dataId);
            attendanceItem.appendChild(attendanceCommit);

            containerList.appendChild(attendanceItem);
        });
        
        const title = document.createElement('h2');
        title.innerText = 'Attendance List';
        title.style.textAlign = 'center';

        this.containerNode.innerHTML = '';
        this.containerNode.appendChild(title);
        this.containerNode.appendChild(containerList);
    }

    /**
	 * @param {string} dataId 
	 */
    async commit(dataId) {
        const participants = await this.store.listMeetingParticipants(dataId);

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if(!tab) return

        const payload = {
            command: "commit-attendance-list",
            participants: participants.map(participant => participant.name.toLowerCase())
        }
        chrome.tabs.sendMessage(tab.id, payload, (response) => {
            this.message(response.ok, response.result);
        });
    }

    /**
	 * @param {boolean} ok 
     * @param {string} text 
	 */
    message(ok, text) {
        this.containerNode.classList.add('attendance-list-message')
        const messageContainer = document.createElement('span');
        messageContainer.innerHTML = `Commit: ${text}`;
        messageContainer.classList.add(ok ? 'done' : 'fail');

        this.containerNode.appendChild(messageContainer);

        setTimeout(() => {
            this.containerNode.removeChild(messageContainer);
            this.containerNode.classList.remove('attendance-list-message');
        }, 5000);
    }
}