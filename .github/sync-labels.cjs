const fs = require('fs');
const { execSync } = require('child_process');

console.log('1. Eliminando etiquetas predeterminadas...');
const defaultLabels = [
  'bug', 'enhancement', 'documentation', 'duplicate',
  'good first issue', 'help wanted', 'invalid', 'question', 'wontfix'
];

for (const name of defaultLabels) {
  try {
    execSync(`gh label delete "${name}" --yes`, { stdio: 'ignore' });
    console.log(`   - Eliminada: ${name}`);
  } catch {
    // Si ya no existe, no pasa nada
  }
}

console.log('\n2. Creando etiquetas del proyecto desde .github/labels.yml...');
const rawYaml = fs.readFileSync('.github/labels.yml', 'utf8');
const lines = rawYaml.split('\n');

let current = null;
const labels = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('- name:')) {
    if (current) labels.push(current);
    current = { name: trimmed.replace('- name:', '').replace(/["']/g, '').trim() };
  } else if (current && trimmed.startsWith('color:')) {
    current.color = trimmed.replace('color:', '').replace(/["']/g, '').trim();
  } else if (current && trimmed.startsWith('description:')) {
    current.description = trimmed.replace('description:', '').replace(/["']/g, '').trim();
  }
}
if (current) labels.push(current);

for (const l of labels) {
  try {
    const desc = l.description ? `--description "${l.description}"` : '';
    execSync(`gh label create "${l.name}" --color "${l.color}" ${desc} --force`, { stdio: 'ignore' });
    console.log(`   + Creada: ${l.name}`);
  } catch {
    console.log(`   ! Error en ${l.name}`);
  }
}

console.log('\n¡Etiquetas listas y sincronizadas!');