import { randomInt } from "node:crypto";

// 헷갈리는 글자(0/o, 1/l/i)를 뺀 소문자와 숫자
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function studentId(grade: number, klass: number, number: number): string {
  return `${grade}-${klass}-${number}`;
}
