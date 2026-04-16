// src/domain/entities/Message.js
class Message {
  constructor(id, text, timestamp) {
    this.id = id;
    this.text = text;
    this.timestamp = timestamp;
  }
}

module.exports = Message;