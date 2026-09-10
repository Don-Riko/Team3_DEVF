const userRepo = require('../repositories/userRepository')

async function getLibrary(username) {
  const user = await userRepo.findUserByUsername(username)
  if (!user) return { ok: true, items: [] }
  const items = await userRepo.getLibraryItems(user.id)
  return { ok: true, items }
}

async function saveLibraryItem(username, item) {
  const user = await userRepo.findUserByUsername(username)
  if (!user) return { ok: false, error: 'Usuario no encontrado' }
  await userRepo.upsertLibraryItem(user.id, item)
  return { ok: true }
}

async function removeLibraryItem(username, movieId) {
  const user = await userRepo.findUserByUsername(username)
  if (!user) return { ok: true }
  await userRepo.deleteLibraryItem(user.id, movieId)
  return { ok: true }
}

async function getProfile(username) {
  const user = await userRepo.findUserByUsername(username)
  if (!user) return { ok: false, error: 'Usuario no encontrado' }

  const [histogram, recent, libraryCounts] = await Promise.all([
    userRepo.getMoodHistory(user.id),
    userRepo.getRecentMoodSelections(user.id),
    userRepo.getLibraryCounts(user.id),
  ])

  const total = histogram.reduce((acc, h) => acc + h.count, 0)
  const library = { watchlist: 0, watched: 0 }
  for (const row of libraryCounts) library[row.status] = row.count

  return {
    ok: true,
    profile: { total, histogram, recent, library },
  }
}

module.exports = { getLibrary, saveLibraryItem, removeLibraryItem, getProfile }