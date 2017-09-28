'use strict';

/* eslint no-unused-expressions: 0 */
/* eslint consistent-return: 0 */

const chai = require('chai');
const expect = chai.expect;

const IncrementalJSONParser = require('../index');

describe('IncrementalJSONParser', () => {
	it('reports pending when incomplete', () => {
		const parser = new IncrementalJSONParser();
		parser.submit('{');
		expect(parser.hasPending()).to.be.true;
	});

	it('reports not pending after construction', () => {
		const parser = new IncrementalJSONParser();
		expect(parser.hasPending()).to.be.false;
	});

	it('loads simple json', done => {
		const parser = new IncrementalJSONParser(data => {
			if (data) {
				return done();
			}
		});

		parser.submit('{}');
		expect(parser.hasPending()).to.be.false;
	});

	it('loads chunked json (single submit)', done => {
		let counter = 0;
		const parser = new IncrementalJSONParser(data => {
			if (data) {
				counter++;
			}

			if (counter === 2) {
				return done();
			}
		});

		parser.submit('{}{}');
		expect(parser.hasPending()).to.be.false;
	});

	it('loads chunked json (multiple submits)', done => {
		let counter = 0;
		const parser = new IncrementalJSONParser(data => {
			if (data) {
				counter++;
			}

			if (counter === 2) {
				return done();
			}
		});

		parser.submit('{}');
		parser.submit('{}');
		expect(parser.hasPending()).to.be.false;
	});

	it('loads chunked json with extra whitespace', done => {
		let counter = 0;
		const parser = new IncrementalJSONParser(data => {
			if (data) {
				counter++;
			}

			if (counter === 2) {
				return done();
			}
		});

		parser.submit('{}');
		parser.submit('      \r\n\t');
		parser.submit('{}');
		expect(parser.hasPending()).to.be.false;
	});

	it('handles odd boundary (non-string)', done => {
		const parser = new IncrementalJSONParser(data => {
			if (data) {
				expect(data.field).to.be.eql('value');
				return done();
			}
			throw new Error('Test failed');
		});

		parser.submit('{"field":"value"');
		parser.submit('}');
		expect(parser.hasPending()).to.be.false;
	});
	it('handles odd boundary (double-quoted-string)', done => {
		const parser = new IncrementalJSONParser(data => {
			if (data) {
				expect(data.field).to.be.eql('value');
				return done();
			}
			throw new Error('Test failed');
		});

		parser.submit('{"field"');
		parser.submit(':"value"}');
		expect(parser.hasPending()).to.be.false;
	});
	it('handles odd boundary (double-quoted-string, escaped)', done => {
		const parser = new IncrementalJSONParser(data => {
			if (data) {
				expect(data.field).to.be.eql('value"}');
				return done();
			}
			throw new Error('Test failed');
		});

		parser.submit('{"field": "value\\"}');
		parser.submit('"}');
		const bool = parser.hasPending();
		expect(bool).to.be.false;
	});
});
