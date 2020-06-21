import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { _ } from 'meteor/underscore';
import { TAPi18n } from 'meteor/tap:i18n';

import { Log } from '/imports/utils/log.js';
import { debugAssert } from '/imports/utils/assert.js';
import { checkExists, checkNotExists, checkModifier, checkPermissions } from '/imports/api/method-checks.js';
import { crudBatchOps, BatchMethod } from '/imports/api/batch-method.js';
import { namesMatch } from '/imports/utils/compare-names.js';
import { equalWithinRounding } from '/imports/api/utils.js';
import { Communities } from '/imports/api/communities/communities.js';
import { Partners } from '/imports/api/partners/partners.js';
import { Recognitions } from '/imports/api/transactions/reconciliation/recognitions.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { Txdefs } from '/imports/api/transactions/txdefs/txdefs.js';
import { StatementEntries } from './statement-entries.js';
import { reconciliationSchema } from '/imports/api/transactions/reconciliation/reconciliation.js';

export const insert = new ValidatedMethod({
  name: 'statementEntries.insert',
  validate: StatementEntries.simpleSchema().validator({ clean: true }),

  run(doc) {
    doc = StatementEntries._transform(doc);
    checkPermissions(this.userId, 'statements.insert', doc);
    const _id = StatementEntries.insert(doc);
    StatementEntries.methods.recognize._execute({ userId: this.userId }, { _id });
    return _id;
  },
});

export const update = new ValidatedMethod({
  name: 'statementEntries.update',
  validate: new SimpleSchema({
    _id: { type: String, regEx: SimpleSchema.RegEx.Id },
    modifier: { type: Object, blackbox: true },
  }).validator(),

  run({ _id, modifier }) {
    const doc = checkExists(StatementEntries, _id);
//    checkModifier(doc, modifier, Statements.modifiableFields);
    checkPermissions(this.userId, 'statements.update', doc);

    const result = StatementEntries.update({ _id }, modifier);
    return result;
  },
});

function checkReconcileMatch(entry, transaction) {
  function throwMatchError(mismatch) {
//    console.log(JSON.stringify(entry));/
//    console.log(JSON.stringify(transaction));
    throw new Meteor.Error('err_notAllowed', `Cannot reconcile entry with transaction - ${mismatch} does not match`);
  }
  if (transaction.valueDate.getTime() !== entry.valueDate.getTime()) throwMatchError('valueDate');
  switch (transaction.category) {
    case 'payment':
    case 'receipt':
      if (!equalWithinRounding(transaction.amount, transaction.relationSign() * entry.amount)) throwMatchError('amount');
      if (transaction.payAccount !== entry.account) throwMatchError('account');
  //  if (!namesMatch(entry, transaction.partner().getName())) throwMatchError('partnerName');
      break;
    case 'transfer':
      if (transaction.toAccount === entry.account) {
        if (transaction.amount !== entry.amount) throwMatchError('amount');
      } else if (transaction.fromAccount === entry.account) {
        if (transaction.amount !== -1 * entry.amount) throwMatchError('amount');
      } else throwMatchError('account');
      break;
    case 'freeTx': break;
    default: throwMatchError('category');
  }
}

export const reconcile = new ValidatedMethod({
  name: 'statementEntries.reconcile',
  validate: reconciliationSchema.validator(),
  run({ _id, txId }) {
    const entry = checkExists(StatementEntries, _id);
    checkPermissions(this.userId, 'statements.reconcile', entry);
    const communityId = entry.communityId;
    const reconciledTx = Transactions.findOne(txId);
    checkReconcileMatch(entry, reconciledTx);
    if (reconciledTx.partnerId && entry.name && entry.name !== reconciledTx.partner().idCard.name) {
      Recognitions.set(`names.${entry.name}`, reconciledTx.partner().idCard.name, { communityId });
    }
    Transactions.update(txId, { $set: { seId: _id } });
    StatementEntries.update(_id, { $set: { txId }, $unset: { match: '' } });
  },
});

