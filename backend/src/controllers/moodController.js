const userRepo = require('../repositories/userRepository')

async function recordMoodSelection(req, res) {
  try {
    const { username, mood } = req.body ?? {}
    if (!username || !mood) {
      return res.status(400).json({ ok: false, error: 'username y mood requeridos' })
    }

    const user = await userRepo.findUserByUsername(username)
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })
    }

    const selection = await userRepo.recordMoodSelection(user.id, mood)
    res.status(201).json({ ok: true, selection })
  } catch (err) {
    console.error('Error registrando mood:', err.message)
    res.status(500).json({ ok: false, error: 'Error en el servidor' })
  }
}

module.exports = { recordMoodSelection }