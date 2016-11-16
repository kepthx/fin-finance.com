'use strict';

import test from 'ava';


import file from '../../src/libs/file'
import fsFilter from '../../src/libs/file/filters'
import readdirStream from '../../src/libs/streams/readdirStream'
import filterStream from '../../src/libs/streams/filterStream'
import transformStream from '../../src/libs/streams/transformStream'
import EventEmmiter from '../../src/libs/events'


import {resolve} from 'path';
const toPromise = require('../../src/libs/promisifyHlStream');
const promisifyFabric = require('../../src/libs/promisifyFabric');

const fs = require('fs');
const _ = require('highland');
// import co from 'co';
//
let readFile  = promisifyFabric(fs.readFile);
let {Transform} = require('stream');


test('equal results of sync and async implementation with unlimited recursion', async t => {

	let dirTreeStream = new readdirStream('../', {isSync: false});

	let filter = new filterStream();

	filter.use(fsFilter.ext('js'));
	filter.use(fsFilter.match(/uniq/gim));

	let transform = new transformStream();
	transform.use(function (ctx) {
		// console.log(ctx);
		let {chunk} = ctx;
		return resolve(chunk.path);
	});

	// dirTreeStream.on('unpipe', console.log.bind(console, 'UNPIPE'))

	let combinedEvents = new EventEmmiter();

	let stream = dirTreeStream;
	combinedEvents.addEmitter(stream);
	stream = stream.pipe(filter);
	combinedEvents.addEmitter(stream);
	stream = stream.pipe(transform);
	combinedEvents.addEmitter(stream);

	let rejectPromise = new Promise((resolve, reject) => {
		combinedEvents.on('error', reject)
	});

	let result = await Promise.race([toPromise(stream), rejectPromise]);

	console.log(result);

});
//
// test('equal results of sync and async implementation with same level 1', async t => {
// 	t.deepEqual(await file.scan('./fixtures', 1), file.scanSync('./fixtures', 1));
// });
//
// test('equal results of sync and async implementation with same level 2', async t => {
// 	t.deepEqual(await file.scan('./fixtures', 2), file.scanSync('./fixtures', 2));
// });
//
// test('not equal results of sync and async with diff level ', async t => {
// 	t.notDeepEqual(await file.scan('./fixtures', 2), file.scanSync('./fixtures', 3));
// });
