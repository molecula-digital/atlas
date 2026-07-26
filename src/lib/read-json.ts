/** Safely read JSON from a fetch Response (avoids empty-body parse crashes). */
export async function readJson<T = unknown>(
  res: Response,
): Promise<{ ok: true; data: T } | { ok: false; data: null; error: string }> {
  const text = await res.text()
  if (!text.trim()) {
    return {
      ok: false,
      data: null,
      error: res.ok ? 'Respuesta vacía del servidor' : `Error del servidor (${res.status})`,
    }
  }

  try {
    const data = JSON.parse(text) as T
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      data: null,
      error: res.ok
        ? 'Respuesta inválida del servidor'
        : `Error del servidor (${res.status})`,
    }
  }
}
