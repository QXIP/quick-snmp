import { createSocket } from 'dgram';

export class LoopbackReceiver {
  constructor(port = 1162) {
    this.port = port;
    this.server = null;
    this.receivedTraps = [];
    this.trapPromise = null;
    this.trapResolve = null;
  }

  /**
   * Start the loopback receiver
   * @returns {Promise<void>}
   */
  async start() {
    return new Promise((resolve) => {
      this.server = createSocket('udp4');
      
      this.server.on('message', (msg, rinfo) => {
        try {
          const trap = {
            timestamp: new Date(),
            source: rinfo,
            data: msg.toString()
          };
          this.receivedTraps.push(trap);
          console.log('Received trap:', trap);
          
          // Resolve the promise if we're waiting for a trap
          if (this.trapResolve) {
            this.trapResolve(trap);
            this.trapResolve = null;
          }
        } catch (error) {
          console.error('Error parsing trap:', error);
        }
      });

      this.server.on('error', (error) => {
        console.error('Loopback receiver error:', error);
      });

      this.server.bind(this.port, () => {
        console.log(`Loopback receiver listening on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Wait for a trap to be received
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} The received trap
   */
  waitForTrap(timeout = 5000) {
    if (this.trapPromise) {
      return this.trapPromise;
    }

    this.trapPromise = new Promise((resolve, reject) => {
      this.trapResolve = resolve;
      
      if (timeout) {
        setTimeout(() => {
          if (this.trapResolve) {
            this.trapResolve = null;
            reject(new Error('Timeout waiting for trap'));
          }
        }, timeout);
      }
    });

    return this.trapPromise;
  }

  /**
   * Stop the loopback receiver
   */
  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log('Loopback receiver stopped');
    }
  }

  /**
   * Get all received traps
   * @returns {Array} Array of received traps
   */
  getReceivedTraps() {
    return this.receivedTraps;
  }

  /**
   * Clear received traps
   */
  clearTraps() {
    this.receivedTraps = [];
  }
} 