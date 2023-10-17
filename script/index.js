(async () => {
	const options = await Store.getOptions();
	const id = window.location.pathname.slice(1);
	const info = await Store.findOrCreateMeeting(id);
	const meeting = new Meeting(info, options, Store);
	meeting.start();
})();
