const EventEmitter = require("events");

class NoticeEventBus extends EventEmitter {}

const noticeEvents = new NoticeEventBus();

const emitNoticeChanged = (payload = {}) => {
  noticeEvents.emit("notice:changed", {
    ...payload,
    ts: Date.now(),
  });
};

module.exports = {
  noticeEvents,
  emitNoticeChanged,
};
