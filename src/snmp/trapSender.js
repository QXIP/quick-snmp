import { createSocket } from 'dgram';

export class TrapSender {
  constructor(config) {
    this.config = config;
    this.socket = createSocket('udp4');
    
    this.socket.on('error', (error) => {
      console.error('UDP socket error:', error);
    });
  }

  /**
   * Initialize the UDP socket
   */
  initialize() {
    // Nothing to do here, socket is created in constructor
  }

  /**
   * Send a trap to specified receivers
   * @param {string[]} receiverIds - Array of receiver IDs to send to
   * @param {string} oid - Full OID for the trap
   * @param {string|number} value - Value to send
   * @param {string} severity - Severity level ('critical' or 'warning')
   */
  async sendTrap(receiverIds, oid, value, severity = null) {
    // Create a simple trap message for testing
    const trap = {
      timestamp: new Date().toISOString(),
      oid,
      value,
      severity,
      type: typeof value
    };

    const message = Buffer.from(JSON.stringify(trap));

    for (const receiverId of receiverIds) {
      const receiver = this.config.receivers.find(r => r.id === receiverId);
      if (!receiver) {
        console.error(`No receiver found for ID ${receiverId}`);
        continue;
      }

      try {
        await new Promise((resolve, reject) => {
          this.socket.send(message, 0, message.length, receiver.port, receiver.host, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        console.log(`Trap sent to ${receiverId} for OID ${oid}`);
      } catch (error) {
        console.error(`Error sending trap to ${receiverId}:`, error);
      }
    }
  }

  /**
   * Close the UDP socket
   */
  close() {
    this.socket.close();
    console.log('UDP socket closed');
  }
} 