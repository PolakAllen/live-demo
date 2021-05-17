
const MessageType = {
  Error: 'error',
  Request: 'request',
  History: 'history',
  Update: 'update'
};
module.exports = {
  MessageType,
  errorMsg: (data) => {
    return JSON.stringify({
      type: MessageType.Error,
      data
    })
  },
  historyMsg: (data) => {
    return JSON.stringify({
      type: MessageType.History,
      data
    })
  },
  updateMsg: (data) => {
    return JSON.stringify({
      type: MessageType.Update,
      data
    })
  }
};