(async () => {
	const options = await Store.getOptions();
	const title = document.title;
	const id = location.pathname.slice(1);
	const info = await Store.findOrCreateMeeting(id, title, true);
	const meeting = new Meeting(info, options, Store);
	meeting.start();
})();
