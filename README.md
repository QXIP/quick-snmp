# QXIP SNMP Trap Sender

A flexible SNMP trap sender system that allows monitoring system metrics and sending SNMP traps based on configurable rules.

## Features

- Configurable OID root for all traps
- Multiple SNMP trap receivers support
- Flexible rule system for monitoring system metrics
- Support for both string and integer values
- Threshold-based monitoring with warning and critical levels
- Automatic OID file generation for SNMP receivers
- YAML-based configuration

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/qxip-snmp.git
cd qxip-snmp
```

2. Install dependencies:
```bash
bun install
```

## Configuration

The system is configured using a YAML file. See `config.yaml` for a complete example.

### Configuration Structure

```yaml
# Root OID for all traps
oidRoot: "1.3.6.1.4.1.12345"

# SNMP trap receivers
receivers:
  - id: "receiver1"
    host: "192.168.1.100"
    port: 162
    community: "public"

# Monitoring rules
rules:
  - id: "rule1"
    oid: "1.1"
    name: "Rule Name"
    type: "integer"  # or "string"
    command: "your-command"
    interval: 60
    thresholds:
      warning: 70
      critical: 90
    receivers: ["receiver1"]
```

## Usage

1. Start the SNMP trap sender:
```bash
bun src/index.js
```

2. Generate OID file for SNMP receivers:
```bash
bun src/index.js --generate-oid
```

## Rule Configuration

Each rule in the configuration defines:

- `id`: Unique identifier for the rule
- `oid`: OID suffix to append to root OID
- `name`: Human-readable name for the OID
- `type`: Type of value to return ("string" or "integer")
- `command`: System command to execute
- `interval`: Check interval in seconds
- `thresholds`: Optional thresholds for integer values
  - `warning`: Warning threshold value
  - `critical`: Critical threshold value
- `receivers`: List of receiver IDs to send traps to

## OID File Generation

The system can generate an SNMP MIB file that can be loaded on SNMP receivers. The generated file includes:

- Module identity
- Trap definitions
- Object type definitions
- Severity level objects (for rules with thresholds)

## License

MIT
