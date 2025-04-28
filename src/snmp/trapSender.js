import snmp from 'net-snmp';

export class TrapSender {
  constructor(config) {
    this.config = config;
    this.sessions = new Map();
  }

  /**
   * Initialize SNMP sessions for all receivers
   */
  initialize() {
    for (const receiver of this.config.receivers) {
      const session = snmp.createSession(receiver.host, receiver.community, {
        port: receiver.port
      });
      this.sessions.set(receiver.id, session);
    }
  }

  /**
   * Send a trap to specified receivers
   * @param {string[]} receiverIds - Array of receiver IDs to send to
   * @param {string} oid - Full OID for the trap
   * @param {string|number} value - Value to send
   * @param {string} severity - Severity level ('critical' or 'warning')
   */
  async sendTrap(receiverIds, oid, value, severity = null) {
    const varbinds = [
      {
        oid: oid,
        type: typeof value === 'number' ? snmp.ObjectType.Integer : snmp.ObjectType.OctetString,
        value: value
      }
    ];

    if (severity) {
      varbinds.push({
        oid: `${oid}.severity`,
        type: snmp.ObjectType.OctetString,
        value: severity
      });
    }

    for (const receiverId of receiverIds) {
      const session = this.sessions.get(receiverId);
      if (!session) {
        console.error(`No session found for receiver ${receiverId}`);
        continue;
      }

      try {
        await new Promise((resolve, reject) => {
          session.trap(snmp.TrapType.EnterpriseSpecific, varbinds, (error) => {
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
   * Close all SNMP sessions
   */
  close() {
    for (const [id, session] of this.sessions) {
      session.close();
      console.log(`Closed session for receiver ${id}`);
    }
    this.sessions.clear();
  }
} 