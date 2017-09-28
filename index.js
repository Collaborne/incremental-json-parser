const State = {
	EMPTY: 0,
	IN_DOUBLE_QUOTE_STRING: 2,
	NORMAL: 1,
};

function IncrementalJSONParser(handler) {
	this.handler = handler;
	this.buffer = '';
	this.buffer_index = 0;
	// State at the last read character.
	this.state = State.EMPTY;
	this.level = 0;
	this.escaped = false;
}

IncrementalJSONParser.prototype.submit = function submit(chunk) {
	// Push the data into the system, and then process any pending content
	const workData = this.buffer + chunk;
	let lastLevel0 = 0;
	while (this.buffer_index < workData.length) {
		if (this.state === State.IN_DOUBLE_QUOTE_STRING) {
			// Look for the next unescaped quote
			for (; this.buffer_index < workData.length; this.buffer_index++) {
				const c = workData[this.buffer_index];
				if (this.escaped) {
					this.escaped = false;
				} else if (c === '\\') {
					this.escaped = true;
				} else if (c === '"') {
					this.state = State.NORMAL;
					this.buffer_index++;
					break;
				}
			}
		} else {
			// Process content regularly until we find a string start
			for (; this.buffer_index < workData.length; this.buffer_index++) {
				const c = workData[this.buffer_index];
				if (c === '{') {
					this.level++;
				} else if (c === '}') {
					this.level--;
					if (this.level === 0) {
						// Parse the block until now
						const parsed = JSON.parse(workData.substring(lastLevel0, this.buffer_index + 1));
						this.handler(parsed);

						// Reset buffer to the section from now
						lastLevel0 = this.buffer_index + 1;
					}
				} else if (c === '"') {
					this.state = State.IN_DOUBLE_QUOTE_STRING;
					this.buffer_index++;
					break;
				}
			}
		}
	}

	if (lastLevel0 > 0) {
		this.buffer = workData.substring(lastLevel0);
		this.buffer_index -= lastLevel0;
	} else {
		this.buffer = workData;
	}
};

IncrementalJSONParser.prototype.hasPending = function hasPending() {
	return this.buffer.length > 0;
};

module.exports = IncrementalJSONParser;
