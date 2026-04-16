// src/presentation/ConsoleUI.js
class ConsoleUI {
  constructor(rl) {
    this.rl = rl;
  }

  async getChannelInput() {
    return this.rl.question('Masukkan channel: ');
  }

  async getStartId() {
    return parseInt(this.rl.question('Start ID: ')) || 0;
  }

  async displayResults(results) {
    console.log(`Scraped ${results.messages} messages, found ${results.deepLinks} deep links.`);
  }

  showMenu() {
    console.log('Menu...');
  }
}

module.exports = ConsoleUI;