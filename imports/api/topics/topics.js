import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Factory } from 'meteor/dburles:factory';
import { moment } from 'meteor/momentjs:moment';
import faker from 'faker';

import { Comments } from '../comments/comments.js';
import { Communities } from '../communities/communities.js';
import { Memberships } from '../memberships/memberships.js';

class TopicsCollection extends Mongo.Collection {
  insert(topic, callback) {
    const ourTopic = topic;
    return super.insert(ourTopic, callback);
  }
  remove(selector, callback) {
    Comments.remove({ topicId: selector });
    return super.remove(selector, callback);
  }
}

export const Topics = new TopicsCollection('topics');

Topics.voteSchema = new SimpleSchema({
  closesAt: { type: Date, defaultValue: moment().add(2, 'week').toDate() },
  type: { type: String, allowedValues: ['yesno', 'preferential'], defaultValue: 'yesno' },
  choices: { type: Array, defaultValue: ['yes', 'no', 'abstain'] },
  'choices.$': { type: String },
//  participation: { type: Number },
});

Topics.schema = new SimpleSchema({
  communityId: { type: String, regEx: SimpleSchema.RegEx.Id },
  userId: { type: String, regEx: SimpleSchema.RegEx.Id },
  category: { type: String, allowedValues: ['vote', 'forum', 'news'] },
  title: { type: String, max: 100 },
  text: { type: String },
  createdAt: { type: Date, denyUpdate: true, autoValue() { if (this.isInsert) { return new Date(); } } },
  closed: { type: Boolean, defaultValue: false },
  unreadCount: { type: Number, defaultValue: 0 },
  vote: { type: Topics.voteSchema, optional: true }, // TODO: should be conditional on category
  voteResults: { type: Object, blackbox: true, defaultValue: {} },
});

Topics.attachSchema(Topics.schema);

Topics.helpers({
  community() {
    return Communities.findOne(this.communityId);
  },
  editableBy(userId) {
    if (!this.userId) { return true; }
    return this.userId === userId;
  },
  comments() {
    return Comments.find({ topicId: this._id }, { sort: { createdAt: -1 } });
  },
  voteTypeIs(type) {
    if (!this.vote) return undefined;
    return (this.vote.type === type);
  },
  votedCount() {
    let votedCount = 0;
    for (const key in this.voteResults) {
      votedCount += this.voteResults[key].length;
    }
    return votedCount;
  },
  memberCount() {
    return Memberships.find({ communityId: this.communityId }).count();
  },
  voteProgress() {
    return Math.round(100 * (this.votedCount() / this.memberCount()));
  },
});

// Deny all client-side updates since we will be using methods to manage this collection
Topics.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

// This represents the keys from Topics objects that should be published to the client.
// If we add secret properties to Topic objects, don't list them here to keep them private to the server.
Topics.publicFields = {
  communityId: 1,
  userId: 1,
  category: 1,
  title: 1,
  text: 1,
  createdAt: 1,
  closed: 1,
  unreadCount: 1,
  vote: 1,
  voteResults: 1, // TODO: Should not be seeen by client?!
};

Factory.define('topic', Topics, {
  communityId: () => Factory.get('community'),
});
