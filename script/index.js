(async () => {
	const options = await Store.loadOptions();
	const meeting = new Meeting(options);
	meeting.start();
})();
