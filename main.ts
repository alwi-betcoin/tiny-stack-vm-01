import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const enc = new TextEncoder();

// Binary ops 0x10..0x22, indexed by op - 0x10 (0 = not a binary op: NEG, NOT, bad).
// A div/mod by zero answers undefined, which the caller turns into trap 4.
const B = [(a, b) => (a + b) | 0, (a, b) => (a - b) | 0, Math.imul,
  (a, b) => b ? a === -2147483648 && b === -1 ? a : (a / b) | 0 : undefined,
  (a, b) => b ? b === -1 ? 0 : (a % b) | 0 : undefined,
  (a, b) => b ? Math.floor((a >>> 0) / (b >>> 0)) | 0 : undefined,
  (a, b) => b ? ((a >>> 0) % (b >>> 0)) | 0 : undefined,
  0, (a, b) => a & b, (a, b) => a | b, (a, b) => a ^ b, 0,
  (a, b) => a << (b & 31), (a, b) => a >> (b & 31), (a, b) => (a >>> (b & 31)) | 0, 0,
  (a, b) => a === b ? 1 : 0, (a, b) => a < b ? 1 : 0, (a, b) => (a >>> 0) < (b >>> 0) ? 1 : 0];

// Tiny stack VM interpreter for make.fun tiny-stack-vm-01 (ISA v1).
// Runs every program under $MAKEFUN_INPUT_DIR and writes its stdout + exit code.
//
// Opcode table T, one char per byte 0x00..0x53: ' ' (32) = unknown opcode,
// otherwise charCode - 33 packs (immediate bytes, pops, pushes) as imm*16+pops*4+pushes.
const T = '!2b%\'+,0        *******&***&*** ***             AEEA!           &)              %%"%';

function run(p, inp) {
  const n = p.length;
  const D = new Int32Array(256);
  let sp = 0;
  const C = new Int32Array(64);
  let cp = 0;
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let ol = 0;
  let ip = 0;
  let pc = 0;
  let steps = 0;
  const end = (code) => ({ out: out.slice(0, ol), code });
  for (;;) {
    if (steps === 1000000) return end(10);
    if (pc < 0 || pc >= n) return end(9);
    const op = p[pc];
    const t = T.charCodeAt(op) - 33;
    if (!(t >= 0)) return end(5);
    const imm = t >> 4, pops = (t >> 2) & 3, pushes = t & 3;
    if (pc + imm >= n) return end(9);
    steps++;
    const next = pc + 1 + imm;
    if (sp < pops) return end(2);
    if (sp - pops + pushes > 256) return end(3);
    pc = next;
    switch (op) {
      case 0x00: return end(0);
      case 0x01: D[sp++] = (p[next - 1] << 24) >> 24; break;
      case 0x02: D[sp++] = p[next - 4] | (p[next - 3] << 8) | (p[next - 2] << 16) | (p[next - 1] << 24); break;
      case 0x03: sp--; break;
      case 0x04: D[sp] = D[sp - 1]; sp++; break;
      case 0x05: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 0x06: D[sp] = D[sp - 2]; sp++; break;
      case 0x07: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 0x17: D[sp - 1] = -D[sp - 1] | 0; break;
      case 0x1b: D[sp - 1] = ~D[sp - 1]; break;
      default: {
        const b = D[sp - 1];
        const a = D[sp - 2];
        const r = B[op - 0x10](a, b);
        if (r === undefined) return end(4);
        sp -= 2;
        D[sp++] = r;
        break;
      }
      case 0x30: case 0x31: case 0x32: {
        const rel = ((p[next - 2] | (p[next - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 0x30) { const v = D[--sp]; take = op === 0x31 ? v === 0 : v !== 0; }
        if (take) pc = next + rel;
        break;
      }
      case 0x33:
        if (cp === 64) return end(7);
        C[cp++] = next;
        pc = p[next - 2] | (p[next - 1] << 8);
        break;
      case 0x34:
        if (cp === 0) return end(8);
        pc = C[--cp];
        break;
      case 0x40: {
        const addr = D[sp - 1];
        if (addr < 0 || addr >= 256) return end(6);
        D[sp - 1] = M[addr];
        break;
      }
      case 0x41: {
        const addr = D[sp - 1];
        const v = D[sp - 2];
        if (addr < 0 || addr >= 256) return end(6);
        sp -= 2;
        M[addr] = v;
        break;
      }
      case 0x50: {
        const bytes = enc.encode(String(D[sp - 1]));
        if (ol + bytes.length > 65536) return end(11);
        sp--;
        out.set(bytes, ol);
        ol += bytes.length;
        break;
      }
      case 0x51:
        if (ol + 1 > 65536) return end(11);
        out[ol++] = D[--sp] & 255;
        break;
      case 0x52: D[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 0x53: return end(D[--sp] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), r.code + '\n');
}
