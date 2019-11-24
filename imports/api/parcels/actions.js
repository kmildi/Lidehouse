import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { __ } from '/imports/localization/i18n.js';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { currentUserHasPermission } from '/imports/ui_3/helpers/permissions.js';
import { importCollectionFromFile } from '/imports/utils/import.js';
import { handleError, onSuccess, displayMessage } from '/imports/ui_3/lib/errors.js';
import { Memberships } from '/imports/api/memberships/memberships.js';
import { Parcels } from './parcels.js';
import './methods.js';

Parcels.actions = {
  new: {
    name: 'new',
    icon: () => 'fa fa-plus',
    visible: () => currentUserHasPermission('parcels.insert'),
    run(id, event, instance) {
      Modal.show('Autoform_edit', {
        id: 'af.parcel.insert',
        collection: Parcels,
        type: 'method',
        meteormethod: 'parcels.insert',
      });
    },
  },
  import: {
    name: 'import',
    icon: () => 'fa fa-upload',
    visible: () => currentUserHasPermission('parcels.upsert'),
    run: (id, event, instance) => importCollectionFromFile(Parcels),
  },
  view: {
    name: 'view',
    icon: () => 'fa fa-eye',
    visible: () => currentUserHasPermission('parcels.inCommunity'),
    run(id) {
      Modal.show('Autoform_edit', {
        id: 'af.parcel.view',
        collection: Parcels,
        doc: Parcels.findOne(id),
        type: 'readonly',
      });
    },
  },
  occupants: {
    name: 'occupants',
    icon: (id) => Parcels.findOne(id).isLed() ? 'fa fa-user-o' : 'fa fa-user',
    color: (id) => {
      let colorClass = '';
      if (Memberships.findOneActive({ id, approved: false })) colorClass = 'text-danger';
      else {
        const representor = Memberships.findOneActive({ id, 'ownership.representor': true });
        if (representor) {
          if (!representor.accepted) {
            if (!representor.personId) colorClass = 'text-warning';
            else colorClass = 'text-info';
          }
        } else {  // no representor
          if (Memberships.findOneActive({ id, accepted: false })) {
            if (Memberships.findOneActive({ id, personId: { $exists: false } })) colorClass = 'text-warning';
            else colorClass = 'text-info';
          }
        }
      }
      return colorClass;
    },
    visible: () => currentUserHasPermission('memberships.inCommunity'),
    href: '#occupants',
    run(id, event, instance) {
      instance.viewmodel.selectedParcelId(id);
    },
  },
  meters: {
    name: 'meters',
    icon: () => 'fa fa-tachometer',
    visible: () => currentUserHasPermission('meters.inCommunity'),
    href: '#meters',
    run(id, event, instance) {
      instance.viewmodel.selectedParcelId(id);
    },
  },
  edit: {
    name: 'edit',
    icon: () => 'fa fa-pencil',
    visible: () => currentUserHasPermission('parcels.update'),
    run(id) {
      Modal.show('Autoform_edit', {
        id: 'af.parcel.update',
        collection: Parcels,
        doc: Parcels.findOne(id),
        type: 'method-update',
        meteormethod: 'parcels.update',
        singleMethodArgument: true,
      });
    },
  },
  period: {
    name: 'period',
    icon: () => 'fa fa-history',
    visible: () => currentUserHasPermission('parcels.update'),
    run(id) {
      Modal.show('Autoform_edit', {
        id: 'af.parcel.update',
        collection: Parcels,
        fields: ['activeTime'],
        doc: Parcels.findOne(id),
        type: 'method-update',
        meteormethod: 'parcels.updateActivePeriod',
        singleMethodArgument: true,
      });
    },
  },
  delete: {
    name: 'delete',
    icon: () => 'fa fa-trash',
    visible: () => currentUserHasPermission('parcels.remove'),
    run(id) {
      Modal.confirmAndCall(Parcels.methods.remove, { _id: id }, {
        action: 'delete parcel',
        message: 'You should rather archive it',
      });
    },
  },
};

//-----------------------------------------------

function onJoinParcelInsertSuccess(parcelId) {
  const communityId = FlowRouter.current().params._cid;
  const communityName = Communities.findOne(communityId).name;
  Memberships.methods.insert.call({
    person: { userId: Meteor.userId() },
    communityId,
    approved: false,  // any user can submit not-yet-approved memberships
    role: 'owner',
    parcelId,
    ownership: {
      share: new Fraction(1),
    },
  }, (err, res) => {
    if (err) displayError(err);
    else displayMessage('success', 'Join request submitted', communityName);
    Meteor.setTimeout(() => Modal.show('Modal', {
      title: __('Join request submitted', communityName),
      text: __('Join request notification'),
      btnOK: 'ok',
      //      btnClose: 'cancel',
      onOK() { FlowRouter.go('App home'); },
      //      onClose() { removeMembership.call({ _id: res }); }, -- has no permission to do it, right now
    }), 3000);
  });
}

AutoForm.addModalHooks('af.parcel.insert');
AutoForm.addModalHooks('af.parcel.update');
AutoForm.addHooks('af.parcel.insert', {
  formToDoc(doc) {
    doc.communityId = Session.get('selectedCommunityId');
    return doc;
  },
});
AutoForm.addHooks('af.parcel.update', {
  formToModifier(modifier) {
    modifier.$set.approved = true;
    return modifier;
  },
});

AutoForm.addModalHooks('af.parcel.insert.unapproved');
AutoForm.addHooks('af.parcel.insert.unapproved', {
  formToDoc(doc) {
    doc.communityId = Session.get('selectedCommunityId');
    doc.approved = false;
    return doc;
  },
  onSuccess(formType, result) {
    onJoinParcelInsertSuccess(result);
  },
});