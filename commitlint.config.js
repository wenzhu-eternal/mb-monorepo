/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // type 枚举与 docs/CONVENTIONS.md 保持一致
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'ci', 'perf', 'style', 'build'],
    ],
    // subject 不超过 72 字符（中文按 2 字符算）
    'subject-max-length': [2, 'always', 100],
    // body 每行不超过 100 字符
    'body-max-line-length': [2, 'always', 200],
  },
}
