const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../app/services');
const files = [
  'user.service.ts',
];

files.forEach(filename => {
  const filePath = path.join(servicesDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  No encontrado: ${filename}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Patrón: reemplazar `fetch(url, {\n        method:` con `fetch(url, {\n        credentials: 'include',\n        method:`
  // Para TODOS los métodos HTTP
  content = content.replace(
    /(const response = await fetch\([^{]+{\s*\n)(\s+)(method: '(?:GET|POST|PUT|PATCH|DELETE)',)/g,
    (match, before, indent, methodLine) => {
      // Verificar si ya tiene credentials en las siguientes líneas  
      const startPos = originalContent.indexOf(match);
      if (startPos === -1) return match;
      const context = originalContent.substr(startPos, 300);
      if (context.includes("credentials: 'include'")) {
        return match;
      }
      return `${before}${indent}credentials: 'include',\n${indent}${methodLine}`;
    }
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Actualizado: ${filename}`);
  } else {
    console.log(`ℹ️  Sin cambios: ${filename}`);
  }
});

console.log('\n🎉 Completado');
