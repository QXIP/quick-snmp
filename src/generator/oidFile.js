/**
 * Generate SNMP MIB file content for the configured OIDs
 * @param {Object} config - The configuration object
 * @returns {string} - The MIB file content
 */
export function generateOidFile(config) {
  const { oidRoot, rules } = config;
  
  let content = `-- Generated SNMP MIB file
-- Root OID: ${oidRoot}

IMPORTS
  MODULE-IDENTITY, OBJECT-TYPE, NOTIFICATION-TYPE, enterprises
    FROM SNMPv2-SMI;

qxipSnmpTraps MODULE-IDENTITY
  LAST-UPDATED "202403150000Z"
  ORGANIZATION "QXIP"
  CONTACT-INFO "https://qxip.net"
  DESCRIPTION "QXIP SNMP Traps MIB"
  ::= { enterprises ${oidRoot.split('.').pop()} }

-- Trap Definitions
`;

  // Add trap definitions
  for (const rule of rules) {
    const fullOid = `${oidRoot}.${rule.oid}`;
    const oidParts = fullOid.split('.');
    const lastPart = oidParts.pop();
    
    content += `
${rule.id} NOTIFICATION-TYPE
  OBJECTS { ${rule.id}Value${rule.thresholds ? ', ' + rule.id + 'Severity' : ''} }
  STATUS current
  DESCRIPTION "${rule.name}"
  ::= { ${oidParts.join('.')} ${lastPart} }

${rule.id}Value OBJECT-TYPE
  SYNTAX ${rule.type === 'integer' ? 'Integer32' : 'OCTET STRING'}
  MAX-ACCESS read-only
  STATUS current
  DESCRIPTION "${rule.name} value"
  ::= { ${fullOid} 1 }
`;

    if (rule.thresholds) {
      content += `
${rule.id}Severity OBJECT-TYPE
  SYNTAX OCTET STRING
  MAX-ACCESS read-only
  STATUS current
  DESCRIPTION "${rule.name} severity level"
  ::= { ${fullOid} 2 }
`;
    }
  }

  return content;
} 