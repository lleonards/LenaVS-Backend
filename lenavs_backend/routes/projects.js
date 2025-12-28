import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { projects, publicProjects } from '../data/store.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// =====================================================
// CREATE PROJECT
// =====================================================
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, data } = req.body

    const project = {
      id: uuidv4(),
      userId: req.user.id,
      name: name || 'Projeto Sem Nome',
      data,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    projects.push(project)

    return res.status(201).json({
      success: true,
      project
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar projeto' })
  }
})

// =====================================================
// GET USER PROJECTS
// =====================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const userProjects = projects.filter(
      p => p.userId === req.user.id
    )

    return res.json({
      success: true,
      projects: userProjects.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar projetos' })
  }
})

// =====================================================
// GET PROJECT BY ID
// =====================================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = projects.find(
      p => p.id === req.params.id && p.userId === req.user.id
    )

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' })
    }

    return res.json({
      success: true,
      project
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar projeto' })
  }
})

// =====================================================
// UPDATE PROJECT
// =====================================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const index = projects.findIndex(
      p => p.id === req.params.id && p.userId === req.user.id
    )

    if (index === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado' })
    }

    projects[index] = {
      ...projects[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    }

    return res.json({
      success: true,
      project: projects[index]
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar projeto' })
  }
})

// =====================================================
// DELETE PROJECT
// =====================================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const index = projects.findIndex(
      p => p.id === req.params.id && p.userId === req.user.id
    )

    if (index === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado' })
    }

    projects.splice(index, 1)

    return res.json({
      success: true,
      message: 'Projeto deletado com sucesso'
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao deletar projeto' })
  }
})

// =====================================================
// PUBLIC / PRIVATE
// =====================================================
router.patch('/:id/visibility', authenticate, async (req, res) => {
  try {
    const { isPublic } = req.body

    const index = projects.findIndex(
      p => p.id === req.params.id && p.userId === req.user.id
    )

    if (index === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado' })
    }

    projects[index].isPublic = isPublic
    projects[index].updatedAt = new Date().toISOString()

    if (isPublic) {
      const pub = { ...projects[index] }
      delete pub.userId
      publicProjects.push(pub)
    } else {
      const pubIndex = publicProjects.findIndex(p => p.id === req.params.id)
      if (pubIndex !== -1) publicProjects.splice(pubIndex, 1)
    }

    return res.json({
      success: true,
      project: projects[index]
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar visibilidade' })
  }
})

// =====================================================
// PUBLIC LIBRARY
// =====================================================
router.get('/public/library', async (req, res) => {
  try {
    const list = projects
      .filter(p => p.isPublic)
      .map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))

    return res.json({
      success: true,
      projects: list
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar biblioteca pública' })
  }
})

// =====================================================
// CLONE PUBLIC PROJECT
// =====================================================
router.post('/clone/:id', authenticate, async (req, res) => {
  try {
    const original = projects.find(
      p => p.id === req.params.id && p.isPublic
    )

    if (!original) {
      return res.status(404).json({ error: 'Projeto público não encontrado' })
    }

    const clone = {
      ...original,
      id: uuidv4(),
      userId: req.user.id,
      name: `${original.name} (Cópia)`,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    projects.push(clone)

    return res.status(201).json({
      success: true,
      project: clone
    })
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao clonar projeto' })
  }
})

export default router
