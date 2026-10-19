// Type declarations for the benchmark scripts only.

// aws4 and aws-sig ship no type declarations; the benchmarks call them as plain JavaScript.
declare module 'aws4';
declare module 'aws-sig';

// compat/run.mjs also runs under Deno, and reads its version when it does.
declare const Deno: { version: { deno: string } } | undefined;
