#!/usr/bin/env node
/**
 * SDK Generator from Soroban Contract ABI
 * Auto-generates TypeScript SDK client from contract WASM/JSON spec
 */

import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

interface ContractSpec {
  name: string;
  version: string;
  functions: ContractFunction[];
  types: ContractType[];
}

interface ContractFunction {
  name: string;
  docs: string[];
  inputs: Parameter[];
  outputs: Parameter[];
  readonly: boolean;
}

interface ContractType {
  name: string;
  type: string;
  fields?: Field[];
  variants?: Variant[];
}

interface Parameter {
  name: string;
  type: string;
  docs?: string[];
}

interface Field {
  name: string;
  type: string;
  docs?: string[];
}

interface Variant {
  name: string;
  value?: number;
  docs?: string[];
}

class SDKGenerator {
  private spec: ContractSpec;
  private outputDir: string;

  constructor(specPath: string, outputDir: string) {
    this.outputDir = outputDir;
    // Load spec from file
    const specContent = require("fs").readFileSync(specPath, "utf-8");
    this.spec = JSON.parse(specContent);
  }

  /**
   * Generate the complete SDK
   */
  async generate(): Promise<void> {
    console.log(`🚀 Generating SDK for ${this.spec.name}...`);

    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Generate type definitions
    await this.generateTypes();

    // Generate client class
    await this.generateClient();

    // Generate index file
    await this.generateIndex();

    console.log(`✅ SDK generated in ${this.outputDir}`);
  }

  /**
   * Generate TypeScript interfaces from contract types
   */
  private async generateTypes(): Promise<void> {
    const lines: string[] = [];

    lines.push("/**");
    lines.push(" * Auto-generated types from contract ABI");
    lines.push(" * DO NOT EDIT MANUALLY");
    lines.push(" */");
    lines.push("");

    for (const type of this.spec.types) {
      lines.push(...this.generateTypeDefinition(type));
      lines.push("");
    }

    const content = lines.join("\n");
    await fs.writeFile(
      path.join(this.outputDir, "types.ts"),
      content,
      "utf-8"
    );

    console.log("  ✅ types.ts");
  }

  /**
   * Generate a single type definition
   */
  private generateTypeDefinition(type: ContractType): string[] {
    const lines: string[] = [];

    // Add documentation if available
    if (type.docs && type.docs.length > 0) {
      lines.push("/**");
      for (const doc of type.docs) {
        lines.push(` * ${doc}`);
      }
      lines.push(" */");
    }

    switch (type.type) {
      case "struct":
        lines.push(`export interface ${this.toPascalCase(type.name)} {`);
        if (type.fields) {
          for (const field of type.fields) {
            if (field.docs) {
              lines.push(`  /** ${field.docs.join(" ")} */`);
            }
            lines.push(
              `  ${field.name}: ${this.mapTypeToTs(field.type)};`
            );
          }
        }
        lines.push("}");
        break;

      case "enum":
        lines.push(`export enum ${this.toPascalCase(type.name)} {`);
        if (type.variants) {
          for (const variant of type.variants) {
            if (variant.docs) {
              lines.push(`  /** ${variant.docs.join(" ")} */`);
            }
            const value = variant.value !== undefined ? variant.value : `"${variant.name}"`;
            lines.push(`  ${variant.name} = ${value},`);
          }
        }
        lines.push("}");
        break;

      default:
        lines.push(
          `export type ${this.toPascalCase(type.name)} = ${this.mapTypeToTs(
            type.type
          )};`
        );
    }

    return lines;
  }

