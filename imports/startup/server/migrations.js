import { Meteor } from 'meteor/meteor';
import { Migrations } from 'meteor/percolate:migrations';
import { Communities } from '/imports/api/communities/communities.js';
import { Partners } from '/imports/api/partners/partners.js';
import { Memberships } from '/imports/api/memberships/memberships.js';
import { Delegations } from '/imports/api/delegations/delegations.js';
import { Topics } from '/imports/api/topics/topics.js';
import '/imports/api/topics/votings/votings.js';
import { Comments } from '/imports/api/comments/comments.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { Parcelships } from '/imports/api/parcelships/parcelships.js';
import { Sharedfolders } from '/imports/api/shareddocs/sharedfolders/sharedfolders.js';
import { Breakdowns } from '/imports/api/transactions/breakdowns/breakdowns.js';
import { _ } from 'meteor/underscore';

Migrations.add({
  version: 1,
  name: 'Add CreatedBy and UpdatedBy fields (and use CreatedBy instead of userId)',
  up() {
    function upgrade(collection) {
      collection.find({ creatorId: { $exists: false } }).forEach(doc => {
        const creatorId = doc.userId;
        collection.update(doc._id, { $unset: { userId: 0 } });
        collection.update(doc._id, { $set: { creatorId } });
      });
    }
    upgrade(Topics);
    upgrade(Comments);
  },
});

Migrations.add({
  version: 2,
  name: 'Use communityId:null for the shared assets',
  up() {
    function upgrade(collection) {
      collection.update(
        { communityId: { $exists: false } },
        { $set: { communityId: null } },
        { multi: true }
      );
    }
    upgrade(Sharedfolders);
    upgrade(Breakdowns);
  },
});

Migrations.add({
  version: 3,
  name: 'Tickets get a type',
  up() {
    Topics.update(
      { category: 'ticket', 'ticket.type': { $exists: false } },
      { $set: { 'ticket.type': 'issue' } },
      { multi: true }
    );
  },
});

Migrations.add({
  version: 4,
  name: 'Topics all get a status',
  up() {
    Topics.find({ category: 'ticket', status: { $exists: false } }).forEach((ticket) => {
      if (!ticket.ticket.status) throw new Meteor.Error('err_migrationFailed', 'There is no ticket.ticket.status');
      Topics.update(ticket._id, { $set: { status: ticket.ticket.status } });
    });
    Topics.update(
      { status: { $exists: false }, closed: false },
      { $set: { status: 'opened' } },
      { multi: true }
    );
    Topics.update(
      { status: { $exists: false }, closed: true },
      { $set: { status: 'closed' } },
      { multi: true }
    );
  },
});

Migrations.add({
  version: 5,
  name: 'Topics need serial',
  up() {
    function upgrade() {
      Topics.find({}, { sort: { createdAt: -1 } }).forEach((doc) => {
        const selector = { communityId: doc.communityId, category: doc.category };
        const last = Topics.findOne(selector, { sort: { serial: -1 } });
        const lastSerial = last ? (last.serial || 0) : 0;
        const nextSerial = lastSerial + 1;
        doc.serial = nextSerial;
        Topics.update(doc._id, { $set: { serial: nextSerial, serialId: doc.computeSerialId() } });
      });
    }
    upgrade();
  },
});

Migrations.add({
  version: 6,
  name: 'Communities get a settings section and an accountingMethod',
  up() {
    Communities.update(
      { settings: { $exists: false } },
      { $set: { settings: {
        joinable: true,
        language: 'hu',
        topicAgeDays: 365,
        currency: 'Ft',
        accountingMethod: 'accrual' } } },
      { multi: true }
    );
  },
});

Migrations.add({
  version: 7,
  name: 'Remove leadRef from parcel, and create parcelships with it',
  up() {
    function upgrade() {
      Parcels.find({ leadRef: { $exists: true } }).forEach((doc) => {
        Parcelships.insert({ communityId: doc.communityId, parcelId: doc._id, leadRef: doc.leadRef });
      });
    }
    upgrade();
  },
});

Migrations.add({
  version: 8,
  name: 'Comments category is now required field',
  up() {
    function upgrade() {
      Comments.update(
        { category: { $exists: false } },
        { $set: { category: 'comment' } },
        { multi: true }
      );
    }
    upgrade();
  },
});

Migrations.add({
  version: 9,
  name: 'Membership persons become partners, and partners cast the votes, delegate and pay the bills',
  up() {
    function upgrade() {
      Memberships.find({}).forEach((doc) => {
        let partnerId;
        if (doc.person && doc.person.idCard && doc.person.idCard.name) {
          const partnerByName = Partners.findOne({ communityId: doc.communityId, 'idCard.name': doc.person.idCard.name });
          if (partnerByName) partnerId = partnerByName._id;
        }
        if (doc.personId) {
          const partnerById = Partners.findOne({ communityId: doc.communityId, userId: doc.personId });
          if (partnerById) partnerId = partnerById._id;
        }
        const person = _.extend(doc.person, { communityId: doc.communityId, relation: 'parcel' });
        if (!partnerId) partnerId = Partners.insert(person);
        const newFields = { partnerId };
        if (doc.personId &&
            (!doc.person || !doc.person.idCard || !doc.person.idCard.identifier ||
              doc.person.idCard.identifier !== doc.personId)) {
          newFields.userId = doc.personId;
        }
        Memberships.update(doc._id, { $set: newFields, $unset: { person: '', personId: '' } });
      });
      Topics.find({ category: 'vote' }).forEach((doc) => {
        const newVoteCasts = {};
        _.each(doc.voteCasts, (vote, userId) => {
          const partnerId = Meteor.users.findOne(userId).partnerId(doc.communityId);
          newVoteCasts[partnerId] = vote;
        });
        Topics.update(doc._id, { $set: { voteCasts: newVoteCasts } }, { selector: { category: 'vote' } });
        doc.voteEvaluate(); // calculates all the rest of the voteResults fields
        // We assume here that the registered delegations have not changed since the voting, but that's OK, noone delegated actually
      });
      Delegations.find({}).forEach((doc) => {
        const sourceUserId = doc.sourcePersonId;
        const sourceUser = Meteor.users.find(sourceUserId);
        const sourcePartnerId = sourceUser ?
          sourceUser.partnerId(doc.communityId) :
          Partners.findOne({ communityId: doc.communityId, 'idCard.identifier': doc.sourcePersonId })._id;
        const targetUserId = doc.targetPersonId;
        const targetUser = Meteor.users.find(targetUserId);
        const targetPartnerId = targetUser.partnerId(doc.communityId);
        Delegations.update(doc._id, { $set: { sourceId: sourcePartnerId, targetId: targetPartnerId }, $unset: { sourcePersonId: '', targetPersonId: '' } });
      });
    }
    upgrade();
  },
});

Meteor.startup(() => {
  Migrations.unlock();
  Migrations.migrateTo('latest');
});
