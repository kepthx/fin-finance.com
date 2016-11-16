'use strict';

const EventEmitter = require('events');

class combinableEventEmmiter extends EventEmitter {

	constructor (...args) {

		super(...args);
		this._sources = [];
		this._handlers = {};
	}

	addEmitter (...emitersList) {

		this._sources.push(...emitersList);
		let eventTypes = Object.keys(this._events);

		let emmitersLength = emitersList.length;
		while (emmitersLength--) {
			let len = eventTypes.length;
			let emitter = emitersList[emmitersLength];

			while (len--) {
				let typeName = eventTypes[len];
				emitter.on(typeName, this._handler(typeName));
			}
		}
	}

	_handler (type) {

		if (this._handlers[type]) {
			return this._handlers[type];
		}

		let handler = (...args) => {
			args.unshift(type);
			EventEmitter.prototype.emit.apply(this, args);
			this._unsubscribe(type);
		};

		this._handlers[type] = handler;
		return handler;
	}

	on (type, listener) {
		this._subscribe(type);
		return EventEmitter.prototype.on.call(this, type, listener);
	}

	addListener (...args) {
		return this.on(...args);
	}

	_subscribe (type) {

		if (!this._events[type]) {
			for (let i = 0; i < this._sources.length; ++i) {
				this._sources[i].on(type, this._handler(type));
			}
		}
	}

	removeListener (type, listener) {

		EventEmitter.prototype.removeListener.call(this, type, listener);
		this._unsubscribe(type);
		return this;
	}

	removeAllListeners (type) {

		EventEmitter.prototype.removeAllListeners.call(this, type);
		this._unsubscribe(type);
		return this;
	}

	_unsubscribe (type) {

		let sourcesListLen = this._sources.length;
		switch (true) {

		case type === undefined:
			while (sourcesListLen--) {
				this._sources[sourcesListLen].removeAllListeners();
			}
			break;


		case !this._events[type]:
			while (sourcesListLen--) {
				this._sources[sourcesListLen].removeListener(type, this._handler(type));
			}
			break;
		}
	}
}


module.exports = combinableEventEmmiter;
