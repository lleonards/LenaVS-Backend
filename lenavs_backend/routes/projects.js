import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { projects, publicProjects } from '../data/store.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create project
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, data } = req.body;

    const project = {
      id: uuidv4(),
      userId: req.userId,
      name: name || 'Projeto Sem Nome',
      data,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(project);

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

// Get user projects
router.get('/', authenticate, async (req, res) => {
  try {
    const userProjects = projects.filter(p => p.userId === req.userId);
    
    res.json({
      success: true,
      projects: userProjects.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  }
});

// Get project by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = projects.find(p => 
      p.id === req.params.id && p.userId === req.userId
    );

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar projeto' });
  }
});

// Update project
router.put('/:id', authenticate, async (req, res) => {
  try {
    const projectIndex = projects.findIndex(p => 
      p.id === req.params.id && p.userId === req.userId
    );

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      project: projects[projectIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

// Delete project
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const projectIndex = projects.findIndex(p => 
      p.id === req.params.id && p.userId === req.userId
    );

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    projects.splice(projectIndex, 1);

    res.json({
      success: true,
      message: 'Projeto deletado com sucesso'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar projeto' });
  }
});

// Make project public/private
router.patch('/:id/visibility', authenticate, async (req, res) => {
  try {
    const { isPublic } = req.body;
    
    const projectIndex = projects.findIndex(p => 
      p.id === req.params.id && p.userId === req.userId
    );

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    projects[projectIndex].isPublic = isPublic;
    projects[projectIndex].updatedAt = new Date().toISOString();

    // Update public projects list
    if (isPublic) {
      const publicProject = { ...projects[projectIndex] };
      delete publicProject.userId; // Remove userId from public view
      publicProjects.push(publicProject);
    } else {
      const pubIndex = publicProjects.findIndex(p => p.id === req.params.id);
      if (pubIndex !== -1) {
        publicProjects.splice(pubIndex, 1);
      }
    }

    res.json({
      success: true,
      project: projects[projectIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar visibilidade' });
  }
});

// Get public projects (library)
router.get('/public/library', async (req, res) => {
  try {
    const publicProjectsList = projects
      .filter(p => p.isPublic)
      .map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));

    res.json({
      success: true,
      projects: publicProjectsList
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar biblioteca pública' });
  }
});

// Clone public project
router.post('/clone/:id', authenticate, async (req, res) => {
  try {
    const originalProject = projects.find(p => p.id === req.params.id && p.isPublic);

    if (!originalProject) {
      return res.status(404).json({ error: 'Projeto público não encontrado' });
    }

    const clonedProject = {
      ...originalProject,
      id: uuidv4(),
      userId: req.userId,
      name: `${originalProject.name} (Cópia)`,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(clonedProject);

    res.status(201).json({
      success: true,
      project: clonedProject
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao clonar projeto' });
  }
});

export default router;
