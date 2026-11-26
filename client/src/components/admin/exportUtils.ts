type CsvCell = string | number | boolean | null | undefined;

const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;

function sanitizeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) {
    return '';
  }

  let text = String(value);
  if (FORMULA_PREFIX_REGEX.test(text)) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: CsvCell[][]
): void {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  const csvContent = [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const normalizedName = filename.toLowerCase().endsWith('.csv')
    ? filename
    : `${filename}.csv`;
  triggerBrowserDownload(blob, normalizedName);
}

export function exportToJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const normalizedName = filename.toLowerCase().endsWith('.json')
    ? filename
    : `${filename}.json`;
  triggerBrowserDownload(blob, normalizedName);
}
