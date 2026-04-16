// src/presentation/ConsoleUI.js
class ConsoleUI {
  constructor(rl) {
    this.rl = rl;
  }

  getChannelInput() {
    return this.rl.question('Masukkan channel: ');
  }

  getStartId() {
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