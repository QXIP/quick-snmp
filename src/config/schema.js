/**
 * Configuration schema for SNMP trap sender
 */

export const configSchema = {
  oidRoot: {
    type: 'string',
    description: 'Root OID for all traps (e.g., 1.3.6.1.4.1.12345)',
    required: true
  },
  receivers: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for the receiver',
          required: true
        },
        host: {
          type: 'string',
          description: 'Hostname or IP address of the SNMP receiver',
          required: true
        },
        port: {
          type: 'number',
          description: 'SNMP port (default: 162)',
          default: 162
        },
        community: {
          type: 'string',
          description: 'SNMP community string',
          required: true
        }
      }
    }
  },
  rules: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for the rule',
          required: true
        },
        oid: {
          type: 'string',
          description: 'OID suffix to append to root OID',
          required: true
        },
        name: {
          type: 'string',
          description: 'Human-readable name for the OID',
          required: true
        },
        type: {
          type: 'string',
          enum: ['string', 'integer'],
          description: 'Type of value to return',
          required: true
        },
        command: {
          type: 'string',
          description: 'System command to execute',
          required: true
        },
        interval: {
          type: 'number',
          description: 'Check interval in seconds',
          required: true
        },
        thresholds: {
          type: 'object',
          properties: {
            warning: {
              type: 'number',
              description: 'Warning threshold value'
            },
            critical: {
              type: 'number',
              description: 'Critical threshold value'
            }
          }
        },
        receivers: {
          type: 'array',
          items: {
            type: 'string',
            description: 'List of receiver IDs to send traps to'
          },
          required: true
        }
      }
    }
  }
}; 