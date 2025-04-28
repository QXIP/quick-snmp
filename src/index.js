import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'yaml';
import { CommandExecutor } from './executor/command.js';
import { TrapSender } from './snmp/trapSender.js';
import { generateOidFile } from './generator/oidFile.js';
import { LoopbackReceiver } from './snmp/loopbackReceiver.js';

class SnmpTrapSender {
  constructor(configPath, options = {}) {
    this.configPath = options.loopback ? 'test-config.yaml' : configPath;
    this.config = null;
    this.trapSender = null;
    this.running = false;
    this.loopbackReceiver = null;
    this.options = options;
  }

  /**
   * Load and validate configuration
   */
  loadConfig() {
    try {
      const configContent = readFileSync(this.configPath, 'utf8');
      this.config = parse(configContent);
      
      // Basic validation
      if (!this.config.oidRoot) {
        throw new Error('Missing oidRoot in configuration');
      }
      if (!Array.isArray(this.config.receivers) || this.config.receivers.length === 0) {
        throw new Error('No receivers configured');
      }
      if (!Array.isArray(this.config.rules) || this.config.rules.length === 0) {
        throw new Error('No rules configured');
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error;
    }
  }

  /**
   * Start the SNMP trap sender
   */
  async start() {
    if (this.running) return;
    
    this.loadConfig();

    // Start loopback receiver if enabled
    if (this.options.loopback) {
      this.loopbackReceiver = new LoopbackReceiver();
      await this.loopbackReceiver.start();
    }

    this.trapSender = new TrapSender(this.config);
    this.trapSender.initialize();
    this.running = true;

    // Start monitoring each rule
    for (const rule of this.config.rules) {
      this.monitorRule(rule);
    }

    console.log('SNMP trap sender started');

    // In loopback mode, wait for one trap and then exit
    if (this.options.loopback) {
      try {
        const trap = await this.loopbackReceiver.waitForTrap();
        console.log('Successfully received trap:', trap);
        this.stop();
        process.exit(0);
      } catch (error) {
        console.error('Failed to receive trap:', error);
        this.stop();
        process.exit(1);
      }
    }
  }

  /**
   * Monitor a single rule
   * @param {Object} rule - The rule to monitor
   */
  async monitorRule(rule) {
    const fullOid = `${this.config.oidRoot}.${rule.oid}`;
    
    const checkAndSend = async () => {
      try {
        const value = await CommandExecutor.execute(rule.command, rule.type);
        let severity = null;

        if (rule.type === 'integer' && rule.thresholds) {
          severity = CommandExecutor.checkThresholds(value, rule.thresholds);
        }

        await this.trapSender.sendTrap(rule.receivers, fullOid, value, severity);
      } catch (error) {
        console.error(`Error monitoring rule ${rule.id}:`, error);
      }
    };

    // Initial check
    await checkAndSend();

    // Set up interval
    setInterval(checkAndSend, rule.interval * 1000);
  }

  /**
   * Generate OID file
   * @param {string} outputPath - Path to save the OID file
   */
  generateOidFile(outputPath) {
    if (!this.config) {
      this.loadConfig();
    }
    
    const content = generateOidFile(this.config);
    writeFileSync(outputPath, content);
    console.log(`OID file generated at ${outputPath}`);
  }

  /**
   * Stop the SNMP trap sender
   */
  stop() {
    if (!this.running) return;
    
    if (this.trapSender) {
      this.trapSender.close();
    }

    if (this.loopbackReceiver) {
      this.loopbackReceiver.stop();
    }
    
    this.running = false;
    console.log('SNMP trap sender stopped');
  }

  /**
   * Get received traps from loopback receiver
   * @returns {Array} Array of received traps
   */
  getReceivedTraps() {
    return this.loopbackReceiver ? this.loopbackReceiver.getReceivedTraps() : [];
  }

  /**
   * Clear received traps from loopback receiver
   */
  clearReceivedTraps() {
    if (this.loopbackReceiver) {
      this.loopbackReceiver.clearTraps();
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const configPath = 'config.yaml';
const options = {
  loopback: args.includes('--loopback')
};

const sender = new SnmpTrapSender(configPath, options);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping SNMP trap sender...');
  sender.stop();
  process.exit(0);
});

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
QXIP SNMP Trap Sender

Usage:
  quick-snmp [options]

Options:
  --help, -h          Show this help message
  --loopback         Run in loopback mode for testing
  --generate-oid     Generate OID file for SNMP receivers
  --version, -v      Show version information

Examples:
  quick-snmp                    Start the SNMP trap sender
  quick-snmp --loopback        Run in loopback mode
  quick-snmp --generate-oid    Generate OID file
`);
  process.exit(0);
}

// Show version
if (args.includes('--version') || args.includes('-v')) {
  console.log('QXIP SNMP Trap Sender v1.0.0');
  process.exit(0);
}

// Check if we should generate OID file
if (args.includes('--generate-oid')) {
  const outputPath = args[args.indexOf('--generate-oid') + 1] || 'qxip-snmp.mib';
  // Create a new sender instance with the correct config for OID generation
  const oidSender = new SnmpTrapSender(options.loopback ? 'test-config.yaml' : configPath, options);
  oidSender.generateOidFile(outputPath);
  process.exit(0);
}

// Start the sender
sender.start().catch(error => {
  console.error('Failed to start SNMP trap sender:', error);
  process.exit(1);
}); 