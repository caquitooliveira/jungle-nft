import sharp from 'sharp'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const names = [
  'ape-green',
  'ape-purple',
  'ape-gold',
  'ape-black',
]

// Gera os arquivos primeiro, mantendo os PNGs originais.
for (const name of names) {
  const output = `public/images/${name}.webp`

  const info = await sharp(`public/images/${name}.png`)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(output)

  console.log(`${name}.webp: ${Math.round(info.size / 1024)} KB`)
}

async function updateReferences(filePath) {
  const original = await readFile(filePath, 'utf8')
  let updated = original

  for (const name of names) {
    updated = updated.replaceAll(
      `/images/${name}.png`,
      `/images/${name}.webp`,
    )
  }

  if (updated !== original) {
    await writeFile(filePath, updated, 'utf8')
    console.log(`Referências atualizadas: ${filePath}`)
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      await walk(filePath)
    } else if (/\.(tsx?|jsx?|css|html|json)$/.test(entry.name)) {
      await updateReferences(filePath)
    }
  }
}

await walk('src')
await updateReferences('index.html')