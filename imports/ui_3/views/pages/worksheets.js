import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { moment } from 'meteor/momentjs:moment';
import { ReactiveDict } from 'meteor/reactive-dict';
import { TAPi18n } from 'meteor/tap:i18n';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { _ } from 'meteor/underscore';
import { datatables_i18n } from 'meteor/ephemer:reactive-datatables';
import { __ } from '/imports/localization/i18n.js';
import { currentUserLanguage } from '/imports/startup/client/language.js';
import { DatatablesExportButtons } from '/imports/ui_3/views/blocks/datatables.js';
import { Topics } from '/imports/api/topics/topics.js';
import { Tickets } from '/imports/api/topics/tickets/tickets.js';
import { ticketColumns } from '/imports/api/topics/tickets/tables.js';
import { importCollectionFromFile } from '/imports/utils/import.js';
//import { momentWithoutTZ } from '/imports/api/utils.js';
import { TicketEventHandlers, afTicketUpdateModal } from '/imports/ui_3/views/components/tickets-edit.js';
import '/imports/ui_3/views/modals/autoform-edit.js';
import '/imports/ui_3/views/modals/confirmation.js';
import '/imports/ui_3/views/blocks/chopped.js';
import './worksheets.html';

Template.Worksheets.onCreated(function onCreated() {
  this.getCommunityId = () => FlowRouter.getParam('_cid') || Session.get('activeCommunityId');
  this.autorun(() =>
    this.subscribe('communities.byId', { _id: this.getCommunityId() })
  );
});

Template.Worksheets.onDestroyed(function onDestroyed() {
  Session.set('expectedStart', undefined);
});

