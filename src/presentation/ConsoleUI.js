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

  async   displayChannels(channels) {
    if (channels.length === 0) {
      console.log('Tidak ada channel tersimpan.');
      return;
    }
    console.log('\n📋 Daftar channel tersimpan:');
    channels.forEach((ch, idx) => {
      console.log(`  ${idx + 1}. ${ch.channelName} | Last Scraped ID: ${ch.lastScrapedId || 'N/A'}`);
    });
    console.log('');
  }

  displayResults(results) {
    console.log(`Scraped ${results.messages} messages, found ${results.deepLinks} deep links.`);
  }

  showMenu() {
    console.log('Menu...');
  }
}

module.exports = ConsoleUI;