export const autoReconcile = new ValidatedMethod({
  name: 'statementEntries.autoReconcile',
  validate: new SimpleSchema({
    _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  }).validator(),
  run({ _id }) {
    const entry = checkExists(StatementEntries, _id);
    checkPermissions(this.userId, 'statements.reconcile', entry);
    if (entry.match.confidence === 'primary' || entry.match.confidence === 'info') {
      let txId = entry.match.txId;
      if (!txId && entry.match.tx) {
        txId = Transactions.methods.insert._execute({ userId: this.userId }, entry.match.tx);
      }
      reconcile._execute({ userId: this.userId }, { _id, txId });
    }
  },
});

export const recognize = new ValidatedMethod({
  name: 'statementEntries.recognize',
  validate: new SimpleSchema({
    _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  }).validator(),
  run({ _id }) {
    const entry = checkExists(StatementEntries, _id);
    checkPermissions(this.userId, 'statements.reconcile', entry);
    const communityId = entry.communityId;
    const community = Communities.findOne(communityId);
    Log.info('Trying to recognize statement entry:', _id);
    // ---------------------------
    // 1st round - 'primary' match: We find the correct BILL REF in the NOTE
    // ---------------------------
    if (entry.note) {
      const noteSplit = entry.note.deaccent().toUpperCase().split(' ');
      const regex = TAPi18n.__('BIL', {}, community.settings.language) + '/';
      const serialId = noteSplit.find(s => s.startsWith(regex));
      Log.debug('Serial id:', serialId);
      if (serialId) {
        const matchingBill = Transactions.findOne({ communityId: entry.communityId, serialId });
        Log.debug('Matching bill:', matchingBill);
        if (matchingBill) {
          const adjustedEntryAmount = matchingBill.relationSign() * entry.amount;
          if (equalWithinRounding(matchingBill.outstanding, adjustedEntryAmount)) {
            const tx = {
              communityId,
              category: 'payment',
              relation: matchingBill.relation,
              partnerId: matchingBill.partnerId,
              defId: Txdefs.findOne({ communityId: entry.communityId, category: 'payment', 'data.relation': matchingBill.relation })._id,
              valueDate: entry.valueDate,
              payAccount: entry.account,
              amount: adjustedEntryAmount,
              bills: [{ id: matchingBill._id, amount: matchingBill.outstanding }],
            };
            Log.info('Primary match with bill', matchingBill._id);
            Log.debug(tx);
            StatementEntries.update(_id, { $set: { match: { confidence: 'primary', tx } } });
            return;
          }
        }
      }
    }
    if (!entry.name) {
      const tx = {
        communityId,
        amount: Math.abs(entry.amount),
        valueDate: entry.valueDate,
      };
      Log.info('Danger no partner, recommendation');
      Log.debug(tx);
      StatementEntries.update(_id, { $set: { match: { confidence: 'danger', tx } } });
      return;
    }
    Log.debug('Looking for partner', entry.name, 'in', entry.communityId);
    const recognizedName = Recognitions.get(`names.${entry.name}`, { communityId }) || entry.name;
    const partner = Partners.findOne({ communityId: entry.communityId, 'idCard.name': recognizedName });
    if (!partner) {
      // ---------------------------
      // 4th round, 'danger' match: No partner and tx type information, we can only provide some guesses
      // ---------------------------
      const tx = {
        communityId,
        partnerName: entry.name, // receipt
        amount: Math.abs(entry.amount), // payment
        valueDate: entry.valueDate,
        issueDate: entry.valueDate, // bill
        deliveryDate: entry.valueDate, // bill
        dueDate: entry.valueDate, // bill
        lines: [{ title: entry.note, quantity: 1, unitPrice: Math.abs(entry.amount) }], // receipt
        payAccount: entry.account, // receipt, payment
        fromAccount: entry.account, // transfer
        toAccount: entry.account, // transfer
      };
      Log.info('Danger not found partner, recommendation');
      Log.debug(tx);
      StatementEntries.update(_id, { $set: { match: { confidence: 'danger', tx } } });
      return;
    }
    const relation = partner.relation[0]; // TODO: When partner has mutiple relation, pick correctly
    const adjustedEntryAmount = Transactions.relationSign(relation) * entry.amount;
    const matchingBills = Transactions.find({ communityId, relation, partnerId: partner._id, outstanding: { $gt: 0 } }, { sort: { issueDate: 1 } }).fetch();
    const paymentDef = Txdefs.findOne({ communityId: entry.communityId, category: 'payment', 'data.relation': relation });
    const tx = {
      communityId,
      category: 'payment',
      relation,
      partnerId: partner._id,
      defId: paymentDef._id,
      valueDate: entry.valueDate,
      payAccount: entry.account,
      amount: adjustedEntryAmount,
    };
    if (partner.outstanding === adjustedEntryAmount) {
      // ---------------------------
      // 2nd round, 'info' match: The payment exactly matches the outstanding bills of the partner
      // ---------------------------
      tx.bills = matchingBills.map(bill => ({ id: bill._id, amount: bill.outstanding }));
      Log.info('Info match with bills', matchingBills.length);
      Log.debug(tx);
      StatementEntries.update(_id, { $set: { match: { confidence: 'info', tx } } });
    } else {
      // ---------------------------
      // 3nd round, 'warning' match: We found the partner but the payment is not the right amount.
      // Either under-paid (=> need to decide which bills are paid), or over-paid (=> need to decide where to allocate the remainder)
      // ---------------------------
      tx.bills = [];
      let amountToFill = adjustedEntryAmount;
      matchingBills.forEach(bill => {
        if (amountToFill === 0) return false;
        const amount = Math.min(amountToFill, bill.outstanding);
        tx.bills.push({ id: bill._id, amount });
        amountToFill -= amount;
      });
      if (amountToFill > 0) {
        tx.lines = [{
          amount: amountToFill,
          account: paymentDef[paymentDef.conteerSide()][0],
          contractId: partner.contracts(relation)[0],
//          localizer: undefined,
        }];
      }
      Log.info('Warning match with bills', matchingBills.length);
      Log.debug(tx);
      StatementEntries.update(_id, { $set: { match: { confidence: 'warning', tx } } });
    }
  },
});
/*
export const autoReconciliation = new ValidatedMethod({
  name: 'statementEntries.autoReconciliation',
  validate: new SimpleSchema({
    communityId: { type: String, regEx: SimpleSchema.RegEx.Id },
  }).validator(),

  run({ communityId }) {
    StatementEntries.find({ communityId, match: { $exists: false } }).forEach(entry => {
      reconcile._execute({ userId: this.userId }, { _id: entry._id });
    });
  },
});

export const reconcile = new ValidatedMethod({
  name: 'statementEntries.reconcile',
  validate: new SimpleSchema({
    _id: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  }).validator(),

  run({ _id }) {
    const entry = checkExists(StatementEntries, _id);
    checkPermissions(this.userId, 'statements.reconcile', entry);
    if (!entry.match) throw new Meteor.Error('err_notExists', 'No match provided to reconcile ' + entry._id + ' with');
    const reconciledTx = entry.match._id ? Transactions.findOne(entry.match._id) : Transactions._transform(entry.match);
    checkReconcileMatch(entry, reconciledTx);
    if (!reconciledTx._id) {
      reconciledTx._id = Transactions.methods.insert._execute({ userId: this.userId }, reconciledTx);
      Transactions.methods.post._execute({ userId: this.userId }, { _id: reconciledTx._id });
    }
    Transactions.update(reconciledTx._id, { $set: { txId: _id } });
    const result = StatementEntries.update(_id, { $set: { txId: reconciledTx._id } });
    return result;
  },
});
*/
export const remove = new ValidatedMethod({
  name: 'statementEntries.remove',
  validate: new SimpleSchema({
    _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  }).validator(),
  run({ _id }) {
    const doc = checkExists(StatementEntries, _id);
    checkPermissions(this.userId, 'statements.remove', doc);

    return StatementEntries.remove(_id);
  },
});

StatementEntries.methods = StatementEntries.methods || {};
_.extend(StatementEntries.methods, { insert, update, recognize, reconcile, autoReconcile, remove });
_.extend(StatementEntries.methods, crudBatchOps(StatementEntries));
StatementEntries.methods.batch.recognize = new BatchMethod(StatementEntries.methods.recognize);
StatementEntries.methods.batch.reconcile = new BatchMethod(StatementEntries.methods.reconcile);