Template.Worksheets.viewmodel({
  eventsToUpdate: {},
  calendarView: false,
  showNeedToSaveWarning: true,
  searchText: '',
  ticketStatusArray: [],
  ticketTypeArray: [],
  startDate: '',
  endDate: '',
  reportedByCurrentUser: false,
  communityId: null,
  onCreated() {
    this.communityId(this.templateInstance.getCommunityId());
    this.setDefaultFilter();
  },
  setDefaultFilter() {
    this.searchText('');
    this.ticketStatusArray([]);
    this.ticketTypeArray([]);
    this.startDate(moment().subtract(30, 'days').format('YYYY-MM-DD'));
    this.endDate('');
    this.reportedByCurrentUser(false);
  },
  addEventsToUpdate(eventObject) {
    /*const eventsToUpdate = this.eventsToUpdate();
    if (eventsToUpdate.includes(eventObject)) return;
    eventsToUpdate.push(eventObject);
    this.eventsToUpdate(eventsToUpdate);*/
    const eventsToUpdate = this.eventsToUpdate();
    eventsToUpdate[eventObject.id] = eventObject;
    const newRef = _.clone(eventsToUpdate);
    this.eventsToUpdate(newRef);
  },
  warnToSave() {
    const viewmodel = this;
    if (viewmodel.showNeedToSaveWarning()) {
      Modal.show('Modal', {
        title: 'Warning',
        text: __('youNeedToSaveYourChanges'),
        btnOK: 'OK',
        onOK() { viewmodel.showNeedToSaveWarning(false); },
      });
    }
  },
  calendarOptions() {
    const viewmodel = this;
    return {
      lang: currentUserLanguage(),
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay',
      },
      eventClick(eventObject) {
        afTicketUpdateModal(eventObject.id, 'statusUpdate');
      },
      eventResizeStop(eventObject, jsEvent, ui, view) {
        viewmodel.addEventsToUpdate(eventObject);
        viewmodel.warnToSave();
      },
      eventDrop(eventObject) {
        viewmodel.addEventsToUpdate(eventObject);
        viewmodel.warnToSave();
      },
      dayClick(date, allDay, jsEvent, view) {
        Session.set('expectedStart', date.toDate());
      },
      editable: true,
      /*
      droppable: true, // this allows things to be dropped onto the calendar
      drop() {
        // is the "remove after drop" checkbox checked?
        if ($('#drop-remove').is(':checked')) {
            // if so, remove the element from the "Draggable Events" list
          $(this).remove();
        }
      },*/
      events(start, end, timezone, callback) {
        const events = Topics.find(viewmodel.filterSelector()).fetch().map(function (t) {
          return {
            title: t.title,
            start: t.ticket.expectedStart,
            end: t.ticket.expectedFinish,
            color: Tickets.statuses[t.status].colorCode,
            id: t._id,
          };
        });
        // I need this nested loop, cause the objects in the 2 arrays are not identical.
        /*events.forEach((eventObject1) => {
          viewmodel.eventsToUpdate().forEach((eventObject2) => {
            if (eventObject1.id === eventObject2.id) {
              eventObject1.start = eventObject2.start.toISOString();
              eventObject1.end = eventObject2.end.toISOString();
            }
          });
        });*/
        if (!_.isEmpty(viewmodel.eventsToUpdate())) {
          const eventsToUpdate = viewmodel.eventsToUpdate();
          events.forEach((eventObject) => {
            if (eventsToUpdate[eventObject.id]) {
              if (eventsToUpdate[eventObject.id].start) eventObject.start = eventsToUpdate[eventObject.id].start.toISOString();
              if (eventsToUpdate[eventObject.id].end) eventObject.end = eventsToUpdate[eventObject.id].end.toISOString();
            }
          });
        }
        callback(events);
      },
    };
  },
  ticketStatuses() {
    return Object.values(Tickets.statuses);
  },
  ticketTypes() {
    return Tickets.typeValues;
  },
  hasFilters() {
    if (this.searchText() ||
        this.ticketStatusArray().length ||
        this.ticketTypeArray().length ||
        this.startDate() !== moment().subtract(30, 'days').format('YYYY-MM-DD') ||
        this.endDate() ||
        this.reportedByCurrentUser()) return true;
    return false;
  },
  activeStatusButton(data) {
    const ticketStatusArray = this.ticketStatusArray();
    if ((ticketStatusArray.includes(data))) return 'active';
    return '';
  },
  activeTypeButton(data) {
    const ticketTypeArray = this.ticketTypeArray();
    if ((ticketTypeArray.includes(data))) return 'active';
    return '';
  },
  recentTickets() {
    const communityId = Session.get('activeCommunityId');
    const recentTickets = [];
    const allTickets = Topics.find({ communityId, category: 'ticket',
      $or: [{ status: { $ne: 'closed' } }, { createdAt: { $gt: moment().subtract(1, 'week').toDate() } }],
    }, { sort: { createdAt: -1 } }).fetch();
    for (let i = 0; i <= 1; i += 1) {
      recentTickets.push(allTickets[i]);
    }
    return recentTickets;
  },
  filterSelector() {
    const communityId = Session.get('activeCommunityId');
    const ticketStatusArray = this.ticketStatusArray();
    const ticketTypeArray = this.ticketTypeArray();
    const startDate = this.startDate();
    const endDate = this.endDate();
    const reportedByCurrentUser = this.reportedByCurrentUser();
    const selector = { communityId, category: 'ticket' };
    if (ticketTypeArray.length > 0) selector['ticket.type'] = { $in: ticketTypeArray };
    if (ticketStatusArray.length > 0) selector.status = { $in: ticketStatusArray };
    selector.createdAt = {};
    if (startDate) selector.createdAt.$gte = new Date(startDate);
    if (endDate) selector.createdAt.$lte = new Date(endDate);
    if (reportedByCurrentUser) selector.creatorId = Meteor.userId();
    return selector;
  },
  ticketsDataFn() {
    return () => {
      const selector = this.filterSelector();
      const searchText = this.searchText();
      let result = Topics.find(selector, { sort: { createdAt: -1 } }).fetch();
      if (searchText) result = result.filter(t =>
        t.title.toLowerCase().search(searchText.toLowerCase()) >= 0
        || t.text.toLowerCase().search(searchText.toLowerCase()) >= 0
      );
      return result;
    };
  },
  ticketsOptionsFn() {
    const self = this;
    return () => {
      const communityId = self.communityId();
      const permissions = {
        view: true,
        edit: Meteor.userOrNull().hasPermission('ticket.update', communityId),
        statusChange: Meteor.userOrNull().hasPermission('ticket.statusChange', communityId),
        statusUpdate: Meteor.userOrNull().hasPermission('ticket.statusChange', communityId),
        delete: Meteor.userOrNull().hasPermission('ticket.remove', communityId),
      };
      return {
        columns: ticketColumns(permissions),
        tableClasses: 'display',
        language: datatables_i18n[TAPi18n.getLanguage()],
        searching: false,
        paging: false,
        ...DatatablesExportButtons,
      };
    };
  },
});

