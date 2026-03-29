/**
 * Archivos en storage asociados al usuario (PDFs, imágenes, etc.).
 * El backend actual no persiste ficheros; si se añade almacenamiento, implementar aquí
 * y llamar desde userDeletionService antes de borrar filas.
 *
 * @param {object} _ctx
 * @param {import('@prisma/client').Prisma.TransactionClient} _ctx.tx
 * @param {{ id: string, role: string }} _ctx.userSnapshot usuario a eliminar
 * @returns {Promise<{ removed: string[] }>}
 */
export async function removeUserAssociatedFiles(_ctx) {
  return { removed: [] };
}
