import { stdout } from 'process';

export class TerminalUtils {
  static getTerminalWidth(): number {
    return stdout.columns || 80;
  }

  static createSeparator(char: string = '─', width?: number): string {
    const terminalWidth = width || this.getTerminalWidth();
    const actualWidth = Math.min(terminalWidth - 4, 80); // Leave margin and max width
    return char.repeat(actualWidth);
  }

  static clearScreen(): void {
    // Clear screen with better compatibility
    console.clear();
    
    // Alternative fallback for terminals that don't support console.clear()
    if (process.stdout.isTTY) {
      process.stdout.write('\x1Bc');
    }
  }

  static ensureNewlines(): void {
    // Ensure we're at the start of a new line
    console.log('');
  }

  static formatChatBox(title: string, width?: number): string[] {
    const terminalWidth = width || this.getTerminalWidth();
    const boxWidth = Math.min(terminalWidth - 4, 50);
    const padding = Math.max(0, Math.floor((boxWidth - title.length - 2) / 2));
    
    const topLine = '┌' + '─'.repeat(boxWidth - 2) + '┐';
    const titleLine = '│' + ' '.repeat(padding) + title + ' '.repeat(boxWidth - 2 - padding - title.length) + '│';
    const bottomLine = '└' + '─'.repeat(boxWidth - 2) + '┘';
    
    return [topLine, titleLine, bottomLine];
  }

  static isColorSupported(): boolean {
    return process.stdout.isTTY && (
      process.env.FORCE_COLOR !== '0' &&
      (process.env.FORCE_COLOR || 
       process.env.TERM !== 'dumb' &&
       process.platform !== 'win32')
    );
  }

  static wrapText(text: string, width?: number): string[] {
    const maxWidth = width || Math.min(this.getTerminalWidth() - 8, 100);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }
}