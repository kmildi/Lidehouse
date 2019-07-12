import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';

import { MinimongoIndexing } from '/imports/startup/both/collection-patches.js';
import { Timestamped } from '/imports/api/behaviours/timestamped.js';
import { Topics } from '/imports/api/topics/topics.js';

export const Contracts = new Mongo.Collection('contracts');

Contracts.schema = new SimpleSchema({
  communityId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  title: { type: String, max: 100, optional: true },
  text: { type: String, max: 1000, optional: true },
  partner: { type: String, max: 100, optional: true },
});

Contracts.helpers({
  worksheets() {
    return Topics.find({ communityId: this.communityId, 'ticket.contractId': this._id }).fetch();
  },
  closed() {
    return _.all(this.worksheets(), topic => topic.closed);
  },
});

Contracts.attachSchema(Contracts.schema);
Contracts.attachBehaviour(Timestamped);

Meteor.startup(function attach() {
  Contracts.simpleSchema().i18n('schemaContracts');
});

Factory.define('contract', Contracts, {
  title: () => `Contract with ${faker.random.word()}`,
});