Template.Worksheets.events({ ...TicketEventHandlers,
  'click .js-mode'(event, instance) {
    const oldVal = instance.viewmodel.calendarView();
    instance.viewmodel.calendarView(!oldVal);
  },
  'click .js-import'(event, instance) {
    importCollectionFromFile(Topics); // TODO Make it Ticket specific
  },
  'click .js-clear-filter'(event, instance) {
    instance.viewmodel.setDefaultFilter();
  },
  'click .js-status-filter'(event, instance) {
    const ticketStatus = $(event.target).data('value');
    const ticketStatusArray = instance.viewmodel.ticketStatusArray();
    if (ticketStatusArray.includes(ticketStatus)) {
      instance.viewmodel.ticketStatusArray(_.without(ticketStatusArray, ticketStatus));
      $(event.target).blur();
    } else {
      ticketStatusArray.push(ticketStatus);
      instance.viewmodel.ticketStatusArray(ticketStatusArray);
    }
  },
  'click .js-type-filter'(event, instance) {
    const ticketType = $(event.target).closest('[data-value]').data('value');
    const ticketTypeArray = instance.viewmodel.ticketTypeArray();
    if (ticketTypeArray.includes(ticketType)) {
      instance.viewmodel.ticketTypeArray(_.without(ticketTypeArray, ticketType));
      $(event.target).blur();
    } else {
      ticketTypeArray.push(ticketType);
      instance.viewmodel.ticketTypeArray(ticketTypeArray);
    }
  },
  'click .js-save-calendar'(event, instance) {
    const eventsToUpdate = instance.viewmodel.eventsToUpdate();
    /*eventsToUpdate.forEach((eventObject) => {
      const dates = {};
      if (eventObject.start) dates['ticket.expectedStart'] = eventObject.start.toISOString();
      if (eventObject.end) dates['ticket.expectedFinish'] = eventObject.end.toISOString();
      const modifier = { $set: dates };
      Meteor.call('topics.update', { _id: eventObject.id, modifier });
    });*/
    const args = [];
    const communityId = instance.viewmodel.communityId();
    _.forEach(eventsToUpdate, function(value, key) {
      const dates = {};
      if (value.start) dates['ticket.expectedStart'] = value.start.toISOString();
      if (value.end) dates['ticket.expectedFinish'] = value.end.toISOString();
      const modifier = { $set: dates };
      args.push({ _id: key, modifier });
    });
    Topics.methods.batch.update.call({ args });
    instance.viewmodel.eventsToUpdate({});
  },
  'click .js-cancel-calendar'(event, instance) {
    instance.viewmodel.eventsToUpdate({});
  },
  'click .fc-widget-content'(event) {
    event.stopPropagation();
    const pageHeading = $('.page-heading').height();
    const navbar = $('.navbar').height();
    const top = event.pageY - pageHeading - navbar;
    const left = event.pageX - $('#fullCalendar').offset().left;
    $('#floating-dropdown').css({left, top});
    $('#floating-dropdown').toggleClass('open');
  },
});
