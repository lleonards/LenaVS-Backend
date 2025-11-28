import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Banco de dados temporário para projetos (em memória)
// NOTA: Em produção, substitua por um banco de dados real
const projects = new Map();
const userProjects = new Map();

// Criar novo projeto
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const projectData = req.body;

    const project = {
      id: uuidv4(),
      userId,
      name: projectData.name || 'Novo Projeto',
      data: projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.set(project.id, project);

    // Adicionar ao índice do usuário
    if (!userProjects.has(userId)) {
      userProjects.set(userId, []);
    }
    userProjects.get(userId).push(project.id);

    res.status(201).json({
      message: 'Projeto criado com sucesso',
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

// Listar projetos do usuário
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const projectIds = userProjects.get(userId) || [];
    
    const userProjectsList = projectIds
      .map(id => projects.get(id))
      .filter(p => p !== undefined)
      .map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      projects: userProjectsList,
      total: userProjectsList.length
    });
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
});

// Buscar projeto específico
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    if (project.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({ error: 'Erro ao buscar projeto' });
  }
});

// Atualizar projeto
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    if (project.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Atualizar dados
    project.data = { ...project.data, ...req.body };
    if (req.body.name) {
      project.name = req.body.name;
    }
    project.updatedAt = new Date().toISOString();

    projects.set(projectId, project);

    res.json({
      message: 'Projeto atualizado com sucesso',
      project: {
        id: project.id,
        name: project.name,
        updatedAt: project.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

// Deletar projeto
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    if (project.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Remover projeto
    projects.delete(projectId);

    // Remover do índice do usuário
    const userProjectsList = userProjects.get(userId) || [];
    const index = userProjectsList.indexOf(projectId);
    if (index > -1) {
      userProjectsList.splice(index, 1);
      userProjects.set(userId, userProjectsList);
    }

    res.json({ message: 'Projeto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({ error: 'Erro ao deletar projeto' });
  }
});

// Duplicar projeto (Salvar Como)
router.post('/:id/duplicate', authenticateToken, (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const originalProject = projects.get(projectId);

    if (!originalProject) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    if (originalProject.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const newProject = {
      id: uuidv4(),
      userId,
      name: req.body.name || `${originalProject.name} (Cópia)`,
      data: { ...originalProject.data },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.set(newProject.id, newProject);

    if (!userProjects.has(userId)) {
      userProjects.set(userId, []);
    }
    userProjects.get(userId).push(newProject.id);

    res.status(201).json({
      message: 'Projeto duplicado com sucesso',
      project: {
        id: newProject.id,
        name: newProject.name,
        createdAt: newProject.createdAt,
        updatedAt: newProject.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao duplicar projeto:', error);
    res.status(500).json({ error: 'Erro ao duplicar projeto' });
  }
});

export default router;
