import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'yaml';
import { CommandExecutor } from './executor/command.js';
import { TrapSender } from './snmp/trapSender.js';
import { generateOidFile } from './generator/oidFile.js';

class SnmpTrapSender {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
    this.trapSender = null;
    this.running = false;
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
    this.trapSender = new TrapSender(this.config);
    this.trapSender.initialize();
    this.running = true;

    // Start monitoring each rule
    for (const rule of this.config.rules) {
      this.monitorRule(rule);
    }

    console.log('SNMP trap sender started');
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
    
    this.running = false;
    console.log('SNMP trap sender stopped');
  }
}

// Example usage
const sender = new SnmpTrapSender('config.yaml');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping SNMP trap sender...');
  sender.stop();
  process.exit(0);
});

// Start the sender
sender.start().catch(error => {
  console.error('Failed to start SNMP trap sender:', error);
  process.exit(1);
}); 