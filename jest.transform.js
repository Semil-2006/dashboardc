"use strict";

module.exports = {
  process(sourceText, sourcePath) {
    if (!sourcePath.endsWith(".js") || sourcePath.includes("__tests__") || sourcePath.includes("node_modules")) {
      return { code: sourceText };
    }

    let code = sourceText;

    const sharedVars = [
      "YEARS", "quadStatus", "anualStatus", "dashboardData",
      "integrityPairs", "yearColors", "varColor", "currentIndicator", "toolbarState",
    ];

    for (const v of sharedVars) {
      const letRegex = new RegExp(`^let\\s+${v}\\s*;\\s*$`, "gm");
      const constRegex = new RegExp(`^const\\s+${v}\\s*=\\s*([^;]+);\\s*$`, "gm");
      const standaloneLet = new RegExp(`^let\\s+${v}\\s*=\\s*([^;]+);\\s*$`, "gm");

      if (letRegex.test(code)) {
        code = code.replace(letRegex, `var ${v} = typeof globalThis.${v} !== 'undefined' ? globalThis.${v} : undefined;`);
      } else if (standaloneLet.test(code)) {
        code = code.replace(standaloneLet, (match, val) => {
          return `if (typeof globalThis.${v} === 'undefined') { var ${v} = ${val}; } else { var ${v} = globalThis.${v}; }`;
        });
      } else if (constRegex.test(code)) {
        code = code.replace(constRegex, (match, val) => {
          return `var ${v} = typeof globalThis.${v} !== 'undefined' ? globalThis.${v} : ${val};`;
        });
      }
    }

    const functionNames = [];
    const funcRegex = /^(?:async\s+)?function\s+(\w+)\s*\(/gm;
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      functionNames.push(match[1]);
    }

    const varNames = [];
    const varRegex = /^(?:let|const|var)\s+(\w+)\s*(?:=|;)/gm;
    while ((match = varRegex.exec(code)) !== null) {
      varNames.push(match[1]);
    }

    const exports = [];
    functionNames.forEach(name => {
      exports.push(`module.exports.${name} = ${name};`);
    });
    varNames.forEach(name => {
      exports.push(
        `Object.defineProperty(module.exports, '${name}', { get: () => ${name}, set: (v) => { ${name} = v; } });`
      );
    });

    if (exports.length > 0) {
      code += "\n\nif (typeof module !== 'undefined') {\n" + exports.join("\n") + "\n}\n";
    }

    return { code };
  },
};