  /**
   * Generate the client class
   */
  private async generateClient(): Promise<void> {
    const lines: string[] = [];

    lines.push("/**");
    lines.push(" * Auto-generated Soroban contract client");
    lines.push(" * DO NOT EDIT MANUALLY");
    lines.push(" */");
    lines.push("");
    lines.push('import { Contract, SorobanRpc } from "@stellar/stellar-sdk";');
    lines.push('import type * as Types from "./types";');
    lines.push("");

    // Generate client class
    lines.push(`export class ${this.toPascalCase(this.spec.name)}Client {`);
    lines.push("  private contract: Contract;");
    lines.push("  private server: SorobanRpc.Server;");
    lines.push("");

    // Constructor
    lines.push("  constructor(");
    lines.push("    contractId: string,");
    lines.push("    rpcUrl: string = 'https://soroban-testnet.stellar.org'");
    lines.push("  ) {");
    lines.push("    this.contract = new Contract(contractId);");
    lines.push("    this.server = new SorobanRpc.Server(rpcUrl);");
    lines.push("  }");
    lines.push("");

    // Generate methods for each function
    for (const func of this.spec.functions) {
      lines.push(...this.generateMethod(func));
      lines.push("");
    }

    lines.push("}");

    const content = lines.join("\n");
    await fs.writeFile(
      path.join(this.outputDir, "client.ts"),
      content,
      "utf-8"
    );

    console.log("  ✅ client.ts");
  }

  /**
   * Generate a client method from contract function
   */
  private generateMethod(func: ContractFunction): string[] {
    const lines: string[] = [];

    // Documentation
    if (func.docs && func.docs.length > 0) {
      lines.push("  /**");
      for (const doc of func.docs) {
        lines.push(`   * ${doc}`);
      }
      lines.push("   */");
    }

    // Method signature
    const params = func.inputs
      .map((input) => `${input.name}: ${this.mapTypeToTs(input.type)}`)
      .join(", ");

    const returnType =
      func.outputs.length > 0
        ? this.mapTypeToTs(func.outputs[0].type)
        : "void";

    const methodName = this.toCamelCase(func.name);

    lines.push(`  async ${methodName}(${params}): Promise<${returnType}> {`);

    // Method body
    lines.push(`    const params = [${func.inputs.map((i) => i.name).join(", ")}];`);
    lines.push(`    const result = await this.call('${func.name}', params);`);

    if (func.outputs.length > 0) {
      lines.push(`    return result as ${returnType};`);
    } else {
      lines.push(`    return;`);
    }

    lines.push("  }");

    return lines;
  }

  /**
   * Generate index file
   */
  private async generateIndex(): Promise<void> {
    const lines: string[] = [];

    lines.push("/**");
    lines.push(` * ${this.spec.name} SDK`);
    lines.push(` * Version: ${this.spec.version}`);
    lines.push(" * Auto-generated from contract ABI");
    lines.push(" */");
    lines.push("");
    lines.push('export * from "./types";');
    lines.push('export * from "./client";');
    lines.push("");

    const content = lines.join("\n");
    await fs.writeFile(
      path.join(this.outputDir, "index.ts"),
      content,
      "utf-8"
    );

    console.log("  ✅ index.ts");
  }

  /**
   * Map contract types to TypeScript types
   */
  private mapTypeToTs(contractType: string): string {
    const typeMap: Record<string, string> = {
      u32: "number",
      i32: "number",
      u64: "bigint",
      i64: "bigint",
      u128: "bigint",
      i128: "bigint",
      u256: "bigint",
      i256: "bigint",
      bool: "boolean",
      string: "string",
      symbol: "string",
      bytes: "Uint8Array",
      address: "string",
      vec: "any[]",
      map: "Map<any, any>",
      option: "any | undefined",
      result: "any",
    };

    // Check if it's a custom type
    if (this.spec.types.some((t) => t.name === contractType)) {
      return `Types.${this.toPascalCase(contractType)}`;
    }

    return typeMap[contractType] || "any";
  }

  /**
   * Convert snake_case to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split("_")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
  }

  /**
   * Convert snake_case to camelCase
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: codegen <spec-file> <output-dir>");
    console.log("");
    console.log("Example:");
    console.log("  codegen ./contract-spec.json ./generated");
    process.exit(1);
  }

  const [specPath, outputDir] = args;

  try {
    const generator = new SDKGenerator(specPath, outputDir);
    await generator.generate();
  } catch (error) {
    console.error("❌ Generation failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SDKGenerator };
