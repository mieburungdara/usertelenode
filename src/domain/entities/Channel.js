// src/domain/entities/Channel.js
class Channel {
  constructor(id, name, lastMessageId = null, lastMessageTimestamp = null) {
    this.id = id;
    this.name = name;
    this.lastMessageId = lastMessageId;
    this.lastMessageTimestamp = lastMessageTimestamp;
  }

  hasNewMessages(latestId) {
    return latestId > this.lastMessageId;
  }
}

module.exports = Channel;