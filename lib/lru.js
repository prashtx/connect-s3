/*jslint node: true */
'use strict';

/*
 * LRU cache
 * Implemented with a hash and a linked list
 */

var LRU = {
  max: 500,
  map: {},
  top: null,
  bottom: null,
  count: 0
};

LRU.add = function (key, value) {
  var entry = this.map[key];

  if (entry !== undefined) {
    entry.value = value;
  } else {
    entry = {
      key: key,
      value: value,
      head: null,
      tail: null
    };
    this.map[key] = entry;
  }

  if (this.top === null) {
    // Nothing here yet
    this.top = entry;
    this.bottom = entry;
  } else {
    // Insert the new entry at the top, and make sure the previous top entry
    // points to the new one
    this.top.head = entry;
    entry.tail = this.top;
    this.top = entry;
  }

  this.count += 1;

  if (this.count > this.max) {
    // Remove from the map
    delete this.map[this.bottom.key];
    // Trim off the bottom
    var oldHead = this.bottom.head;
    this.bottom = oldHead;
    oldHead.bottom = null;
  }
};

LRU.get = function (key) {
  var entry = this.map[key];
  var oldTop = this.top;

  if (entry === undefined) {
    return null;
  }

  // This is already at the top of the list
  if (oldTop === entry) {
    return entry.value;
  }

  var oldHead = entry.head;
  var oldTail = entry.tail;

  // Cut the entry out of its old location in the linked list
  oldHead.tail = oldTail;
  if (oldTail !== null) {
    oldTail.head = oldHead;
  } else {
    this.bottom = oldHead;
  }

  // Insert the entry at the top
  this.top = entry;
  oldTop.head = entry;
  entry.head = null;
  entry.tail = oldTop;

  return entry.value;
};

module.exports = function makeLRU(options) {
  var lru = Object.create(LRU);

  if (options && options.max !== undefined) {
    if (options.max < 1) {
      throw new Error('Must have a capacity of 1 or more.');
    }
    lru.max = options.max;
  }

  return lru;
};
