import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { _ } from 'meteor/underscore';
import { moment } from 'meteor/momentjs:moment';

import { __ } from '/imports/localization/i18n.js';
import { Clock } from '/imports/utils/clock.js';
import { debugAssert } from '/imports/utils/assert.js';
import { Communities, getActiveCommunityId } from '/imports/api/communities/communities.js';
import { MinimongoIndexing } from '/imports/startup/both/collection-patches.js';
import { Timestamped } from '/imports/api/behaviours/timestamped.js';
import { SerialId } from '/imports/api/behaviours/serial-id.js';
import { chooseSubAccount } from '/imports/api/transactions/breakdowns/breakdowns.js';
import { chooseAccountNode } from '/imports/api/transactions/breakdowns/chart-of-accounts.js';
import { Bills } from '../bills/bills';
import { StatementEntries } from '../statements/statements';

export const Payments = new Mongo.Collection('payments');

Payments.schema = new SimpleSchema({
  communityId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  billId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  valueDate: { type: Date },
  amount: { type: Number },
  account: { type: String, optional: true, autoform: chooseSubAccount('COA', '38') },  // the money account paid to/from
  txId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true, autoform: { omit: true } },
  reconciledId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true, autoform: { omit: true } },
});

Meteor.startup(function indexPayments() {
  Payments.ensureIndex({ billId: 1 });
  Payments.ensureIndex({ txId: 1 });
  Payments.ensureIndex({ reconciledId: 1 });
  if (Meteor.isServer) {
    Payments._ensureIndex({ communityId: 1, valueDate: 1 });
  }
});

Payments.helpers({
  community() {
    return Communities.findOne(this.communityId);
  },
  isReconciled() {
    return (!!this.reconciledId);
  },
  reconciledEntry() {
    if (!this.reconciledId) return undefined;
    return StatementEntries.findOne(this.reconciledId);
  },
  makeTx(accountingMethod) {
    const tx = {
      communityId: this.communityId,
      // def: 'payment',
      valueDate: this.valueDate,
      amount: this.amount,
      billId: this.billId,
      paymentId: this._id,
    };
    const bill = Bills.findOne(this.billId);
    const ratio = this.amount / bill.amount;
    function copyLinesInto(txSide) {
      bill.lines.forEach(line => txSide.push({ amount: line.amount * ratio, account: line.account, localizer: line.localizer }));
    }
    if (accountingMethod === 'accrual') {
      if (bill.category === 'in') {
        tx.debit = [{ account: '46' }];
        tx.credit = [{ account: this.account }];
      } else if (bill.category === 'out') {
        tx.debit = [{ account: this.account }];
        tx.credit = [{ account: '31' }];
      } else if (bill.category === 'parcel') {
        tx.debit = [{ account: this.account }];
        tx.credit = [{ account: '33'+'' }];
      } else debugAssert(false, 'No such bill category');
    } else if (accountingMethod === 'cash') {
      if (bill.category === 'in') {
        tx.debit = []; copyLinesInto(tx.debit);
        tx.credit = [{ account: '46' }];
      } else if (bill.category === 'out') {
        tx.debit = [{ account: '31' }];
        tx.credit = []; copyLinesInto(tx.credit);
      } else if (bill.category === 'parcel') {
        tx.debit = [{ account: '33'+'' }];  // line.account = Breakdowns.name2code('Assets', 'Owner obligations', parcelBilling.communityId) + parcelBilling.payinType;
        tx.credit = []; copyLinesInto(tx.credit);
      } else debugAssert(false, 'No such bill category');
    }
    return tx;
  },
});

Payments.attachSchema(Payments.schema);
Payments.attachBehaviour(Timestamped);
Payments.attachBehaviour(SerialId(Payments));

Meteor.startup(function attach() {
  Payments.simpleSchema().i18n('schemaPayments');
});

// --- Factory ---

Factory.define('payment', Payments, {
  communityId: () => Factory.get('community'),
//  billId: () => Factory.get('bill'),
  valueDate: Clock.currentDate(),
  amount: faker.random.number(1000),
  account: '85',
});

/*
Bills.Payments.schema = new SimpleSchema({
  amount: { type: Number },
  valueDate: { type: Date },
  bills: { type: Array },
  'bills.$': { type: FulfillmentSchema },
});

export const BankStatements = new Mongo.Collection('bankStatements');

BankStatements.schema = new SimpleSchema({
  communityId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  payments: { type: [Payments.schema] },
});
*/