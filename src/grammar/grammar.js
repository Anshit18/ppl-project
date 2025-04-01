/**
 * Grammar Definition for the Probabilistic Programming Language (PPL)
 *
 * This file serves as a reference for the syntax rules implemented in the parser.
 *
 * The parser (parser.js) will follow this structure when generating the AST.
 */

const grammar = `
program    ::= statement+
statement  ::= assignment | observe

assignment ::= variable "=" expression
observe    ::= "observe(" value "," distribution ")"

expression ::= term (("+" | "-") term)*
term       ::= factor (("*" | "/") factor)*
factor     ::= number | variable | sample | "(" expression ")"

sample     ::= "sample(" distribution ")"

distribution ::= identifier "(" parameters ")"
parameters   ::= number | parameters "," number

value      ::= number | variable
identifier ::= letter (letter | digit)*
variable   ::= letter (letter | digit)*
number     ::= digit+
letter     ::= "a" | ... | "z" | "A" | ... | "Z"
digit      ::= "0" | ... | "9"
`;

module.exports = grammar;
