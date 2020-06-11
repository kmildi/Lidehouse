import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { AutoForm } from 'meteor/aldeed:autoform';
import { moment } from 'meteor/momentjs:moment';
import { $ } from 'meteor/jquery';

import { ModalStack } from '/imports/ui_3/lib/modal-stack.js';
import '/imports/ui_3/views/modals/modal-guard.js';
// The autoform needs to see these, to handle new events on it
import '/imports/api/partners/actions.js';
import '/imports/api/contracts/actions.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { Txdefs } from '/imports/api/transactions/txdefs/txdefs.js';
import '/imports/api/transactions/actions.js';
import './reconciliation.html';

Template.Reconciliation.viewmodel({
  partnerRelation() {
    return this.templateInstance.data.relation;
  },
  allocatedAmount() {
    let allocated = 0;
    (AutoForm.getFieldValue('bills') || []).forEach(bp => {
      if (!bp) return;
      allocated += bp.amount;
    });
    return allocated;
  },
  unallocatedAmount() {
    return AutoForm.getFieldValue('amount') - this.allocatedAmount();
  },
  reconciling() {
    return ModalStack.getVar('statementEntry');
  },
  originalStatementEntry() {
    const original = ModalStack.getVar('statementEntry')?.original;
    const jsonText = JSON.stringify(original || {}, null, 2);
    return jsonText.trim().substr(3, jsonText.length - 5).trim();
  },
});

Template.Reconciliation.events({
  'click .js-new[data-entity="bill"]'(event, instance) {
    const paymentDef = instance.data.doc.txdef();
    const billDef = paymentDef.correspondingBillDef();
    const doc = {
      relation: AutoForm.getFieldValue('relation'),
      partnerId: AutoForm.getFieldValue('partnerId'),
    };
    Transactions.actions.new({ entity: 'bill', txdef: billDef }, doc).run(event, instance);
  },
  'click .js-full-amount'(event, instance) {
    const cell = $(event.target).closest('[data-line]');
    const afLineName = cell.data('line');
    const billId = AutoForm.getFieldValue(afLineName + '.id');
    const bill = Transactions.findOne(billId);
//    AutoForm.setFieldValue(afLineName + '.amount', bill.outstanding); AutoForm 7.0 has it. Can replace next 3 lines with it
    const amountElem = cell.next().find('input');
    amountElem.val(bill.outstanding);
    amountElem.change();
  },
});