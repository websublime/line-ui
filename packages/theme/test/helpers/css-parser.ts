/**
 * CSS parsing utilities for test infrastructure.
 *
 * Extracts custom property declarations and var() references
 * from raw CSS source text using regex-based parsing.
 *
 * @module test/helpers/css-parser
 */

import { readFileSync } from 'node:fs';

/**
 * Extract all CSS custom property declarations (--name: value) from CSS text.
 * Returns a Map of property name -> value.
 */
export function extractDeclarations(css: string): Map<string, string> {
  const declarations = new Map<string, string>();

  // Match --property-name: value (handles multiline values by matching until ; or })
  // We need to handle multiline values like shadows that span multiple lines
  const regex = /(--[\w-]+)\s*:\s*([^;{}]+)/g;

  for (const match of css.matchAll(regex)) {
    const name = match[1].trim();
    const value = match[2].trim();
    declarations.set(name, value);
  }

  return declarations;
}

/**
 * Extract only the custom property names declared in CSS text.
 */
export function extractDeclaredNames(css: string): Set<string> {
  const names = new Set<string>();
  const regex = /(--[\w-]+)\s*:/g;

  for (const match of css.matchAll(regex)) {
    names.add(match[1]);
  }

  return names;
}

/**
 * Extract all var(--name) references from CSS text.
 * Returns a Set of referenced custom property names.
 *
 * Handles:
 * - var(--name)
 * - var(--name, fallback)
 * - nested var() in fallbacks
 */
export function extractVarReferences(css: string): Set<string> {
  const refs = new Set<string>();
  const regex = /var\(\s*(--[\w-]+)/g;

  for (const match of css.matchAll(regex)) {
    refs.add(match[1]);
  }

  return refs;
}

/**
 * Read a CSS file and return its contents.
 */
export function readCssFile(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

/**
 * Extract custom property declarations from a CSS file.
 */
export function extractDeclarationsFromFile(filePath: string): Map<string, string> {
  return extractDeclarations(readCssFile(filePath));
}

/**
 * Extract custom property names declared in a CSS file.
 */
export function extractDeclaredNamesFromFile(filePath: string): Set<string> {
  return extractDeclaredNames(readCssFile(filePath));
}

/**
 * Extract var() references from a CSS file.
 */
export function extractVarReferencesFromFile(filePath: string): Set<string> {
  return extractVarReferences(readCssFile(filePath));
}

/**
 * Strip the --line- prefix from a property name, returning the base name.
 * e.g., "--line-radius-1" -> "--radius-1"
 */
export function stripLinePrefix(name: string): string {
  return name.replace(/^--line-/, '--');
}

/**
 * Add the --line- prefix to a property name.
 * e.g., "--radius-1" -> "--line-radius-1"
 */
export function addLinePrefix(name: string): string {
  if (name.startsWith('--line-')) return name;
  return name.replace(/^--/, '--line-');
}
