class Utils {
	/**
	* @param {number} milliseconds 
	*/
	static milliToHHMMSS(milliseconds) {
		const time = Math.round(milliseconds / 1000);
		const s = (time % 60).toString().padStart(2, "0");
		const m = (Math.floor(time / 60) % 60).toString();
		const h = Math.floor(time / 3600);
		return `${h > 0 ? `${h}:` : ""}${h > 0 ? m.padStart(2, "0") : m}:${s}`;
	}

	/**
	* @param {number} milliseconds 
	*/
	static milliToHHMMSSFull(milliseconds) {
		const time = Math.round(milliseconds / 1000);
		const s = (time % 60).toString().padStart(2, "0");
		const m = (Math.floor(time / 60) % 60).toString().padStart(2, "0");
		const h = Math.floor(time / 3600).toString().padStart(2, "0");
		return `${h}:${m}:${s}`;
	}
}
