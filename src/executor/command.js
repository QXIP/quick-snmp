import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CommandExecutor {
  /**
   * Execute a system command and return its output
   * @param {string} command - The command to execute
   * @param {string} type - The expected output type ('string' or 'integer')
   * @returns {Promise<string|number>} - The command output
   */
  static async execute(command, type) {
    try {
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.warn(`Command stderr: ${stderr}`);
      }

      const output = stdout.trim();
      
      if (type === 'integer') {
        const num = parseInt(output, 10);
        if (isNaN(num)) {
          throw new Error(`Command output "${output}" cannot be converted to integer`);
        }
        return num;
      }
      
      return output;
    } catch (error) {
      console.error(`Error executing command "${command}":`, error);
      throw error;
    }
  }

  /**
   * Check if a value exceeds thresholds
   * @param {number} value - The value to check
   * @param {Object} thresholds - The thresholds object
   * @returns {string|null} - 'critical', 'warning', or null
   */
  static checkThresholds(value, thresholds) {
    if (!thresholds) return null;
    
    if (thresholds.critical !== undefined && value >= thresholds.critical) {
      return 'critical';
    }
    
    if (thresholds.warning !== undefined && value >= thresholds.warning) {
      return 'warning';
    }
    
    return null;
  }
} 