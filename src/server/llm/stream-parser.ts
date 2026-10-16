/**
 * Incremental extractor for the elements of the top-level "steps" array in a JSON object that arrives in chunks
 * (`{"steps":[ {...}, {...} ]}`), or of a bare top-level array. Tolerates markdown fences and preamble text before
 * the JSON, strings containing brackets and escapes, and truncated streams (only complete elements are emitted).
 */
export class StepStreamParser {
  private text = '';
  private started = false;
  private finished = false;
  private depth = 0;
  private inStr = false;
  private esc = false;
  private strBuf = '';
  private lastStr = '';
  private lastKey = '';
  private inSteps = false;
  private stepsDepth = 0;
  private elemStart = -1;
  private scanned = 0;
  elements = 0;

  push(chunk: string): string[] {
    this.text += chunk;
    const out: string[] = [];
    for (; this.scanned < this.text.length; this.scanned++) {
      if (this.finished) break;
      const i = this.scanned;
      const c = this.text[i];
      if (!this.started) {
        if (c === '{') {
          this.started = true;
          this.depth = 1;
        } else if (c === '[') {
          this.started = true;
          this.depth = 1;
          this.inSteps = true;
          this.stepsDepth = 1;
        }
        continue;
      }
      if (this.inStr) {
        if (this.esc) {
          this.esc = false;
          this.strBuf += c;
        } else if (c === '\\') {
          this.esc = true;
          this.strBuf += c;
        } else if (c === '"') {
          this.inStr = false;
          this.lastStr = this.strBuf;
        } else {
          this.strBuf += c;
        }
        continue;
      }
      switch (c) {
        case '"':
          this.inStr = true;
          this.strBuf = '';
          break;
        case ':':
          if (this.depth === 1) this.lastKey = this.lastStr;
          break;
        case '{':
        case '[':
          this.depth++;
          if (!this.inSteps && c === '[' && this.depth === 2 && this.lastKey === 'steps') {
            this.inSteps = true;
            this.stepsDepth = 2;
          } else if (this.inSteps && this.depth === this.stepsDepth + 1) {
            this.elemStart = i;
          }
          break;
        case '}':
        case ']':
          if (this.inSteps && this.depth === this.stepsDepth + 1 && this.elemStart >= 0) {
            out.push(this.text.slice(this.elemStart, i + 1));
            this.elements++;
            this.elemStart = -1;
          }
          if (c === ']' && this.inSteps && this.depth === this.stepsDepth) this.inSteps = false;
          this.depth--;
          if (this.depth <= 0) this.finished = true;
          break;
        default:
          break;
      }
    }
    // Keep memory bounded: text before the current element start is no longer needed.
    if (this.elemStart < 0 && this.scanned > 4096) {
      this.text = this.text.slice(this.scanned);
      this.scanned = 0;
    } else if (this.elemStart > 2048) {
      this.text = this.text.slice(this.elemStart);
      this.scanned -= this.elemStart;
      this.elemStart = 0;
    }
    return out;
  }

  /** Whether the JSON started at all (false means the model returned prose or nothing). */
  get sawJson(): boolean {
    return this.started;
  }

  get complete(): boolean {
    return this.finished;
  }
}
