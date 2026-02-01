const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const PROJECTS_FILE = path.join(__dirname, '../data/projects.json');

// Criar diretório data se não existir
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Inicializar arquivo de projetos
if (!fs.existsSync(PROJECTS_FILE)) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2));
}

// Funções auxiliares
const getProjects = () => {
  try {
    const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveProjects = (projects) => {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
};

// Criar novo projeto
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, data } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório.' });
    }

    const projects = getProjects();

    const newProject = {
      id: Date.now().toString(),
      userId,
      name,
      data: data || {},
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(newProject);
    saveProjects(projects);

    res.status(201).json({
      message: 'Projeto criado com sucesso!',
      project: newProject
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro ao criar projeto.' });
  }
});

// Listar projetos do usuário
router.get('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const projects = getProjects();

    const userProjects = projects.filter(p => p.userId === userId);

    res.json({
      projects: userProjects.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    });
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    res.status(500).json({ error: 'Erro ao listar projetos.' });
  }
});

// Buscar projeto específico
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const projects = getProjects();

    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    // Verificar se é público ou do usuário
    if (project.userId !== userId && !project.isPublic) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({ error: 'Erro ao buscar projeto.' });
  }
});

// Atualizar projeto
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { name, data, isPublic } = req.body;

    const projects = getProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    if (projects[projectIndex].userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    // Atualizar projeto
    if (name) projects[projectIndex].name = name;
    if (data) projects[projectIndex].data = data;
    if (typeof isPublic === 'boolean') projects[projectIndex].isPublic = isPublic;
    projects[projectIndex].updatedAt = new Date().toISOString();

    saveProjects(projects);

    res.json({
      message: 'Projeto atualizado com sucesso!',
      project: projects[projectIndex]
    });
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
});

// Deletar projeto
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const projects = getProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    if (projects[projectIndex].userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    projects.splice(projectIndex, 1);
    saveProjects(projects);

    res.json({ message: 'Projeto deletado com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({ error: 'Erro ao deletar projeto.' });
  }
});

// Duplicar projeto público
router.post('/:id/duplicate', authMiddleware, (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const projects = getProjects();
    const sourceProject = projects.find(p => p.id === projectId);

    if (!sourceProject) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    if (!sourceProject.isPublic) {
      return res.status(403).json({ error: 'Este projeto não é público.' });
    }

    // Criar cópia
    const newProject = {
      id: Date.now().toString(),
      userId,
      name: `${sourceProject.name} (Cópia)`,
      data: JSON.parse(JSON.stringify(sourceProject.data)),
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(newProject);
    saveProjects(projects);

    res.status(201).json({
      message: 'Projeto duplicado com sucesso!',
      project: newProject
    });
  } catch (error) {
    console.error('Erro ao duplicar projeto:', error);
    res.status(500).json({ error: 'Erro ao duplicar projeto.' });
  }
});

module.exports = router;
