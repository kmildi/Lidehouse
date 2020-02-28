import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
//import Tabular from 'meteor/aldeed:tabular';
//import { TAPi18n } from 'meteor/tap:i18n';
//import { datatables_i18n } from 'meteor/ephemer:reactive-datatables';

//import { DatatablesExportButtons } from '/imports/ui_3/views/blocks/datatables.js';
import { __ } from '/imports/localization/i18n.js';
import { Render } from '/imports/ui_3/lib/datatable-renderers.js';
import '/imports/ui_3/views/blocks/action-buttons.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { Memberships } from '/imports/api/memberships/memberships.js';

export function parcelColumns() {
  return [
    { data: 'ref', title: __('schemaParcels.ref.label') },
    { data: 'leadRef', title: __('schemaParcels.leadRef.label') },
    { data: 'location()', title: __('schemaParcels.location.label') },
    { data: 'type', title: __('schemaParcels.type.label'), render: Render.translateWithScope('schemaParcels.type') },
    { data: 'lot', title: __('schemaParcels.lot.label') },
    { data: 'area', title: __('schemaParcels.area.label') },
    { data: 'units', title: __('schemaParcels.units.label') },
    { data: 'occupants()', title: __('occupants'), render: Render.joinOccupants },
    { data: '_id', title: __('Action buttons'), render: Render.actionButtons,
      createdCell: (cell, cellData, rowData) => Blaze.renderWithData(Template.Action_buttons_group,
      { doc: cellData, collection: 'parcels', actions: 'view,edit,occupants,meters,delete', size: 'sm' }, cell),
    },
  ];
}

export function localizerColumns() {
  return [
    { data: 'code', title: __('schemaAccounts.code.label') },
    { data: 'displayName()', title: __('schemaParcels.location.label') },
    { data: 'category', title: __('schemaParcels.category.label'), render: Render.translateWithScope('schemaParcels.category') },
    { data: '_id', title: __('Action buttons'), render: Render.actionButtons,
      createdCell: (cell, cellData, rowData) => Blaze.renderWithData(Template.Action_buttons_group,
      { doc: cellData, collection: 'parcels', actions: 'view,edit,delete', size: 'sm' }, cell),
    },
  ];
}

export function parcelFinancesColumns() {
  return [
    { data: 'ref', title: __('schemaParcels.ref.label') },
    { data: 'type', title: __('schemaParcels.type.label'), render: Render.translate },
    { data: 'occupants()', title: __('occupants'), render: Render.joinOccupants },
    { data: 'withFollowers()', title: __('follower parcels') },
    { data: 'payerMembership().outstanding', title: __('schemaBills.outstanding.label') },
    { data: '_id', title: __('Action buttons'), render: Render.actionButtons,
      createdCell: (cell, cellData, rowData) => Blaze.renderWithData(Template.Action_buttons_group,
      { doc: cellData, collection: 'parcels', actions: 'finances,meters', size: 'sm' }, cell),
    },
  ];
}

export function highlightMyRow(row, data, index) {
  const parcelId = data._id;
  const leadParcelId = Parcels.findOne(parcelId).leadParcelId();
  const isMine = Memberships.findOne({ parcelId, userId: Meteor.userId() }) ||
    Memberships.findOne({ parcelId: leadParcelId, userId: Meteor.userId() });
  if (isMine) {
    $(row).addClass('tr-bold');
  }
}

/* with aldeed:tabular:
const parcelColumns = [
  { data: 'ref', title: __('schemaParcels.ref.label') },
  { data: 'leadRef', title: __('schemaParcels.leadParcelId.label') },
  { data: 'location()', title: __('schemaParcels.location.label') },
  { data: 'type', title: __('schemaParcels.type.label'), render: Render.translate },
  { data: 'lot', title: __('schemaParcels.lot.label') },
  { data: 'area', title: 'm2' },
//  { data: 'share()', title: __('schemaParcels.units.label') },
  { data: 'occupants()', title: __('occupants'), render: Render.joinOccupants },
  { tmpl: Meteor.isClient && Template.Action_buttons_group,
    tmplContext: rowData => ({
      doc: rowData,
      collection: 'parcels',
      actions: 'view,edit,occupants,meters,delete',
      size: 'sm',
    }),
  },
];

const parcelsTable = new Tabular.Table({
  name: 'Parcels',
  collection: Parcels,
  columns: parcelColumns,
  extraFields: ['communityId'],
  selector(userId) { return {}; }, //communityId: Template.instance.viewmodel.communityId() }; },

//  responsive: true,
//  autoWidth: false,

  createdRow: highlightMyRow,
  tableClasses: 'display',
  language: Meteor.isClient && datatables_i18n[TAPi18n.getLanguage()],
  lengthMenu: [[25, 100, 250, -1], [25, 100, 250, __('all')]],
  pageLength: 25,
  ...DatatablesExportButtons,
});
*/
