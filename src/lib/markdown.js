/**
 * Minimal markdown → HTML renderer for the seeded reference pages.
 *
 * Deliberately tiny (no dependency) and covers exactly what the seed uses:
 * headings, bold/italic/code, links, lists, tables, blockquotes and rules.
 * Input is escaped first, so a hand-edited page can never inject markup.
 */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(text) {
  let out = escapeHtml(text)
  // code first so its contents aren't re-processed
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, label, href) => {
    const safeHref = href.replace(/"/g, '%22')
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label}</a>`
  })
  out = out.replace(/\\([\\`*_[\]()$])/g, '$1')
  return out
}

function isTableDivider(line) {
  return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-')
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

export function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n')
  const html = []
  let i = 0
  let listType = null

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      i++
      continue
    }

    // Table — header row followed by a divider row
    if (trimmed.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      closeList()
      const header = splitRow(trimmed)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitRow(lines[i]))
        i++
      }
      html.push('<div class="table-scroll"><table><thead><tr>')
      header.forEach((h) => html.push(`<th>${inline(h)}</th>`))
      html.push('</tr></thead><tbody>')
      rows.forEach((r) => {
        html.push('<tr>')
        r.forEach((c) => html.push(`<td>${inline(c)}</td>`))
        html.push('</tr>')
      })
      html.push('</tbody></table></div>')
      continue
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      closeList()
      const level = Math.min(3, trimmed.match(/^#+/)[0].length + 1) // h1 in body → h2
      html.push(`<h${level}>${inline(trimmed.replace(/^#+\s*/, ''))}</h${level}>`)
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList()
      html.push('<hr />')
      i++
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      closeList()
      const quote = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      html.push(`<blockquote>${quote.map((q) => inline(q)).join('<br />')}</blockquote>`)
      continue
    }

    const ul = trimmed.match(/^[-*]\s+(.*)$/)
    if (ul) {
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${inline(ul[1])}</li>`)
      i++
      continue
    }

    const ol = trimmed.match(/^\d+[.)]\s+(.*)$/)
    if (ol) {
      if (listType !== 'ol') {
        closeList()
        html.push('<ol>')
        listType = 'ol'
      }
      html.push(`<li>${inline(ol[1])}</li>`)
      i++
      continue
    }

    closeList()
    html.push(`<p>${inline(trimmed)}</p>`)
    i++
  }

  closeList()
  return html.join('\n')
}
